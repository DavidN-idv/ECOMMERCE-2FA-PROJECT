import express from 'express';
import { 
  registerUser, authUser, verifyEmail, verify2FA,
  enable2FARequest, enable2FAConfirm, disable2FA,
  forgotPassword, resetPassword
} from '../controllers/authController.js';
import { changePassword } from '../controllers/userController.js'; // Import changePassword từ userController
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.post('/register', registerUser);
router.post('/verify-email', verifyEmail);
router.post('/login', authUser);
router.post('/verify-2fa', verify2FA);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Private (Cần Token)
router.post('/2fa/enable-request', protect, enable2FARequest);
router.post('/2fa/enable-confirm', protect, enable2FAConfirm);
router.post('/2fa/disable', protect, disable2FA);
router.post('/change-password', protect, changePassword); // Requirement đặt endpoint này ở /auth/

export default router;