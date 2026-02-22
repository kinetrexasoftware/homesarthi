import express from 'express';
import { Analytics } from '../models/Analytics.js';
import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { Visit } from '../models/Visit.js';
import { Report } from '../models/Report.js';
import { protect, authorize } from '../middleware/auth.js';
import { getOwnerComprehensiveAnalytics, getOwnerDashboardAnalytics } from '../controllers/analyticsController.js';

const router = express.Router();

// Owner comprehensive analytics for analytics dashboard
router.get('/owner/comprehensive', protect, authorize('owner'), getOwnerComprehensiveAnalytics);

// Admin Analytics Overview
router.get('/admin/overview', protect, authorize('admin'), async (req, res) => {
  try {
    // Get user stats
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ verified: true });
    const blockedUsers = await User.countDocuments({ isBlocked: true });

    // Get room stats
    const totalRooms = await Room.countDocuments();
    const pendingRooms = await Room.countDocuments({ status: 'pending' });
    const approvedRooms = await Room.countDocuments({ status: 'approved' });

    // Get visit stats
    const activeVisits = await Visit.countDocuments({ status: 'scheduled' });

    // Get report stats
    const totalReports = await Report.countDocuments();

    // Calculate growth (simplified - you might want to implement proper growth calculation)
    const userGrowth = 0; // Placeholder
    const roomGrowth = 0; // Placeholder
    const visitGrowth = 0; // Placeholder
    const reportGrowth = 0; // Placeholder

    res.json({
      success: true,
      data: {
        totalUsers,
        verifiedUsers,
        blockedUsers,
        totalRooms,
        pendingRooms,
        approvedRooms,
        activeVisits,
        totalReports,
        userGrowth,
        roomGrowth,
        visitGrowth,
        reportGrowth
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


router.get('/owner/dashboard', protect, authorize('owner'), getOwnerDashboardAnalytics);


router.get('/room/:roomId', protect, authorize('owner'), async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.roomId, owner: req.user._id });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const analytics = await Analytics.find({ room: req.params.roomId })
      .sort('-date')
      .limit(30);

    res.json({ success: true, data: { analytics } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;