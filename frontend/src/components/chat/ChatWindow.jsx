import { useState, useEffect, useRef } from 'react';
import { Send, Home, MapPin, DollarSign, MessageCircle, ArrowDown, Ban, Unlock, ArrowLeft, Phone, Video, MoreVertical, Smile, Paperclip } from 'lucide-react';
import { Link } from 'react-router-dom';
import MessageBubble from './MessageBubble';
import api from '../../utils/api';
import { getSocket } from '../../utils/socket';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/helpers';

const ChatWindow = ({ conversation, currentUserId, onConversationUpdate, onBack }) => {
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
     SCROLL LOGIC
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
      <div className="flex flex-col items-center justify-center h-full bg-[#222d34] text-[#8696a0] p-12 text-center">
        <div className="w-32 h-32 bg-[#202c33] rounded-full flex items-center justify-center mb-8">
          <MessageCircle size={64} className="text-[#00a884] opacity-20" />
        </div>
        <h2 className="text-gray-200 text-3xl font-light mb-4">WhatsApp for HomeSarthi</h2>
        <p className="text-sm font-bold opacity-60 max-w-sm">Select a conversation to start messaging. Your messages are end-to-end encrypted.</p>
      </div>
    );
  }

  /* =======================
     UI
  ======================= */
  return (
    <div className="flex flex-col h-full min-h-0 bg-[#0b141a]">

      {/* WHATSAPP HEADER */}
      <div className="px-4 py-2 bg-[#202c33] flex-shrink-0 flex items-center justify-between shadow-md z-20">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="md:hidden text-[#aebac1] mr-1">
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
            {conversation.otherUser?.avatar?.url ? (
              <img src={conversation.otherUser.avatar.url} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold bg-[#6a7175]">
                {(conversation.otherUser?.name || 'U')[0]}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-[#d1d7db] truncate text-base leading-none mb-1">
              {conversation.otherUser?.name || 'User'}
            </h3>
            <p className="text-[11px] text-[#00a884] font-black">online</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-[#aebac1]">
          <Video size={20} className="hidden sm:block cursor-pointer" />
          <Phone size={18} className="hidden sm:block cursor-pointer" />
          <MoreVertical size={20} className="cursor-pointer" />
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
        <div className="bg-[#182229] px-4 py-2 border-b border-[#222d34] flex-shrink-0 z-10 transition-colors hover:bg-[#202c33]">
          <Link
            to={`/rooms/${conversation.room._id}`}
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <Home size={14} className="text-[#00a884]" />
              <span className="text-xs font-bold text-[#d1d7db] group-hover:text-[#00a884] transition-colors truncate max-w-[200px]">
                {conversation.room.title}
              </span>
            </div>
            <div className="text-[11px] font-black text-[#00a884] bg-[#00a884]/10 px-2 py-0.5 rounded-md">
              {formatCurrency(conversation.room.rent)}/mo
            </div>
          </Link>
        </div>
      )}

      {/* MESSAGES AREA */}
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 relative"
        style={{
          backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
          backgroundBlendMode: 'overlay',
          backgroundColor: '#0b141a',
          backgroundSize: '400px',
          opacity: 0.95
        }}
      >
        {fetching && (
          <div className="text-center py-4">
            <div className="inline-block w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!fetching && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-20">
            <MessageCircle size={80} className="text-[#00a884] mb-4" />
            <p className="text-[#d1d7db] font-bold uppercase tracking-widest text-sm">Safe Messaging Enabled</p>
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
            className="absolute bottom-6 right-6 bg-[#202c33] text-[#aebac1] p-2 rounded-full shadow-lg hover:bg-[#2a3942] z-30"
          >
            <ArrowDown size={20} />
          </button>
        )}
      </div>

      {/* WHATSAPP INPUT AREA */}
      {!isBlocked && !amIBlocked ? (
        <form
          onSubmit={handleSendMessage}
          className="p-2 bg-[#202c33] flex-shrink-0 z-20"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#2a3942] rounded-lg flex items-center px-3 py-1 gap-3">
              <Smile size={24} className="text-[#8696a0] cursor-pointer" />
              <Paperclip size={22} className="text-[#8696a0] cursor-pointer" />
              <input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping(!!e.target.value.trim());
                }}
                onBlur={() => handleTyping(false)}
                placeholder="Type a message"
                className="flex-1 bg-transparent border-none focus:outline-none text-[#d1d7db] text-base py-2 placeholder:text-[#8696a0]"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="bg-[#00a884] text-[#111b21] w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex-shrink-0 shadow-lg"
            >
              <Send size={22} className="ml-0.5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-[#182229] border-t border-[#222d34] text-center">
          <p className="text-[#8696a0] font-bold text-sm italic">
            {isBlocked ? 'You have blocked this contact' : 'This conversation is read-only'}
          </p>
          {isBlocked && (
            <button
              onClick={handleUnblockUser}
              className="mt-2 text-[#00a884] font-black uppercase text-[11px] tracking-widest hover:underline"
            >
              Unblock now
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
