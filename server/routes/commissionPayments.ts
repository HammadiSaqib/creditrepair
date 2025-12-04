import express from 'express';
import crypto from 'crypto';
import { ENV_CONFIG } from '../config/environment.js';
import multer from 'multer';
import path from 'path';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { executeQuery, getRecords, insertRecord, updateRecord } from '../database/mysqlConfig.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payment-proofs/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

interface CommissionPayment extends RowDataPacket {
  id: number;
  affiliate_id: number;
  amount: number;
  transaction_id: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  payment_date: string;
  notes?: string;
  proof_of_payment_url?: string;
  created_at: string;
  updated_at: string;
}

// Get all commission payments (super admin only)
router.get('/', 
  authenticateToken, 
  requireRole('super_admin'), 
  async (req, res) => {
    try {
      const payments = await getRecords<CommissionPayment>(
        `SELECT cp.*, a.first_name, a.last_name, a.email 
         FROM commission_payments cp 
         JOIN affiliates a ON cp.affiliate_id = a.id 
         ORDER BY cp.created_at DESC`
      );
      
      res.json({ success: true, data: payments });
    } catch (error) {
      console.error('Error fetching commission payments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch commission payments' });
    }
  }
);

// Get commission payments for a specific affiliate
router.get('/affiliate/:affiliateId', 
  authenticateToken, 
  requireRole('super_admin'), 
  async (req, res) => {
    try {
      const { affiliateId } = req.params;
      
      const payments = await getRecords<CommissionPayment>(
        'SELECT * FROM commission_payments WHERE affiliate_id = ? ORDER BY created_at DESC',
        [affiliateId]
      );
      
      res.json({ success: true, data: payments });
    } catch (error) {
      console.error('Error fetching affiliate payment history:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
    }
  }
);

// Record a new commission payment
router.post('/', 
  authenticateToken, 
  requireRole('super_admin'),
  upload.single('proof_of_payment'),
  async (req, res) => {
    try {
      const { affiliate_id, amount, transaction_id, payment_method, notes } = req.body;
      const proof_of_payment_url = req.file ? `/uploads/payment-proofs/${req.file.filename}` : null;
      
      // Validate required fields
      if (!affiliate_id || !amount || !transaction_id || !payment_method) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: affiliate_id, amount, transaction_id, payment_method' 
        });
      }
      
      // Check if affiliate exists
      const affiliateCheck = await getRecords<RowDataPacket>(
        'SELECT id FROM affiliates WHERE id = ?',
        [affiliate_id]
      );
      
      if (affiliateCheck.length === 0) {
        return res.status(404).json({ success: false, message: 'Affiliate not found' });
      }
      
      // Check if transaction ID already exists
      const existingTransaction = await getRecords<RowDataPacket>(
        'SELECT id FROM commission_payments WHERE transaction_id = ?',
        [transaction_id]
      );
      
      if (existingTransaction.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Transaction ID already exists. Please use a unique transaction ID.' 
        });
      }
      
      // Record payout directly in affiliate_payouts instead of commission_payments
      // Optional: continue to adjust outstanding totals
      await updateRecord(
        'UPDATE affiliates SET total_earnings = total_earnings - ? WHERE id = ?',
        [amount, affiliate_id]
      );

      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const commissionMonth = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`;
      const payoutMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
      const postedAmount = Number(amount);

      await executeQuery(
        `CREATE TABLE IF NOT EXISTS affiliate_payouts (
           id INT AUTO_INCREMENT PRIMARY KEY,
           affiliate_id INT NOT NULL,
           admin_user_id INT NULL,
           commission_month CHAR(7) NOT NULL,
           payout_month CHAR(7) NOT NULL,
           amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
           invoice_id INT NULL,
           invoice_number VARCHAR(64) NULL,
           invoice_public_token VARCHAR(64) NULL,
           invoice_url VARCHAR(255) NULL,
           status ENUM('generated','emailed','paid','cancelled') DEFAULT 'generated',
           paid_at DATETIME NULL,
           notes VARCHAR(255) NULL,
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
           UNIQUE KEY uniq_affiliate_commission_month (affiliate_id, commission_month)
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      );

      const adminUserId = (req as any)?.user?.id || null;

      try {
        await executeQuery(
          `ALTER TABLE affiliate_payouts
             ADD COLUMN IF NOT EXISTS payslip_number VARCHAR(64) NULL,
             ADD COLUMN IF NOT EXISTS payslip_token VARCHAR(64) NULL,
             ADD COLUMN IF NOT EXISTS payslip_url VARCHAR(255) NULL`
        );
      } catch (alterErr: any) {
        try { await executeQuery(`ALTER TABLE affiliate_payouts ADD COLUMN payslip_number VARCHAR(64) NULL`); } catch (e: any) {}
        try { await executeQuery(`ALTER TABLE affiliate_payouts ADD COLUMN payslip_token VARCHAR(64) NULL`); } catch (e: any) {}
        try { await executeQuery(`ALTER TABLE affiliate_payouts ADD COLUMN payslip_url VARCHAR(255) NULL`); } catch (e: any) {}
      }

      const payslipToken = crypto.randomBytes(24).toString('hex');
      const frontendBase = String(ENV_CONFIG.FRONTEND_URL || '').replace(/\/$/, '');
      const payslipUrl = frontendBase ? `${frontendBase}/payslip/${payslipToken}` : null;
      const payslipNumber = `PS-${commissionMonth.replace('-', '')}-${parseInt(String(affiliate_id), 10)}`;
      await executeQuery(
        `INSERT INTO affiliate_payouts (
           affiliate_id, admin_user_id, commission_month, payout_month, amount, status, paid_at, notes, payslip_number, payslip_token, payslip_url, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, 'paid', NOW(), ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE amount = VALUES(amount), status = 'paid', paid_at = NOW(), notes = VALUES(notes), payslip_number = VALUES(payslip_number), payslip_token = VALUES(payslip_token), payslip_url = VALUES(payslip_url), updated_at = NOW()`,
        [parseInt(String(affiliate_id), 10), adminUserId, commissionMonth, payoutMonth, postedAmount, notes || null, payslipNumber, payslipToken, payslipUrl]
      );

      res.json({ 
        success: true, 
        message: 'Affiliate payout recorded successfully'
      });
    } catch (error) {
      console.error('Error recording commission payment:', error);
      res.status(500).json({ success: false, message: 'Failed to record commission payment' });
    }
  }
);

// Update payment status
router.put('/:paymentId/status', 
  authenticateToken, 
  requireRole('super_admin'), 
  async (req, res) => {
    try {
      const { paymentId } = req.params;
      const { status } = req.body;
      
      if (!['pending', 'completed', 'failed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      
      await updateRecord(
        'UPDATE commission_payments SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, paymentId]
      );
      
      res.json({ success: true, message: 'Payment status updated successfully' });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ success: false, message: 'Failed to update payment status' });
    }
  }
);

// Delete a payment record
router.delete('/:paymentId', 
  authenticateToken, 
  requireRole('super_admin'), 
  async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      await executeQuery(
        'DELETE FROM commission_payments WHERE id = ?',
        [paymentId]
      );
      
      res.json({ success: true, message: 'Payment record deleted successfully' });
    } catch (error) {
      console.error('Error deleting payment record:', error);
      res.status(500).json({ success: false, message: 'Failed to delete payment record' });
    }
  }
);

export default router;
