import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    enum: ['room', 'user', 'review', 'chat'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  reason: {
    type: String,
    enum: [
      'misleading_location',
      'privacy_violation',
      'unsafe_area',
      'scam_fraud',
      'inappropriate_behavior',
      'incorrect_info',
      'other'
    ],
    required: true
  },
  description: {
    type: String,
    required: true,
    minlength: [20, 'Description must be at least 20 characters for serious reports'],
    maxlength: 1000
  },
  evidence: [{
    url: String,
    publicId: String
  }],
  weight: {
    type: Number,
    default: 1.0
  },
  status: {
    type: String,
    enum: ['pending', 'flagged', 'investigating', 'resolved', 'dismissed', 'rejected'],
    default: 'pending'
  },
  adminNotes: String,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date
}, { timestamps: true });

// Prevent duplicate reports from same user on same target
reportSchema.index({ reportedBy: 1, targetId: 1, reportType: 1 }, { unique: true });
reportSchema.index({ status: 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);
