// controllers/chatController.js
import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { Analytics } from '../models/Analytics.js';
import { Room } from '../models/Room.js';
import { createAndSendNotification } from '../services/notificationService.js';

export const sendMessage = async (req, res) => {
  try {
    const { recipientId, roomId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and message content are required'
      });
    }

    // Check if user is blocked or has blocked recipient
    const { User } = await import('../models/User.js');
    const sender = await User.findById(req.user._id);
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    if (sender.blockedUsers.includes(recipientId)) {
      return res.status(403).json({
        success: false,
        message: 'You have blocked this user'
      });
    }

    if (recipient.blockedUsers.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You have been blocked by this user'
      });
    }

    // Check if this is the first message in this conversation (inquiry)
    const existingMessages = await Message.countDocuments({
      'conversation.participants': {
        $all: [req.user._id.toString(), recipientId.toString()]
      },
      'conversation.room': roomId || null
    });

    const isFirstMessage = existingMessages === 0;

    // Create sorted participants array as ObjectIds for indexing/aggregation
    const participants = [
      new mongoose.Types.ObjectId(req.user._id),
      new mongoose.Types.ObjectId(recipientId)
    ].sort((a, b) => a.toString().localeCompare(b.toString()));

    const message = await Message.create({
      sender: req.user._id,
      content: content.trim(),
      conversation: {
        participants,
        room: roomId || null
      }
    });

    // Track inquiry if this is the first message and has a room
    if (isFirstMessage && roomId) {
      try {
        const room = await Room.findById(roomId);
        if (room) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          await Analytics.findOneAndUpdate(
            { room: roomId, date: today },
            {
              $inc: { 'metrics.inquiries': 1 },
              owner: room.owner
            },
            { upsert: true, setDefaultsOnInsert: true }
          );

          // Update room stats
          await Room.findByIdAndUpdate(roomId, {
            $inc: { 'stats.inquiries': 1 }
          });
        }
      } catch (analyticsError) {
        console.error('Error tracking inquiry:', analyticsError);
        // Don't fail the message send if analytics fails
      }
    }

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar email')
      .populate('conversation.room', 'title images');

    // Emit to recipient via socket
    if (global.io) {
      // Emit the message directly to the recipient's room
      global.io.to(recipientId).emit('receive_message', populatedMessage);

      // Also emit to sender for real-time update in their own UI
      global.io.to(req.user._id.toString()).emit('message_sent', populatedMessage);
    }

    // 🔥 Send Push Notification only to recipient
    if (recipientId.toString() !== req.user._id.toString()) {
      try {
        const messagePreview = content.length > 80
          ? content.substring(0, 77) + '...'
          : content;

        await createAndSendNotification(recipientId, {
          type: 'message',
          category: 'messages',
          title: req.user.name,
          body: messagePreview,
          data: {
            messageId: message._id,
            senderId: req.user._id, // This is the person who sent the message
            senderName: req.user.name,
            roomId: roomId || null
          },
          // Action URL should tell the app to open chat with the SENDER
          actionUrl: `homesarthi://chat/${req.user._id}`,
          priority: 'critical'
        });
      } catch (notifError) {
        console.error('Failed to send message notification:', notifError);
      }
    }

    res.status(201).json({
      success: true,
      data: { message: populatedMessage }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    // Ensure userId is valid ObjectId
    if (!userId || userId === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const messages = await Message.find({
      'conversation.participants': { $all: [req.user._id, userId] }
    })
      .populate('sender', 'name avatar email')
      .populate('conversation.room', 'title images rent location.address verification.status')
      .sort('createdAt');

    // Mark messages as read
    await Message.updateMany(
      {
        'conversation.participants': { $all: [req.user._id, userId] },
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      {
        $addToSet: {
          readBy: { user: req.user._id, readAt: new Date() }
        }
      }
    );

    // ✅ NEW: Mark corresponding notifications as read
    try {
      const { Notification } = await import('../models/Notification.js');
      await Notification.updateMany(
        {
          user: req.user._id,
          type: 'message',
          'data.senderId': userId.toString(),
          read: false
        },
        { $set: { read: true } }
      );
    } catch (nError) {
      console.error('Error marking notifications as read:', nError);
    }

    const { User } = await import('../models/User.js');
    const currentUser = await User.findById(req.user._id);
    const isBlocked = currentUser.blockedUsers.includes(userId);
    const otherUserObj = await User.findById(userId).select('blockedUsers');
    const amIBlocked = otherUserObj?.blockedUsers.includes(req.user._id);

    res.json({
      success: true,
      data: {
        messages,
        isBlocked,
        amIBlocked
      }
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString(); // string for participant matching

    const conversations = await Message.aggregate([
      {
        $match: {
          'conversation.participants': {
            $in: [
              new mongoose.Types.ObjectId(currentUserId),
              currentUserId
            ]
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            participants: '$conversation.participants',
            room: '$conversation.room'
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    // sender is stored as ObjectId, compare both ways
                    { $ne: [{ $toString: '$sender' }, currentUserId] },
                    // readBy.user is ObjectId array
                    { $not: { $in: [req.user._id, '$readBy.user'] } }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Populate and format conversations
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        await Message.populate(conv.lastMessage, [
          { path: 'sender', select: 'name avatar email' },
          {
            path: 'conversation.room',
            select: 'title images rent location.address verification.status'
          }
        ]);

        // Find the other participant (not the current user)
        const participants = conv._id?.participants || conv._id || [];
        const roomId = conv._id?.room || null;
        const otherUserId = Array.isArray(participants)
          ? participants.find((id) => id.toString() !== req.user._id.toString())
          : null;

        if (!otherUserId) {
          return null;
        }

        const { User } = await import('../models/User.js');
        const otherUser = await User.findById(otherUserId).select('name avatar email verified');

        // Create unique conversation ID that includes room
        const conversationId = roomId
          ? `${participants.sort().join('_')}_${roomId}`
          : participants.sort().join('_');

        return {
          _id: conversationId,
          otherUser: otherUser || { _id: otherUserId, name: 'Unknown User' },
          room: conv.lastMessage.conversation?.room || (roomId ? { _id: roomId } : null),
          lastMessage: {
            _id: conv.lastMessage._id,
            content: conv.lastMessage.content,
            sender: conv.lastMessage.sender,
            createdAt: conv.lastMessage.createdAt
          },
          unreadCount: conv.unreadCount || 0,
          updatedAt: conv.lastMessage.createdAt
        };
      })
    );

    // Filter out null conversations and sort by last message time
    const validConversations = formattedConversations
      .filter((conv) => conv !== null)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({
      success: true,
      data: { conversations: validConversations }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const { User } = await import('../models/User.js');
    const user = await User.findById(req.user._id);

    if (user.blockedUsers.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User already blocked' });
    }

    user.blockedUsers.push(userId);
    await user.save();

    res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const { User } = await import('../models/User.js');
    const user = await User.findById(req.user._id);

    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== userId.toString());
    await user.save();

    res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};