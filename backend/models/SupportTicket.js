import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        unique: true,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room'
    },
    category: {
        type: String,
        enum: ['listing_issue', 'payment', 'verification', 'technical', 'other'],
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    attachments: [{
        url: String,
        publicId: String,
        fileName: String
    }],
    responses: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        message: {
            type: String,
            required: true
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        attachments: [{
            url: String,
            publicId: String,
            fileName: String
        }],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    resolvedAt: Date,
    closedAt: Date
}, {
    timestamps: true
});

// Indexes for performance
supportTicketSchema.index({ owner: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: -1, createdAt: -1 });
// supportTicketSchema.index({ ticketId: 1 }); // Already unique: true in schema

// Generate Ticket ID before saving
supportTicketSchema.pre('validate', async function (next) {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear();
        const count = await mongoose.model('SupportTicket').countDocuments();
        this.ticketId = `TKT-${year}-${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

export default SupportTicket;
