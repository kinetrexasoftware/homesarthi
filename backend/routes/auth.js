import express from 'express';
import { register, login, getProfile, updateProfile, uploadVerification, forgotPassword, resetPassword, googleLogin, changePassword, logoutAll, deleteAccount, updatePushToken } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google-login', authLimiter, googleLogin);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/push-token', protect, updatePushToken);

export default router;