import { Request, Response } from 'express';
import { z } from 'zod';
import { runQuery, getQuery, allQuery, runTransaction, logActivity, logAudit } from '../database/databaseAdapter.js';
import { Dispute } from '../database/enhancedSchema.js';
import { AuthRequest } from '../middleware/securityMiddleware.js';
import { sanitizeInput } from '../config/security.js';

// Enhanced validation schemas
const disputeSchema = z.object({
  client_id: z.number()
    .int('Client ID must be an integer')
    .positive('Client ID must be positive'),
  
  bureau: z.enum(['experian', 'equifax', 'transunion'], {
    errorMap: () => ({ message: 'Bureau must be experian, equifax, or transunion' })
  }),
  
  account_name: z.string()
    .min(1, 'Account name is required')
    .max(255, 'Account name must be less than 255 characters'),
  
  account_number: z.string()
    .max(50, 'Account number must be less than 50 characters')
    .optional(),
  
  dispute_reason: z.string()
    .min(10, 'Dispute reason must be at least 10 characters')
    .max(1000, 'Dispute reason must be less than 1000 characters'),
  
  dispute_type: z.enum(['inaccurate', 'incomplete', 'unverifiable', 'fraudulent', 'other'], {
    errorMap: () => ({ message: 'Invalid dispute type' })
  }),
  
  status: z.enum(['draft', 'submitted', 'in_progress', 'resolved', 'rejected'], {
    errorMap: () => ({ message: 'Invalid status' })
  }).default('draft'),
  
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Priority must be low, medium, or high' })
  }).default('medium'),
  
  filed_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Filed date must be in YYYY-MM-DD format')
    .refine((date) => {
      const filedDate = new Date(date);
      const today = new Date();
      return filedDate <= today;
    }, 'Filed date cannot be in the future')
    .optional(),
  
  response_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Response date must be in YYYY-MM-DD format')
    .optional(),
  
  expected_resolution_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected resolution date must be in YYYY-MM-DD format')
    .optional(),
  
  result: z.string()
    .max(2000, 'Result must be less than 2000 characters')
    .optional(),
  
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional(),
  
  documents: z.array(z.string().url('Invalid document URL'))
    .max(10, 'Cannot attach more than 10 documents')
    .optional()
}).refine((data) => {
  // If response_date is provided, filed_date must also be provided
  if (data.response_date && !data.filed_date) {
    return false;
  }
  // Response date must be after filed date
  if (data.response_date && data.filed_date) {
    return new Date(data.response_date) >= new Date(data.filed_date);
  }
  return true;
}, {
  message: 'Response date must be after filed date',
  path: ['response_date']
});

const updateDisputeSchema = disputeSchema.partial();

// Query parameter validation
const disputeQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n <= 100, 'Limit cannot exceed 100').default('20'),
  search: z.string().max(100).optional(),
  status: z.enum(['draft', 'submitted', 'in_progress', 'resolved', 'rejected']).optional(),
  bureau: z.enum(['experian', 'equifax', 'transunion']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  client_id: z.string().regex(/^\d+$/).transform(Number).optional(),
  dispute_type: z.enum(['inaccurate', 'incomplete', 'unverifiable', 'fraudulent', 'other']).optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'filed_date', 'priority', 'status']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

// Get all disputes for the authenticated user with enhanced filtering
export async function getDisputes(req: AuthRequest, res: Response) {
  try {
    // Validate query parameters
    const queryParams = disputeQuerySchema.parse(req.query);
    const { 
      page, limit, search, status, bureau, priority, client_id, 
      dispute_type, sort_by, sort_order, date_from, date_to 
    } = queryParams;
    
    // Build secure query with joins
    let query = `
      SELECT 
        d.id, d.client_id, d.bureau, d.account_name, d.account_number,
        d.dispute_reason, d.dispute_type, d.status, d.priority,
        d.filed_date, d.response_date, d.expected_resolution_date,
        d.result, d.notes, d.documents, d.created_at, d.updated_at,
        d.created_by, d.updated_by,
        c.first_name, c.last_name, c.email as client_email
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ?
    `;
    
    let params: any[] = [req.user!.id];
    
    // Add filters with proper sanitization
    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }
    
    if (bureau) {
      query += ' AND d.bureau = ?';
      params.push(bureau);
    }
    
    if (priority) {
      query += ' AND d.priority = ?';
      params.push(priority);
    }
    
    if (client_id) {
      query += ' AND d.client_id = ?';
      params.push(client_id);
    }
    
    if (dispute_type) {
      query += ' AND d.dispute_type = ?';
      params.push(dispute_type);
    }
    
    if (search) {
      const sanitizedSearch = sanitizeInput(search);
      query += ' AND (d.account_name LIKE ? OR d.dispute_reason LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)';
      const searchParam = `%${sanitizedSearch}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    if (date_from) {
      query += ' AND d.created_at >= ?';
      params.push(date_from + ' 00:00:00');
    }
    
    if (date_to) {
      query += ' AND d.created_at <= ?';
      params.push(date_to + ' 23:59:59');
    }
    
    // Add sorting with whitelist validation
    const allowedSortColumns = ['created_at', 'updated_at', 'filed_date', 'priority', 'status'];
    const allowedSortOrders = ['asc', 'desc'];
    
    if (allowedSortColumns.includes(sort_by) && allowedSortOrders.includes(sort_order)) {
      // Handle priority sorting specially
      if (sort_by === 'priority') {
        query += ` ORDER BY CASE d.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END ${sort_order.toUpperCase()}`;
      } else {
        query += ` ORDER BY d.${sort_by} ${sort_order.toUpperCase()}`;
      }
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const disputes = await allQuery(query, params);
    
    // Parse documents JSON for each dispute
    const processedDisputes = disputes.map(dispute => ({
      ...dispute,
      documents: dispute.documents ? JSON.parse(dispute.documents) : []
    }));
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ?
    `;
    let countParams: any[] = [req.user!.id];
    
    // Apply same filters to count query
    if (status) {
      countQuery += ' AND d.status = ?';
      countParams.push(status);
    }
    
    if (bureau) {
      countQuery += ' AND d.bureau = ?';
      countParams.push(bureau);
    }
    
    if (priority) {
      countQuery += ' AND d.priority = ?';
      countParams.push(priority);
    }
    
    if (client_id) {
      countQuery += ' AND d.client_id = ?';
      countParams.push(client_id);
    }
    
    if (dispute_type) {
      countQuery += ' AND d.dispute_type = ?';
      countParams.push(dispute_type);
    }
    
    if (search) {
      const sanitizedSearch = sanitizeInput(search);
      countQuery += ' AND (d.account_name LIKE ? OR d.dispute_reason LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)';
      const searchParam = `%${sanitizedSearch}%`;
      countParams.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    if (date_from) {
      countQuery += ' AND d.created_at >= ?';
      countParams.push(date_from + ' 00:00:00');
    }
    
    if (date_to) {
      countQuery += ' AND d.created_at <= ?';
      countParams.push(date_to + ' 23:59:59');
    }
    
    const countResult = await getQuery(countQuery, countParams);
    const total = countResult?.total || 0;
    
    // Log activity
    await logActivity(
      'disputes_list_viewed',
      `Viewed disputes list (page ${page}, ${processedDisputes.length} results)`,
      req.user!.id,
      undefined,
      undefined,
      { page, limit, filters: { status, bureau, priority, client_id, dispute_type }, total },
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      data: {
        disputes: processedDisputes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        },
        filters: {
          search, status, bureau, priority, client_id, dispute_type,
          sort_by, sort_order, date_from, date_to
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching disputes:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch disputes'
    });
  }
}

// Get a specific dispute with enhanced security checks
export async function getDispute(req: AuthRequest, res: Response) {
  try {
    const disputeId = parseInt(req.params.id);
    
    if (isNaN(disputeId) || disputeId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dispute ID'
      });
    }
    
    const dispute = await getQuery(
      `SELECT 
        d.*, c.first_name, c.last_name, c.email as client_email,
        c.phone as client_phone, c.address as client_address
       FROM disputes d
       JOIN clients c ON d.client_id = c.id
       WHERE d.id = ? AND c.user_id = ?`,
      [disputeId, req.user!.id]
    );
    
    if (!dispute) {
      return res.status(404).json({
        success: false,
        error: 'Dispute not found or access denied'
      });
    }
    
    // Parse documents JSON
    dispute.documents = dispute.documents ? JSON.parse(dispute.documents) : [];
    
    // Get related activities
    const activities = await allQuery(
      `SELECT activity_type, description, created_at, created_by
       FROM activities 
       WHERE dispute_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [disputeId]
    );
    
    // Log activity
    await logActivity(
      'dispute_viewed',
      `Viewed dispute details: ${dispute.account_name} (${dispute.bureau})`,
      req.user!.id,
      dispute.client_id,
      disputeId,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      data: {
        dispute,
        related_data: {
          activities
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching dispute:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch dispute'
    });
  }
}

// Create a new dispute with enhanced validation
export async function createDispute(req: AuthRequest, res: Response) {
  try {
    // Validate and sanitize input data
    const disputeData = disputeSchema.parse(req.body);
    
    // Verify that the client belongs to the authenticated user
    const client = await getQuery(
      'SELECT id, first_name, last_name FROM clients WHERE id = ? AND user_id = ?',
      [disputeData.client_id, req.user!.id]
    );
    
    if (!client) {
      return res.status(400).json({
        success: false,
        error: 'Client not found or access denied'
      });
    }
    
    // Check for duplicate disputes (same client, bureau, account)
    const existingDispute = await getQuery(
      `SELECT id FROM disputes 
       WHERE client_id = ? AND bureau = ? AND account_name = ? AND status NOT IN ('resolved', 'rejected')`,
      [disputeData.client_id, disputeData.bureau, disputeData.account_name]
    );
    
    if (existingDispute) {
      return res.status(409).json({
        success: false,
        error: 'An active dispute for this account already exists with this bureau'
      });
    }
    
    // Prepare transaction queries
    const queries = [
      {
        sql: `INSERT INTO disputes (
          client_id, bureau, account_name, account_number, dispute_reason,
          dispute_type, status, priority, filed_date, response_date,
          expected_resolution_date, result, notes, documents,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [
          disputeData.client_id,
          disputeData.bureau,
          sanitizeInput(disputeData.account_name),
          sanitizeInput(disputeData.account_number) || null,
          sanitizeInput(disputeData.dispute_reason),
          disputeData.dispute_type,
          disputeData.status,
          disputeData.priority,
          disputeData.filed_date || null,
          disputeData.response_date || null,
          disputeData.expected_resolution_date || null,
          sanitizeInput(disputeData.result) || null,
          sanitizeInput(disputeData.notes) || null,
          disputeData.documents ? JSON.stringify(disputeData.documents) : null,
          req.user!.id,
          req.user!.id
        ]
      }
    ];
    
    const results = await runTransaction(queries);
    const disputeId = results[0];
    
    // Get the created dispute with client info
    const newDispute = await getQuery(
      `SELECT d.*, c.first_name, c.last_name, c.email as client_email
       FROM disputes d
       JOIN clients c ON d.client_id = c.id
       WHERE d.id = ?`,
      [disputeId]
    );
    
    // Parse documents JSON
    newDispute.documents = newDispute.documents ? JSON.parse(newDispute.documents) : [];
    
    // Log activity and audit
    await Promise.all([
      logActivity(
        'dispute_created',
        `New dispute created: ${disputeData.account_name} with ${disputeData.bureau}`,
        req.user!.id,
        disputeData.client_id,
        disputeId,
        { 
          bureau: disputeData.bureau, 
          dispute_type: disputeData.dispute_type,
          priority: disputeData.priority 
        },
        req.ip,
        req.get('User-Agent')
      ),
      logAudit(
        'disputes',
        disputeId,
        'INSERT',
        null,
        newDispute,
        req.user!.id,
        req.ip,
        req.get('User-Agent')
      )
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Dispute created successfully',
      data: {
        dispute: newDispute
      }
    });
    
  } catch (error) {
    console.error('Error creating dispute:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create dispute'
    });
  }
}

// Update a dispute with enhanced validation and audit trail
export async function updateDispute(req: AuthRequest, res: Response) {
  try {
    const disputeId = parseInt(req.params.id);
    
    if (isNaN(disputeId) || disputeId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dispute ID'
      });
    }
    
    const updates = updateDisputeSchema.parse(req.body);
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }
    
    // Get existing dispute for audit trail and validation
    const existingDispute = await getQuery(
      `SELECT d.* FROM disputes d
       JOIN clients c ON d.client_id = c.id
       WHERE d.id = ? AND c.user_id = ?`,
      [disputeId, req.user!.id]
    );
    
    if (!existingDispute) {
      return res.status(404).json({
        success: false,
        error: 'Dispute not found or access denied'
      });
    }
    
    // Validate client_id if being updated
    if (updates.client_id && updates.client_id !== existingDispute.client_id) {
      const client = await getQuery(
        'SELECT id FROM clients WHERE id = ? AND user_id = ?',
        [updates.client_id, req.user!.id]
      );
      
      if (!client) {
        return res.status(400).json({
          success: false,
          error: 'Invalid client ID or access denied'
        });
      }
    }
    
    // Build dynamic update query with sanitization
    const fields = Object.keys(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = updates[field as keyof typeof updates];
      // Sanitize string inputs
      if (typeof value === 'string' && ['account_name', 'account_number', 'dispute_reason', 'result', 'notes'].includes(field)) {
        return sanitizeInput(value);
      }
      // Handle documents array
      if (field === 'documents' && Array.isArray(value)) {
        return JSON.stringify(value);
      }
      return value;
    });
    
    await runQuery(
      `UPDATE disputes SET ${setClause}, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, req.user!.id, disputeId]
    );
    
    // Get updated dispute with client info
    const updatedDispute = await getQuery(
      `SELECT d.*, c.first_name, c.last_name, c.email as client_email
       FROM disputes d
       JOIN clients c ON d.client_id = c.id
       WHERE d.id = ?`,
      [disputeId]
    );
    
    // Parse documents JSON
    updatedDispute.documents = updatedDispute.documents ? JSON.parse(updatedDispute.documents) : [];
    
    // Log activity and audit
    await Promise.all([
      logActivity(
        'dispute_updated',
        `Dispute updated: ${updatedDispute.account_name} (${updatedDispute.bureau})`,
        req.user!.id,
        updatedDispute.client_id,
        disputeId,
        { updated_fields: fields },
        req.ip,
        req.get('User-Agent')
      ),
      logAudit(
        'disputes',
        disputeId,
        'UPDATE',
        existingDispute,
        updatedDispute,
        req.user!.id,
        req.ip,
        req.get('User-Agent')
      )
    ]);
    
    res.json({
      success: true,
      message: 'Dispute updated successfully',
      data: {
        dispute: updatedDispute
      }
    });
    
  } catch (error) {
    console.error('Error updating dispute:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update dispute'
    });
  }
}

// Delete a dispute with enhanced security
export async function deleteDispute(req: AuthRequest, res: Response) {
  try {
    const disputeId = parseInt(req.params.id);
    
    if (isNaN(disputeId) || disputeId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dispute ID'
      });
    }
    
    // Get existing dispute for audit trail
    const existingDispute = await getQuery(
      `SELECT d.* FROM disputes d
       JOIN clients c ON d.client_id = c.id
       WHERE d.id = ? AND c.user_id = ?`,
      [disputeId, req.user!.id]
    );
    
    if (!existingDispute) {
      return res.status(404).json({
        success: false,
        error: 'Dispute not found or access denied'
      });
    }
    
    // Check if dispute can be deleted (only drafts and rejected disputes)
    if (!['draft', 'rejected'].includes(existingDispute.status)) {
      return res.status(400).json({
        success: false,
        error: 'Only draft and rejected disputes can be deleted',
        current_status: existingDispute.status
      });
    }
    
    // Delete dispute
    await runQuery(
      'DELETE FROM disputes WHERE id = ?',
      [disputeId]
    );
    
    // Log activity and audit
    await Promise.all([
      logActivity(
        'dispute_deleted',
        `Dispute deleted: ${existingDispute.account_name} (${existingDispute.bureau})`,
        req.user!.id,
        existingDispute.client_id,
        disputeId,
        { status: existingDispute.status },
        req.ip,
        req.get('User-Agent')
      ),
      logAudit(
        'disputes',
        disputeId,
        'DELETE',
        existingDispute,
        null,
        req.user!.id,
        req.ip,
        req.get('User-Agent')
      )
    ]);
    
    res.json({
      success: true,
      message: 'Dispute deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting dispute:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete dispute'
    });
  }
}

// Get comprehensive dispute statistics
export async function getDisputeStats(req: AuthRequest, res: Response) {
  try {
    // Get basic stats
    const basicStats = await getQuery(`
      SELECT 
        COUNT(*) as total_disputes,
        COUNT(CASE WHEN d.status = 'draft' THEN 1 END) as draft,
        COUNT(CASE WHEN d.status = 'submitted' THEN 1 END) as submitted,
        COUNT(CASE WHEN d.status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN d.status = 'rejected' THEN 1 END) as rejected
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ?
    `, [req.user!.id]);
    
    // Calculate success rate
    const successfulDisputes = basicStats?.resolved || 0;
    const totalCompleted = (basicStats?.resolved || 0) + (basicStats?.rejected || 0);
    const successRate = totalCompleted > 0 ? Math.round((successfulDisputes / totalCompleted) * 100) : 0;
    
    // Get bureau breakdown
    const bureauStats = await allQuery(`
      SELECT 
        d.bureau,
        COUNT(*) as total,
        COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved,
        COUNT(CASE WHEN d.status = 'rejected' THEN 1 END) as rejected
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ?
      GROUP BY d.bureau
    `, [req.user!.id]);
    
    // Get dispute type breakdown
    const typeStats = await allQuery(`
      SELECT 
        d.dispute_type,
        COUNT(*) as count,
        COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ?
      GROUP BY d.dispute_type
      ORDER BY count DESC
    `, [req.user!.id]);
    
    // Get priority breakdown
    const priorityStats = await allQuery(`
      SELECT 
        d.priority,
        COUNT(*) as count,
        AVG(CASE 
          WHEN d.filed_date IS NOT NULL AND d.response_date IS NOT NULL 
          THEN julianday(d.response_date) - julianday(d.filed_date)
        END) as avg_resolution_days
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ?
      GROUP BY d.priority
    `, [req.user!.id]);
    
    // Get recent activity (last 30 days)
    const recentStats = await getQuery(`
      SELECT 
        COUNT(*) as recent_disputes,
        COUNT(CASE WHEN d.created_at >= date('now', '-7 days') THEN 1 END) as this_week,
        COUNT(CASE WHEN d.status = 'resolved' AND d.updated_at >= date('now', '-30 days') THEN 1 END) as recent_resolved
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ? AND d.created_at >= date('now', '-30 days')
    `, [req.user!.id]);
    
    // Get monthly trends (last 12 months)
    const monthlyTrends = await allQuery(`
      SELECT 
        strftime('%Y-%m', d.created_at) as month,
        COUNT(*) as new_disputes,
        COUNT(CASE WHEN d.status = 'resolved' THEN 1 END) as resolved_disputes
      FROM disputes d
      JOIN clients c ON d.client_id = c.id
      WHERE c.user_id = ? AND d.created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', d.created_at)
      ORDER BY month DESC
      LIMIT 12
    `, [req.user!.id]);
    
    // Log activity
    await logActivity(
      'dispute_stats_viewed',
      'Viewed dispute statistics dashboard',
      req.user!.id,
      undefined,
      undefined,
      undefined,
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      data: {
        overview: {
          ...basicStats,
          success_rate: successRate,
          total_completed: totalCompleted
        },
        bureau_breakdown: bureauStats.map(bureau => ({
          ...bureau,
          success_rate: (bureau.resolved + bureau.rejected) > 0 
            ? Math.round((bureau.resolved / (bureau.resolved + bureau.rejected)) * 100) 
            : 0
        })),
        type_breakdown: typeStats.map(type => ({
          ...type,
          success_rate: type.count > 0 ? Math.round((type.resolved / type.count) * 100) : 0
        })),
        priority_breakdown: priorityStats.map(priority => ({
          ...priority,
          avg_resolution_days: priority.avg_resolution_days ? Math.round(priority.avg_resolution_days) : null
        })),
        recent_activity: recentStats,
        monthly_trends: monthlyTrends.reverse(), // Show oldest to newest
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching dispute stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch dispute statistics'
    });
  }
}

// Generate enhanced dispute letter with AI-like features
export async function generateDisputeLetter(req: AuthRequest, res: Response) {
  try {
    const disputeId = parseInt(req.params.dispute_id);
    
    if (isNaN(disputeId) || disputeId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dispute ID'
      });
    }
    
    // Get dispute details with client info
    const dispute = await getQuery(
      `SELECT 
        d.*, c.first_name, c.last_name, c.address, c.city, c.state, c.zip_code
       FROM disputes d
       JOIN clients c ON d.client_id = c.id
       WHERE d.id = ? AND c.user_id = ?`,
      [disputeId, req.user!.id]
    );
    
    if (!dispute) {
      return res.status(404).json({
        success: false,
        error: 'Dispute not found or access denied'
      });
    }
    
    // Generate letter content based on dispute type and reason
    const letterTemplates = {
      inaccurate: 'This information is inaccurate and does not reflect my true credit history.',
      incomplete: 'The information reported is incomplete and misleading.',
      unverifiable: 'I believe this information cannot be verified and should be removed.',
      fraudulent: 'This account appears to be the result of identity theft or fraud.',
      other: 'This item requires investigation and correction.'
    };
    
    const bureauAddresses = {
      experian: 'Experian\nP.O. Box 4500\nAllen, TX 75013',
      equifax: 'Equifax Information Services LLC\nP.O. Box 740256\nAtlanta, GA 30374',
      transunion: 'TransUnion LLC\nConsumer Dispute Center\nP.O. Box 2000\nChester, PA 19016'
    };
    
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const clientAddress = [
      dispute.address,
      dispute.city && dispute.state ? `${dispute.city}, ${dispute.state}` : null,
      dispute.zip_code
    ].filter(Boolean).join('\n');
    
    const letter = {
      date: currentDate,
      client_name: `${dispute.first_name} ${dispute.last_name}`,
      client_address: clientAddress || 'Address on file',
      bureau_name: dispute.bureau.charAt(0).toUpperCase() + dispute.bureau.slice(1),
      bureau_address: bureauAddresses[dispute.bureau as keyof typeof bureauAddresses],
      account_name: dispute.account_name,
      account_number: dispute.account_number || 'Not provided',
      dispute_reason: dispute.dispute_reason,
      dispute_type: dispute.dispute_type,
      template_reason: letterTemplates[dispute.dispute_type as keyof typeof letterTemplates],
      content: `${currentDate}

${bureauAddresses[dispute.bureau as keyof typeof bureauAddresses]}

Re: Request for Investigation of Credit Report Information

Dear Credit Reporting Agency,

I am writing to formally dispute the following information on my credit report. I have carefully reviewed my credit report and found the following item(s) to be inaccurate:

Account Name: ${dispute.account_name}
Account Number: ${dispute.account_number || 'Not provided'}

Dispute Details:
${dispute.dispute_reason}

Reason for Dispute:
${letterTemplates[dispute.dispute_type as keyof typeof letterTemplates]}

Under the Fair Credit Reporting Act (FCRA), I have the right to request that you investigate this information. I am requesting that you:

1. Conduct a thorough investigation of the disputed information
2. Contact the data furnisher to verify the accuracy of this information
3. Remove or correct any inaccurate, incomplete, or unverifiable information
4. Provide me with written results of your investigation

I understand that you have 30 days from receipt of this letter to investigate and respond to my dispute. Please send me written confirmation of the results of your investigation and any actions taken.

Thank you for your prompt attention to this matter. I look forward to your response.

Sincerely,

${dispute.first_name} ${dispute.last_name}
${clientAddress}`,
      generated_at: new Date().toISOString(),
      dispute_id: disputeId,
      letter_type: 'formal_dispute'
    };
    
    // Log activity
    await logActivity(
      'dispute_letter_generated',
      `Generated dispute letter for: ${dispute.account_name} (${dispute.bureau})`,
      req.user!.id,
      dispute.client_id,
      disputeId,
      { letter_type: 'formal_dispute' },
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      data: {
        letter
      }
    });
    
  } catch (error) {
    console.error('Error generating dispute letter:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate dispute letter'
    });
  }
}

// Bulk operations for disputes
export async function bulkUpdateDisputes(req: AuthRequest, res: Response) {
  try {
    const { dispute_ids, updates } = req.body;
    
    // Validate input
    if (!Array.isArray(dispute_ids) || dispute_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'dispute_ids must be a non-empty array'
      });
    }
    
    if (dispute_ids.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update more than 50 disputes at once'
      });
    }
    
    // Validate updates
    const validatedUpdates = updateDisputeSchema.parse(updates);
    
    if (Object.keys(validatedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }
    
    // Verify all disputes belong to the user's clients
    const placeholders = dispute_ids.map(() => '?').join(',');
    const ownedDisputes = await allQuery(
      `SELECT d.id FROM disputes d
       JOIN clients c ON d.client_id = c.id
       WHERE d.id IN (${placeholders}) AND c.user_id = ?`,
      [...dispute_ids, req.user!.id]
    );
    
    if (ownedDisputes.length !== dispute_ids.length) {
      return res.status(403).json({
        success: false,
        error: 'Some disputes not found or access denied'
      });
    }
    
    // Build update query
    const fields = Object.keys(validatedUpdates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = validatedUpdates[field as keyof typeof validatedUpdates];
      if (field === 'documents' && Array.isArray(value)) {
        return JSON.stringify(value);
      }
      return value;
    });
    
    // Perform bulk update
    await runQuery(
      `UPDATE disputes SET ${setClause}, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
      [...values, req.user!.id, ...dispute_ids]
    );
    
    // Log activity
    await logActivity(
      'disputes_bulk_updated',
      `Bulk updated ${dispute_ids.length} disputes`,
      req.user!.id,
      undefined,
      undefined,
      { dispute_ids, updated_fields: fields, count: dispute_ids.length },
      req.ip,
      req.get('User-Agent')
    );
    
    res.json({
      success: true,
      message: `Successfully updated ${dispute_ids.length} disputes`,
      data: {
        updated_count: dispute_ids.length,
        updated_fields: fields
      }
    });
    
  } catch (error) {
    console.error('Error in bulk update:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to perform bulk update'
    });
  }
}