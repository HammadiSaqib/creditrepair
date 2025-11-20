import express from 'express';
import { executeQuery } from '../database/mysqlConfig.js';
import { SecurityLogger } from '../utils/securityLogger.js';

const router = express.Router();
const securityLogger = new SecurityLogger();

// GET /api/landing/pricing - Get pricing plans with affiliate tracking
router.get('/pricing', async (req, res) => {
  try {
    const { ref } = req.query; // Affiliate referral ID
    let affiliateInfo = null;

    // If referral ID is provided, get affiliate information
    if (ref) {
      const affiliateQuery = `
        SELECT 
          a.id,
          a.first_name,
          a.last_name,
          a.company_name,
          a.commission_rate,
          a.status,
          u.first_name as admin_first_name,
          u.last_name as admin_last_name,
          u.company_name as admin_company_name
        FROM affiliates a
        LEFT JOIN users u ON a.admin_id = u.id
        WHERE a.id = ? AND a.status = 'active'
      `;
      
      const affiliate = await executeQuery(affiliateQuery, [ref]);
      
      if (affiliate && affiliate.length > 0) {
        const affiliateData = affiliate[0];
        affiliateInfo = {
          id: affiliateData.id,
          name: `${affiliateData.first_name} ${affiliateData.last_name}`,
          companyName: affiliateData.company_name,
          commissionRate: affiliateData.commission_rate,
          adminName: `${affiliateData.admin_first_name} ${affiliateData.admin_last_name}`,
          adminCompany: affiliateData.admin_company_name
        };

        // Log the referral visit
        securityLogger.logSecurityEvent('affiliate_referral_visit', {
          affiliateId: ref,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });
      }
    }

    // Get pricing plans (you can customize these based on your needs)
    const pricingPlans = [
      {
        id: 'basic',
        name: 'Basic Plan',
        price: 29.99,
        billingCycle: 'monthly',
        features: [
          'Credit Report Analysis',
          'Basic Dispute Letters',
          'Email Support',
          'Monthly Progress Reports'
        ],
        popular: false
      },
      {
        id: 'professional',
        name: 'Professional Plan',
        price: 59.99,
        billingCycle: 'monthly',
        features: [
          'Everything in Basic',
          'Advanced Dispute Strategies',
          'Priority Support',
          'Weekly Progress Reports',
          'Credit Monitoring',
          'Personalized Action Plan'
        ],
        popular: true
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        price: 99.99,
        billingCycle: 'monthly',
        features: [
          'Everything in Professional',
          'Dedicated Credit Specialist',
          '24/7 Phone Support',
          'Daily Monitoring',
          'Identity Theft Protection',
          'Legal Document Review'
        ],
        popular: false
      }
    ];

    res.json({
      success: true,
      data: {
        plans: pricingPlans,
        affiliate: affiliateInfo,
        referralId: ref || null
      }
    });

  } catch (error) {
    console.error('Error fetching pricing with affiliate info:', error);
    res.status(500).json({ error: 'Failed to load pricing information' });
  }
});

// POST /api/landing/track-visit - Track affiliate link visit
router.post('/track-visit', async (req, res) => {
  try {
    const { affiliateId, source, userAgent, referrer } = req.body;

    if (!affiliateId) {
      return res.status(400).json({
        success: false,
        error: 'Affiliate ID is required'
      });
    }

    // Validate affiliate exists and is active
    const affiliateQuery = `
      SELECT id FROM affiliates WHERE id = ? AND status = 'active'
    `;
    
    const affiliate = await executeQuery(affiliateQuery, [affiliateId]);

    if (!affiliate || affiliate.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Affiliate not found or inactive'
      });
    }

    // Log the visit (update affiliate's last activity)
    const updateQuery = `
      UPDATE affiliates SET last_referral_date = NOW() WHERE id = ?
    `;
    
    await executeQuery(updateQuery, [affiliateId]);

    // Log the visit event
    securityLogger.logSecurityEvent('affiliate_visit_tracked', {
      affiliateId,
      source,
      userAgent,
      referrer,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Visit tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking affiliate visit:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/landing/track-conversion - Track when a referral converts to a purchase
router.post('/track-conversion', async (req, res) => {
  try {
    const { affiliateId, userId, planId, amount, commissionRate } = req.body;

    if (!affiliateId || !userId || !planId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify affiliate exists and is active
    const affiliateQuery = `
      SELECT id, commission_rate, total_earnings, total_referrals
      FROM affiliates 
      WHERE id = ? AND status = 'active'
    `;
    
    const affiliate = await executeQuery(affiliateQuery, [affiliateId]);
    
    if (!affiliate || affiliate.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found or inactive' });
    }

    const affiliateData = affiliate[0];
    const finalCommissionRate = commissionRate || affiliateData.commission_rate;
    const commissionAmount = (amount * finalCommissionRate) / 100;

    // Upsert referral record without transaction_id; will be updated at payment time
    const existingPending = await executeQuery(
      `SELECT id FROM affiliate_referrals 
       WHERE affiliate_id = ? AND referred_user_id = ? AND (transaction_id IS NULL OR transaction_id = '') 
       ORDER BY created_at ASC LIMIT 1`,
      [affiliateId, userId]
    );

    let referralId: number;
    if (existingPending && existingPending.length > 0) {
      referralId = existingPending[0].id;
      await executeQuery(
        `UPDATE affiliate_referrals 
         SET commission_amount = ?, commission_rate = ?, 
             notes = ?, conversion_date = NOW(), updated_at = NOW() 
         WHERE id = ?`,
        [commissionAmount, finalCommissionRate, `Plan: ${planId}, Amount: $${amount}`, referralId]
      );
    } else {
      const insertReferralQuery = `
        INSERT INTO affiliate_referrals (
          affiliate_id, referred_user_id, commission_amount, 
          commission_rate, status, referral_date, conversion_date,
          notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'pending', NOW(), NOW(), ?, NOW(), NOW())
      `;
      const referralResult = await executeQuery(insertReferralQuery, [
        affiliateId,
        userId,
        commissionAmount,
        finalCommissionRate,
        `Plan: ${planId}, Amount: $${amount}`
      ]);
      referralId = referralResult.insertId;
    }

    // Update affiliate totals
    const updateAffiliateQuery = `
      UPDATE affiliates 
      SET 
        total_earnings = total_earnings + ?,
        total_referrals = total_referrals + 1,
        updated_at = NOW()
      WHERE id = ?
    `;

    await executeQuery(updateAffiliateQuery, [commissionAmount, affiliateId]);

    // Log the conversion
    securityLogger.logSecurityEvent('affiliate_conversion', {
      affiliateId,
      userId,
      planId,
      amount,
      commissionAmount,
      commissionRate: finalCommissionRate,
      referralId: referralResult.insertId,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Conversion tracked successfully',
      data: {
      referralId,
      commissionAmount,
      commissionRate: finalCommissionRate
    }
  });

  } catch (error) {
    console.error('Error tracking conversion:', error);
    securityLogger.logSecurityEvent('affiliate_conversion_error', {
      affiliateId: req.body?.affiliateId,
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Failed to track conversion' });
  }
});

// GET /api/landing/affiliate/:id/info - Get public affiliate information
router.get('/affiliate/:id/info', async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(String(id));
    let affiliate;
    if (isNumeric) {
      const q = `
        SELECT 
          a.id,
          a.email,
          a.first_name,
          a.last_name,
          a.company_name,
          a.total_referrals,
          a.commission_rate,
          a.status,
          u.first_name as admin_first_name,
          u.last_name as admin_last_name,
          u.company_name as admin_company_name
        FROM affiliates a
        LEFT JOIN users u ON a.admin_id = u.id
        WHERE a.id = ? AND a.status = 'active'
      `;
      affiliate = await executeQuery(q, [id]);
    } else {
      const qSlug = `
        SELECT 
          a.id,
          a.email,
          a.first_name,
          a.last_name,
          a.company_name,
          a.total_referrals,
          a.commission_rate,
          a.status,
          u.first_name as admin_first_name,
          u.last_name as admin_last_name,
          u.company_name as admin_company_name
        FROM affiliates a
        LEFT JOIN users u ON a.admin_id = u.id
        WHERE a.referral_slug = ? AND a.status = 'active'
        LIMIT 1
      `;
      affiliate = await executeQuery(qSlug, [id]);
      if (!affiliate || affiliate.length === 0) {
        const qFallback = `
          SELECT 
            a.id,
            a.email,
            a.first_name,
            a.last_name,
            a.company_name,
            a.total_referrals,
            a.commission_rate,
            a.status,
            u.first_name as admin_first_name,
            u.last_name as admin_last_name,
            u.company_name as admin_company_name
          FROM affiliates a
          LEFT JOIN users u ON a.admin_id = u.id
          WHERE (a.email = ? OR LOWER(CONCAT(a.first_name, a.last_name)) = LOWER(?) OR LOWER(REPLACE(CONCAT(a.first_name, ' ', a.last_name), ' ', '')) = LOWER(?)) 
            AND a.status = 'active'
          LIMIT 1
        `;
        affiliate = await executeQuery(qFallback, [id, id, id]);
      }
    }
    if (!affiliate || affiliate.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found or inactive' });
    }
    const a = affiliate[0];
    res.json({
      success: true,
      data: {
        id: a.id,
        name: `${a.first_name} ${a.last_name}`,
        firstName: a.first_name,
        lastName: a.last_name,
        email: a.email,
        companyName: a.company_name,
        totalReferrals: a.total_referrals,
        commissionRate: a.commission_rate,
        adminName: `${a.admin_first_name} ${a.admin_last_name}`,
        adminCompany: a.admin_company_name,
        status: a.status
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate info:', error);
    res.status(500).json({ error: 'Failed to fetch affiliate information' });
  }
});

// GET /api/landing/referral/:username - Get affiliate info by username/email for landing page
router.get('/referral/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Try to find affiliate by email first, then by first_name+last_name combination
  const affiliateQuery = `
      SELECT 
        a.id,
        a.email,
        a.first_name,
        a.last_name,
        a.company_name,
        a.total_referrals,
        a.commission_rate,
        a.status
      FROM affiliates a
      WHERE (a.email = ? OR a.referral_slug = ? OR LOWER(CONCAT(a.first_name, a.last_name)) = LOWER(?) OR LOWER(REPLACE(CONCAT(a.first_name, ' ', a.last_name), ' ', '')) = LOWER(?)) 
        AND a.status = 'active'
      LIMIT 1
    `;
    
    let affiliate;
    try {
      affiliate = await executeQuery(affiliateQuery, [username, username, username, username]);
    } catch (err) {
      const fallbackQuery = `
        SELECT 
          a.id,
          a.email,
          a.first_name,
          a.last_name,
          a.company_name,
          a.total_referrals,
          a.commission_rate,
          a.status
        FROM affiliates a
        WHERE (a.email = ? OR LOWER(CONCAT(a.first_name, a.last_name)) = LOWER(?) OR LOWER(REPLACE(CONCAT(a.first_name, ' ', a.last_name), ' ', '')) = LOWER(?)) 
          AND a.status = 'active'
        LIMIT 1
      `;
      affiliate = await executeQuery(fallbackQuery, [username, username, username]);
    }
    
    if (!affiliate || affiliate.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Affiliate not found or inactive' 
      });
    }
    
    const affiliateData = affiliate[0];
    
    // Log the landing page visit
    securityLogger.logSecurityEvent('affiliate_landing_visit', {
      affiliateId: affiliateData.id,
      username: username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: {
        id: affiliateData.id,
        name: `${affiliateData.first_name} ${affiliateData.last_name}`,
        firstName: affiliateData.first_name,
        lastName: affiliateData.last_name,
        companyName: affiliateData.company_name,
        email: affiliateData.email,
        totalReferrals: affiliateData.total_referrals,
        commissionRate: affiliateData.commission_rate,
        status: affiliateData.status
      }
    });
    
  } catch (error) {
    console.error('Error fetching affiliate by username:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch affiliate information' 
    });
  }
});

export default router;