import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { executeQuery } from '../database/mysqlConfig.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { SecurityLogger } from '../utils/securityLogger.js';

const router = express.Router();
const securityLogger = new SecurityLogger();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Middleware to ensure only super admin can access affiliate management
const requireSuperAdminRole = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'super_admin') {
    securityLogger.logSecurityEvent('unauthorized_affiliate_access', {
      userId: req.user?.id,
      userRole: req.user?.role,
      endpoint: req.path,
      ip: req.ip
    });
    return res.status(403).json({ error: 'Access denied. Super admin role required.' });
  }
  next();
};

const requireSuperAdminOrSupport = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'super_admin' && req.user?.role !== 'support') {
    securityLogger.logSecurityEvent('unauthorized_affiliate_import_access', {
      userId: req.user?.id,
      userRole: req.user?.role,
      endpoint: req.path,
      ip: req.ip
    });
    return res.status(403).json({ error: 'Access denied. Super admin or Support role required.' });
  }
  next();
};

// GET /api/affiliate-management - Get all affiliates (all for super admin, filtered for regular admin)
router.get('/', authenticateToken, requireSuperAdminRole, async (req, res) => {
  try {
    const adminIdValue = req.user?.role === 'support' ? 2 : req.user.id;
    const userRole = req.user.role;
    let hasReferralSlug = false;
    try {
      const colRes: any[] = await executeQuery(
        `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'affiliates' AND COLUMN_NAME = 'referral_slug'`,
        []
      );
      hasReferralSlug = !!colRes && ((colRes[0]?.cnt || 0) > 0);
    } catch {}
    
    let query = `
      SELECT 
        a.id,
        a.admin_id,
        a.parent_affiliate_id,
        a.email,
        a.first_name,
        a.last_name,
        a.company_name,
        a.phone,
        a.address,
        a.city,
        a.state,
        a.zip_code,
        a.commission_rate,
        a.parent_commission_rate,
        a.affiliate_level,
        a.total_earnings,
        a.total_referrals,
        a.status,
        a.email_verified,
        a.last_login,
        a.bank_name,
        a.account_holder_name,
        a.account_number,
        a.routing_number,
        a.account_type,
        a.swift_code,
        a.iban,
        a.bank_address,
        a.payment_method,
        a.paypal_email,
        a.stripe_account_id,
        a.created_at,
        a.updated_at${hasReferralSlug ? ',\n        a.referral_slug' : ''},
        u.email as admin_email,
        u.first_name as admin_first_name,
        u.last_name as admin_last_name,
        pa.first_name as parent_first_name,
        pa.last_name as parent_last_name,
        pa.email as parent_email,
        COALESCE(acsum.total_commission, 0) - COALESCE(cpsum.total_paid, 0) AS computed_total_earnings,
        COALESCE(rfsum.total_referrals, a.total_referrals) AS computed_total_referrals
      FROM affiliates a
      LEFT JOIN users u ON a.admin_id = u.id
      LEFT JOIN affiliates pa ON a.parent_affiliate_id = pa.id
      LEFT JOIN (
        SELECT affiliate_id, SUM(commission_amount) AS total_commission
        FROM affiliate_commissions
        GROUP BY affiliate_id
      ) acsum ON acsum.affiliate_id = a.id
      LEFT JOIN (
        SELECT affiliate_id, SUM(amount) AS total_paid
        FROM commission_payments
        WHERE status = 'completed'
        GROUP BY affiliate_id
      ) cpsum ON cpsum.affiliate_id = a.id
      LEFT JOIN (
        SELECT affiliate_id, COUNT(*) AS total_referrals
        FROM affiliate_referrals
        GROUP BY affiliate_id
      ) rfsum ON rfsum.affiliate_id = a.id
    `;
    
    let queryParams = [];
    
    // Super admin can see all affiliates, regular admin only sees their own
    if (userRole !== 'super_admin') {
      query += ' WHERE a.admin_id = ?';
      queryParams.push(adminIdValue);
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    const affiliates = await executeQuery(query, queryParams);
    
    // Transform data to match frontend interface
    const transformedAffiliates = affiliates.map((affiliate: any) => ({
      id: affiliate.id,
      admin_id: affiliate.admin_id,
      parent_affiliate_id: affiliate.parent_affiliate_id,
      email: affiliate.email,
      first_name: affiliate.first_name,
      last_name: affiliate.last_name,
      company_name: affiliate.company_name,
      phone: affiliate.phone,
      address: affiliate.address,
      city: affiliate.city,
      state: affiliate.state,
      zip_code: affiliate.zip_code,
      commission_rate: parseFloat(affiliate.commission_rate) || 0,
      parent_commission_rate: parseFloat(affiliate.parent_commission_rate) || 0,
      affiliate_level: parseInt(affiliate.affiliate_level) || 1,
      total_earnings: (affiliate.computed_total_earnings != null
        ? parseFloat(affiliate.computed_total_earnings)
        : parseFloat(affiliate.total_earnings)) || 0,
      total_referrals: (affiliate.computed_total_referrals != null
        ? parseInt(affiliate.computed_total_referrals)
        : parseInt(affiliate.total_referrals)) || 0,
      status: affiliate.status,
      email_verified: affiliate.email_verified || false,
      last_login: affiliate.last_login,
      bank_name: affiliate.bank_name,
      account_holder_name: affiliate.account_holder_name,
      account_number: affiliate.account_number,
      routing_number: affiliate.routing_number,
      account_type: affiliate.account_type,
      swift_code: affiliate.swift_code,
      iban: affiliate.iban,
      bank_address: affiliate.bank_address,
      payment_method: affiliate.payment_method,
      paypal_email: affiliate.paypal_email,
      stripe_account_id: affiliate.stripe_account_id,
      created_at: affiliate.created_at,
      updated_at: affiliate.updated_at,
      referral_slug: hasReferralSlug ? affiliate.referral_slug : undefined,
      parent_info: affiliate.parent_first_name ? {
        first_name: affiliate.parent_first_name,
        last_name: affiliate.parent_last_name,
        email: affiliate.parent_email
      } : null
    }));
    
    res.json({ success: true, data: transformedAffiliates });
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    securityLogger.logSecurityEvent('affiliate_fetch_error', {
      userId: req.user?.id,
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Failed to fetch affiliates' });
  }
});

router.post('/import', authenticateToken, requireSuperAdminOrSupport, upload.single('file'), async (req, res) => {
  try {
    if (!(req as any).file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const adminId = (req as any).user.id;
    const adminIdValue = (req as any).user.role === 'support' ? 2 : adminId;
    const content = (req as any).file.buffer.toString('utf-8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV has no data' });
    }

    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const idx = (name: string) => header.indexOf(name);

    let inserted = 0;
    let updated = 0;
    const errors: { line: number; message: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const raw = lines[i];
      const cols: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let c = 0; c < raw.length; c++) {
        const ch = raw[c];
        if (ch === '"') {
          if (inQuotes && raw[c + 1] === '"') { current += '"'; c++; } else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
          cols.push(current); current = '';
        } else { current += ch; }
      }
      cols.push(current);

      const get = (name: string, fallbackIndex?: number) => {
        const j = idx(name);
        if (j >= 0) return cols[j];
        if (typeof fallbackIndex === 'number' && fallbackIndex < cols.length) return cols[fallbackIndex];
        return '';
      };

      const nameRaw = get('affiliate name', 0).trim();
      const passwordRaw = get('password', 1).trim();
      const phoneRaw = get('phone', 2).trim();
      const emailRaw = get('email', 3).trim().toLowerCase();

      if (!emailRaw) {
        errors.push({ line: i + 1, message: 'Missing email' });
        continue;
      }
      if (!passwordRaw) {
        errors.push({ line: i + 1, message: 'Missing password' });
        continue;
      }

      const nameParts = nameRaw.split(' ').filter(Boolean);
      const firstName = nameParts.length > 0 ? nameParts.slice(0, -1).join(' ') || nameParts[0] : '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(passwordRaw, saltRounds);

      const existing = await executeQuery('SELECT id FROM affiliates WHERE email = ?', [emailRaw]);
      if (existing.length > 0) {
        const affiliateId = existing[0].id;
        await executeQuery(
          'UPDATE affiliates SET first_name = ?, last_name = ?, phone = ?, password_hash = ?, updated_at = NOW() WHERE id = ?',
          [firstName || null, lastName || null, phoneRaw || null, hashedPassword, affiliateId]
        );
        updated += 1;
        continue;
      }

      const result = await executeQuery(
        'INSERT INTO affiliates (admin_id, email, password_hash, first_name, last_name, phone, commission_rate, parent_commission_rate, affiliate_level, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "active", NOW(), NOW())',
        [adminIdValue, emailRaw, hashedPassword, firstName || null, lastName || null, phoneRaw || null, 10.0, 5.0, 1]
      );
      if ((result as any).insertId) inserted += 1;
    }

    securityLogger.logSecurityEvent('affiliate_csv_import', {
      adminId,
      inserted,
      updated,
      errors: errors.length,
      ip: (req as any).ip
    });

    res.json({ message: 'Import completed', inserted, updated, errors });
  } catch (error: any) {
    console.error('Error importing affiliates:', error);
    securityLogger.logSecurityEvent('affiliate_csv_import_error', {
      userId: (req as any).user?.id,
      error: error.message,
      ip: (req as any).ip
    });
    res.status(500).json({ error: 'Failed to import affiliates' });
  }
});

// POST /api/affiliate-management - Create new affiliate
router.post('/', authenticateToken, requireSuperAdminOrSupport, async (req, res) => {
  try {
    const adminId = req.user.id;
    const {
      email,
      firstName,
      lastName,
      companyName,
      phone,
      commissionRate,
      parentAffiliateId,
      parentCommissionRate,
      password
    } = req.body;
    
    // Validate required fields
    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if email already exists in affiliates table
    const existingAffiliate = await executeQuery(
      'SELECT id FROM affiliates WHERE email = ?',
      [email]
    );
    
    if (existingAffiliate.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    // Validate parent affiliate if provided
    let affiliateLevel = 1;
    if (parentAffiliateId) {
      const parentAffiliate = await executeQuery(
        'SELECT id, affiliate_level FROM affiliates WHERE id = ? AND status = "active"',
        [parentAffiliateId]
      );
      
      if (parentAffiliate.length === 0) {
        return res.status(400).json({ error: 'Invalid parent affiliate ID' });
      }
      
      affiliateLevel = parentAffiliate[0].affiliate_level + 1;
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create affiliate
    const insertQuery = `
      INSERT INTO affiliates (
        admin_id, parent_affiliate_id, email, password_hash, first_name, last_name, 
        company_name, phone, commission_rate, parent_commission_rate, affiliate_level, 
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())
    `;
    
    const result = await executeQuery(insertQuery, [
      adminIdValue,
      parentAffiliateId || null,
      email,
      hashedPassword,
      firstName,
      lastName,
      companyName || null,
      phone || null,
      commissionRate || 10.0, // Default 10% commission
      parentCommissionRate || 5.0, // Default 5% parent commission
      affiliateLevel
    ]);
    
    // Log security event
    securityLogger.logSecurityEvent('affiliate_created', {
      createdBy: adminId,
      affiliateId: result.insertId,
      affiliateEmail: email,
      parentAffiliateId: parentAffiliateId || null,
      affiliateLevel: affiliateLevel,
      ip: req.ip
    });
    
    res.status(201).json({
      success: true,
      message: 'Affiliate created successfully',
      affiliateId: result.insertId
    });
  } catch (error) {
    console.error('Error creating affiliate:', error);
    securityLogger.logSecurityEvent('affiliate_creation_error', {
      userId: req.user?.id,
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Failed to create affiliate' });
  }
});

// PUT /api/affiliate-management/:id - Update affiliate
router.put('/:id', authenticateToken, requireSuperAdminRole, async (req, res) => {
  try {
    const adminId = req.user.id;
    const affiliateId = req.params.id.replace('AFF-', ''); // Remove prefix
    const {
      firstName,
      lastName,
      companyName,
      phone,
      commissionRate,
      status,
      bank_name,
      account_holder_name,
      account_number,
      routing_number,
      account_type,
      swift_code,
      iban,
      bank_address,
      payment_method,
      paypal_email,
      stripe_account_id
    } = req.body;
    
    // Verify affiliate exists and belongs to this admin
    const existingAffiliate = await executeQuery(
      'SELECT id, admin_id FROM affiliates WHERE id = ? AND admin_id = ?',
      [affiliateId, adminId]
    );
    
    if (existingAffiliate.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found or access denied' });
    }
    
    // Update affiliate
    const updateQuery = `
      UPDATE affiliates 
      SET 
        first_name = ?,
        last_name = ?,
        company_name = ?,
        phone = ?,
        commission_rate = ?,
        status = ?,
        bank_name = ?,
        account_holder_name = ?,
        account_number = ?,
        routing_number = ?,
        account_type = ?,
        swift_code = ?,
        iban = ?,
        bank_address = ?,
        payment_method = ?,
        paypal_email = ?,
        stripe_account_id = ?,
        updated_at = NOW()
      WHERE id = ? AND admin_id = ?
    `;
    
    await executeQuery(updateQuery, [
      firstName,
      lastName,
      companyName,
      phone,
      commissionRate,
      status,
      bank_name || null,
      account_holder_name || null,
      account_number || null,
      routing_number || null,
      account_type || null,
      swift_code || null,
      iban || null,
      bank_address || null,
      payment_method || 'bank_transfer',
      paypal_email || null,
      stripe_account_id || null,
      affiliateId,
      adminId
    ]);
    
    // Log security event
    securityLogger.logSecurityEvent('affiliate_updated', {
      updatedBy: adminId,
      affiliateId,
      ip: req.ip
    });
    
    res.json({ success: true, message: 'Affiliate updated successfully' });
  } catch (error) {
    console.error('Error updating affiliate:', error);
    securityLogger.logSecurityEvent('affiliate_update_error', {
      userId: req.user?.id,
      affiliateId: req.params.id,
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Failed to update affiliate' });
  }
});

// DELETE /api/affiliate-management/:id - Deactivate affiliate
router.delete('/:id', authenticateToken, requireSuperAdminRole, async (req, res) => {
  try {
    const adminId = req.user.id;
    const affiliateId = req.params.id.replace('AFF-', ''); // Remove prefix
    
    // Verify affiliate exists and belongs to this admin
    const existingAffiliate = await executeQuery(
      'SELECT id, admin_id, email FROM affiliates WHERE id = ? AND admin_id = ?',
      [affiliateId, adminId]
    );
    
    if (existingAffiliate.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found or access denied' });
    }
    
    // Soft delete by setting status to inactive
    await executeQuery(
      'UPDATE affiliates SET status = "inactive", updated_at = NOW() WHERE id = ? AND admin_id = ?',
      [affiliateId, adminId]
    );
    
    // Log security event
    securityLogger.logSecurityEvent('affiliate_deactivated', {
      deactivatedBy: adminId,
      affiliateId,
      affiliateEmail: existingAffiliate[0].email,
      ip: req.ip
    });
    
    res.json({ success: true, message: 'Affiliate deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating affiliate:', error);
    securityLogger.logSecurityEvent('affiliate_deactivation_error', {
      userId: req.user?.id,
      affiliateId: req.params.id,
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Failed to deactivate affiliate' });
  }
});

// POST /api/affiliate-management/:id/toggle-status - Toggle affiliate status
router.post('/:id/toggle-status', authenticateToken, requireSuperAdminRole, async (req, res) => {
  try {
    const adminId = req.user.id;
    const affiliateId = req.params.id.replace('AFF-', ''); // Remove prefix
    
    // Get current status
    const affiliate = await executeQuery(
      'SELECT id, status, email FROM affiliates WHERE id = ? AND admin_id = ?',
      [affiliateId, adminId]
    );
    
    if (affiliate.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found or access denied' });
    }
    
    const currentStatus = affiliate[0].status;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    // Update status
    await executeQuery(
      'UPDATE affiliates SET status = ?, updated_at = NOW() WHERE id = ? AND admin_id = ?',
      [newStatus, affiliateId, adminId]
    );
    
    // Log security event
    securityLogger.logSecurityEvent('affiliate_status_toggled', {
      toggledBy: adminId,
      affiliateId,
      affiliateEmail: affiliate[0].email,
      oldStatus: currentStatus,
      newStatus,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: `Affiliate ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      newStatus
    });
  } catch (error) {
    console.error('Error toggling affiliate status:', error);
    securityLogger.logSecurityEvent('affiliate_status_toggle_error', {
      userId: req.user?.id,
      affiliateId: req.params.id,
      error: error.message,
      ip: req.ip
    });
    res.status(500).json({ error: 'Failed to toggle affiliate status' });
  }
});

// GET /api/affiliate-management/:id/referrals - Get affiliate referrals
router.get('/:id/referrals', authenticateToken, requireSuperAdminRole, async (req, res) => {
  try {
    const adminId = req.user.id;
    const userRole = req.user.role;
    const affiliateId = req.params.id.replace('AFF-', ''); // Remove prefix
    
    // Verify affiliate exists; super_admin can view any affiliate
    let verifyQuery = 'SELECT id FROM affiliates WHERE id = ?';
    const verifyParams: any[] = [affiliateId];
    if (userRole !== 'super_admin') {
      verifyQuery += ' AND admin_id = ?';
      verifyParams.push(adminId);
    }
    const affiliate = await executeQuery(verifyQuery, verifyParams);
    
    if (affiliate.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found or access denied' });
    }
    
    // Get referrals
    const referralsQuery = `
      SELECT 
        ar.id,
        ar.referred_user_id,
        ar.commission_amount,
        ar.status as commission_status,
        ar.referral_date,
        ar.conversion_date,
        ar.notes,
        u.email as referred_user_email,
        u.first_name as referred_user_first_name,
        u.last_name as referred_user_last_name,
        (
          SELECT bt.plan_name 
          FROM billing_transactions bt 
          WHERE bt.user_id = ar.referred_user_id AND bt.status = 'succeeded' 
          ORDER BY bt.created_at DESC 
          LIMIT 1
        ) AS plan_name,
        (
          SELECT bt.plan_type 
          FROM billing_transactions bt 
          WHERE bt.user_id = ar.referred_user_id AND bt.status = 'succeeded' 
          ORDER BY bt.created_at DESC 
          LIMIT 1
        ) AS plan_type
      FROM affiliate_referrals ar
      LEFT JOIN users u ON ar.referred_user_id = u.id
      WHERE ar.affiliate_id = ?
      ORDER BY ar.referral_date DESC
    `;
    
    const referrals = await executeQuery(referralsQuery, [affiliateId]);
    
    res.json({ success: true, data: referrals });
  } catch (error) {
    console.error('Error fetching affiliate referrals:', error);
    res.status(500).json({ error: 'Failed to fetch affiliate referrals' });
  }
});

// GET /api/affiliate-management/:id/earnings/monthly - Get current month's earnings for an affiliate
router.get('/:id/earnings/monthly', authenticateToken, requireSuperAdminRole, async (req, res) => {
  try {
    const adminId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const affiliateId = String(req.params.id).replace('AFF-', '');

    // Verify affiliate exists; super_admin can view any affiliate
    let verifyQuery = 'SELECT id FROM affiliates WHERE id = ?';
    const verifyParams: any[] = [affiliateId];
    if (userRole !== 'super_admin') {
      verifyQuery += ' AND admin_id = ?';
      verifyParams.push(adminId);
    }
    const affiliate = await executeQuery(verifyQuery, verifyParams);

    if (!affiliate || affiliate.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found or access denied' });
    }

    const monthlyEarningsQuery = `
      SELECT COALESCE(SUM(commission_amount), 0) as monthly_earnings
      FROM affiliate_commissions 
      WHERE affiliate_id = ? 
        AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
        AND status IN ('paid','pending')
    `;

    const result = await executeQuery(monthlyEarningsQuery, [affiliateId]);
    const monthly_earnings = Number(result?.[0]?.monthly_earnings || 0);

    res.json({ success: true, data: { monthly_earnings } });
  } catch (error) {
    console.error('Error fetching monthly earnings:', error);
    res.status(500).json({ error: 'Failed to fetch monthly earnings' });
  }
});

export default router;
