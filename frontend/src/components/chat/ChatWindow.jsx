import { useState, useEffect, useRef } from 'react';
import { Send, Home, MapPin, DollarSign, MessageCircle, ArrowDown, Ban, Unlock } from 'lucide-react';
import { Link } from 'react-router-dom';
import MessageBubble from './MessageBubble';
import api from '../../utils/api';
import { getSocket } from '../../utils/socket';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/helpers';

const ChatWindow = ({ conversation, currentUserId, onConversationUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [amIBlocked, setAmIBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const socket = getSocket();

  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);

  /* =======================
     FETCH MESSAGES
  ======================= */
  useEffect(() => {
    if (conversation?.otherUser?._id) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [conversation?._id]);

  const fetchMessages = async () => {
    if (!conversation?.otherUser?._id) return;

    try {
      setFetching(true);
      const { data } = await api.get(
        `/chat/conversation/${conversation.otherUser._id}`
      );
      setMessages(data.data.messages || []);
      setIsBlocked(data.data.isBlocked);
      setAmIBlocked(data.data.amIBlocked);

      if (!conversation.room && data.data.messages?.length && onConversationUpdate) {
        onConversationUpdate();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load messages');
    } finally {
      setFetching(false);
    }
  };

  /* =======================
     SOCKET LISTENERS
  ======================= */
  useEffect(() => {
    if (!socket || !conversation?.otherUser?._id) return;

    const handleReceiveMessage = (message) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleReceiveMessage);
    };
  }, [socket, conversation?.otherUser?._id]);

  /* =======================
     SCROLL LOGIC (FIXED)
  ======================= */
  useEffect(() => {
    if (isUserNearBottom) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 40;

    setIsUserNearBottom(atBottom);
    setShowScrollToBottom(!atBottom);
  };

  /* =======================
     SEND MESSAGE
  ======================= */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation?.otherUser?._id) return;

    const text = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    try {
      const { data } = await api.post('/chat/send', {
        recipientId: conversation.otherUser._id,
        roomId: conversation.room?._id || null,
        content: text
      });

      setMessages((prev) => [...prev, data.data.message]);
      if (onConversationUpdate) onConversationUpdate();
      setIsUserNearBottom(true);
    } catch (error) {
      toast.error('Failed to send message');
      setNewMessage(text);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     TYPING INDICATOR
  ======================= */
  const handleTyping = (isTyping) => {
    if (!socket || !conversation?.otherUser?._id) return;

    clearTimeout(typingTimeoutRef.current);

    socket.emit(isTyping ? 'typing_start' : 'typing_stop', {
      recipientId: conversation.otherUser._id
    });

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', {
          recipientId: conversation.otherUser._id
        });
      }, 3000);
    }
  };

  const handleBlockUser = async () => {
    if (!window.confirm('Are you sure you want to block this user?')) return;

    setBlocking(true);
    try {
      const { data } = await api.post('/chat/block', { userId: conversation.otherUser._id });
      if (data.success) {
        setIsBlocked(true);
        toast.success('User blocked');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block user');
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblockUser = async () => {
    setBlocking(true);
    try {
      const { data } = await api.post('/chat/unblock', { userId: conversation.otherUser._id });
      if (data.success) {
        setIsBlocked(false);
        toast.success('User unblocked');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unblock user');
    } finally {
      setBlocking(false);
    }
  };

  /* =======================
     EMPTY STATES
  ======================= */
  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Select a conversation
      </div>
    );
  }

  /* =======================
     UI
  ======================= */
  return (
    <div className="flex flex-col h-full min-h-0 bg-white shadow-lg">

      {/* HEADER */}
      <div className="p-4 bg-[#075E54] flex-shrink-0 flex items-center shadow-md">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            {conversation.otherUser?.avatar?.url ? (
              <img src={conversation.otherUser.avatar.url} className="w-full h-full rounded-full object-cover" alt="" />
            ) : (
              <span className="text-white font-black">{(conversation.otherUser?.name || 'U')[0]}</span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-white leading-none mb-1">
              {conversation.otherUser?.name || 'User'}
            </h3>
            <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest opacity-80">Online Now</p>
          </div>
        </div>

        <div className="ml-auto flex items-center space-x-2">
          <button
            onClick={isBlocked ? handleUnblockUser : handleBlockUser}
            disabled={blocking}
            className={`p-2 rounded-full transition-all ${isBlocked
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            title={isBlocked ? 'Unblock User' : 'Block User'}
          >
            {isBlocked ? <Unlock size={18} /> : <Ban size={18} />}
          </button>
        </div>
      </div>

      {isBlocked && (
        <div className="bg-red-50 px-4 py-2 border-b border-red-100 flex items-center justify-center">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
            You have blocked this user
          </p>
        </div>
      )}

      {amIBlocked && (
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-center">
          <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
            You cannot reply to this conversation
          </p>
        </div>
      )}

      {conversation.room && (
        <div className="bg-white/95 backdrop-blur-md px-4 py-2 border-b flex-shrink-0 z-10 sticky top-0">
          <Link
            to={`/rooms/${conversation.room._id}`}
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <Home size={14} className="text-emerald-600" />
              <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                {conversation.room.title}
              </span>
            </div>
            <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              {formatCurrency(conversation.room.rent?.amount)}/mo
            </div>
          </Link>
        </div>
      )}

      {/* MESSAGES */}
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 min-h-0 overflow-y-auto p-6 space-y-2 relative bg-[#E5DDD5]"
        style={{
          backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
          backgroundBlendMode: 'overlay',
          backgroundSize: '400px'
        }}
      >
        {fetching && (
          <div className="text-center text-gray-400">Loading messages…</div>
        )}

        {!fetching && messages.length === 0 && (
          <div className="text-center text-gray-400">
            <MessageCircle size={40} className="mx-auto mb-2" />
            Start the conversation
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={msg.sender?._id === currentUserId}
          />
        ))}

        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            className="sticky bottom-4 ml-auto mr-2 bg-blue-600 text-white p-2 rounded-full shadow-lg"
          >
            <ArrowDown size={18} />
          </button>
        )}
      </div>

      {/* INPUT */}
      {!isBlocked && !amIBlocked ? (
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-gray-200 bg-white flex-shrink-0 shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping(!!e.target.value.trim());
              }}
              onBlur={() => handleTyping(false)}
              placeholder="Type a message…"
              className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-6 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-gray-500 font-medium italic">
            {isBlocked ? 'Unblock to resume conversation' : 'Messaging is unavailable'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
