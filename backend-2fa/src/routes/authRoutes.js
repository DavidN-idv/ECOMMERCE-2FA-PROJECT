import express from 'express';
import { 
  registerUser, authUser, verifyEmail, verify2FA,
  enable2FARequest, enable2FAConfirm, disable2FA,
  forgotPassword, resetPassword, logoutUser, refreshToken
} from '../controllers/authController.js';
import { changePassword } from '../controllers/userController.js'; // Import changePassword từ userController
import { protect } from '../middleware/authMiddleware.js';
import { loginLimiter, emailLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Public
// Áp dụng loginLimiter cho Đăng ký và Đăng nhập
router.post('/register', loginLimiter, registerUser); // Chống spam tạo nick
router.post('/login', loginLimiter, authUser); // Chống dò mật khẩu và email
router.post('/verify-email', verifyEmail);
router.post('/verify-2fa', verify2FA);
router.post('/forgot-password', emailLimiter, forgotPassword); // Chống spam mail
router.post('/reset-password', resetPassword);
router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);

// Private (Cần Token)
router.post('/2fa/enable-request', protect, emailLimiter, enable2FARequest); // Chống spam mail 2FA
router.post('/2fa/enable-confirm', protect, enable2FAConfirm);
router.post('/2fa/disable', protect, disable2FA);
router.post('/change-password', protect, changePassword); // Requirement đặt endpoint này ở /auth/

export default router;