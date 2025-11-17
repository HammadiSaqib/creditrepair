
import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { executeQuery } from '../database/mysqlConfig.js';
import { notifyUserLogin, notifyUserRegistration } from '../middleware/notificationTriggers';

const router = Router();

// Authentication routes
router.post('/login', notifyUserLogin, AuthController.login);
router.post('/super-admin/login', AuthController.superAdminLogin);
router.post('/support/login', AuthController.supportLogin);
router.post('/affiliate/login', AuthController.affiliateLogin);
router.post('/member/login', AuthController.clientLogin);
router.post('/funding-manager/login', AuthController.fundingManagerLogin);
router.post('/register', notifyUserRegistration, AuthController.register);
router.post('/verify-email', AuthController.verifyEmailAndRegister);
router.post('/verify-user-email', authenticateToken, AuthController.verifyEmail);
router.post('/change-email', authenticateToken, AuthController.changeEmail);
router.post('/resend-verification', authenticateToken, AuthController.resendVerificationCode);
router.post('/logout', AuthController.logout);

// Password reset routes
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-reset-code', AuthController.verifyResetCode);
router.post('/reset-password', AuthController.resetPassword);

// Affiliate password reset routes
router.post('/affiliate/forgot-password', AuthController.affiliateForgotPassword);
router.post('/affiliate/verify-reset-code', AuthController.affiliateVerifyResetCode);
router.post('/affiliate/reset-password', AuthController.affiliateResetPassword);

// Protected routes (authentication required)
router.get('/verify', authenticateToken, AuthController.verifyToken);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfile);
router.post('/login-as-admin', authenticateToken, AuthController.loginAsAdmin);
router.post('/login-as-support', authenticateToken, AuthController.loginAsSupport);

// GET /api/auth/affiliate/status - Check affiliate status for admin users
router.get('/affiliate/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Only allow admin and super_admin users
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
    
    // Check if admin has affiliate record
    const affiliateQuery = `
      SELECT 
        id,
        status,
        email_verified,
        plan_type,
        created_at
      FROM affiliates 
      WHERE admin_id = ?
    `;
    
    const affiliate = await executeQuery(affiliateQuery, [userId]);
    
    if (affiliate.length === 0) {
      return res.status(404).json({ error: 'No affiliate access found' });
    }
    
    const affiliateData = affiliate[0];
    
    res.json({
      success: true,
      status: affiliateData.status,
      email_verified: affiliateData.email_verified,
      plan_type: affiliateData.plan_type,
      affiliate_id: affiliateData.id,
      created_at: affiliateData.created_at
    });
  } catch (error) {
    console.error('Error checking affiliate status:', error);
    res.status(500).json({ error: 'Failed to check affiliate status' });
  }
});

export default router;
