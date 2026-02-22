import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead
} from '../services/notificationService.js';
import { Notification } from '../models/Notification.js';

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications with pagination
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
    try {
        const {
            limit = 50,
            skip = 0,
            category = null,
            unreadOnly = false
        } = req.query;

        const options = {
            limit: parseInt(limit),
            skip: parseInt(skip),
            category: category || null,
            unreadOnly: unreadOnly === 'true'
        };

        const result = await getUserNotifications(req.user._id, options);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', protect, async (req, res) => {
    try {
        const count = await Notification.getUnreadCount(req.user._id);

        res.json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark specific notification as read
 * @access  Private
 */
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await markAsRead(req.params.id, req.user._id);

        res.json({
            success: true,
            data: { notification }
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read for user
 * @access  Private
 */
router.put('/read-all', protect, async (req, res) => {
    try {
        const result = await markAllAsRead(req.user._id);

        res.json({
            success: true,
            data: {
                modifiedCount: result.modifiedCount,
                message: 'All notifications marked as read'
            }
        });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete specific notification (optional feature)
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            data: { message: 'Notification deleted' }
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   DELETE /api/notifications/clear-all
 * @desc    Clear all read notifications for user
 * @access  Private
 */
router.delete('/clear-all', protect, async (req, res) => {
    try {
        const result = await Notification.deleteMany({
            user: req.user._id,
            read: true
        });

        res.json({
            success: true,
            data: {
                deletedCount: result.deletedCount,
                message: 'All read notifications cleared'
            }
        });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
