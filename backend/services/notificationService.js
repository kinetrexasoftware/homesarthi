import { Expo } from 'expo-server-sdk';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';

const expo = new Expo();

/**
 * 🔥 CORE NOTIFICATION ENGINE
 * 
 * Rules:
 * 1. ALWAYS save notification to DB (even if push fails)
 * 2. NEVER crash if push fails
 * 3. Respect user preferences & quiet hours
 * 4. Log everything for debugging
 */

/**
 * Check if current time is within user's quiet hours
 */
const isQuietHours = (quietHoursConfig) => {
    if (!quietHoursConfig || !quietHoursConfig.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const { start, end } = quietHoursConfig;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
        return currentTime >= start || currentTime <= end;
    }

    // Normal quiet hours (e.g., 13:00 to 15:00)
    return currentTime >= start && currentTime <= end;
};

/**
 * Create and send notification (MAIN METHOD)
 * 
 * @param {ObjectId} userId - Target user ID
 * @param {Object} payload - Notification payload
 * @returns {Object} Created notification
 */
export const createAndSendNotification = async (userId, payload) => {
    try {
        const {
            type,
            category,
            title,
            body,
            data = {},
            actionUrl = null,
            priority = 'normal'
        } = payload;

        // Validate required fields
        if (!type || !category || !title || !body) {
            throw new Error('Missing required notification fields: type, category, title, body');
        }

        // STEP 1: Create notification in DB (ALWAYS, even if push fails)
        const notification = await Notification.create({
            user: userId,
            type,
            category,
            title,
            body,
            data,
            actionUrl,
            priority,
            pushSent: false,
            pushStatus: 'pending'
        });

        console.log(`✅ Notification saved to DB: ${notification._id} for user ${userId}`);

        // STEP 1.5: Emit socket event for real-time in-app updates
        if (global.io) {
            global.io.to(userId.toString()).emit('new_notification', notification);
            console.log(`📡 Socket event emitted to user ${userId}`);
        }

        // STEP 2: Try to send push notification
        try {
            await sendPushNotification(userId, notification);
        } catch (pushError) {
            // Push failed, but notification is already in DB
            console.error(`⚠️ Push notification failed for ${notification._id}:`, pushError.message);

            // Update notification with failure status
            await Notification.findByIdAndUpdate(notification._id, {
                pushStatus: 'failed',
                pushError: pushError.message
            });
        }

        return notification;

    } catch (error) {
        console.error('❌ Error in createAndSendNotification:', error);
        throw error;
    }
};

/**
 * Send push notification to user's device
 * Internal method - called by createAndSendNotification
 */
const sendPushNotification = async (userId, notification) => {
    // Fetch user with push token and preferences
    const user = await User.findById(userId).select('pushToken preferences');
    console.log(`🔍 Checking push status for ${userId}. Token: ${user?.pushToken ? 'EXISTS' : 'NULL'}`);

    if (!user) {
        throw new Error(`User ${userId} not found`);
    }

    // Check 1: User has push token?
    if (!user.pushToken) {
        console.log(`⏭️ User ${userId} has no push token, skipping push`);
        await Notification.findByIdAndUpdate(notification._id, {
            pushStatus: 'skipped',
            pushError: 'No push token'
        });
        return;
    }

    // Check 2: User enabled push notifications?
    if (!user.preferences?.notifications?.push) {
        console.log(`⏭️ User ${userId} disabled push notifications`);
        await Notification.findByIdAndUpdate(notification._id, {
            pushStatus: 'skipped',
            pushError: 'Push disabled by user'
        });
        return;
    }

    // Check 3: User enabled this category?
    const categoryEnabled = user.preferences?.notifications?.categories?.[notification.category];
    if (categoryEnabled === false) {
        console.log(`⏭️ User ${userId} disabled ${notification.category} notifications`);
        await Notification.findByIdAndUpdate(notification._id, {
            pushStatus: 'skipped',
            pushError: `Category ${notification.category} disabled`
        });
        return;
    }

    // Check 4: Quiet hours?
    if (isQuietHours(user.preferences?.notifications?.quietHours)) {
        console.log(`🌙 User ${userId} in quiet hours, skipping push (will show in-app only)`);
        await Notification.findByIdAndUpdate(notification._id, {
            pushStatus: 'skipped',
            pushError: 'Quiet hours active'
        });
        return;
    }

    // Check 5: Valid Expo push token?
    if (!Expo.isExpoPushToken(user.pushToken)) {
        console.error(`❌ Invalid Expo push token for user ${userId}: ${user.pushToken}`);
        await Notification.findByIdAndUpdate(notification._id, {
            pushStatus: 'failed',
            pushError: 'Invalid Expo push token'
        });
        return;
    }

    // All checks passed - send push notification
    const pushMessage = {
        to: user.pushToken,
        sound: 'default', // Always use default sound for push
        title: notification.title,
        body: notification.body,
        data: {
            ...notification.data,
            notificationId: notification._id.toString(),
            actionUrl: notification.actionUrl,
            type: notification.type
        },
        priority: 'high', // High priority for heads-up notification
        channelId: 'default', // Match with mobile/src/services/notifications.js
        badge: await Notification.getUnreadCount(userId) // iOS badge count
    };

    try {
        const chunks = expo.chunkPushNotifications([pushMessage]);
        const tickets = [];

        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }

        console.log(`📤 Push sent successfully for notification ${notification._id}`);

        // Update notification status
        await Notification.findByIdAndUpdate(notification._id, {
            pushSent: true,
            pushStatus: 'sent'
        });

        return tickets;

    } catch (pushError) {
        console.error(`❌ Expo push error for notification ${notification._id}:`, pushError);
        throw pushError;
    }
};

/**
 * Get user's notifications with pagination and filters
 */
export const getUserNotifications = async (userId, options = {}) => {
    try {
        const notifications = await Notification.getUserNotifications(userId, options);
        const unreadCount = await Notification.getUnreadCount(userId);

        return {
            notifications,
            unreadCount,
            hasMore: notifications.length === (options.limit || 50)
        };
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        throw error;
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOne({
            _id: notificationId,
            user: userId
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        await notification.markAsRead();
        return notification;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

/**
 * Mark all notifications as read for user
 */
export const markAllAsRead = async (userId) => {
    try {
        const result = await Notification.markAllAsRead(userId);
        return result;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

/**
 * Send bulk notifications (for broadcasts, digests, etc.)
 */
export const sendBulkNotifications = async (userIds, payload) => {
    try {
        const results = {
            successful: [],
            failed: []
        };

        // Process in batches to avoid overwhelming the system
        const batchSize = 100;
        for (let i = 0; i < userIds.length; i += batchSize) {
            const batch = userIds.slice(i, i + batchSize);

            const promises = batch.map(async (userId) => {
                try {
                    const notification = await createAndSendNotification(userId, payload);
                    results.successful.push({ userId, notificationId: notification._id });
                } catch (error) {
                    results.failed.push({ userId, error: error.message });
                }
            });

            await Promise.allSettled(promises);
        }

        console.log(`📊 Bulk notification results: ${results.successful.length} sent, ${results.failed.length} failed`);
        return results;

    } catch (error) {
        console.error('Error in sendBulkNotifications:', error);
        throw error;
    }
};
