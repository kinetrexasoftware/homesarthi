import express from 'express';
import { register, login, getProfile, updateProfile, uploadVerification, forgotPassword, resetPassword, googleLogin, changePassword, logoutAll, deleteAccount, updatePushToken } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { loginLimiter, registerLimiter, forgotPasswordLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/google-login', loginLimiter, googleLogin);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', forgotPasswordLimiter, resetPassword);
router.post('/push-token', protect, updatePushToken);


export default router;