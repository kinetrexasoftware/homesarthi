import api from './api';

/**
 * 🔔 Notification API Service
 * All notification-related API calls
 */

/**
 * Fetch user's notifications
 */
export const fetchNotifications = async (options = {}) => {
    try {
        const {
            limit = 50,
            skip = 0,
            category = null,
            unreadOnly = false
        } = options;

        const params = { limit, skip };
        if (category) params.category = category;
        if (unreadOnly) params.unreadOnly = 'true';

        const response = await api.get('/notifications', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
    try {
        const response = await api.get('/notifications/unread-count');
        return response.data.data.unreadCount;
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
};

/**
 * Mark specific notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
    try {
        const response = await api.put(`/notifications/${notificationId}/read`);
        return response.data;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
    try {
        const response = await api.put('/notifications/read-all');
        return response.data;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

/**
 * Delete specific notification
 */
export const deleteNotification = async (notificationId) => {
    try {
        const response = await api.delete(`/notifications/${notificationId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};

/**
 * Clear all read notifications
 */
export const clearAllReadNotifications = async () => {
    try {
        const response = await api.delete('/notifications/clear-all');
        return response.data;
    } catch (error) {
        console.error('Error clearing notifications:', error);
        throw error;
    }
};
