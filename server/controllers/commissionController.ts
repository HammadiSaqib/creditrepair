import { Request, Response } from 'express';
import { commissionService } from '../services/commissionService';
import { RowDataPacket } from 'mysql2';
import { executeQuery } from '../database/mysqlConfig.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    adminId?: number;
  };
}

class CommissionController {
  /**
   * Process a purchase and handle commission attribution
   */
  async processPurchase(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { planId, amount, transactionId, affiliateId, paymentMethod } = req.body;
      const userId = req.user?.id;

      if (!userId || !planId || !amount || !transactionId) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: planId, amount, transactionId'
        });
        return;
      }

      const purchaseData = {
        userId,
        planId: parseInt(planId),
        amount: parseFloat(amount),
        transactionId,
        affiliateId: affiliateId ? parseInt(affiliateId) : undefined,
        paymentMethod
      };

      const result = await commissionService.processPurchase(purchaseData);

      if (result.success) {
        res.json({
          success: true,
          message: 'Purchase processed successfully',
          commissionId: result.commissionId
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error || 'Failed to process purchase'
        });
      }
    } catch (error) {
      console.error('Error in processPurchase:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get commission summary for the authenticated affiliate or all affiliates for super admin
   */
  async getCommissionSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { affiliateId } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // For super admin, get summary for specific affiliate or overall summary
      if (userRole === 'super_admin' || userRole === 'admin') {
        if (affiliateId) {
          const summary = await commissionService.getCommissionSummary(parseInt(affiliateId as string));
          res.json({
            success: true,
            data: summary
          });
        } else {
          // Get overall summary for all affiliates
          const summaryRows = await executeQuery(
            `SELECT 
               COALESCE(SUM(commission_amount), 0) as total_earnings,
               COALESCE(SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END), 0) as pending_commissions,
               COALESCE(SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END), 0) as paid_commissions,
               COUNT(*) as total_referrals,
               COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN commission_amount ELSE 0 END), 0) as this_month_earnings
             FROM affiliate_commissions`
          ) as RowDataPacket[];
          
          res.json({
            success: true,
            data: summaryRows[0]
          });
        }
        return;
      }

      // For regular affiliate users
      res.status(403).json({
        success: false,
        error: 'Affiliate access not implemented for regular users'
      });
    } catch (error) {
      console.error('Error in getCommissionSummary:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get commission history for the authenticated affiliate or all commissions for super admin
   */
  async getCommissionHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { limit = 50, offset = 0, affiliateId } = req.query;
      const limitNum = Math.min(500, Math.max(1, parseInt(String(limit), 10) || 50));
      const offsetNum = Math.max(0, parseInt(String(offset), 10) || 0);

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // For super admin, get all commissions or specific affiliate commissions
      if (userRole === 'super_admin' || userRole === 'admin') {
        let query = `
          SELECT ac.*, a.first_name as affiliate_first_name, a.last_name as affiliate_last_name,
                 a.email as affiliate_email
          FROM affiliate_commissions ac
          JOIN affiliates a ON ac.affiliate_id = a.id
        `;
        const params: any[] = [];
        
        if (affiliateId) {
          query += ' WHERE ac.affiliate_id = ?';
          params.push(parseInt(affiliateId as string));
        }
        
        query += ` ORDER BY ac.created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
        
        const rows = await executeQuery(query, params) as RowDataPacket[];
        
        res.json({
          success: true,
          data: rows
        });
        return;
      }

      // For regular affiliate users, find their affiliate record
      // Note: This assumes affiliates have their own authentication system
      // If affiliates are linked to users, this logic would need to be updated
      res.status(403).json({
        success: false,
        error: 'Affiliate access not implemented for regular users'
      });
    } catch (error) {
      console.error('Error in getCommissionHistory:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get pending commissions (Admin only)
   */
  async getPendingCommissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;
      const adminId = req.user?.adminId || req.user?.id;

      if (userRole !== 'super_admin' && userRole !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
        return;
      }

      const pendingCommissions = await commissionService.getPendingCommissions(
        userRole === 'super_admin' ? undefined : adminId
      );

      res.json({
        success: true,
        data: pendingCommissions
      });
    } catch (error) {
      console.error('Error in getPendingCommissions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Mark commissions as paid (Admin only)
   */
  async markCommissionsAsPaid(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;
      const { referralIds } = req.body;

      if (userRole !== 'super_admin' && userRole !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
        return;
      }

      if (!Array.isArray(referralIds) || referralIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid referral IDs provided'
        });
        return;
      }

      const success = await commissionService.markCommissionsAsPaid(referralIds);

      if (success) {
        res.json({
          success: true,
          message: 'Commissions marked as paid successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to mark commissions as paid'
        });
      }
    } catch (error) {
      console.error('Error in markCommissionsAsPaid:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Validate affiliate referral link
   */
  async validateReferralLink(req: Request, res: Response): Promise<void> {
    try {
      const { affiliateId } = req.params;

      if (!affiliateId) {
        res.status(400).json({
          success: false,
          error: 'Affiliate ID is required'
        });
        return;
      }

      const isValid = await commissionService.validateReferralLink(parseInt(affiliateId));

      res.json({
        success: true,
        valid: isValid
      });
    } catch (error) {
      console.error('Error in validateReferralLink:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get affiliate performance metrics (Admin only)
   */
  async getAffiliatePerformance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;
      const adminId = req.user?.adminId || req.user?.id;
      const { affiliateId, startDate, endDate } = req.query;

      if (userRole !== 'super_admin' && userRole !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
        return;
      }

      let query = `
        SELECT 
          a.id,
          a.first_name,
          a.last_name,
          a.email,
          a.total_earnings,
          a.total_referrals AS referral_count,
          COUNT(ar.id) as period_referrals,
          COALESCE(SUM(ar.commission_amount), 0) as period_earnings,
          COALESCE(SUM(ac.order_value), 0) as period_sales
        FROM affiliates a
        LEFT JOIN affiliate_referrals ar ON a.id = ar.affiliate_id
        LEFT JOIN affiliate_commissions ac ON a.id = ac.affiliate_id
      `;

      const params: any[] = [];
      const conditions: string[] = [];

      // Filter by admin if not super admin
      if (userRole !== 'super_admin') {
        conditions.push('a.admin_id = ?');
        params.push(adminId);
      }

      // Filter by specific affiliate if provided
      if (affiliateId) {
        conditions.push('a.id = ?');
        params.push(parseInt(affiliateId as string));
      }

      // Filter by date range if provided
      if (startDate) {
        conditions.push('((ar.created_at >= ? OR ar.created_at IS NULL) OR (ac.order_date >= ? OR ac.order_date IS NULL))');
        params.push(startDate, startDate);
      }

      if (endDate) {
        conditions.push('((ar.created_at <= ? OR ar.created_at IS NULL) OR (ac.order_date <= ? OR ac.order_date IS NULL))');
        params.push(endDate, endDate);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY a.id ORDER BY period_earnings DESC';

      const rows = await executeQuery(query, params) as RowDataPacket[];

      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error in getAffiliatePerformance:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export const commissionController = new CommissionController();
export default CommissionController;