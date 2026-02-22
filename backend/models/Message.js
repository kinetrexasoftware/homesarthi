import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    }
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  attachments: [{
    type: String,
    url: String
  }]
}, { timestamps: true });

messageSchema.index({ 'conversation.participants': 1, createdAt: -1 });
export const Message = mongoose.model('Message', messageSchema);
