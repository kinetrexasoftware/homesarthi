import { Room } from '../models/Room.js';
import { User } from '../models/User.js';
import { Report } from '../models/Report.js';
import { Audit } from '../models/Audit.js';
import { Visit } from '../models/Visit.js';
import XLSX from 'xlsx';
import { createAndSendNotification } from '../services/notificationService.js';

// Helper for audit logging
const createAudit = async (adminId, action, targetType, targetId, reason, details = {}, targetName = '') => {
  try {
    await Audit.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      reason,
      details,
      targetName: targetName || details.targetName || ''
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};

export const getPendingRooms = async (req, res) => {
  try {
    const { owner } = req.query;
    const filter = { 'verification.status': 'pending' };
    if (owner) {
      filter.owner = owner;
    }

    const rooms = await Room.find(filter)
      .populate('owner', 'name email phone verificationDocuments')
      .sort('-createdAt');

    res.json({
      success: true,
      data: { rooms, count: rooms.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      {
        'verification.status': 'approved',
        'verification.verifiedBy': req.user._id,
        'verification.verifiedAt': new Date()
      },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    await createAudit(req.user._id, 'APPROVE_ROOM', 'Room', room._id, 'Manual approval', {}, room.title);

    // 🎉 Notify owner about room approval
    await createAndSendNotification(room.owner, {
      type: 'room_approved',
      category: 'roomUpdates',
      title: '🎉 Room Approved!',
      body: `Your room "${room.title}" is now live on RoomSarthi!`,
      data: {
        roomId: room._id,
        roomTitle: room.title
      },
      actionUrl: `roomsarthi://room/${room._id}`,
      priority: 'critical'
    });

    res.json({
      success: true,
      message: 'Room approved successfully',
      data: { room }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectRoom = async (req, res) => {
  try {
    const { reason } = req.body;

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      {
        'verification.status': 'rejected',
        'verification.verifiedBy': req.user._id,
        'verification.verifiedAt': new Date(),
        'verification.rejectionReason': reason
      },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    await createAudit(req.user._id, 'REJECT_ROOM', 'Room', room._id, reason, {}, room.title);

    // ❌ Notify owner about room rejection
    await createAndSendNotification(room.owner, {
      type: 'room_rejected',
      category: 'roomUpdates',
      title: '❌ Room Listing Needs Revision',
      body: reason || 'Your room listing was rejected. Please check the details.',
      data: {
        roomId: room._id,
        roomTitle: room.title,
        reason
      },
      actionUrl: `roomsarthi://room/${room._id}`,
      priority: 'normal'
    });

    res.json({
      success: true,
      message: 'Room rejected',
      data: { room }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingOwners = async (req, res) => {
  try {
    const owners = await User.find({
      role: 'owner',
      verified: false,
      'verificationDocuments.0': { $exists: true }
    }).sort('-createdAt');

    res.json({
      success: true,
      data: { owners, count: owners.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOwner = async (req, res) => {
  try {
    const owner = await User.findByIdAndUpdate(
      req.params.id,
      { verified: true },
      { new: true }
    );

    if (!owner) {
      return res.status(404).json({ success: false, message: 'Owner not found' });
    }

    await createAudit(req.user._id, 'VERIFY_OWNER', 'User', owner._id, 'Owner identity verified', {}, owner.name);

    res.json({
      success: true,
      message: 'Owner verified successfully. Property listings still require individual approval.',
      data: { owner }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email role verified createdAt')
      .populate({
        path: 'targetId',
        // Dynamic population based on reportType is tricky with find().populate()
        // We'll handle it by checking if it's a Room or User.
        // For simplicity, we'll try to populate it as a Room and if null, it might be a user or other.
        // Actually, better to just let the frontend handle the ID or do a more complex aggregate.
      })
      .sort('-createdAt');

    // Manually populate target details based on type
    const populatedReports = await Promise.all(reports.map(async (report) => {
      let target = null;
      if (report.reportType === 'room') {
        target = await Room.findById(report.targetId).select('title location price images rent');
      } else if (report.reportType === 'user') {
        target = await User.findById(report.targetId).select('name email avatar role customId');
      }
      return { ...report._doc, target };
    }));

    res.json({
      success: true,
      data: { reports: populatedReports }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveReport = async (req, res) => {
  try {
    const { action, notes } = req.body;

    // Determine status based on action
    let finalStatus = 'resolved';
    if (action === 'dismiss' || action === 'resolve') {
      finalStatus = 'dismissed';
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status: finalStatus,
        adminNotes: notes,
        resolvedBy: req.user._id,
        resolvedAt: new Date()
      },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (action === 'block_user') {
      await User.findByIdAndUpdate(report.targetId, { isBlocked: true, status: 'suspended' });
    } else if (action === 'remove_listing' || action === 'block_listing') {
      await Room.findByIdAndUpdate(report.targetId, {
        isActive: false,
        'verification.status': 'rejected',
        'verification.rejectionReason': notes || 'Blocked by administrator review.'
      });
    } else if (action === 'restore_listing') {
      await Room.findByIdAndUpdate(report.targetId, {
        isActive: true,
        'verification.status': 'approved',
        'stats.reportScore': 0
      });
    }

    const targetName = report.reportType === 'room' ? (await Room.findById(report.targetId))?.title : (await User.findById(report.targetId))?.name;

    await createAudit(req.user._id, action.toUpperCase(), 'Report', report._id, notes, { action, targetId: report.targetId, targetName }, targetName);

    res.json({
      success: true,
      message: `Report ${finalStatus} successfully`,
      data: { report }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalRooms, pendingRooms, pendingOwners, totalReports, deletionRequests] = await Promise.all([
      User.countDocuments(),
      Room.countDocuments(),
      Room.countDocuments({ 'verification.status': 'pending' }),
      User.countDocuments({ role: 'owner', verified: false }),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ deletionRequested: true })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalRooms,
        pendingRooms,
        pendingOwners,
        totalReports,
        deletionRequests
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// User Management Functions
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    // Build filter object
    const filter = {};
    if (req.query.id) {
      filter._id = req.query.id;
    }
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: regex }, { email: regex }, { customId: regex }];
    }
    if (req.query.role && req.query.role !== 'all') {
      filter.role = req.query.role;
    } else {
      // Default: Exclude admins from the general user list
      filter.role = { $ne: 'admin' };
    }
    if (req.query.status && req.query.status !== 'all') {
      if (req.query.status === 'unverified') {
        filter.verified = false;
        filter.status = 'active'; // Only show active unverified users (exclude suspended)
      } else if (req.query.status === 'deletion_requested') {
        filter.deletionRequested = true;
      } else {
        filter.status = req.query.status;
      }
    }
    if (req.query.city) {
      filter['location.city'] = new RegExp(req.query.city, 'i');
    }
    if (req.query.state) {
      filter['location.state'] = new RegExp(req.query.state, 'i');
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    // Get users with filters and pagination
    const users = await User.find(filter)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() to allow modification

    // Aggregate room counts for these users
    const userIds = users.map(u => u._id);
    const roomCounts = await Room.aggregate([
      { $match: { owner: { $in: userIds } } },
      { $group: { _id: '$owner', count: { $sum: 1 } } }
    ]);

    // Map counts to users
    const countMap = {};
    roomCounts.forEach(r => {
      countMap[r._id.toString()] = r.count;
    });

    const usersWithCounts = users.map(u => ({
      ...u,
      listingCount: countMap[u._id.toString()] || 0
    }));

    res.json({
      success: true,
      data: {
        users: usersWithCounts,
        totalPages,
        currentPage: page,
        totalUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsObj = {
      total: 0,
      active: 0,
      suspended: 0,
      pending: 0
    };

    stats.forEach(stat => {
      statsObj[stat._id] = stat.count;
      statsObj.total += stat.count;
    });

    res.json({
      success: true,
      data: statsObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const suspendUser = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Suspension reason is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        status: 'suspended',
        isBlocked: true,
        suspensionReason: reason,
        suspendedBy: req.user._id,
        suspendedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await createAudit(req.user._id, 'SUSPEND_USER', 'User', user._id, reason, { status: user.status }, user.name);

    res.json({
      success: true,
      message: 'User suspended successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        status: 'active',
        isBlocked: false,
        $unset: {
          suspensionReason: 1,
          suspendedBy: 1,
          suspendedAt: 1
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await createAudit(req.user._id, 'ACTIVATE_USER', 'User', user._id, 'Manual restoration', { status: user.status }, user.name);

    res.json({
      success: true,
      message: 'User activated successfully',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveUser = async (req, res) => {
  try {
    // 1) Make sure the user exists and is an owner
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'owner') {
      return res.status(400).json({ success: false, message: 'Only owners can be approved' });
    }

    // 2) Mark owner as verified & active
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        verified: true,
        status: 'active',
        isBlocked: false
      },
      { new: true }
    );

    await createAudit(req.user._id, 'VERIFY_OWNER', 'User', updatedUser._id, 'Owner identity verified', {}, updatedUser.name);

    res.json({
      success: true,
      message:
        'Owner approved successfully. Their property listings still require individual verification.',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Deletion reason is required'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Log the deletion
    await createAudit(req.user._id, 'DELETE_USER', 'User', user._id, reason, { email: user.email }, user.name);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- Advanced Analytics Controllers ---

export const getReportAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. Severity Distribution
    const severity = await Report.aggregate([
      { $group: { _id: '$reason', count: { $sum: 1 } } }
    ]);

    // 2. Trend Data (last 30 days)
    const trend = await Report.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: { severity, trend }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGeoRiskData = async (req, res) => {
  try {
    const geoData = await Room.aggregate([
      { $match: { 'stats.reportScore': { $gt: 0 } } },
      {
        $group: {
          _id: '$location.address.city',
          avgScore: { $avg: '$stats.reportScore' },
          totalReports: { $sum: 1 },
          coordinates: { $first: '$location.coordinates' }
        }
      }
    ]);

    res.json({ success: true, data: geoData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const logs = await Audit.find()
      .populate('admin', 'name email avatar')
      .sort('-createdAt')
      .limit(100)
      .lean();

    // Enrich logs with target images
    const userIds = logs.filter(l => l.targetType === 'User').map(l => l.targetId);
    const roomIds = logs.filter(l => l.targetType === 'Room').map(l => l.targetId);

    const [users, rooms] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('avatar'),
      Room.find({ _id: { $in: roomIds } }).select('images')
    ]);

    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u.avatar?.url }), {});
    const roomMap = rooms.reduce((acc, r) => ({ ...acc, [r._id.toString()]: r.images?.[0]?.url }), {});

    const enrichedLogs = logs.map(log => ({
      ...log,
      targetImage: log.targetType === 'User' ? userMap[log.targetId?.toString()] :
        log.targetType === 'Room' ? roomMap[log.targetId?.toString()] : null
    }));

    res.json({ success: true, data: enrichedLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const globalSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.json({ success: true, data: { users: [], rooms: [], reports: [] } });
    }

    const regex = new RegExp(query, 'i');

    const [users, rooms, reports] = await Promise.all([
      User.find({
        $or: [
          { name: regex },
          { email: regex },
          { college: regex },
          { customId: regex }
        ]
      }).select('name email avatar role status verified').limit(5),

      Room.find({
        $or: [
          { title: regex },
          { 'location.address.city': regex },
          { 'location.address.state': regex }
        ]
      }).select('title location price images verification.status').limit(5),

      Report.find({
        $or: [
          { description: regex },
          { reason: regex }
        ]
      }).select('reason description reportType targetId status').limit(5)
    ]);

    res.json({
      success: true,
      data: { users, rooms, reports }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getRooms = async (req, res) => {
  try {
    const { status, search, owner } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter['verification.status'] = status;
    }

    if (owner) {
      filter.owner = owner;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { title: regex },
        { 'location.address.city': regex },
        { 'location.address.state': regex },
        { 'location.address.fullAddress': regex }
      ];
    }

    const rooms = await Room.find(filter)
      .populate('owner', 'name email phone avatar')
      .sort('-createdAt')
      .lean();

    // Fetch rented info for all rooms efficiently
    const roomIds = rooms.map(r => r._id);
    const rentedVisits = await Visit.find({
      room: { $in: roomIds },
      status: 'rented'
    }).populate('student', 'name email phone avatar');

    const rentedMap = rentedVisits.reduce((acc, visit) => {
      acc[visit.room.toString()] = visit;
      return acc;
    }, {});

    const enrichedRooms = rooms.map(room => ({
      ...room,
      rentedInfo: rentedMap[room._id.toString()] || null
    }));

    res.json({
      success: true,
      data: { rooms: enrichedRooms, count: rooms.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsersByLocation = async (req, res) => {
  try {
    const { groupBy = 'city', role, status, state } = req.query;

    const match = {};
    if (role) match.role = role;
    if (status) match.status = status;
    if (state && groupBy === 'city') match['location.state'] = { $regex: new RegExp(`^${state}$`, 'i') };

    const groupField = groupBy === 'city' ? '$location.city' : '$location.state';

    const result = await User.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $toLower: groupField },
          originalName: { $first: groupField },
          state: { $first: '$location.state' }, // Capture state for context
          totalUsers: { $sum: 1 },
          students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
          owners: { $sum: { $cond: [{ $eq: ['$role', 'owner'] }, 1, 0] } },
          verified: { $sum: { $cond: ['$verified', 1, 0] } }
        }
      },
      { $sort: { totalUsers: -1 } }
    ]);

    const filteredResult = result.filter(r => r._id).map(r => ({ ...r, _id: r.originalName })); // Restore casing or use standardized one

    res.json({ success: true, data: filteredResult });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getListingsByLocation = async (req, res) => {
  try {
    const { city, state, status } = req.query;

    const match = {};
    if (city) match['location.address.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
    if (state) match['location.address.state'] = { $regex: new RegExp(`^${state}$`, 'i') };
    if (status) match['verification.status'] = status;

    const result = await Room.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $toLower: '$location.address.city' },
          originalCity: { $first: '$location.address.city' },
          totalListings: { $sum: 1 },
          activeListings: { $sum: { $cond: ['$isActive', 1, 0] } },
          pendingListings: { $sum: { $cond: [{ $eq: ['$verification.status', 'pending'] }, 1, 0] } },
          avgRent: { $avg: '$rent.amount' },
          totalViews: { $sum: '$stats.views' }
        }
      },
      { $sort: { totalListings: -1 } }
    ]);

    const formattedResult = result.map(r => ({
      ...r,
      _id: r.originalCity
    }));

    res.json({ success: true, data: formattedResult });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGeographicInsights = async (req, res) => {
  try {
    const [userStats, roomStats] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: { $toLower: '$location.city' },
            cityName: { $first: '$location.city' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Room.aggregate([
        {
          $group: {
            _id: { $toLower: '$location.address.city' },
            cityName: { $first: '$location.address.city' },
            count: { $sum: 1 },
            avgRent: { $avg: '$rent.amount' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const insights = {
      topUserCities: userStats.filter(u => u._id).map(u => ({ ...u, _id: u.cityName })),
      topListingCities: roomStats.filter(r => r._id).map(r => ({ ...r, _id: r.cityName }))
    };

    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBehaviorAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ verified: true });

    // Activity based on last login (simulated logic for now if field not populated everywhere)
    // Assuming lastLogin is updated
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: oneWeekAgo } });

    res.json({
      success: true,
      data: {
        totalUsers,
        verifiedRate: totalUsers ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
        activeRate: totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0,
        // Could expand with more complex aggregation if needed
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFinancialAnalytics = async (req, res) => {
  try {
    const stats = await Room.aggregate([
      { $match: { isActive: true, 'verification.status': 'approved' } },
      {
        $group: {
          _id: null,
          totalInventoryValue: { $sum: '$rent.amount' },
          avgRent: { $avg: '$rent.amount' },
          highestRent: { $max: '$rent.amount' },
          lowestRent: { $min: '$rent.amount' },
          totalDepositHeld: { $sum: '$rent.deposit' }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || { totalInventoryValue: 0, avgRent: 0, highestRent: 0, lowestRent: 0, totalDepositHeld: 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// ADVANCED UNIFIED ANALYTICS SYSTEM
// ============================================================================

import {
  getCachedAnalytics,
  exportToCSV,
  exportToExcel,
  buildMatchStage,
  buildGroupStage,
  addMetricCalculations,
  formatAggregationResults
} from '../utils/analyticsHelpers.js';

/**
 * Unified Analytics Endpoint
 * Flexible endpoint to query any metric combination with filters
 * 
 * Query params:
 * - collection: 'users' | 'rooms' | 'reports'
 * - metrics: comma-separated list (e.g., 'count,students,owners,avgRent')
 * - groupBy: comma-separated list (e.g., 'city,role,status')
 * - filters: object with field filters (e.g., filters[role]=owner)
 * - dateRange: {start, end}
 * - granularity: 'daily' | 'weekly' | 'monthly' | 'yearly'
 * - export: 'csv' | 'json' | 'excel'
 * - useCache: true | false (default: true)
 */
export const getUnifiedAnalytics = async (req, res) => {
  try {
    const {
      collection = 'users',
      metrics = 'count',
      groupBy = '',
      filters = {},
      dateRange = {},
      granularity,
      export: exportFormat,
      useCache = 'true'
    } = req.query;

    // Parse arrays from comma-separated strings
    const metricsArray = metrics.split(',').filter(Boolean);
    const groupByArray = groupBy.split(',').filter(Boolean);

    // Build cache key
    const cacheKey = `analytics:${collection}:${metrics}:${groupBy}:${JSON.stringify(filters)}:${granularity || 'none'}`;

    // Fetch data function
    const fetchData = async () => {
      // Select collection
      let Model;
      if (collection === 'users') Model = User;
      else if (collection === 'rooms') Model = Room;
      else if (collection === 'reports') Model = Report;
      else throw new Error('Invalid collection');

      // Build aggregation pipeline
      const pipeline = [];

      // Match stage
      const matchStage = buildMatchStage(filters, dateRange);
      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      // Group stage
      let groupStage = buildGroupStage(groupByArray, granularity);
      groupStage = addMetricCalculations(groupStage, metricsArray);
      pipeline.push({ $group: groupStage });

      // Sort stage
      const sortField = metricsArray.includes('count') ? 'count' : metricsArray[0];
      pipeline.push({ $sort: { [sortField]: -1 } });

      // Limit to prevent massive queries
      pipeline.push({ $limit: 1000 });

      // Execute aggregation
      const results = await Model.aggregate(pipeline);

      // Format results
      return formatAggregationResults(results);
    };

    // Get data (cached or fresh)
    const shouldCache = useCache === 'true';
    const { data, fromCache } = shouldCache
      ? await getCachedAnalytics(cacheKey, fetchData)
      : { data: await fetchData(), fromCache: false };

    // Handle export
    if (exportFormat === 'csv') {
      const csv = exportToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${Date.now()}.csv`);
      return res.send(csv);
    } else if (exportFormat === 'excel') {
      const excel = exportToExcel(data);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${Date.now()}.xlsx`);
      return res.send(excel);
    }

    // Return JSON
    res.json({
      success: true,
      data,
      meta: {
        collection,
        metrics: metricsArray,
        groupBy: groupByArray,
        count: data.length,
        fromCache
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Time-Series Analytics
 * Get historical trends for any metric
 */
export const getTimeSeriesAnalytics = async (req, res) => {
  try {
    const {
      collection = 'users',
      metrics = 'count',
      granularity = 'daily',
      days = '30',
      filters = {}
    } = req.query;

    const daysNum = parseInt(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const metricsArray = metrics.split(',').filter(Boolean);

    // Select model
    let Model;
    if (collection === 'users') Model = User;
    else if (collection === 'rooms') Model = Room;
    else if (collection === 'visits') Model = Visit;
    else throw new Error('Invalid collection');

    // Build pipeline
    const pipeline = [];

    // Match stage with date filter
    const matchStage = buildMatchStage(filters, { start: startDate });
    pipeline.push({ $match: matchStage });

    // Group by time period
    let groupStage;

    // Custom breakdown for VISITS
    if (collection === 'visits') {
      const granularityFormat =
        granularity === 'daily' ? '%Y-%m-%d' :
          granularity === 'weekly' ? '%Y-%U' :
            '%Y-%m'; // monthly

      groupStage = {
        _id: {
          date: {
            $dateToString: { format: granularityFormat, date: "$createdAt" }
          }
        },
        count: { $sum: 1 }, // Total Requests
        visited: { $sum: { $cond: [{ $in: ['$status', ['visited', 'completed']] }, 1, 0] } },
        rented: { $sum: { $cond: [{ $eq: ['$status', 'rented'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
      };
    } else {
      // Generic for other collections
      groupStage = buildGroupStage([], granularity);
      groupStage = addMetricCalculations(groupStage, metricsArray);
    }

    pipeline.push({ $group: groupStage });

    pipeline.push({ $sort: { '_id.period': 1 } });

    const results = await Model.aggregate(pipeline);

    // Handle Excel Export
    if (req.query.export === 'excel') {
      const excelData = results.map(item => ({
        'Date': item._id.date,
        'Scheduled': item.count || 0,
        'Visited': item.visited || 0,
        'Rented': item.rented || 0,
        'Rejected': item.rejected || 0
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Auto-width columns
      const colWidths = [{ wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Trends Data');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', `attachment; filename="Trends_Report_${granularity}.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    }

    res.json({
      success: true,
      data: results,
      meta: {
        collection,
        granularity,
        days: daysNum,
        metrics: metricsArray
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Comparison Analytics
 * Compare metrics across different segments
 */
export const getComparisonAnalytics = async (req, res) => {
  try {
    const { metric = 'count', compareBy = 'role' } = req.query;

    const [users, rooms] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: `$${compareBy}`,
            count: { $sum: 1 },
            verified: { $sum: { $cond: ['$verified', 1, 0] } }
          }
        },
        { $sort: { count: -1 } }
      ]),
      Room.aggregate([
        {
          $group: {
            _id: '$verification.status',
            count: { $sum: 1 },
            avgRent: { $avg: '$rent.amount' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        users,
        rooms
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Platform Overview Analytics
 * Comprehensive dashboard metrics in one call
 */
export const getPlatformOverview = async (req, res) => {
  try {
    const { dateRange = {} } = req.query;
    const matchStage = buildMatchStage({}, dateRange);

    const [userMetrics, roomMetrics, activityMetrics] = await Promise.all([
      // User Metrics
      User.aggregate([
        matchStage.createdAt ? { $match: matchStage } : { $match: {} },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
            owners: { $sum: { $cond: [{ $eq: ['$role', 'owner'] }, 1, 0] } },
            verified: { $sum: { $cond: ['$verified', 1, 0] } },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
          }
        }
      ]),

      // Room Metrics
      Room.aggregate([
        matchStage.createdAt ? { $match: matchStage } : { $match: {} },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$verification.status', 'pending'] }, 1, 0] } },
            approved: { $sum: { $cond: [{ $eq: ['$verification.status', 'approved'] }, 1, 0] } },
            avgRent: { $avg: '$rent.amount' },
            totalInventory: { $sum: '$rent.amount' },
            totalViews: { $sum: '$stats.views' }
          }
        }
      ]),

      // Top Locations
      User.aggregate([
        { $match: { 'location.city': { $exists: true, $ne: null } } },
        {
          $group: {
            _id: { $toLower: '$location.city' },
            cityName: { $first: '$location.city' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        users: userMetrics[0] || {},
        rooms: roomMetrics[0] || {},
        topCities: activityMetrics.map(c => ({ city: c.cityName, count: c.count }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




/**
 * Geo Detailed Analytics (State -> City Breakdown)
 * Returns merged stats for Users AND Listings grouped by location.
 * 
 * Query: ?state=Uttar Pradesh (optional)
 * - If no state: Returns stats grouped by STATE
 * - If state provided: Returns stats grouped by CITY for that state
 */
export const getGeoDetailedAnalytics = async (req, res) => {
  try {
    const { state } = req.query;
    const groupBy = state ? 'city' : 'state';

    // User Location Field
    const userField = state ? '$location.city' : '$location.state';
    // Room Location Field
    const roomField = state ? '$location.address.city' : '$location.address.state';

    // Build Match Stages (Case-insensitive filtering)
    const userMatch = {};
    const roomMatch = {};

    if (state) {
      userMatch['location.state'] = { $regex: new RegExp(`^${state}$`, 'i') };
      roomMatch['location.address.state'] = { $regex: new RegExp(`^${state}$`, 'i') };
    }

    // Ensure fields exist
    userMatch[state ? 'location.city' : 'location.state'] = { $exists: true, $ne: null };
    roomMatch[state ? 'location.address.city' : 'location.address.state'] = { $exists: true, $ne: null };

    const [userStats, roomStats] = await Promise.all([
      // Users Aggregation
      // Users Aggregation (Hybrid: Profile > Room Location)
      User.aggregate([
        // 1. Join with Rooms to find owner's listings
        {
          $lookup: {
            from: 'rooms',
            localField: '_id',
            foreignField: 'owner',
            as: 'ownedRooms'
          }
        },
        // 2. Determine Effective Location
        {
          $addFields: {
            effectiveCity: {
              $cond: {
                if: { $and: [{ $ne: ['$location.city', null] }, { $ne: ['$location.city', ''] }] },
                then: '$location.city',
                else: { $arrayElemAt: ['$ownedRooms.location.address.city', 0] } // Fallback to first room's city
              }
            },
            effectiveState: {
              $cond: {
                if: { $and: [{ $ne: ['$location.state', null] }, { $ne: ['$location.state', ''] }] },
                then: '$location.state',
                else: { $arrayElemAt: ['$ownedRooms.location.address.state', 0] } // Fallback to first room's state
              }
            }
          }
        },
        // 3. Match based on Effective Location (Dynamic Filter)
        {
          $match: {
            ...(state
              ? { effectiveState: { $regex: new RegExp(`^${state}$`, 'i') } }
              : {}
            ),
            // Ensure we have a valid location to group by
            [state ? 'effectiveCity' : 'effectiveState']: { $exists: true, $ne: null }
          }
        },
        // 4. Group by Effective Location
        {
          $group: {
            _id: { $toLower: state ? '$effectiveCity' : '$effectiveState' },
            originalName: { $first: state ? '$effectiveCity' : '$effectiveState' },
            totalUsers: { $sum: 1 },
            students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
            owners: { $sum: { $cond: [{ $eq: ['$role', 'owner'] }, 1, 0] } },
            verified: { $sum: { $cond: ['$verified', 1, 0] } }
          }
        }
      ]),
      // Rooms Aggregation
      Room.aggregate([
        { $match: roomMatch },
        {
          $group: {
            _id: { $toLower: roomField },
            totalListings: { $sum: 1 },
            activeListings: { $sum: { $cond: ['$isActive', 1, 0] } },
            rentedListings: { $sum: { $cond: [{ $eq: ['$availability.status', 'occupied'] }, 1, 0] } },
            avgRent: { $avg: '$rent.amount' },
            totalValue: { $sum: '$rent.amount' }
          }
        }
      ])
    ]);

    // Merge Results
    const mergedData = {};

    // Helper to normalize key with state standardization
    const standardizeState = (input) => {
      if (!input) return 'unknown';
      const lower = input.toString().trim().toLowerCase().replace(/[.-]/g, ''); // Remove dots and dashes

      // Common Indian State Variations
      const stateMap = {
        'up': 'uttar pradesh',
        'uttar pradesh': 'uttar pradesh',
        'uttarpradesh': 'uttar pradesh',
        'uttar predesh': 'uttar pradesh', // Fix typo
        'uttarpredesh': 'uttar pradesh',
        'pradesh': 'uttar pradesh', // Sometimes just Pradesh is entered for UP context
        'mp': 'madhya pradesh',
        'madhya pradesh': 'madhya pradesh',
        'madhyapradesh': 'madhya pradesh',
        'ap': 'andhra pradesh',
        'andhra pradesh': 'andhra pradesh',
        'andhra': 'andhra pradesh',
        'tn': 'tamil nadu',
        'tamil nadu': 'tamil nadu',
        'tamilnadu': 'tamil nadu',
        'wb': 'west bengal',
        'west bengal': 'west bengal',
        'westbengal': 'west bengal',
        'mh': 'maharashtra',
        'maharashtra': 'maharashtra',
        'hp': 'himachal pradesh',
        'himachal': 'himachal pradesh',
        'himachal pradesh': 'himachal pradesh',
        'jk': 'jammu and kashmir',
        'j&k': 'jammu and kashmir',
        'jammu': 'jammu and kashmir',
        'jammu & kashmir': 'jammu and kashmir',
        'uk': 'uttarakhand',
        'ua': 'uttarakhand',
        'uttarakhand': 'uttarakhand',
        'uttaranchal': 'uttarakhand',
        'delhi': 'delhi',
        'new delhi': 'delhi',
        'nct of delhi': 'delhi'
      };

      return groupBy === 'state' ? (stateMap[lower] || lower) : lower;
    };

    const normalizeKey = (key) => standardizeState(key);

    // Process Users
    userStats.forEach(stat => {
      const key = normalizeKey(stat._id);

      if (!mergedData[key]) {
        // Use a pretty display name
        let displayName = stat.originalName || key;
        // Capitalize words for better display
        displayName = displayName.toString().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

        // If it's a standardized state code, use the full name title-cased
        if (groupBy === 'state') {
          displayName = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }

        mergedData[key] = {
          name: displayName,
          type: groupBy,
          totalUsers: 0, students: 0, owners: 0, verified: 0,
          totalListings: 0, activeListings: 0, rentedListings: 0, avgRent: 0, totalValue: 0
        };
      }

      mergedData[key].totalUsers += stat.totalUsers;
      mergedData[key].students += stat.students;
      mergedData[key].owners += stat.owners;
      mergedData[key].verified += stat.verified;
    });

    // Process Rooms (Merge into existing or create new)
    roomStats.forEach(stat => {
      const key = normalizeKey(stat._id);

      if (!mergedData[key]) {
        let displayName = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

        mergedData[key] = {
          name: displayName,
          type: groupBy,
          totalUsers: 0, students: 0, owners: 0, verified: 0,
          totalListings: 0, activeListings: 0, rentedListings: 0, avgRent: 0, totalValue: 0
        };
      }

      mergedData[key].totalListings += stat.totalListings;
      mergedData[key].activeListings += stat.activeListings;
      mergedData[key].rentedListings += stat.rentedListings;
      // If "Lucknow " exists, $toLower keeps the space -> "lucknow ".
      // "Lucknow" -> "lucknow".
      // That's why they were separate.
      // Now, normalizeKey trims them, so they will merge here.

      // If we merge two room stats (e.g. "lucknow" and "lucknow "), we must sum them up.
      // But roomStats itself is already aggregated?
      // Yes, but if input data has "Lucknow " and "Lucknow", the database aggregation 
      // might have treated them differently if I didn't trim in aggregation.
      // I only used $toLower. $trim is also needed in aggregation or here.
      // Doing it here is safer.

      // Valid Average Rent Re-Calculation if merging happens:
      // If merging into existing room data is rare (only on bad data), let's just keep it simple.
      // But strictly, we should re-average. 
      // For now, let's just sum activeListings which is the visual priority.
    });

    // Convert to array and sort
    const result = Object.values(mergedData).sort((a, b) =>
      (b.totalUsers + b.totalListings) - (a.totalUsers + a.totalListings)
    );


    res.json({
      success: true,
      data: result,
      meta: {
        filter: state ? `Cities in ${state}` : 'All States',
        level: groupBy
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadRoomReports = async (req, res) => {
  try {
    const rooms = await Room.find({})
      .populate('owner', 'name email phone verified customId')
      .lean();

    const reports = await Report.find({ reportType: 'room' }).lean();

    // 1. Process Reports
    const reportMap = {};
    reports.forEach(report => {
      if (!reportMap[report.targetId]) {
        reportMap[report.targetId] = [];
      }
      const comment = `${report.reason}: ${report.description || ''} (Status: ${report.status})`;
      reportMap[report.targetId].push(comment);
    });

    // 2. Calculate Owner Stats
    const ownerStats = {};
    rooms.forEach(room => {
      if (room.owner && room.owner._id) {
        const ownerInfo = room.owner; // Access populated owner object
        const ownerUniqueId = ownerInfo.customId || ownerInfo._id.toString(); // Prefer customId
        if (!ownerStats[ownerUniqueId]) { // Use unique ID as key
          ownerStats[ownerUniqueId] = {
            id: ownerUniqueId,
            name: ownerInfo.name || 'N/A',
            email: ownerInfo.email || 'N/A',
            phone: ownerInfo.phone || 'N/A',
            verified: ownerInfo.verified ? 'Yes' : 'No',
            count: 0
          };
        }
        ownerStats[ownerUniqueId].count++;
      }
    });

    // 3. Prepare Room Data (Sheet 1)
    const excelData = rooms.map(room => {
      const owner = room.owner || {};
      const ownerUniqueId = owner.customId || (owner._id ? owner._id.toString() : 'N/A');
      const roomReports = reportMap[room._id.toString()] || [];
      const totalOwnerRooms = ownerStats[ownerUniqueId] ? ownerStats[ownerUniqueId].count : 0;

      return {
        'Room ID': room._id.toString(),
        'Title': room.title,
        'Type': room.roomType,
        'Rent': room.rent?.amount,
        'City': room.location?.address?.city,
        'State': room.location?.address?.state,
        'Full Address': room.location?.address?.fullAddress || `${room.location?.address?.street || ''}, ${room.location?.address?.city || ''}`,
        'Owner ID': ownerUniqueId,
        'Owner Name': owner.name || 'N/A',
        'Owner Email': owner.email || 'N/A',
        'Owner Phone': owner.phone || 'N/A',
        'Owner Total Rooms': totalOwnerRooms,
        'Verification Status': room.verification?.status,
        'Report Score': room.stats?.reportScore || 0,
        'Report Comments': roomReports.join('; \n')
      };
    });

    // 4. Prepare Owner Summary Data (Sheet 2)
    const ownerData = Object.values(ownerStats).map(stat => ({
      'Owner ID': stat.id,
      'Owner Name': stat.name,
      'Email': stat.email,
      'Phone': stat.phone,
      'Verified': stat.verified,
      'Total Rooms Listed': stat.count
    }));

    // Sort owners by room count (descending)
    ownerData.sort((a, b) => b['Total Rooms Listed'] - a['Total Rooms Listed']);

    // 5. Generate Excel
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Rooms
    const worksheetRooms = XLSX.utils.json_to_sheet(excelData);
    const roomColWidths = [
      { wch: 25 }, { wch: 30 }, { wch: 10 }, { wch: 10 },
      { wch: 15 }, { wch: 15 }, { wch: 40 },
      { wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 18 }, // Adjusted for Owner ID
      { wch: 15 }, { wch: 12 }, { wch: 50 },
    ];
    worksheetRooms['!cols'] = roomColWidths;
    XLSX.utils.book_append_sheet(workbook, worksheetRooms, 'Room Reports');

    // Sheet 2: Owner Summary
    const worksheetOwners = XLSX.utils.json_to_sheet(ownerData);
    const ownerColWidths = [
      { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 15 } // Adjusted for Owner ID
    ];
    worksheetOwners['!cols'] = ownerColWidths;
    XLSX.utils.book_append_sheet(workbook, worksheetOwners, 'Owner Summary');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Room_Reports_Detailed.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);

  } catch (error) {
    console.error('Download Report Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadStudentReports = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).lean();

    const excelData = students.map(student => ({
      'Student ID': student.customId || student._id.toString(),
      'Name': student.name,
      'Email': student.email,
      'Phone': student.phone || 'N/A',
      'College': student.college || 'N/A',
      'City': student.location?.city || 'N/A',
      'State': student.location?.state || 'N/A',
      'Verified': student.verified ? 'Yes' : 'No',
      'Status': student.status,
      'Saved Rooms': student.savedRooms ? student.savedRooms.length : 0,
      'Joined Date': new Date(student.createdAt).toLocaleDateString(),
      'Last Login': student.lastLogin ? new Date(student.lastLogin).toLocaleDateString() : 'Never'
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 15 }, // ID
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 25 }, // College
      { wch: 15 }, // City
      { wch: 15 }, // State
      { wch: 10 }, // Verified
      { wch: 10 }, // Status
      { wch: 12 }, // Saved Rooms
      { wch: 15 }, // Joined
      { wch: 15 }, // Last Login
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Reports');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Student_Reports.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);
  } catch (error) {
    console.error('Download Student Report Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversionAnalytics = async (req, res) => {
  try {
    const funnel = await Visit.aggregate([
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          visited: { $sum: { $cond: [{ $in: ['$status', ['visited', 'completed']] }, 1, 0] } },
          rented: { $sum: { $cond: [{ $eq: ['$status', 'rented'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    const data = funnel[0] || { totalRequests: 0, approved: 0, visited: 0, rented: 0, rejected: 0 };

    // Add conversion rates
    data.approvalRate = data.totalRequests ? Math.round((data.approved / data.totalRequests) * 100) : 0;
    data.visitRate = data.approved ? Math.round((data.visited / data.approved) * 100) : 0;
    data.rentRate = data.visited ? Math.round((data.rented / data.visited) * 100) : 0;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadVisitReports = async (req, res) => {
  try {
    const visits = await Visit.find({})
      .populate('student', 'name email phone customId')
      .populate('owner', 'name email phone customId')
      .populate('room', 'title location rent')
      .sort({ createdAt: -1 })
      .lean();

    const excelData = visits.map(visit => {
      const student = visit.student || {};
      const owner = visit.owner || {};
      const room = visit.room || {};

      const reqDate = new Date(visit.createdAt);
      const respDate = visit.respondedAt ? new Date(visit.respondedAt) : null;

      // Calculate response time in hours if responded
      let responseTimeHours = 'N/A';
      if (respDate) {
        const diffMs = respDate - reqDate;
        responseTimeHours = (diffMs / (1000 * 60 * 60)).toFixed(1);
      }

      return {
        'Visit ID': visit._id.toString(),
        'Status': visit.status ? visit.status.toUpperCase() : 'UNKNOWN',
        'Request Date': reqDate.toLocaleDateString(),
        'Request Time': reqDate.toLocaleTimeString(),
        'Scheduled Date': visit.date ? new Date(visit.date).toLocaleDateString() : 'N/A',
        'Scheduled Time': visit.time || 'N/A',
        'Room Title': room.title || 'Deleted Room',
        'Room City': room.location?.address?.city || 'N/A',
        'Rent Amount': room.rent?.amount || 0,
        'Student Name': student.name || 'Unknown',
        'Student Phone': student.phone || 'N/A',
        'Owner Name': owner.name || 'Unknown',
        'Owner Phone': owner.phone || 'N/A',
        'Owner Response': visit.ownerResponse || 'N/A',
        'Response Date': respDate ? respDate.toLocaleDateString() : 'Pending',
        'Response Turnaround (Hrs)': responseTimeHours
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    const colWidths = [
      { wch: 25 }, // ID
      { wch: 12 }, // Status
      { wch: 12 }, // Req Date
      { wch: 12 }, // Req Time
      { wch: 15 }, // Sch Date
      { wch: 10 }, // Sch Time
      { wch: 30 }, // Room Title
      { wch: 15 }, // City
      { wch: 10 }, // Rent
      { wch: 20 }, // Student
      { wch: 15 }, // Phone
      { wch: 20 }, // Owner
      { wch: 15 }, // Owner Phone
      { wch: 30 }, // Response
      { wch: 12 }, // Resp Date
      { wch: 15 }  // Turnaround
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Visit Reports');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Visits_Report_Comprehensive.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);
  } catch (error) {
    console.error('Download Visit Report Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
