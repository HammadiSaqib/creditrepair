import express from 'express';
import { executeQuery } from '../database/mysqlConfig.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { SecurityLogger } from '../utils/securityLogger.js';

const router = express.Router();
const securityLogger = new SecurityLogger();

// Middleware to ensure only affiliates OR admins with affiliate access can use these routes
const requireAffiliateRole = (req: any, res: any, next: any) => {
  const role = req.user?.role;
  if (!['affiliate', 'admin', 'super_admin'].includes(role)) {
    securityLogger.logSecurityEvent('unauthorized_affiliate_dashboard_access', {
      userId: req.user?.id,
      role,
      endpoint: req.path,
      ip: req.ip
    });
    return res.status(403).json({ error: 'Access denied. Affiliate or Admin role required.' });
  }
  next();
};

// Resolve the affiliate ID for the current user (supports affiliate role and admin owners)
async function resolveAffiliateId(req: any): Promise<number | null> {
  try {
    if (req.user?.role === 'affiliate') {
      return req.user.id;
    }
    if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
      const rows = await executeQuery(
        'SELECT id FROM affiliates WHERE admin_id = ? LIMIT 1',
        [req.user.id]
      );
      if (rows && rows.length > 0) {
        return rows[0].id;
      }
      return null;
    }
    return null;
  } catch (err) {
    console.error('💥 [AFFILIATE] Error resolving affiliate id for user:', req.user?.id, err);
    return null;
  }
}

// GET /api/affiliate/dashboard/stats - Get affiliate earnings and performance stats
router.get('/dashboard/stats', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      console.log('❌ [AFFILIATE STATS] No affiliate record associated with user:', req.user?.id);
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    console.log('🔍 [AFFILIATE STATS] Starting stats fetch for affiliate ID:', affiliateId);
    
    // Get affiliate basic stats including new tier fields
    const affiliateQuery = `
      SELECT 
        total_earnings,
        total_referrals,
        commission_rate,
        plan_type,
        paid_referrals_count,
        status,
        created_at,
        admin_id
      FROM affiliates 
      WHERE id = ?
    `;
    
    console.log('📊 [AFFILIATE STATS] Executing affiliate query:', affiliateQuery, 'with params:', [affiliateId]);
    const affiliate = await executeQuery(affiliateQuery, [affiliateId]);
    console.log('📊 [AFFILIATE STATS] Affiliate query result:', affiliate);
    
    if (!affiliate || affiliate.length === 0) {
      console.log('❌ [AFFILIATE STATS] Affiliate not found for ID:', affiliateId);
      return res.status(404).json({ error: 'Affiliate not found' });
    }
    
    const affiliateData = affiliate[0];
    console.log('✅ [AFFILIATE STATS] Affiliate data:', affiliateData);
    
    // Check if affiliate has been upgraded to admin and get subscription info
    let subscriptionData = null;
    if (affiliateData.admin_id) {
      console.log('🔍 [AFFILIATE STATS] Checking subscription for admin_id:', affiliateData.admin_id);
      const subscriptionQuery = `
        SELECT 
          plan_name,
          plan_type,
          status,
          current_period_start,
          current_period_end
        FROM subscriptions 
        WHERE user_id = ? AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      const subscriptionResult = await executeQuery(subscriptionQuery, [affiliateData.admin_id]);
      if (subscriptionResult && subscriptionResult.length > 0) {
        subscriptionData = subscriptionResult[0];
        console.log('✅ [AFFILIATE STATS] Found active subscription:', subscriptionData);
      }
    }
    
    // Check what commission tables exist
    const tablesQuery = `SHOW TABLES LIKE '%commission%'`;
    const tables = await executeQuery(tablesQuery, []);
    console.log('🗄️ [AFFILIATE STATS] Available commission tables:', tables);
    
    // Get monthly earnings (current month) - include both paid and pending commissions
    const monthlyEarningsQuery = `
      SELECT COALESCE(SUM(commission_amount), 0) as monthly_earnings
      FROM affiliate_commissions 
      WHERE affiliate_id = ? 
        AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
        AND status IN ('paid', 'pending')
    `;
    
    console.log('💰 [AFFILIATE STATS] Executing monthly earnings query:', monthlyEarningsQuery, 'with params:', [affiliateId]);
    const monthlyResult = await executeQuery(monthlyEarningsQuery, [affiliateId]);
    console.log('💰 [AFFILIATE STATS] Monthly earnings result:', monthlyResult);
    const monthlyEarnings = monthlyResult[0]?.monthly_earnings || 0;
    
    // Get pending commissions (users who signed up but haven't paid for a plan yet)
    const pendingQuery = `
      SELECT COUNT(DISTINCT ar.referred_user_id) as pending_signups,
             COALESCE(SUM(ar.commission_amount), 0) as potential_commissions
      FROM affiliate_referrals ar
      LEFT JOIN users u ON ar.referred_user_id = u.id
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE ar.affiliate_id = ? 
        AND ar.status = 'pending'
        AND (s.status IS NULL OR s.status NOT IN ('active'))
    `;
    
    console.log('⏳ [AFFILIATE STATS] Executing pending commissions query:', pendingQuery, 'with params:', [affiliateId]);
    const pendingResult = await executeQuery(pendingQuery, [affiliateId]);
    console.log('⏳ [AFFILIATE STATS] Pending commissions result:', pendingResult);
    const pendingSignups = pendingResult[0]?.pending_signups || 0;
    const potentialCommissions = pendingResult[0]?.potential_commissions || 0;
    
    // Check if there are any commission records at all for this affiliate
    const allCommissionsQuery = `
      SELECT COUNT(*) as total_count, 
             COALESCE(SUM(commission_amount), 0) as total_amount,
             GROUP_CONCAT(DISTINCT status) as statuses
      FROM affiliate_commissions 
      WHERE affiliate_id = ?
    `;
    
    console.log('🔍 [AFFILIATE STATS] Checking all commissions:', allCommissionsQuery, 'with params:', [affiliateId]);
    const allCommissionsResult = await executeQuery(allCommissionsQuery, [affiliateId]);
    console.log('🔍 [AFFILIATE STATS] All commissions result:', allCommissionsResult);
    
    // Also check if there's a different commission table structure
    try {
      const alternateCommissionsQuery = `
        SELECT COUNT(*) as total_count, 
               COALESCE(SUM(amount), 0) as total_amount,
               GROUP_CONCAT(DISTINCT status) as statuses
        FROM commissions 
        WHERE affiliate_id = ?
      `;
      
      console.log('🔍 [AFFILIATE STATS] Checking alternate commissions table:', alternateCommissionsQuery, 'with params:', [affiliateId]);
      const alternateResult = await executeQuery(alternateCommissionsQuery, [affiliateId]);
      console.log('🔍 [AFFILIATE STATS] Alternate commissions result:', alternateResult);
    } catch (altError) {
      console.log('ℹ️ [AFFILIATE STATS] Alternate commissions table not found or different structure:', altError.message);
    }
    
    // Get active referrals count - only count approved/converted referrals (paid customers)
    const activeReferralsQuery = `
      SELECT COUNT(DISTINCT ar.id) as active_referrals
      FROM affiliate_referrals ar
      WHERE ar.affiliate_id = ? 
        AND ar.status IN ('approved', 'converted')
    `;
    
    console.log('👥 [AFFILIATE STATS] Executing active referrals query:', activeReferralsQuery, 'with params:', [affiliateId]);
    const activeResult = await executeQuery(activeReferralsQuery, [affiliateId]);
    console.log('👥 [AFFILIATE STATS] Active referrals result:', activeResult);
    const activeReferrals = activeResult[0]?.active_referrals || 0;
    
    // Calculate conversion rate with better logic
    const conversionRate = affiliateData.total_referrals > 0 ? (activeReferrals / affiliateData.total_referrals * 100) : 0;
    
    // Get next payment date (first day of next month)
    const nextPayment = new Date();
    nextPayment.setMonth(nextPayment.getMonth() + 1);
    nextPayment.setDate(1);
    
    // Calculate current tier commission rate based on plan type and referrals
    const calculateCurrentTierRate = (planType, paidReferralsCount) => {
      // Normalize plan type - handle both affiliate plan types and subscription plan types
      const normalizedPlanType = planType?.toLowerCase();
      
      // Check if user has a paid plan (from subscription data or affiliate data)
      const hasPaidPlan = subscriptionData?.status === 'active' || 
                         normalizedPlanType === 'paid_partner' || 
                         normalizedPlanType === 'partner' || 
                         normalizedPlanType === 'pro' || 
                         normalizedPlanType === 'premium';
      
      if (!hasPaidPlan || normalizedPlanType === 'free' || normalizedPlanType === 'starter') {
        return paidReferralsCount >= 100 ? 15.0 : 10.0;
      } else {
        // User has a paid plan (Pro/Premium/Partner)
        return paidReferralsCount >= 100 ? 25.0 : 20.0;
      }
    };

    const currentTierRate = calculateCurrentTierRate(affiliateData.plan_type, affiliateData.paid_referrals_count);
    
    // Determine tier name and next tier info
    const getTierInfo = (planType, paidReferralsCount) => {
      // Normalize plan type - handle both affiliate plan types and subscription plan types
      const normalizedPlanType = planType?.toLowerCase();
      
      // Check if user has a paid plan (from subscription data or affiliate data)
      const hasPaidPlan = subscriptionData?.status === 'active' || 
                         normalizedPlanType === 'paid_partner' || 
                         normalizedPlanType === 'partner' || 
                         normalizedPlanType === 'pro' || 
                         normalizedPlanType === 'premium';
      
      if (!hasPaidPlan || normalizedPlanType === 'free' || normalizedPlanType === 'starter') {
        if (paidReferralsCount >= 100) {
          return {
            currentTier: 'Free - Advanced',
            nextTier: 'Upgrade to Pro Partner for higher rates',
            progressToNext: 100,
            referralsToNext: 0
          };
        } else {
          return {
            currentTier: 'Free - Starter',
            nextTier: 'Free - Advanced (15%)',
            progressToNext: (paidReferralsCount / 100) * 100,
            referralsToNext: 100 - paidReferralsCount
          };
        }
      } else {
        // User has a paid plan (Pro/Premium/Partner)
        if (paidReferralsCount >= 100) {
          return {
            currentTier: 'Pro - Premium',
            nextTier: 'Maximum tier reached',
            progressToNext: 100,
            referralsToNext: 0
          };
        } else {
          return {
            currentTier: 'Pro - Standard',
            nextTier: 'Pro - Premium (25%)',
            progressToNext: (paidReferralsCount / 100) * 100,
            referralsToNext: 100 - paidReferralsCount
          };
        }
      }
    };

    const tierInfo = getTierInfo(affiliateData.plan_type, affiliateData.paid_referrals_count);

    // Calculate non-renewals (referrals who were active but cancelled/expired in the last 30 days)
    const nonRenewalsQuery = `
      SELECT COUNT(DISTINCT ar.id) as non_renewals_count,
             COALESCE(SUM(ac.commission_amount), 0) as lost_commission_amount
      FROM affiliate_referrals ar
      LEFT JOIN affiliate_commissions ac ON ar.id = ac.referral_id
      LEFT JOIN users u ON ar.referred_user_id = u.id
      WHERE ar.affiliate_id = ? 
        AND ar.status IN ('cancelled', 'expired')
        AND ar.updated_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        AND ac.status = 'paid'
    `;
    
    console.log('📉 [AFFILIATE STATS] Executing non-renewals query:', nonRenewalsQuery, 'with params:', [affiliateId]);
    const nonRenewalsResult = await executeQuery(nonRenewalsQuery, [affiliateId]);
    console.log('📉 [AFFILIATE STATS] Non-renewals result:', nonRenewalsResult);
    const nonRenewalsCount = nonRenewalsResult[0]?.non_renewals_count || 0;
    const lostCommissionAmount = nonRenewalsResult[0]?.lost_commission_amount || 0;

    // Calculate potential lost commission for next month (based on current active referrals who might not renew)
    const potentialLostCommissionQuery = `
      SELECT COUNT(DISTINCT ar.id) as at_risk_referrals,
             COALESCE(AVG(ac.commission_amount), 0) as avg_commission
      FROM affiliate_referrals ar
      LEFT JOIN affiliate_commissions ac ON ar.id = ac.referral_id
      LEFT JOIN users u ON ar.referred_user_id = u.id
      WHERE ar.affiliate_id = ? 
        AND ar.status = 'converted'
        AND u.status = 'active'
        AND ac.status = 'paid'
    `;
    
    console.log('⚠️ [AFFILIATE STATS] Executing potential lost commission query:', potentialLostCommissionQuery, 'with params:', [affiliateId]);
    const potentialLostResult = await executeQuery(potentialLostCommissionQuery, [affiliateId]);
    console.log('⚠️ [AFFILIATE STATS] Potential lost commission result:', potentialLostResult);
    const atRiskReferrals = potentialLostResult[0]?.at_risk_referrals || 0;
    const avgCommission = potentialLostResult[0]?.avg_commission || 0;
    
    // Get actual yearly earnings (last 12 months of paid commissions)
    const yearlyEarningsQuery = `
      SELECT COALESCE(SUM(commission_amount), 0) as yearly_earnings
      FROM affiliate_commissions 
      WHERE affiliate_id = ? 
        AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        AND status = 'paid'
    `;
    
    console.log('📅 [AFFILIATE STATS] Executing yearly earnings query:', yearlyEarningsQuery, 'with params:', [affiliateId]);
    const yearlyResult = await executeQuery(yearlyEarningsQuery, [affiliateId]);
    console.log('📅 [AFFILIATE STATS] Yearly earnings result:', yearlyResult);
    const yearlyEarnings = yearlyResult[0]?.yearly_earnings || 0;

    // Estimate potential lost commission (assuming 20% churn rate)
    const estimatedLostCommission = atRiskReferrals * avgCommission * 0.2;

    // Get payment information
    const lastPaymentQuery = `
      SELECT 
        commission_amount as amount,
        DATE_FORMAT(created_at, '%b %d') as date
      FROM affiliate_commissions 
      WHERE affiliate_id = ? AND status = 'paid'
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const lastPaymentResult = await executeQuery(lastPaymentQuery, [affiliateId]);
    const lastPayment = lastPaymentResult[0] ? {
      amount: parseFloat(lastPaymentResult[0].amount),
      date: lastPaymentResult[0].date
    } : null;

    // Calculate percentage changes (comparing current month to last month)
    const currentMonthEarningsQuery = `
      SELECT COALESCE(SUM(commission_amount), 0) as current_month
      FROM affiliate_commissions 
      WHERE affiliate_id = ? 
        AND MONTH(created_at) = MONTH(CURRENT_DATE())
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
        AND status = 'paid'
    `;
    
    const lastMonthEarningsQuery = `
      SELECT COALESCE(SUM(commission_amount), 0) as last_month
      FROM affiliate_commissions 
      WHERE affiliate_id = ? 
        AND MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
        AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
        AND status = 'paid'
    `;
    
    const currentMonthResult = await executeQuery(currentMonthEarningsQuery, [affiliateId]);
    const lastMonthResult = await executeQuery(lastMonthEarningsQuery, [affiliateId]);
    
    const currentMonthEarnings = parseFloat(currentMonthResult[0]?.current_month) || 0;
    const lastMonthEarnings = parseFloat(lastMonthResult[0]?.last_month) || 0;
    
    const earningsChangePercentage = lastMonthEarnings > 0 ? 
      ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100) : 0;

    // Calculate conversion rate change (current month vs last month)
    const currentMonthConversionsQuery = `
      SELECT COUNT(*) as conversions
      FROM affiliate_referrals 
      WHERE affiliate_id = ? 
        AND status = 'converted'
        AND MONTH(conversion_date) = MONTH(CURRENT_DATE())
        AND YEAR(conversion_date) = YEAR(CURRENT_DATE())
    `;
    
    const lastMonthConversionsQuery = `
      SELECT COUNT(*) as conversions
      FROM affiliate_referrals 
      WHERE affiliate_id = ? 
        AND status = 'converted'
        AND MONTH(conversion_date) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
        AND YEAR(conversion_date) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
    `;
    
    const currentMonthConversions = await executeQuery(currentMonthConversionsQuery, [affiliateId]);
    const lastMonthConversions = await executeQuery(lastMonthConversionsQuery, [affiliateId]);
    
    const currentConversions = parseInt(currentMonthConversions[0]?.conversions) || 0;
    const lastConversions = parseInt(lastMonthConversions[0]?.conversions) || 0;
    
    const conversionChangePercentage = lastConversions > 0 ? 
      ((currentConversions - lastConversions) / lastConversions * 100) : 0;

    const stats = {
      totalEarnings: parseFloat(affiliateData.total_earnings) || 0,
      monthlyEarnings: parseFloat(monthlyEarnings) || 0,
      yearlyEarnings: parseFloat(yearlyEarnings) || 0,
      totalReferrals: affiliateData.total_referrals || 0,
      activeReferrals: activeReferrals,
      clickThroughRate: 8.4, // Mock data - would need click tracking
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      pendingCommissions: parseInt(pendingSignups) || 0,
      potentialCommissions: parseFloat(potentialCommissions) || 0,
      commissionRate: parseFloat(affiliateData.commission_rate) || 10,
      status: affiliateData.status,
      // New tier-related fields - prioritize subscription data if available
      planType: subscriptionData ? subscriptionData.plan_type : (affiliateData.plan_type || 'free'),
      actualPlanName: subscriptionData ? subscriptionData.plan_name : null,
      subscriptionStatus: subscriptionData ? subscriptionData.status : null,
      paidReferralsCount: affiliateData.paid_referrals_count || 0,
      paidCommissions: affiliateData.paid_referrals_count || 0, // Add this field for frontend compatibility
      currentTierRate: currentTierRate,
      tierInfo: tierInfo,
      // New non-renewals and lost commission fields
      nonRenewalsCount: parseInt(nonRenewalsCount) || 0,
      lostCommissionAmount: parseFloat(lostCommissionAmount) || 0,
      estimatedLostCommission: parseFloat(estimatedLostCommission.toFixed(2)) || 0,
      atRiskReferrals: parseInt(atRiskReferrals) || 0,
      // Payment information
      lastPayment: lastPayment,
      nextPayment: pendingSignups > 0 ? {
        date: nextPayment.toISOString().split('T')[0].replace(/-/g, '/'),
        status: 'Pending'
      } : null,
      paymentMethod: lastPayment ? 'Bank Transfer' : null,
      // Percentage changes
      totalEarningsChange: {
        percentage: parseFloat(earningsChangePercentage.toFixed(1)),
        period: 'last month'
      },
      conversionRateChange: {
        percentage: parseFloat(conversionChangePercentage.toFixed(1)),
        period: 'last month'
      }
    };
    
    console.log('📈 [AFFILIATE STATS] Final stats object:', stats);
    console.log('🎯 [AFFILIATE STATS] Key values - Total Earnings:', stats.totalEarnings, 'Monthly:', stats.monthlyEarnings, 'Yearly:', stats.yearlyEarnings, 'Pending Signups:', stats.pendingCommissions);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('💥 [AFFILIATE STATS] Error fetching affiliate stats:', error);
    res.status(500).json({ error: 'Failed to fetch affiliate statistics' });
  }
});

// GET /api/affiliate/dashboard/recent-referrals - Get recent referrals
router.get('/dashboard/recent-referrals', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    const limitParam = parseInt(req.query.limit as string);
    const safeLimit = Number.isFinite(limitParam) ? Math.max(1, Math.min(100, limitParam)) : 10;
    
    const query = `
      SELECT 
        ar.id,
        ar.transaction_id,
        u.first_name,
        u.last_name,
        u.email,
        ar.created_at as signup_date,
        u.status as user_status,
        COALESCE(ar.commission_amount, 0) as commission_earned,
        'basic' as subscription_plan,
        CASE 
        WHEN ar.status = 'approved' THEN 'paid'
        WHEN ar.status = 'converted' THEN 'paid'
        WHEN u.status = 'inactive' THEN 'cancelled'
        ELSE 'unpaid'
      END as referral_status
      FROM affiliate_referrals ar
      JOIN users u ON ar.referred_user_id = u.id
      WHERE ar.affiliate_id = ?
      ORDER BY ar.created_at DESC
      LIMIT ${safeLimit}
    `;
    
    const referrals = await executeQuery(query, [affiliateId]);
    
    const transformedReferrals = referrals.map((referral: any) => ({
      id: referral.id,
      customerName: `${referral.first_name || ''} ${referral.last_name || ''}`.trim() || `User ${referral.id}`,
      email: referral.email,
      status: referral.referral_status,
      dateReferred: referral.signup_date,
      commission: parseFloat(referral.commission_earned) || 0,
      lifetimeValue: parseFloat(referral.commission_earned) || 0,
      tier: parseFloat(referral.commission_earned) > 100 ? 'gold' : 
            parseFloat(referral.commission_earned) > 50 ? 'silver' : 'bronze',
      transactionId: referral.transaction_id
    }));
    
    res.json({
      success: true,
      data: transformedReferrals
    });
    
  } catch (error) {
    console.error('Error fetching recent referrals:', error);
    res.status(500).json({ error: 'Failed to fetch recent referrals' });
  }
});

// GET /api/affiliate/dashboard/performance - Get performance metrics
router.get('/dashboard/performance', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    
    // Get monthly performance for the last 6 months
    const performanceQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as referrals,
        COALESCE(SUM(commission_amount), 0) as earnings
      FROM affiliate_commissions
      WHERE affiliate_id = ? 
        AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
        AND status = 'paid'
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6
    `;
    
    const performance = await executeQuery(performanceQuery, [affiliateId]);
    
    const transformedPerformance = performance.map((item: any) => ({
      month: item.month,
      referrals: item.referrals,
      earnings: parseFloat(item.earnings) || 0
    }));
    
    res.json({
      success: true,
      data: transformedPerformance
    });
    
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

// GET /api/affiliate/dashboard/commissions - Get commission history
router.get('/dashboard/commissions', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    const pageNum = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 20));
    const safeOffset = (pageNum - 1) * limitNum;
    
    const query = `
      SELECT 
        ac.id,
        ac.customer_name,
        ac.customer_email,
        ac.order_value,
        ac.commission_rate,
        ac.commission_amount,
        ac.status,
        ac.tier,
        ac.product,
        ac.order_date,
        ac.payment_date,
        ac.commission_type,
        ac.tracking_code,
        ac.created_at
      FROM affiliate_commissions ac
      WHERE ac.affiliate_id = ?
      ORDER BY ac.created_at DESC
      LIMIT ${limitNum} OFFSET ${safeOffset}
    `;
    
    const commissions = await executeQuery(query, [affiliateId]);
    
    const transformedCommissions = commissions.map((commission: any) => ({
      id: commission.id,
      customerName: commission.customer_name,
      customerEmail: commission.customer_email,
      orderValue: parseFloat(commission.order_value) || 0,
      commissionRate: parseFloat(commission.commission_rate) || 0,
      commissionAmount: parseFloat(commission.commission_amount) || 0,
      status: commission.status,
      tier: commission.tier,
      product: commission.product,
      orderDate: commission.order_date,
      paymentDate: commission.payment_date,
      type: commission.commission_type || 'signup',
      trackingCode: commission.tracking_code,
      createdAt: commission.created_at
    }));
    
    res.json({
      success: true,
      data: transformedCommissions
    });
    
  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({ error: 'Failed to fetch commission history' });
  }
});

// POST /api/affiliate/dashboard/generate-link - Generate affiliate tracking link
router.post('/dashboard/generate-link', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    const { campaign, customCode } = req.body;
    
    // Generate unique tracking code
    const trackingCode = customCode || `AFF${affiliateId}_${Date.now()}`;
    const baseUrl = process.env.FRONTEND_URL || 'https://creditrepairpro.com';
    const affiliateLink = `${baseUrl}/signup?ref=${trackingCode}&campaign=${campaign || 'general'}&affiliate=${affiliateId}`;
    
    // Log link generation
    securityLogger.logSecurityEvent('affiliate_link_generated', {
      affiliateId,
      trackingCode,
      campaign: campaign || 'general',
      ip: req.ip
    });
    
    res.json({
      success: true,
      data: {
        link: affiliateLink,
        trackingCode,
        campaign: campaign || 'general'
      }
    });
    
  } catch (error) {
    console.error('Error generating affiliate link:', error);
    res.status(500).json({ error: 'Failed to generate affiliate link' });
  }
});

// GET /api/affiliate/dashboard/analytics - Get performance analytics
router.get('/dashboard/analytics', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    
    // Get click through rate and conversion data
    const analyticsQuery = `
      SELECT 
        COUNT(DISTINCT ar.id) as total_referrals,
        COUNT(DISTINCT CASE WHEN u.status = 'active' THEN ar.id END) as conversions,
        AVG(CASE WHEN u.status = 'active' THEN 50.0 ELSE 0 END) as avg_order_value
      FROM affiliate_referrals ar
      LEFT JOIN users u ON ar.referred_user_id = u.id
      WHERE ar.affiliate_id = ?
    `;
    
    const analyticsResult = await executeQuery(analyticsQuery, [affiliateId]);
    const analytics = analyticsResult[0] || {};
    
    // Get monthly earnings for chart
    const earningsQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%b') as month,
        COALESCE(SUM(commission_amount), 0) as earnings
      FROM affiliate_commissions
      WHERE affiliate_id = ? 
        AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
        AND status = 'paid'
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')
      ORDER BY created_at ASC
      LIMIT 6
    `;
    
    const earningsResult = await executeQuery(earningsQuery, [affiliateId]);
    
    const performanceData = {
      clickThroughRate: 12.8, // Mock data - would need click tracking
      conversionRate: analytics.total_referrals > 0 ? 
        ((analytics.conversions / analytics.total_referrals) * 100).toFixed(1) : 0,
      averageOrderValue: parseFloat(analytics.avg_order_value) || 0,
      totalClicks: analytics.total_referrals * 10, // Mock multiplier
      totalConversions: analytics.conversions || 0,
      earningsChart: earningsResult.map((item: any) => ({
        month: item.month,
        earnings: parseFloat(item.earnings) || 0
      }))
    };
    
    res.json({
      success: true,
      data: performanceData
    });
    
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// GET /api/affiliate/referrals - Get all referrals for the affiliate
router.get('/referrals', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    const pageParam = parseInt(req.query.page as string);
    const limitParam = parseInt(req.query.limit as string);
    const safeLimit = Number.isFinite(limitParam) ? Math.max(1, Math.min(100, limitParam)) : 50;
    const safePage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const safeOffset = (safePage - 1) * safeLimit;
    
    const query = `
      SELECT 
        ar.id,
        u.first_name,
        u.last_name,
        u.email,
        ar.created_at as signup_date,
        ar.conversion_date,
        u.status as user_status,
        ar.status as referral_status,
        COALESCE(ac.total_commission, ar.commission_amount, 0) as commission_earned,
        'basic' as subscription_plan,
        CASE 
          WHEN u.status = 'inactive' THEN 'cancelled'
          WHEN ac.latest_status IN ('paid','settled','approved') OR ac.payment_date IS NOT NULL THEN 'paid'
          WHEN ar.status IN ('approved','converted','paid') THEN 'paid'
          ELSE 'unpaid'
        END as final_status
      FROM affiliate_referrals ar
      JOIN users u ON ar.referred_user_id = u.id
      LEFT JOIN (
        SELECT 
          referral_id,
          affiliate_id,
          SUM(commission_amount) AS total_commission,
          MAX(status) AS latest_status,
          MAX(payment_date) AS payment_date
        FROM affiliate_commissions
        GROUP BY referral_id, affiliate_id
      ) ac ON ar.id = ac.referral_id AND ac.affiliate_id = ?
      WHERE ar.affiliate_id = ?
      ORDER BY ar.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;
    
    const referrals = await executeQuery(query, [affiliateId, affiliateId]);
    
    // Transform data to match frontend interface
    const transformedReferrals = referrals.map((referral: any) => ({
      id: referral.id,
      customerName: `${referral.first_name || ''} ${referral.last_name || ''}`.trim() || `User ${referral.id}`,
      email: referral.email,
      status: referral.final_status,
      signupDate: referral.signup_date,
      conversionDate: referral.conversion_date,
      commission: parseFloat(referral.commission_earned) || 0,
      lifetimeValue: parseFloat(referral.commission_earned) || 0,
      tier: parseFloat(referral.commission_earned) > 100 ? 'enterprise' :
            parseFloat(referral.commission_earned) > 50 ? 'premium' : 'basic'
    }));
    
    res.json({
      success: true,
      data: transformedReferrals
    });
    
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

// GET /api/affiliate/referrals/stats - Get referral statistics
router.get('/referrals/stats', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    
    // Get total referrals count
    const totalReferralsQuery = `
      SELECT COUNT(*) as total_referrals
      FROM affiliate_referrals 
      WHERE affiliate_id = ?
    `;
    
    // Get paid referrals count based on commissions/payment evidence or referral status
    const paidReferralsQuery = `
      SELECT COUNT(*) as paid_referrals
      FROM affiliate_referrals ar
      JOIN users u ON ar.referred_user_id = u.id
      LEFT JOIN (
        SELECT 
          referral_id,
          affiliate_id,
          SUM(CASE WHEN status = 'paid' OR payment_date IS NOT NULL THEN 1 ELSE 0 END) AS paid_events
        FROM affiliate_commissions
        GROUP BY referral_id, affiliate_id
      ) ac ON ar.id = ac.referral_id AND ar.affiliate_id = ac.affiliate_id
      WHERE ar.affiliate_id = ?
        AND u.status != 'inactive'
        AND (
          COALESCE(ac.paid_events, 0) > 0
          OR ar.status IN ('approved', 'converted', 'paid')
        )
    `;

    // Get unpaid referrals count (no paid commission/payment evidence and not approved/converted/paid)
    const unpaidReferralsQuery = `
      SELECT COUNT(*) as unpaid_referrals
      FROM affiliate_referrals ar
      JOIN users u ON ar.referred_user_id = u.id
      LEFT JOIN (
        SELECT 
          referral_id,
          affiliate_id,
          SUM(CASE WHEN status = 'paid' OR payment_date IS NOT NULL THEN 1 ELSE 0 END) AS paid_events
        FROM affiliate_commissions
        GROUP BY referral_id, affiliate_id
      ) ac ON ar.id = ac.referral_id AND ar.affiliate_id = ac.affiliate_id
      WHERE ar.affiliate_id = ?
        AND u.status != 'inactive'
        AND NOT (
          COALESCE(ac.paid_events, 0) > 0
          OR ar.status IN ('approved', 'converted', 'paid')
        )
    `;
    
    // Get total commission earned
    const totalCommissionQuery = `
      SELECT COALESCE(SUM(commission_amount), 0) as total_commission
      FROM affiliate_commissions 
      WHERE affiliate_id = ? AND status = 'paid'
    `;
    
    // Get average lifetime value per paid referral (matching updated referrals logic)
    const avgLifetimeValueQuery = `
      SELECT COALESCE(AVG(ac.commission_amount), 0) as avg_lifetime_value
      FROM affiliate_commissions ac
      JOIN affiliate_referrals ar ON ac.referral_id = ar.id
      JOIN users u ON ar.referred_user_id = u.id
      WHERE ac.affiliate_id = ? AND ac.status = 'paid' AND ar.status IN ('approved', 'converted')
    `;
    
    const [totalResult, paidResult, unpaidResult, commissionResult, avgResult] = await Promise.all([
      executeQuery(totalReferralsQuery, [affiliateId]),
      executeQuery(paidReferralsQuery, [affiliateId]),
      executeQuery(unpaidReferralsQuery, [affiliateId]),
      executeQuery(totalCommissionQuery, [affiliateId]),
      executeQuery(avgLifetimeValueQuery, [affiliateId])
    ]);
    
    const totalReferrals = totalResult[0]?.total_referrals || 0;
    const paidReferrals = paidResult[0]?.paid_referrals || 0;
    const unpaidReferrals = unpaidResult[0]?.unpaid_referrals || 0;
    const totalCommission = parseFloat(commissionResult[0]?.total_commission) || 0;
    const avgLifetimeValue = parseFloat(avgResult[0]?.avg_lifetime_value) || 0;
    
    const conversionRate = totalReferrals > 0 ? ((paidReferrals / totalReferrals) * 100) : 0;
    
    const stats = {
      totalReferrals,
      convertedReferrals: paidReferrals, // Keep the same field name for frontend compatibility
      pendingReferrals: unpaidReferrals, // Keep the same field name for frontend compatibility
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      totalCommission,
      avgLifetimeValue: parseFloat(avgLifetimeValue.toFixed(2))
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({ error: 'Failed to fetch referral statistics' });
  }
});

// GET /api/affiliate/earnings/stats - Get detailed earnings statistics
router.get('/earnings/stats', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    
    // Get total earnings
    const totalEarningsQuery = `
      SELECT COALESCE(SUM(commission_amount), 0) as total_earnings
      FROM affiliate_commissions 
      WHERE affiliate_id = ? AND status = 'paid'
    `;
    
    // Get monthly earnings (current month)
    const monthlyEarningsQuery = `
      SELECT COALESCE(SUM(commission_amount), 0) as monthly_earnings
      FROM affiliate_commissions 
      WHERE affiliate_id = ? 
        AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
        AND status = 'paid'
    `;
    
    // Get yearly earnings (current year)
    const yearlyEarningsQuery = `
      SELECT COALESCE(SUM(commission_amount), 0) as yearly_earnings
      FROM affiliate_commissions 
      WHERE affiliate_id = ? 
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
        AND status = 'paid'
    `;
    
    // Get pending earnings
    const pendingEarningsQuery = `
      SELECT COALESCE(SUM(commission_amount), 0) as pending_earnings
      FROM affiliate_commissions 
      WHERE affiliate_id = ? AND status = 'pending'
    `;
    
    // Get average monthly earnings (last 6 months)
    const avgMonthlyQuery = `
      SELECT COALESCE(AVG(monthly_total), 0) as avg_monthly
      FROM (
        SELECT COALESCE(SUM(commission_amount), 0) as monthly_total
        FROM affiliate_commissions 
        WHERE affiliate_id = ? 
          AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
          AND status = 'paid'
        GROUP BY YEAR(created_at), MONTH(created_at)
      ) monthly_earnings
    `;
    
    // Get growth rate (compare current month to last month)
    const growthRateQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE()) THEN commission_amount ELSE 0 END), 0) as current_month,
        COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH)) THEN commission_amount ELSE 0 END), 0) as last_month
      FROM affiliate_commissions 
      WHERE affiliate_id = ? AND status = 'paid'
    `;
    
    const [totalResult, monthlyResult, yearlyResult, pendingResult, avgResult, growthResult] = await Promise.all([
      executeQuery(totalEarningsQuery, [affiliateId]),
      executeQuery(monthlyEarningsQuery, [affiliateId]),
      executeQuery(yearlyEarningsQuery, [affiliateId]),
      executeQuery(pendingEarningsQuery, [affiliateId]),
      executeQuery(avgMonthlyQuery, [affiliateId]),
      executeQuery(growthRateQuery, [affiliateId])
    ]);
    
    const totalEarnings = parseFloat(totalResult[0]?.total_earnings) || 0;
    const monthlyEarnings = parseFloat(monthlyResult[0]?.monthly_earnings) || 0;
    const yearlyEarnings = parseFloat(yearlyResult[0]?.yearly_earnings) || 0;
    const pendingEarnings = parseFloat(pendingResult[0]?.pending_earnings) || 0;
    const avgMonthlyEarnings = parseFloat(avgResult[0]?.avg_monthly) || 0;
    
    const currentMonth = parseFloat(growthResult[0]?.current_month) || 0;
    const lastMonth = parseFloat(growthResult[0]?.last_month) || 0;
    const growthRate = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth * 100) : 0;
    
    const stats = {
      totalEarnings,
      monthlyEarnings,
      yearlyEarnings,
      pendingEarnings,
      paidEarnings: totalEarnings,
      avgMonthlyEarnings,
      growthRate: parseFloat(growthRate.toFixed(1)),
      nextPaymentDate: "2024-02-01", // Mock data - would need payment schedule logic
      nextPaymentAmount: pendingEarnings
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error fetching earnings stats:', error);
    res.status(500).json({ error: 'Failed to fetch earnings statistics' });
  }
});

// GET /api/affiliate/earnings/payments - Get payment history
router.get('/earnings/payments', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    
    const paymentsQuery = `
      SELECT 
        ac.id,
        ac.commission_amount as amount,
        ac.status,
        DATE_FORMAT(ac.created_at, '%Y-%m-%d') as payment_date,
        ac.updated_at,
        'Bank Transfer' as payment_method,
        CONCAT('TXN-', ac.id) as transaction_id,
        DATE_FORMAT(ac.created_at, '%M %Y') as period,
        ac.commission_amount as commissions,
        0 as bonuses
      FROM affiliate_commissions ac
      WHERE ac.affiliate_id = ?
      ORDER BY ac.created_at DESC
      LIMIT 50
    `;
    
    const payments = await executeQuery(paymentsQuery, [affiliateId]);
    
    const transformedPayments = payments.map((payment: any) => ({
      id: payment.id.toString(),
      amount: parseFloat(payment.amount) || 0,
      status: payment.status,
      paymentDate: payment.payment_date,
      paymentMethod: payment.payment_method,
      transactionId: payment.transaction_id,
      period: payment.period,
      commissions: parseFloat(payment.commissions) || 0,
      bonuses: parseFloat(payment.bonuses) || 0
    }));
    
    // Return the array directly as expected by the frontend
    res.json(transformedPayments);
    
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// GET /api/affiliate/earnings/breakdown - Get earnings breakdown
router.get('/earnings/breakdown', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    
    // Get commission breakdown
    const breakdownQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN commission_type = 'referral' THEN commission_amount ELSE 0 END), 0) as commissions,
        COALESCE(SUM(CASE WHEN commission_type = 'bonus' THEN commission_amount ELSE 0 END), 0) as bonuses,
        COALESCE(SUM(CASE WHEN commission_type = 'recurring' THEN commission_amount ELSE 0 END), 0) as recurring_commissions,
        COALESCE(SUM(CASE WHEN commission_type = 'one_time' THEN commission_amount ELSE 0 END), 0) as one_time_commissions,
        COALESCE(SUM(CASE WHEN commission_type = 'tier_bonus' THEN commission_amount ELSE 0 END), 0) as tier_bonuses
      FROM affiliate_commissions 
      WHERE affiliate_id = ? AND status IN ('paid', 'pending')
    `;
    
    const result = await executeQuery(breakdownQuery, [affiliateId]);
    const breakdown = result[0] || {};
    
    // If commission_type doesn't exist, use fallback logic
    const fallbackQuery = `
      SELECT COALESCE(SUM(commission_amount), 0) as total_commissions
      FROM affiliate_commissions 
      WHERE affiliate_id = ? AND status IN ('paid', 'pending')
    `;
    
    const fallbackResult = await executeQuery(fallbackQuery, [affiliateId]);
    const totalCommissions = parseFloat(fallbackResult[0]?.total_commissions) || 0;
    
    const earningsBreakdown = {
      commissions: parseFloat(breakdown.commissions) || totalCommissions,
      bonuses: parseFloat(breakdown.bonuses) || 0,
      recurringCommissions: parseFloat(breakdown.recurring_commissions) || totalCommissions * 0.7,
      oneTimeCommissions: parseFloat(breakdown.one_time_commissions) || totalCommissions * 0.3,
      tierBonuses: parseFloat(breakdown.tier_bonuses) || 0
    };
    
    // Return the data directly as expected by the frontend
    res.json(earningsBreakdown);
    
  } catch (error) {
    console.error('Error fetching earnings breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch earnings breakdown' });
  }
});

// GET /api/affiliate/earnings/monthly - Get monthly earnings data
router.get('/earnings/monthly', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    
    const monthlyQuery = `
      SELECT 
        DATE_FORMAT(ac.created_at, '%b %Y') as month,
        COALESCE(SUM(ac.commission_amount), 0) as earnings,
        COALESCE(SUM(ac.commission_amount), 0) as commissions,
        COUNT(DISTINCT ar.id) as referrals
      FROM affiliate_commissions ac
      LEFT JOIN affiliate_referrals ar ON ac.affiliate_id = ar.affiliate_id 
        AND MONTH(ac.created_at) = MONTH(ar.created_at)
        AND YEAR(ac.created_at) = YEAR(ar.created_at)
      WHERE ac.affiliate_id = ? 
        AND ac.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
        AND ac.status IN ('paid', 'pending')
      GROUP BY YEAR(ac.created_at), MONTH(ac.created_at), DATE_FORMAT(ac.created_at, '%b %Y')
      ORDER BY YEAR(ac.created_at) ASC, MONTH(ac.created_at) ASC
    `;
    
    const monthlyData = await executeQuery(monthlyQuery, [affiliateId]);
    
    const transformedData = monthlyData.map((item: any) => ({
      month: item.month,
      earnings: parseFloat(item.earnings) || 0,
      commissions: parseFloat(item.commissions) || 0,
      referrals: parseInt(item.referrals) || 0
    }));
    
    // Return the array directly as expected by the frontend
    res.json(transformedData);
    
  } catch (error) {
    console.error('Error fetching monthly earnings:', error);
    res.status(500).json({ error: 'Failed to fetch monthly earnings' });
  }
});

// GET /api/affiliate/tiers - Get commission tiers information
router.get('/tiers', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const query = `
      SELECT 
        name,
        min_referrals,
        commission_rate,
        bonuses
      FROM commission_tiers
      WHERE is_active = true
      ORDER BY min_referrals ASC
    `;
    
    const tiersData = await executeQuery(query, []);
    
    const tiers = tiersData.map((tier: any) => ({
      name: tier.name,
      minReferrals: tier.min_referrals,
      commissionRate: parseFloat(tier.commission_rate),
      bonuses: tier.bonuses ? JSON.parse(tier.bonuses) : []
    }));

    // If no tiers found in database, return default tiers
    if (tiers.length === 0) {
      const defaultTiers = [
        {
          name: "Bronze",
          minReferrals: 0,
          commissionRate: 15,
          bonuses: ["Basic support", "Monthly reports"]
        },
        {
          name: "Silver",
          minReferrals: 10,
          commissionRate: 20,
          bonuses: ["Priority support", "Weekly reports", "Marketing materials"]
        },
        {
          name: "Gold",
          minReferrals: 25,
          commissionRate: 25,
          bonuses: ["Dedicated support", "Daily reports", "Custom materials", "Performance bonuses"]
        },
        {
          name: "Platinum",
          minReferrals: 50,
          commissionRate: 30,
          bonuses: ["VIP support", "Real-time analytics", "Custom landing pages", "Quarterly bonuses", "Exclusive events"]
        }
      ];
      
      res.json({
        success: true,
        data: defaultTiers
      });
      return;
    }

    res.json({
      success: true,
      data: tiers
    });
    
  } catch (error) {
    console.error('Error fetching tiers:', error);
    res.status(500).json({ error: 'Failed to fetch commission tiers' });
  }
});

// GET /api/affiliate/dashboard/commissions/export - Export commission history as CSV
router.get('/dashboard/commissions/export', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    const { from, to } = req.query;
    
    let query = `
      SELECT 
        ac.id,
        u.first_name,
        u.last_name,
        u.email,
        ac.commission_amount as amount,
        ac.created_at as date,
        ac.status,
        ac.commission_type as type,
        ar.created_at as referral_date
      FROM affiliate_commissions ac
      JOIN affiliate_referrals ar ON ac.referral_id = ar.id
      JOIN users u ON ar.referred_user_id = u.id
      WHERE ac.affiliate_id = ?
    `;
    
    const params = [affiliateId];
    
    if (from) {
      query += ' AND ac.created_at >= ?';
      params.push(from as string);
    }
    
    if (to) {
      query += ' AND ac.created_at <= ?';
      params.push(to as string);
    }
    
    query += ' ORDER BY ac.created_at DESC';
    
    const commissions = await executeQuery(query, params);
    
    // Generate CSV content
    const headers = ['ID', 'Customer Name', 'Email', 'Amount', 'Status', 'Type', 'Date', 'Referral Date'];
    const csvRows = [headers.join(',')];
    
    commissions.forEach((commission: any) => {
      const row = [
        commission.id,
        `"${commission.first_name} ${commission.last_name}"`,
        commission.email,
        commission.amount,
        commission.status,
        commission.type || 'signup',
        new Date(commission.date).toISOString().split('T')[0],
        new Date(commission.referral_date).toISOString().split('T')[0]
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    res.json({
      success: true,
      data: csvContent
    });
    
  } catch (error) {
    console.error('Error exporting commissions:', error);
    res.status(500).json({ error: 'Failed to export commission data' });
  }
});

// GET /api/affiliate/links - Get all referral links for the affiliate
router.get('/links', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    
    // For now, return mock data since we don't have a links table yet
    // In a real implementation, you would query a referral_links table
    const mockLinks = [
      {
        id: "link_1",
        name: "Social Media Campaign",
        description: "General social media promotion link",
        originalUrl: "https://creditrepairpro.com/signup",
        shortUrl: "https://crp.ly/social123",
        trackingCode: "SOCIAL_JAN2024",
        campaign: "social_media",
        source: "facebook",
        medium: "social",
        clicks: 1247,
        conversions: 89,
        conversionRate: 7.14,
        revenue: 2201.50,
        status: "active",
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-20T14:30:00Z"
      },
      {
        id: "link_2",
        name: "Email Newsletter",
        description: "Weekly newsletter promotion",
        originalUrl: "https://creditrepairpro.com/special-offer",
        shortUrl: "https://crp.ly/email456",
        trackingCode: "EMAIL_WEEKLY",
        campaign: "email_marketing",
        source: "newsletter",
        medium: "email",
        clicks: 892,
        conversions: 67,
        conversionRate: 7.51,
        revenue: 1654.75,
        status: "active",
        createdAt: "2024-01-10T09:15:00Z",
        updatedAt: "2024-01-18T16:45:00Z"
      },
      {
        id: "link_3",
        name: "Blog Content",
        description: "Credit repair tips blog post",
        originalUrl: "https://creditrepairpro.com/blog-signup",
        shortUrl: "https://crp.ly/blog789",
        trackingCode: "BLOG_CONTENT",
        campaign: "content_marketing",
        source: "blog",
        medium: "organic",
        clicks: 634,
        conversions: 41,
        conversionRate: 6.47,
        revenue: 1012.25,
        status: "active",
        createdAt: "2024-01-08T14:20:00Z",
        updatedAt: "2024-01-16T11:30:00Z"
      }
    ];
    
    res.json({
      success: true,
      data: mockLinks
    });
    
  } catch (error) {
    console.error('Error fetching affiliate links:', error);
    res.status(500).json({ error: 'Failed to fetch affiliate links' });
  }
});

// GET /api/affiliate/links/stats - Get link statistics
router.get('/links/stats', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    
    // Mock stats data - in real implementation, aggregate from links table
    const mockStats = {
      totalClicks: 2773,
      totalConversions: 197,
      totalRevenue: 4868.50,
      conversionRate: 7.10,
      activeLinks: 3,
      pausedLinks: 0,
      expiredLinks: 0
    };
    
    res.json({
      success: true,
      data: mockStats
    });
    
  } catch (error) {
    console.error('Error fetching link stats:', error);
    res.status(500).json({ error: 'Failed to fetch link statistics' });
  }
});

// POST /api/affiliate/links - Create a new referral link
router.post('/links', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    const { name, description, originalUrl, campaign, source, medium, expiresAt } = req.body;
    
    // Validate required fields
    if (!name || !originalUrl) {
      return res.status(400).json({ error: 'Name and original URL are required' });
    }
    
    // Generate a unique tracking code
    const trackingCode = `${campaign?.toUpperCase() || 'CUSTOM'}_${Date.now()}`;
    const shortUrl = `https://crp.ly/${Math.random().toString(36).substr(2, 8)}`;
    
    // In a real implementation, you would insert into a referral_links table
    const newLink = {
      id: `link_${Date.now()}`,
      name,
      description: description || '',
      originalUrl,
      shortUrl,
      trackingCode,
      campaign: campaign || 'custom',
      source: source || 'direct',
      medium: medium || 'referral',
      clicks: 0,
      conversions: 0,
      conversionRate: 0,
      revenue: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: expiresAt || null
    };
    
    // Log the link creation
    securityLogger.logSecurityEvent('affiliate_link_created', {
      affiliateId,
      linkId: newLink.id,
      name,
      campaign,
      ip: req.ip
    });
    
    res.json({
      success: true,
      data: newLink
    });
    
  } catch (error) {
    console.error('Error creating affiliate link:', error);
    res.status(500).json({ error: 'Failed to create affiliate link' });
  }
});

// GET /api/affiliate/dashboard/leaderboard - Get affiliate leaderboard data
router.get('/dashboard/leaderboard', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    console.log('🏆 [LEADERBOARD] Starting leaderboard fetch');
    
    // Get top Pro affiliates (premium plans)
    const proAffiliatesQuery = `
      SELECT 
        a.id,
        a.first_name,
        a.last_name,
        a.total_earnings,
        a.total_referrals,
        a.paid_referrals_count,
        a.plan_type,
        a.commission_rate,
        COALESCE(SUM(ac.commission_amount), 0) as monthly_earnings
      FROM affiliates a
      LEFT JOIN affiliate_commissions ac ON a.id = ac.affiliate_id 
        AND ac.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND ac.status = 'paid'
      WHERE a.plan_type IN ('pro', 'premium', 'partner')
        AND a.status = 'active'
      GROUP BY a.id, a.first_name, a.last_name, a.total_earnings, a.total_referrals, 
               a.paid_referrals_count, a.plan_type, a.commission_rate
      ORDER BY a.total_earnings DESC
      LIMIT 10
    `;
    
    // Get top Free affiliates (free/starter plans)
    const freeAffiliatesQuery = `
      SELECT 
        a.id,
        a.first_name,
        a.last_name,
        a.total_earnings,
        a.total_referrals,
        a.paid_referrals_count,
        a.plan_type,
        a.commission_rate,
        COALESCE(SUM(ac.commission_amount), 0) as monthly_earnings
      FROM affiliates a
      LEFT JOIN affiliate_commissions ac ON a.id = ac.affiliate_id 
        AND ac.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND ac.status = 'paid'
      WHERE a.plan_type IN ('free', 'starter')
        AND a.status = 'active'
      GROUP BY a.id, a.first_name, a.last_name, a.total_earnings, a.total_referrals, 
               a.paid_referrals_count, a.plan_type, a.commission_rate
      ORDER BY a.total_earnings DESC
      LIMIT 10
    `;
    
    console.log('🏆 [LEADERBOARD] Executing Pro affiliates query');
    const proAffiliates = await executeQuery(proAffiliatesQuery);
    
    console.log('🏆 [LEADERBOARD] Executing Free affiliates query');
    const freeAffiliates = await executeQuery(freeAffiliatesQuery);
    
    // Format the results with rankings
    const formatLeaderboard = (affiliates: any[]) => {
      return affiliates.map((affiliate, index) => ({
        rank: index + 1,
        id: affiliate.id,
        name: `${affiliate.first_name} ${affiliate.last_name}`,
        totalEarnings: parseFloat(affiliate.total_earnings) || 0,
        monthlyEarnings: parseFloat(affiliate.monthly_earnings) || 0,
        totalReferrals: affiliate.total_referrals || 0,
        paidReferrals: affiliate.paid_referrals_count || 0,
        planType: affiliate.plan_type,
        commissionRate: affiliate.commission_rate || 10,
        tier: getTierFromPlanType(affiliate.plan_type)
      }));
    };
    
    const leaderboardData = {
      pro: formatLeaderboard(proAffiliates || []),
      free: formatLeaderboard(freeAffiliates || [])
    };
    
    console.log('✅ [LEADERBOARD] Leaderboard data prepared:', {
      proCount: leaderboardData.pro.length,
      freeCount: leaderboardData.free.length
    });
    
    res.json({
      success: true,
      data: leaderboardData
    });
    
  } catch (error) {
    console.error('💥 [LEADERBOARD] Error fetching leaderboard:', error);
    securityLogger.logSecurityEvent('affiliate_leaderboard_error', {
      userId: req.user?.id,
      error: error.message,
      ip: req.ip
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard data'
    });
  }
});

// GET /api/affiliate/dashboard/team-performance - Get team performance data with affiliate counts by level
router.get('/dashboard/team-performance', authenticateToken, requireAffiliateRole, async (req, res) => {
  try {
    const affiliateId = await resolveAffiliateId(req);
    if (!affiliateId) {
      return res.status(404).json({ error: 'Affiliate not found for this user' });
    }
    console.log('🏢 [TEAM PERFORMANCE] Starting team performance fetch for affiliate ID:', affiliateId);
    
    // Get Level 1 (Direct) affiliates - those directly recruited by this affiliate
    const level1Query = `
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(ac.commission_amount), 0) as total_earnings
      FROM affiliates a
      LEFT JOIN affiliate_commissions ac ON a.id = ac.affiliate_id 
        AND ac.status = 'paid'
      WHERE a.parent_affiliate_id = ?
        AND a.status = 'active'
    `;
    
    // Get Level 2 affiliates - those recruited by Level 1 affiliates
    const level2Query = `
      SELECT 
        COUNT(DISTINCT a2.id) as count,
        COALESCE(SUM(ac.commission_amount), 0) as total_earnings
      FROM affiliates a1
      JOIN affiliates a2 ON a1.id = a2.parent_affiliate_id
      LEFT JOIN affiliate_commissions ac ON a2.id = ac.affiliate_id 
        AND ac.status = 'paid'
      WHERE a1.parent_affiliate_id = ?
        AND a1.status = 'active'
        AND a2.status = 'active'
    `;
    
    // Get Level 3 affiliates - those recruited by Level 2 affiliates
    const level3Query = `
      SELECT 
        COUNT(DISTINCT a3.id) as count,
        COALESCE(SUM(ac.commission_amount), 0) as total_earnings
      FROM affiliates a1
      JOIN affiliates a2 ON a1.id = a2.parent_affiliate_id
      JOIN affiliates a3 ON a2.id = a3.parent_affiliate_id
      LEFT JOIN affiliate_commissions ac ON a3.id = ac.affiliate_id 
        AND ac.status = 'paid'
      WHERE a1.parent_affiliate_id = ?
        AND a1.status = 'active'
        AND a2.status = 'active'
        AND a3.status = 'active'
    `;
    
    console.log('🏢 [TEAM PERFORMANCE] Executing Level 1 query');
    const level1Result = await executeQuery(level1Query, [affiliateId]);
    
    console.log('🏢 [TEAM PERFORMANCE] Executing Level 2 query');
    const level2Result = await executeQuery(level2Query, [affiliateId]);
    
    console.log('🏢 [TEAM PERFORMANCE] Executing Level 3 query');
    const level3Result = await executeQuery(level3Query, [affiliateId]);
    
    const teamPerformanceData = {
      level1: {
        count: level1Result[0]?.count || 0,
        earnings: parseFloat(level1Result[0]?.total_earnings) || 0
      },
      level2: {
        count: level2Result[0]?.count || 0,
        earnings: parseFloat(level2Result[0]?.total_earnings) || 0
      },
      level3: {
        count: level3Result[0]?.count || 0,
        earnings: parseFloat(level3Result[0]?.total_earnings) || 0
      }
    };
    
    console.log('✅ [TEAM PERFORMANCE] Team performance data prepared:', teamPerformanceData);
    
    res.json({
      success: true,
      data: teamPerformanceData
    });
    
  } catch (error) {
    console.error('💥 [TEAM PERFORMANCE] Error fetching team performance:', error);
    securityLogger.logSecurityEvent('affiliate_team_performance_error', {
      userId: req.user?.id,
      error: error.message,
      ip: req.ip
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team performance data'
    });
  }
});

// Helper function to get tier display name from plan type
function getTierFromPlanType(planType: string): string {
  switch (planType?.toLowerCase()) {
    case 'free':
      return 'Free - Starter';
    case 'starter':
      return 'Free - Starter';
    case 'pro':
      return 'Pro - Advanced';
    case 'premium':
      return 'Premium - Partner';
    case 'partner':
      return 'Premium - Partner';
    default:
      return 'Free - Starter';
  }
}

export default router;