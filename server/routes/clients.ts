import { Request, Response } from 'express';
import { z } from 'zod';
import { runQuery, getQuery, allQuery } from '../database/databaseAdapter.js';
import { format } from 'date-fns';
import { executeTransaction } from '../database/mysqlConfig.js';
import { Client } from '../database/schema.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { validateClientQuota } from '../utils/planValidation.js';

// Validation schemas
const clientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  ssn_last_four: z.string().optional(),
  date_of_birth: z.string().optional(),
  employment_status: z.string().optional(),
  annual_income: z.number().optional(),
  status: z.enum(['active', 'inactive', 'pending']).default('active'),
  credit_score: z.number().optional(),
  experian_score: z.number().optional(),
  equifax_score: z.number().optional(),
  transunion_score: z.number().optional(),
  previous_credit_score: z.number().optional(),
  notes: z.string().optional(),
  platform: z.enum(['creditkarma', 'creditwise', 'freecreditscore', 'experian', 'equifax', 'transunion', 'myfreescorenow', 'identityiq', 'myscoreiq', 'other']).optional(),
  platform_email: z.string().optional(),
  platform_password: z.string().optional(),
  fundable_status: z.enum(['fundable','not_fundable']).optional()
  ,fundable_in_tu: z.union([z.boolean(), z.number().int().min(0).max(1)]).optional()
  ,fundable_in_ex: z.union([z.boolean(), z.number().int().min(0).max(1)]).optional()
  ,fundable_in_eq: z.union([z.boolean(), z.number().int().min(0).max(1)]).optional()
});

const updateClientSchema = clientSchema.partial();

function normalizeDateInput(input?: string | null): string | null {
  try {
    if (!input) return null;
    const s = String(input);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const t = s.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    const d = new Date(s);
    if (!isNaN(d.getTime())) return format(d, 'yyyy-MM-dd');
  } catch {}
  return null;
}

// Get all clients for the authenticated user (or all clients for funding managers)
export async function getClients(req: AuthRequest, res: Response) {
  try {
    const { page = 1, limit = 50, search, status } = req.query;
    
    // Determine base visibility: funding managers see all; admins see their own;
    // employees (role 'user' or 'funding_manager' when created) should see their admin's clients
    let query = 'SELECT * FROM clients';
    let params: any[] = [];

    // Resolve base user context for non-funding_manager users
    let baseUserId: number | null = null;
    const isFundingManager = req.user!.role === 'funding_manager';

    if (!isFundingManager) {
      // Admins/super_admins view their own clients
      if (req.user!.role === 'admin' || req.user!.role === 'super_admin') {
        baseUserId = req.user!.id;
      } else {
        // Try to resolve employee → admin mapping
        const employeeLink = await getQuery(
          'SELECT admin_id FROM employees WHERE user_id = ? AND status = ? ORDER BY updated_at DESC LIMIT 1',
          [req.user!.id, 'active']
        );
        if (employeeLink?.admin_id) {
          baseUserId = employeeLink.admin_id;
        } else {
          // Fallback to the user's own ID (legacy behavior)
          baseUserId = req.user!.id;
        }
      }
    }

    const hasBaseFilter = !isFundingManager;
    if (hasBaseFilter && baseUserId !== null) {
      query += ' WHERE (user_id = ? OR user_id IN (SELECT user_id FROM employees WHERE admin_id = ? AND status = ?))';
      params.push(baseUserId, baseUserId, 'active');
    }
    
    // Add filters
    if (status) {
      query += hasBaseFilter ? ' AND status = ?' : ' WHERE status = ?';
      params.push(status as string);
    }
    
    if (search) {
      const searchCondition = ' (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      if (!hasBaseFilter && !status) {
        query += ' WHERE' + searchCondition;
      } else {
        query += ' AND' + searchCondition;
      }
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    const limitNum = Number(limit);
    query += ` ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;
    // Note: LIMIT and OFFSET cannot use parameter placeholders in MySQL
    
    const clients = await allQuery(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM clients';
    let countParams: any[] = [];

    if (hasBaseFilter && baseUserId !== null) {
      countQuery += ' WHERE (user_id = ? OR user_id IN (SELECT user_id FROM employees WHERE admin_id = ? AND status = ?))';
      countParams.push(baseUserId, baseUserId, 'active');
    }
    
    if (status) {
      countQuery += hasBaseFilter ? ' AND status = ?' : ' WHERE status = ?';
      countParams.push(status as string);
    }
    
    if (search) {
      const searchCondition = ' (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      if (!hasBaseFilter && !status) {
        countQuery += ' WHERE' + searchCondition;
      } else {
        countQuery += ' AND' + searchCondition;
      }
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam);
    }
    
    const countResult = await getQuery(countQuery, countParams);
    const total = countResult?.total || 0;
    
    res.json({
      clients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get a specific client
export async function getClient(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    
    // Resolve admin context for employees to allow viewing their admin's client
    let baseUserId: number = req.user!.id;
    const isFundingManager = req.user!.role === 'funding_manager';
    if (!isFundingManager && req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
      const employeeLink = await getQuery(
        'SELECT admin_id FROM employees WHERE user_id = ? AND status = ? ORDER BY updated_at DESC LIMIT 1',
        [req.user!.id, 'active']
      );
      if (employeeLink?.admin_id) {
        baseUserId = employeeLink.admin_id;
      }
    }

    const client = await getQuery(
      isFundingManager
        ? 'SELECT * FROM clients WHERE id = ?'
        : 'SELECT * FROM clients WHERE id = ? AND (user_id = ? OR user_id IN (SELECT user_id FROM employees WHERE admin_id = ? AND status = ?))',
      isFundingManager ? [id] : [id, baseUserId, baseUserId, 'active']
    );
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Create a new client
export async function createClient(req: AuthRequest, res: Response) {
  try {
    const clientData = clientSchema.parse(req.body);
    
    // Use transaction to prevent race conditions in quota validation
    const result = await executeTransaction(async (connection) => {
      // Check client quota within transaction to prevent race conditions
      const quotaValidation = await validateClientQuota(req.user!.id);
      
      if (!quotaValidation.canAdd) {
        throw new Error(JSON.stringify({
          status: 403,
          error: 'Client quota exceeded',
          message: quotaValidation.error,
          planLimits: quotaValidation.planLimits
        }));
      }
      
      // Store platform credentials if provided
      const platformEmail = clientData.platform_email || clientData.email;
      const platformPassword = clientData.platform_password;
      
      const [insertResult] = await connection.execute(`
        INSERT INTO clients (
          user_id, first_name, last_name, email, phone, address, city, state, zip_code, ssn_last_four,
          date_of_birth, employment_status, annual_income, status, credit_score,
          experian_score, equifax_score, transunion_score, previous_credit_score, notes, 
          platform, platform_email, platform_password, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        req.user!.id,
        clientData.first_name || null,
        clientData.last_name || null,
        clientData.email || null,
        clientData.phone || null,
        clientData.address || null,
        clientData.city || null,
        clientData.state || null,
        clientData.zip_code || null,
        clientData.ssn_last_four || null,
        normalizeDateInput(clientData.date_of_birth) || null,
        clientData.employment_status || null,
        clientData.annual_income || null,
        clientData.status || 'active',
        clientData.credit_score || null,
        clientData.experian_score || null,
        clientData.equifax_score || null,
        clientData.transunion_score || null,
        clientData.previous_credit_score || null,
        clientData.notes || null,
        clientData.platform || null,
        platformEmail || null,
        platformPassword || null,
        req.user!.id, // created_by
        req.user!.id  // updated_by
      ]);
      
      // connection.execute returns [ResultSetHeader, FieldPacket[]]; we need the header
      return insertResult;
    });
    
    // Get the inserted ID (MySQL uses insertId)
    const insertedId = (result as any)?.insertId;
    
    const newClient = await getQuery(
      'SELECT * FROM clients WHERE id = ?',
      [insertedId]
    );
    
    // Update any credit reports with 'unknown' client_id to use the new client ID
    try {
      const { updateCreditReportClientId } = await import('../database/dbConnection.js');
      await updateCreditReportClientId(insertedId.toString());
      console.log(`Updated credit report history for new client ID: ${insertedId}`);
    } catch (updateError) {
      console.error('Error updating credit report history:', updateError);
      // Don't fail the client creation if report update fails
    }
    
    // Log activity
    await runQuery(`
      INSERT INTO activities (user_id, client_id, type, description)
      VALUES (?, ?, ?, ?)
    `, [
      req.user!.id,
      insertedId,
      'client_added',
      `New client added: ${clientData.first_name} ${clientData.last_name}${clientData.platform ? ` (via ${clientData.platform})` : ''}`
    ]);

    await runQuery(`
      INSERT INTO user_activities (user_id, activity_type, resource_type, resource_id, description, ip_address, user_agent, session_id)
      VALUES (?, 'create', 'client', ?, ?, ?, ?, ?)
    `, [
      req.user!.id,
      insertedId,
      `New client added: ${clientData.first_name} ${clientData.last_name}${clientData.platform ? ` (via ${clientData.platform})` : ''}`,
      req.ip,
      req.get('User-Agent') || null,
      null
    ]);
    
    res.status(201).json(newClient);
  } catch (error) {
    // Handle quota exceeded errors from transaction
    if (error instanceof Error && error.message.startsWith('{')) {
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.status === 403) {
          return res.status(403).json({
            success: false,
            error: errorData.error,
            message: errorData.message,
            planLimits: errorData.planLimits
          });
        }
      } catch (parseError) {
        // If parsing fails, continue to general error handling
      }
    }
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update a client
export async function updateClient(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const updates = updateClientSchema.parse(req.body);
    const normalizedUpdates: any = { ...updates };
    if (typeof normalizedUpdates.fundable_in_tu !== 'undefined') {
      normalizedUpdates.fundable_in_tu = Number(Boolean(normalizedUpdates.fundable_in_tu));
    }
    if (typeof normalizedUpdates.fundable_in_ex !== 'undefined') {
      normalizedUpdates.fundable_in_ex = Number(Boolean(normalizedUpdates.fundable_in_ex));
    }
    if (typeof normalizedUpdates.fundable_in_eq !== 'undefined') {
      normalizedUpdates.fundable_in_eq = Number(Boolean(normalizedUpdates.fundable_in_eq));
    }
    if (typeof updates.date_of_birth !== 'undefined') {
      const raw = updates.date_of_birth as any;
      const isEmpty = raw === null || (typeof raw === 'string' && raw.trim() === '');
      if (isEmpty) {
        delete normalizedUpdates.date_of_birth;
      } else {
        const normalized = normalizeDateInput(String(raw));
        if (normalized === null) {
          delete normalizedUpdates.date_of_birth;
        } else {
          normalizedUpdates.date_of_birth = normalized;
        }
      }
    }
    
    if (Object.keys(normalizedUpdates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    const isFundingManager = req.user!.role === 'funding_manager';
    let baseUserId: number = req.user!.id;
    if (!isFundingManager && req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
      const employeeLink = await getQuery(
        'SELECT admin_id FROM employees WHERE user_id = ? AND status = ? ORDER BY updated_at DESC LIMIT 1',
        [req.user!.id, 'active']
      );
      if (employeeLink?.admin_id) {
        baseUserId = employeeLink.admin_id;
      }
    }
    const existingClient = await getQuery(
      isFundingManager ? 'SELECT * FROM clients WHERE id = ?' : 'SELECT * FROM clients WHERE id = ? AND user_id = ?',
      isFundingManager ? [id] : [id, baseUserId]
    );
    
    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Build dynamic update query
    const fields = Object.keys(normalizedUpdates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => normalizedUpdates[field as keyof typeof normalizedUpdates]);
    const whereClause = isFundingManager ? 'id = ?' : 'id = ? AND user_id = ?';
    const params = isFundingManager ? [...values, id] : [...values, id, baseUserId];
    await runQuery(
      `UPDATE clients SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ${whereClause}`,
      params
    );
    
    const updatedClient = await getQuery(
      'SELECT * FROM clients WHERE id = ?',
      [id]
    );
    
    res.json(updatedClient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete a client
export async function deleteClient(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    
    // Check if client exists and belongs to user
    const existingClient = await getQuery(
      'SELECT * FROM clients WHERE id = ? AND user_id = ?',
      [id, req.user!.id]
    );
    
    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Delete client (this will cascade to related disputes due to foreign key constraints)
    await runQuery(
      'DELETE FROM clients WHERE id = ? AND user_id = ?',
      [id, req.user!.id]
    );
    
    const desc = `Client deleted: ${existingClient.first_name || ''} ${existingClient.last_name || ''}${existingClient.email ? ` (${existingClient.email})` : ''} (IP: ${req.ip})`;
    try {
      await runQuery(
        `INSERT INTO activities (user_id, client_id, type, description, metadata)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.user!.id,
          Number(id),
          'note_added',
          desc,
          JSON.stringify({ event: 'client_deleted', ip_address: req.ip, user_agent: req.get('User-Agent') || null })
        ]
      );
    } catch {}
    try {
      await runQuery(
        `INSERT INTO user_activities (user_id, activity_type, resource_type, resource_id, description, ip_address, user_agent, session_id)
         VALUES (?, 'delete', 'client', ?, ?, ?, ?, ?)`,
        [
          req.user!.id,
          Number(id),
          desc,
          req.ip,
          req.get('User-Agent') || null,
          null
        ]
      );
    } catch {}

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get client statistics
export async function getClientStats(req: AuthRequest, res: Response) {
  try {
    // Funding managers can see stats for all clients, others see only their own
    const whereClause = req.user!.role === 'funding_manager' ? '' : 'WHERE user_id = ?';
    const params = req.user!.role === 'funding_manager' ? [] : [req.user!.id];
    
    const stats = await getQuery(`
      SELECT 
        COUNT(*) as total_clients,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_clients,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_clients,
        COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_clients,
        AVG(credit_score) as avg_credit_score,
        COUNT(CASE WHEN credit_score > previous_credit_score THEN 1 END) as improved_scores
      FROM clients 
      ${whereClause}
    `, params);
    
    // Get recent clients (last 30 days)
    const recentWhereClause = req.user!.role === 'funding_manager' 
      ? 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)' 
      : 'WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    const recentParams = req.user!.role === 'funding_manager' ? [] : [req.user!.id];
    
    const recentClients = await getQuery(`
      SELECT COUNT(*) as recent_clients
      FROM clients 
      ${recentWhereClause}
    `, recentParams);
    
    res.json({
      ...stats,
      recent_clients: recentClients?.recent_clients || 0
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
