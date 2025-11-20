import { Router, Request, Response } from 'express';
import { getDatabaseAdapter } from '../database/databaseAdapter.js';
import { getWebSocketService } from '../services/websocketService.js';
import CommissionService from '../services/commissionService.js';

const router = Router();

// Get all active subscription plans (public endpoint)
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const db = getDatabaseAdapter();
    const plans = await db.allQuery(
      `SELECT id, name, description, price, billing_cycle, features, page_permissions, max_users, max_clients, max_disputes, sort_order
       FROM subscription_plans 
       WHERE is_active = TRUE 
       ORDER BY sort_order ASC, price ASC`
    );

    const filtered = plans.filter((plan: any) => {
      try {
        const perm = plan.page_permissions ? JSON.parse(plan.page_permissions) : [];
        if (Array.isArray(perm)) return true;
        return !perm?.is_specific;
      } catch { return true; }
    });

    const formattedPlans = filtered.map((plan: any) => ({
      ...plan,
      features: JSON.parse(plan.features || '[]')
    }));

    res.json({
      success: true,
      data: formattedPlans
    });
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch pricing plans' 
    });
  }
});

// Get a specific plan by ID (public endpoint)
router.get('/plans/:id', async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id);
    
    if (isNaN(planId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid plan ID' 
      });
    }

    const db = getDatabaseAdapter();
    const plan = await db.getQuery(
      `SELECT id, name, description, price, billing_cycle, features, page_permissions, max_users, max_clients, max_disputes, sort_order
       FROM subscription_plans 
       WHERE id = ? AND is_active = TRUE`,
      [planId]
    );

    if (!plan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Plan not found' 
      });
    }

    const perm = (() => { try { return plan.page_permissions ? JSON.parse(plan.page_permissions) : []; } catch { return []; } })();
    if (!Array.isArray(perm) && perm?.is_specific) {
      return res.status(404).json({ success: false, error: 'Plan not found' });
    }
    const formattedPlan = {
      ...plan,
      features: JSON.parse(plan.features || '[]')
    };

    res.json({
      success: true,
      data: formattedPlan
    });
  } catch (error) {
    console.error('Error fetching pricing plan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch pricing plan' 
    });
  }
});

// Purchase plan endpoint - upgrades user to admin role
router.post('/purchase/:planId', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const { userId, paymentMethod, paymentAmount, affiliateId } = req.body;

    if (!userId || !paymentMethod || !paymentAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, paymentMethod, paymentAmount'
      });
    }

    const db = getDatabaseAdapter();
    
    // Get the plan details
    const plan = await db.query(
      'SELECT * FROM subscription_plans WHERE id = ? AND is_active = true',
      [planId]
    );

    if (!plan || plan.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found or inactive'
      });
    }

    try {
      const perm = plan[0].page_permissions ? JSON.parse(plan[0].page_permissions) : [];
      if (!Array.isArray(perm) && perm?.is_specific) {
        const users = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
        const userEmail = users?.[0]?.email || '';
        const allowed = Array.isArray(perm?.allowed_admin_emails) ? perm.allowed_admin_emails : [];
        if (!userEmail || !allowed.includes(String(userEmail))) {
          return res.status(403).json({ success: false, error: 'This plan is restricted' });
        }
      }
    } catch {}

    // Check if user exists
    const user = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Start transaction
    await db.query('START TRANSACTION');

    try {
      // Update user role to admin
      await db.query(
        'UPDATE users SET role = ? WHERE id = ?',
        ['admin', userId]
      );

      // Create admin subscription record
      await db.query(
        `INSERT INTO admin_subscriptions (admin_id, plan_id, status, start_date, end_date, 
         auto_renew, payment_method, payment_amount, currency, created_by, updated_by) 
         VALUES (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH), true, ?, ?, 'USD', ?, ?)`,
        [userId, planId, paymentMethod, paymentAmount, userId, userId]
      );

      // Resolve affiliateId from body or request context and process hierarchical commission
      try {
        const commissionService = new CommissionService();
        let resolvedAffiliateId: number | undefined = undefined;
        // Prefer explicit affiliateId, resolve non-numeric formats too
        if (affiliateId) {
          const resolved = await commissionService.resolveAffiliateId(String(affiliateId));
          if (resolved) resolvedAffiliateId = resolved;
        }
        // Fallback: look for ?ref in query
        if (!resolvedAffiliateId && (req.query as any)?.ref) {
          const resolved = await commissionService.resolveAffiliateId(String((req.query as any).ref));
          if (resolved) resolvedAffiliateId = resolved;
        }
        // Fallback: parse referer header for ?ref
        if (!resolvedAffiliateId && (req.headers['referer'] || req.headers['origin'])) {
          const referer = (req.headers['referer'] as string) || (req.headers['origin'] as string);
          try {
            const url = new URL(referer);
            const refParam = url.searchParams.get('ref');
            if (refParam) {
              const resolved = await commissionService.resolveAffiliateId(String(refParam));
              if (resolved) resolvedAffiliateId = resolved;
            }
          } catch {}
        }
        // Dashboard fallback: derive from user's affiliate parent chain if still unresolved
        if (!resolvedAffiliateId) {
          const hierarchy = await commissionService.getAffiliateHierarchy(userId);
          if (Array.isArray(hierarchy) && hierarchy.length > 0 && hierarchy[0]?.id) {
            resolvedAffiliateId = Number(hierarchy[0].id);
            console.log('🔁 [PRICING] Fallback resolved affiliate via hierarchy:', resolvedAffiliateId);
          }
        }

        const transactionId = `pricing_${Date.now()}_${userId}`;
        await commissionService.processPurchase({
          userId,
          planId: parseInt(planId),
          amount: plan.price,
          transactionId,
          affiliateId: resolvedAffiliateId,
          paymentMethod
        });
        console.log('✅ Commission processed for purchase, user:', userId, 'affiliateId:', resolvedAffiliateId || 'none');
      } catch (commissionError) {
        console.error('⚠️ Commission processing failed for purchase:', commissionError);
        // Don't fail the purchase if commission processing fails
      }

      // Commit transaction
      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Plan purchased successfully. User upgraded to admin role.',
        data: {
          userId,
          planId,
          newRole: 'admin',
          subscriptionStart: new Date().toISOString()
        }
      });
    } catch (error) {
      // Rollback transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error purchasing plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase plan'
    });
  }
});

export default router;