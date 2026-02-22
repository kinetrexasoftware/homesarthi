import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedDate: {
    type: Date,
    required: true
  },
  requestedTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'visited', 'rented', 'cancelled'],
    default: 'pending'
  },
  verificationMethod: {
    type: String,
    enum: ['gps', 'manual', 'otp'],
    default: 'manual'
  },
  notes: String,
  identityProof: {
    type: String, // URL from Cloudinary
    required: true
  },
  ownerResponse: String,
  respondedAt: Date
}, { timestamps: true });

visitSchema.index({ student: 1, status: 1 });
visitSchema.index({ owner: 1, status: 1 });
export const Visit = mongoose.model('Visit', visitSchema);
