import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  // Detailed criteria (Flipkart/Meesho style for rooms)
  criteria: {
    cleanliness: { type: Number, default: 5, min: 1, max: 5 },
    communication: { type: Number, default: 5, min: 1, max: 5 },
    accuracy: { type: Number, default: 5, min: 1, max: 5 },
    location: { type: Number, default: 5, min: 1, max: 5 },
    value: { type: Number, default: 5, min: 1, max: 5 }
  },
  comment: {
    type: String,
    maxlength: 1000
  },
  images: [{
    url: String,
    publicId: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  helpful: {
    count: { type: Number, default: 0 },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }
}, { timestamps: true });

reviewSchema.index({ room: 1, student: 1 }, { unique: true });
export const Review = mongoose.model('Review', reviewSchema);
