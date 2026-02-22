import express from 'express';
import { Visit } from '../models/Visit.js';
import { Analytics } from '../models/Analytics.js';
import { Room } from '../models/Room.js';
import { protect, authorize } from '../middleware/auth.js';
import { createAndSendNotification } from '../services/notificationService.js';
import upload from '../middleware/upload.js';
import uploadOnCloudinary from '../config/cloudinary.js';

const router = express.Router();

router.post('/', protect, authorize('student'), upload.single('identityProof'), async (req, res) => {
  try {
    const { roomId, ownerId, requestedDate, requestedTime, notes } = req.body;

    // Check if student already has a pending or approved request for this room
    const existingVisit = await Visit.findOne({
      room: roomId,
      student: req.user._id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingVisit) {
      if (req.file) {
        // Optional: Clean up the uploaded file if we reject
        // fs.unlinkSync(req.file.path); 
      }
      return res.status(400).json({
        success: false,
        message: 'You already have a pending or approved visit request for this room.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Identity proof (Aadhar/College ID) is required' });
    }

    const uploadResult = await uploadOnCloudinary(req.file.path, 'visit_ids');
    if (!uploadResult) {
      return res.status(500).json({ success: false, message: 'Failed to upload identity proof' });
    }

    const visit = await Visit.create({
      room: roomId,
      student: req.user._id,
      owner: ownerId,
      requestedDate,
      requestedTime,
      notes,
      identityProof: uploadResult.secure_url
    });

    // 🔔 Notify owner about new visit request
    const roomDetails = await Room.findById(roomId).select('title');
    await createAndSendNotification(ownerId, {
      type: 'visit_request',
      category: 'visits',
      title: '👥 New Visit Request',
      body: `${req.user.name} wants to visit ${roomDetails?.title || 'your room'}`,
      data: {
        visitId: visit._id,
        studentId: req.user._id,
        studentName: req.user.name,
        roomId,
        roomTitle: roomDetails?.title
      },
      actionUrl: `roomsarthi://visit/${visit._id}`,
      priority: 'normal'
    });

    // Track visit request in analytics
    try {
      const room = await Room.findById(roomId);
      if (room) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await Analytics.findOneAndUpdate(
          { room: roomId, date: today },
          {
            $inc: { 'metrics.visitRequests': 1 },
            owner: room.owner
          },
          { upsert: true, setDefaultsOnInsert: true }
        );

        // Update room stats
        await Room.findByIdAndUpdate(roomId, {
          $inc: { 'stats.visitRequests': 1 }
        });
      }
    } catch (analyticsError) {
      console.error('Error tracking visit request:', analyticsError);
      // Don't fail the visit creation if analytics fails
    }

    res.status(201).json({ success: true, data: { visit } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/my-visits', protect, async (req, res) => {
  try {
    const query = req.user.role === 'student'
      ? { student: req.user._id }
      : req.user.role === 'owner'
        ? { owner: req.user._id }
        : {}; // Admin sees all

    const visits = await Visit.find(query)
      .populate('room', 'title images location contactNumber')
      .populate('student', 'name email phone')
      .populate('owner', 'name email phone')
      .sort('-createdAt');

    res.json({ success: true, data: { visits } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Alias for owners to fetch their visit requests
router.get('/owner-visits', protect, authorize('owner', 'admin'), async (req, res) => {
  try {
    const visits = await Visit.find({ owner: req.user._id })
      .populate('room', 'title images location contactNumber')
      .populate('student', 'name email phone')
      .populate('owner', 'name email phone')
      .sort('-createdAt');

    res.json({ success: true, data: { visits } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/respond', protect, authorize('owner', 'admin'), async (req, res) => {
  try {
    const { status, response } = req.body;

    const visit = await Visit.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      {
        status,
        ownerResponse: response,
        respondedAt: new Date()
      },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    res.json({ success: true, data: { visit } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Convenience endpoints used by frontend
router.put('/:id/approve', protect, authorize('owner', 'admin'), async (req, res) => {
  try {
    const visit = await Visit.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      {
        status: 'approved',
        ownerResponse: req.body.responseMessage || 'Your visit request has been approved!',
        respondedAt: new Date()
      },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    // 🎉 Notify student about visit approval
    await createAndSendNotification(visit.student, {
      type: 'visit_approved',
      category: 'visits',
      title: '✅ Visit Approved!',
      body: req.body.responseMessage || 'Your visit request has been approved!',
      data: {
        visitId: visit._id,
        roomId: visit.room,
        ownerId: req.user._id
      },
      actionUrl: `roomsarthi://visit/${visit._id}`,
      priority: 'critical'
    });

    res.json({ success: true, data: { visit } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/reject', protect, authorize('owner', 'admin'), async (req, res) => {
  try {
    const visit = await Visit.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      {
        status: 'rejected',
        ownerResponse: req.body.responseMessage || 'Your visit request has been rejected.',
        respondedAt: new Date()
      },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    // ❌ Notify student about visit rejection
    await createAndSendNotification(visit.student, {
      type: 'visit_rejected',
      category: 'visits',
      title: '❌ Visit Request Rejected',
      body: req.body.responseMessage || 'Your visit request has been rejected.',
      data: {
        visitId: visit._id,
        roomId: visit.room,
        ownerId: req.user._id,
        reason: req.body.responseMessage
      },
      actionUrl: `roomsarthi://visit/${visit._id}`,
      priority: 'normal'
    });

    res.json({ success: true, data: { visit } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/complete', protect, authorize('owner', 'student', 'admin'), async (req, res) => {
  try {
    const visit = await Visit.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    res.json({ success: true, data: { visit } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/mark-visited', protect, authorize('student'), async (req, res) => {
  try {
    const { verificationMethod = 'manual' } = req.body;

    const visit = await Visit.findOneAndUpdate(
      { _id: req.params.id, student: req.user._id, status: 'approved' },
      {
        status: 'visited',
        verificationMethod,
        notes: req.body.notes // Optional notes from student
      },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Approved visit not found or already processed' });
    }

    // Notify owner
    await createAndSendNotification(visit.owner, {
      type: 'visit_completed',
      category: 'visits',
      title: '📍 Visit Confirmed',
      body: `${req.user.name} has visited your property.`,
      data: { visitId: visit._id },
    });

    res.json({ success: true, data: { visit } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/mark-rented', protect, authorize('owner', 'admin'), async (req, res) => {
  try {
    // 1. Mark this specific visit as 'rented'
    const visit = await Visit.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id }, // Only owner can mark rented
      { status: 'rented' },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit request not found' });
    }

    // 2. Mark Room as Unavailable (Occupied)
    const roomId = visit.room;
    await Room.findByIdAndUpdate(roomId, {
      'availability.status': 'occupied',
      isActive: false
    });

    // 3. Find OTHER pending/approved visits for this room
    const otherVisits = await Visit.find({
      room: roomId,
      _id: { $ne: visit._id }, // Exclude the rented visit
      status: { $in: ['pending', 'approved', 'visited'] } // Reject all active flows
    });

    // 4. Reject other visits and Notify Students
    if (otherVisits.length > 0) {
      const otherVisitIds = otherVisits.map(v => v._id);

      // Bulk update status to rejected
      await Visit.updateMany(
        { _id: { $in: otherVisitIds } },
        {
          status: 'rejected',
          ownerResponse: 'Room has been rented to another student.',
          respondedAt: new Date()
        }
      );

      // Send notifications to rejected students
      // We can do this in a loop or bulk push. Ideally notificationService handles arrays, 
      // but for now let's loop to reuse createAndSendNotification logic safely.
      // Or use Promise.all for speed.
      const notificationPromises = otherVisits.map(v =>
        createAndSendNotification(v.student, {
          type: 'visit_rejected',
          category: 'visits',
          title: '🏠 Room Rented Out',
          body: 'This room has been rented to someone else. Better luck next time!',
          data: {
            visitId: v._id,
            roomId: roomId,
            reason: 'Room marked as occupied'
          },
          actionUrl: `roomsarthi://visit/${v._id}`,
          priority: 'normal'
        })
      );

      await Promise.allSettled(notificationPromises);
    }

    // 5. Analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await Analytics.findOneAndUpdate(
      { room: visit.room, date: today },
      { $inc: { 'metrics.bookings': 1 } },
      { upsert: true }
    );

    res.json({
      success: true,
      data: {
        visit,
        rejectedCount: otherVisits.length,
        message: `Marked as rented. ${otherVisits.length} other requests were auto-rejected.`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;