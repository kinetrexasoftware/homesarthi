import SupportTicket from '../models/SupportTicket.js';
import { User } from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary attachment uploader helper (assuming cloudinary is configured in some config)
// If not, we can use the existing upload logic in the project.

export const createTicket = async (req, res) => {
    try {
        const { category, subject, description, roomId, priority, attachments } = req.body;

        const ticket = new SupportTicket({
            owner: req.user._id,
            category,
            subject,
            description,
            room: roomId || null,
            priority: priority || 'medium',
            attachments: attachments || []
        });

        await ticket.save();

        res.status(201).json({
            success: true,
            message: 'Support ticket created successfully',
            data: ticket
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ owner: req.user._id })
            .sort({ createdAt: -1 })
            .populate('room', 'title');

        res.json({
            success: true,
            data: tickets
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTicketById = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate('owner', 'name email avatar phone')
            .populate('room', 'title images')
            .populate('responses.user', 'name avatar role');

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Authorization check
        if (req.user.role !== 'admin' && ticket.owner._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        res.json({
            success: true,
            data: ticket
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addReply = async (req, res) => {
    try {
        const { message, attachments } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Authorization check
        if (req.user.role !== 'admin' && ticket.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const reply = {
            user: req.user._id,
            message,
            attachments: attachments || [],
            isAdmin: req.user.role === 'admin'
        };

        ticket.responses.push(reply);

        // Auto re-open if owner replies to a resolved ticket?
        if (req.user.role !== 'admin' && ticket.status === 'resolved') {
            ticket.status = 'in_progress';
        }

        await ticket.save();

        res.json({
            success: true,
            message: 'Reply added successfully',
            data: reply
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Admin Controllers
export const getAllTickets = async (req, res) => {
    try {
        const { status, category, priority, page = 1, limit = 10 } = req.query;
        const query = {};

        if (status) query.status = status;
        if (category) query.category = category;
        if (priority) query.priority = priority;

        const tickets = await SupportTicket.find(query)
            .populate('owner', 'name email customId')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await SupportTicket.countDocuments(query);

        res.json({
            success: true,
            data: {
                tickets,
                pagination: {
                    total,
                    page: Number(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTicketStatus = async (req, res) => {
    try {
        const { status, priority } = req.body;
        const ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (status) {
            ticket.status = status;
            if (status === 'resolved') ticket.resolvedAt = Date.now();
            if (status === 'closed') ticket.closedAt = Date.now();
        }

        if (priority) ticket.priority = priority;

        await ticket.save();

        res.json({
            success: true,
            message: 'Ticket updated successfully',
            data: ticket
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSupportStats = async (req, res) => {
    try {
        const stats = await SupportTicket.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            open: 0,
            in_progress: 0,
            resolved: 0,
            closed: 0,
            total: 0
        };

        stats.forEach(item => {
            formattedStats[item._id] = item.count;
            formattedStats.total += item.count;
        });

        res.json({
            success: true,
            data: formattedStats
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
