import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required for notification'],
        index: true // CRITICAL: Fast user queries
    },
    type: {
        type: String,
        required: [true, 'Notification type is required'],
        enum: [
            // Chat
            'message',
            'unread_messages_reminder',

            // Visits
            'visit_request',
            'visit_approved',
            'visit_rejected',
            'visit_reminder',
            'visit_completed',
            'visit_cancelled',

            // Rooms
            'room_approved',
            'room_rejected',
            'room_flagged',
            'room_saved',
            'room_inquiry',
            'room_price_drop',
            'room_view_milestone',

            // Admin
            'account_verified',
            'account_suspended',
            'account_warning',
            'content_flagged',

            // Support
            'ticket_created',
            'ticket_response',
            'ticket_resolved',

            // Engagement
            'welcome',
            'profile_incomplete',
            'weekly_digest',
            'new_match'
        ]
    },
    category: {
        type: String,
        required: true,
        enum: ['messages', 'visits', 'roomUpdates', 'admin', 'support', 'engagement'],
        index: true
    },
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    body: {
        type: String,
        required: [true, 'Notification body is required'],
        maxlength: [300, 'Body cannot exceed 300 characters']
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
        // Custom payload: { visitId, roomId, conversationId, etc. }
    },
    actionUrl: {
        type: String,
        default: null
        // Deep link: roomsarthi://chat/123, roomsarthi://visit/456
    },
    priority: {
        type: String,
        enum: ['critical', 'normal', 'low'],
        default: 'normal'
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date,
        default: null
    },
    pushSent: {
        type: Boolean,
        default: false
        // Track whether push was attempted (not whether it succeeded)
    },
    pushStatus: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'skipped'],
        default: 'pending'
    },
    pushError: {
        type: String,
        default: null
        // Store error if push failed (for debugging)
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound indexes for common queries
notificationSchema.index({ user: 1, createdAt: -1 }); // User's notifications, latest first
notificationSchema.index({ user: 1, read: 1, createdAt: -1 }); // Unread notifications
notificationSchema.index({ user: 1, category: 1, createdAt: -1 }); // Filter by category

// Virtual for time ago (e.g., "2 hours ago")
notificationSchema.virtual('timeAgo').get(function () {
    const now = new Date();
    const diff = now - this.createdAt;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return this.createdAt.toLocaleDateString();
});

// Static method: Get unread count for user
notificationSchema.statics.getUnreadCount = async function (userId) {
    return await this.countDocuments({ user: userId, read: false });
};

// Static method: Mark all as read for user
notificationSchema.statics.markAllAsRead = async function (userId) {
    return await this.updateMany(
        { user: userId, read: false },
        { read: true, readAt: new Date() }
    );
};

// Static method: Get user's notifications with pagination
notificationSchema.statics.getUserNotifications = async function (userId, options = {}) {
    const {
        limit = 50,
        skip = 0,
        category = null,
        unreadOnly = false
    } = options;

    const query = { user: userId };
    if (category) query.category = category;
    if (unreadOnly) query.read = false;

    return await this.find(query)
        .sort('-createdAt')
        .limit(limit)
        .skip(skip)
        .lean();
};

// Instance method: Mark notification as read
notificationSchema.methods.markAsRead = async function () {
    if (!this.read) {
        this.read = true;
        this.readAt = new Date();
        await this.save();
    }
    return this;
};

export const Notification = mongoose.model('Notification', notificationSchema);
