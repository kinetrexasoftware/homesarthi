import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: [
            'APPROVE_ROOM', 'REJECT_ROOM', 'BLOCK_ROOM', 'RESTORE_ROOM',
            'SUSPEND_USER', 'ACTIVATE_USER', 'DELETE_USER', 'VERIFY_OWNER',
            'RESOLVE_REPORT', 'SYSTEM_FLAG'
        ]
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetType: {
        type: String,
        required: true,
        enum: ['Room', 'User', 'Report']
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    targetName: String,
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    reason: String,
    ipAddress: String,
    userAgent: String
}, { timestamps: true });

auditSchema.index({ action: 1, createdAt: -1 });
auditSchema.index({ targetId: 1 });

export const Audit = mongoose.model('Audit', auditSchema);
