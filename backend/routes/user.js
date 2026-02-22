import express from 'express';
import { getProfile, updateProfile, changePassword, logoutAll, deleteAccount, uploadVerification, finishOnboarding } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.get('/me', protect, getProfile);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.post('/finish-onboarding', protect, finishOnboarding);
router.put('/change-password', protect, changePassword);
router.post('/logout-all', protect, logoutAll);
router.delete('/delete-account', protect, deleteAccount);
router.post('/verification', protect, upload.array('documents', 5), uploadVerification);

export default router;
