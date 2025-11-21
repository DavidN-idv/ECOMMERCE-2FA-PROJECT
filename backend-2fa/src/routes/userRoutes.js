import express from 'express';
import { 
  getUserProfile, 
  changePassword,
  getLoginHistory
 } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

// Bảo vệ route cụ thể
//router.get('/profile', protect, getUserProfile);

router.use(protect);
router.get('/profile', getUserProfile);
router.put('/change-password', changePassword);
router.get('/logs', getLoginHistory);

export default router;