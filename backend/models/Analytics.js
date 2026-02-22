import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true
  },
  metrics: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    inquiries: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
    visitRequests: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 }
  },
  visitors: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: Date,
    source: String
  }]
}, { timestamps: true });

analyticsSchema.index({ room: 1, date: -1 });
analyticsSchema.index({ owner: 1, date: -1 });
export const Analytics = mongoose.model('Analytics', analyticsSchema);
