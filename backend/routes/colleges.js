import express from 'express';
import { searchColleges, seedColleges } from '../controllers/collegeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', searchColleges);
router.post('/seed', protect, authorize('admin'), seedColleges);

export default router;
