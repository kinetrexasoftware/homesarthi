import { useState, useEffect, useCallback, useRef } from 'react';
import { useChatStore } from '../store/useChatStore';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

export const useChat = () => {
  const {
    conversations,
    currentConversation,
    messages,
    onlineUsers,
    isTyping,
    setConversations,
    setCurrentConversation,
    setMessages,
    addMessage,
    setOnlineUsers,
    setTyping,
    clearChat
  } = useChatStore();

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (socketRef.current) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const socketURL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || window.location.origin;
    const newSocket = io(socketURL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    newSocket.on('receive_message', (messageData) => {
      addMessage(messageData);
      // Show notification if message is not from current user
      if (messageData.senderId !== currentConversation?.participants?.find(p => p._id !== messageData.senderId)?._id) {
        toast.success(`New message from ${messageData.senderName}`);
      }
    });

    newSocket.on('user_online', (userId) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    newSocket.on('user_offline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    newSocket.on('user_typing', (data) => {
      if (data.senderId !== currentConversation?.participants?.find(p => p._id !== data.senderId)?._id) {
        setTyping(data.senderId, data.isTyping);
      }
    });

    return newSocket;
  }, [addMessage, currentConversation, setOnlineUsers, setTyping]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/chat/conversations');
      const conversationsData = response.data.data;
      setConversations(conversationsData);
      return conversationsData;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    }
  }, [setConversations]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId, page = 1) => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
        params: { page, limit: 50 }
      });
      const messagesData = response.data.data;
      setMessages(conversationId, messagesData);
      return messagesData;
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  }, [setMessages]);

  // Send message
  const sendMessage = useCallback(async (recipientId, content, attachments = []) => {
    try {
      const messageData = {
        recipientId,
        content,
        attachments,
        timestamp: new Date().toISOString()
      };

      // Send via API
      const response = await api.post('/chat/messages', messageData);
      const newMessage = response.data.data;

      // Add to local state
      addMessage(newMessage);

      // Send via socket if connected
      if (socket && isConnected) {
        socket.emit('send_message', newMessage);
      }

      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  }, [addMessage, socket, isConnected]);

  // Start conversation
  const startConversation = useCallback(async (participantId, roomId = null) => {
    try {
      const response = await api.post('/chat/conversations', {
        participantId,
        roomId
      });
      const conversation = response.data.data;

      // Add to conversations list
      setConversations(prev => [conversation, ...prev.filter(c => c._id !== conversation._id)]);

      // Set as current conversation
      setCurrentConversation(conversation);

      // Fetch messages
      await fetchMessages(conversation._id);

      return conversation;
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
      throw error;
    }
  }, [setConversations, setCurrentConversation, fetchMessages]);

  // Set current conversation
  const selectConversation = useCallback(async (conversation) => {
    setCurrentConversation(conversation);
    if (conversation && conversation._id) {
      await fetchMessages(conversation._id);
    }
  }, [setCurrentConversation, fetchMessages]);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId) => {
    try {
      await api.put(`/chat/conversations/${conversationId}/read`);
      // Update local state to mark messages as read
      setMessages(conversationId, messages[conversationId]?.map(msg => ({
        ...msg,
        readBy: [...(msg.readBy || []), { user: 'currentUser', readAt: new Date() }]
      })) || []);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [messages, setMessages]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((recipientId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', {
        recipientId,
        senderId: currentConversation?.participants?.find(p => p._id !== recipientId)?._id,
        isTyping
      });
    }
  }, [socket, isConnected, currentConversation]);

  // Join user to socket room
  const joinUser = useCallback((userId) => {
    if (socket && isConnected) {
      socket.emit('user_online', userId);
    }
  }, [socket, isConnected]);

  // Search conversations
  const searchConversations = useCallback(async (query) => {
    try {
      const response = await api.get('/chat/conversations/search', {
        params: { q: query }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching conversations:', error);
      toast.error('Failed to search conversations');
    }
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      await api.delete(`/chat/conversations/${conversationId}`);
      setConversations(prev => prev.filter(c => c._id !== conversationId));
      if (currentConversation?._id === conversationId) {
        setCurrentConversation(null);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  }, [setConversations, setCurrentConversation, currentConversation]);

  // Initialize on mount
  useEffect(() => {
    const socket = initializeSocket();
    fetchConversations();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [initializeSocket, fetchConversations]);

  return {
    // State
    conversations,
    currentConversation,
    messages,
    onlineUsers,
    isTyping,
    isConnected,

    // Actions
    fetchConversations,
    fetchMessages,
    sendMessage,
    startConversation,
    selectConversation,
    markAsRead,
    sendTypingIndicator,
    joinUser,
    searchConversations,
    deleteConversation,
    clearChat
  };
};
