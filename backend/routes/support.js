import express from 'express';
import {
    createTicket,
    getMyTickets,
    getTicketById,
    addReply,
    getAllTickets,
    updateTicketStatus,
    getSupportStats
} from '../controllers/supportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Mixed / Shared Routes (Auth required)
router.use(protect);

router.get('/my-tickets', getMyTickets);
router.get('/ticket/:id', getTicketById);
router.post('/ticket/:id/reply', addReply);

// Member Specific
router.post('/', authorize('owner', 'student'), createTicket);
router.post('', authorize('owner', 'student'), createTicket);

// Admin Specific
router.get('/admin/all', authorize('admin'), getAllTickets);
router.put('/ticket/:id/status', authorize('admin'), updateTicketStatus);
router.get('/admin/stats', authorize('admin'), getSupportStats);

export default router;
