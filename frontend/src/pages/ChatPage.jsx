import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import api from '../utils/api';
import useAuthStore from '../store/useAuthStore';
import Loader from '../components/common/Loader';
import { getSocket } from '../utils/socket';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();

    if (location.state?.recipientId) {
      const { recipientId, roomId, recipientInfo } = location.state;
      handleStartConversation(recipientId, roomId, recipientInfo);
    }
  }, [location.state]);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on('receive_message', handleNewMessage);
      socket.on('message_sent', handleNewMessage);
      return () => {
        socket.off('receive_message');
        socket.off('message_sent');
      };
    }
  }, []);

  const handleNewMessage = (message) => {
    setConversations(prev => {
      const participantsId = message.conversation?.participants?.sort().join('_') || '';
      const roomId = message.conversation?.room?._id || message.conversation?.room;
      const conversationId = roomId ? `${participantsId}_${roomId}` : participantsId;

      const index = prev.findIndex(c => c._id === conversationId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          lastMessage: {
            content: message.content,
            sender: message.sender,
            createdAt: message.createdAt
          },
          updatedAt: message.createdAt
        };
        return [updated[index], ...updated.filter((_, i) => i !== index)];
      }
      return prev;
    });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/chat/conversations');
      setConversations(data.data.conversations || []);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async (recipientId, roomId, recipientInfo = null) => {
    const existing = conversations.find(c => c.otherUser?._id === recipientId);
    if (existing) {
      setSelectedConversation(existing);
      return;
    }

    const conversationId = roomId
      ? `${[user._id, recipientId].sort().join('_')}_${roomId}`
      : [user._id, recipientId].sort().join('_');

    const newConv = {
      _id: conversationId,
      otherUser: recipientInfo || { _id: recipientId, name: 'User' },
      room: roomId ? { _id: roomId } : null,
      lastMessage: null,
      unreadCount: 0,
      updatedAt: new Date()
    };

    setSelectedConversation(newConv);
    setConversations(prev => [newConv, ...prev]);
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="h-screen max-w-7xl mx-auto px-4 flex flex-col min-h-0">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-4xl font-bold flex items-center">
          <MessageCircle className="mr-3" />
          Messages
        </h1>
      </div>

      <div className="flex-1 min-h-0 border-2 border-gray-100 overflow-hidden">
        <div className="flex h-full min-h-0">
          <div className="w-1/3 border-r bg-white flex flex-col min-h-0">
            <ChatList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={setSelectedConversation}
              onRefresh={fetchConversations}
            />
          </div>

          <div className="flex-1 bg-white flex flex-col min-h-0">
            <ChatWindow
              conversation={selectedConversation}
              currentUserId={user?._id}
              onConversationUpdate={fetchConversations}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
