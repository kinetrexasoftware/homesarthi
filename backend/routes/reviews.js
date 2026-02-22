import express from 'express';
import { Review } from '../models/Review.js';
import { Room } from '../models/Room.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('student'), async (req, res) => {
  try {
    const { roomId, rating, criteria, comment } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const review = await Review.findOneAndUpdate(
      { room: roomId, student: req.user._id },
      {
        room: roomId,
        owner: room.owner,
        student: req.user._id,
        rating,
        criteria: criteria || {
          cleanliness: req.body.cleanliness || 5,
          communication: req.body.communication || 5,
          accuracy: req.body.accuracy || 5,
          location: 5,
          value: 5
        },
        comment
      },
      { new: true, upsert: true, runValidators: true }
    );

    const reviews = await Review.find({ room: roomId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const ratingUpdate = {
      average: avgRating,
      count: reviews.length
    };

    await Room.updateOne(
      { _id: roomId },
      { rating: ratingUpdate }
    );

    res.status(201).json({ success: true, data: { review } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId || roomId === 'undefined' || roomId.length !== 24) {
      return res.status(400).json({ success: false, message: 'Invalid room ID' });
    }
    const reviews = await Review.find({ room: roomId })
      .populate('student', 'name avatar')
      .sort('-createdAt');

    res.json({ success: true, data: { reviews } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
