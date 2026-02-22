import express from 'express';
import { sendMessage, getConversation, getConversations, blockUser, unblockUser } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/send', sendMessage);
router.get('/conversations', getConversations);
router.get('/conversation/:userId', getConversation);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);

export default router;
