import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, RefreshCw, Home } from 'lucide-react';

const ChatList = ({ conversations, selectedConversation, onSelectConversation, onRefresh }) => {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
        <MessageCircle size={48} className="mb-4" />
        <p className="text-center">No conversations yet</p>
        <p className="text-sm text-center mt-2">Start chatting from a room listing!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header with refresh */}
      {onRefresh && (
        <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white flex justify-between items-center shadow-sm flex-shrink-0">
          <h3 className="font-bold text-gray-800 text-lg">Conversations</h3>
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-blue-100 rounded-full transition-all hover:rotate-180 duration-500"
            title="Refresh conversations"
          >
            <RefreshCw size={18} className="text-blue-600" />
          </button>
        </div>
      )}
      
      {/* Conversations List */}
      <div className="overflow-y-auto flex-1 custom-scrollbar bg-white/30 min-h-0">
        {conversations.map((conv) => {
          const otherUser = conv.otherUser || conv.lastMessage?.sender;
          const isSelected = selectedConversation?._id === conv._id;
          const lastMessage = conv.lastMessage;
          
          if (!otherUser) return null;
          
          return (
            <div
              key={conv._id || conv._id}
              onClick={() => onSelectConversation(conv)}
              className={`p-3 border-b cursor-pointer transition-all duration-150 flex items-center gap-3 ${
                isSelected
                  ? 'bg-white shadow-sm border-l-4 border-l-blue-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              {otherUser.avatar?.url ? (
                <img
                  src={otherUser.avatar.url}
                  alt={otherUser.name || 'User'}
                  className={`w-12 h-12 rounded-full object-cover flex-shrink-0 ${isSelected ? 'ring-2 ring-blue-100' : 'ring-1 ring-gray-100'}`}
                />
              ) : (
                <div className={`w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${isSelected ? 'ring-2 ring-blue-100' : 'ring-1 ring-gray-100'}`}>
                  {(otherUser.name || 'U')[0].toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {otherUser.name || 'Unknown User'}
                  </h4>
                  {lastMessage?.createdAt && (
                    <span className="text-xs text-gray-400 ml-2">
                      {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  {conv.room && (
                    <div className="flex items-center space-x-1 text-xs text-blue-600">
                      <Home size={12} />
                      <span className="truncate font-medium text-sm">
                        {conv.room.title || 'Room Listing'}
                      </span>
                    </div>
                  )}
                </div>

                {lastMessage?.content && (
                  <p className="text-sm text-gray-600 truncate mt-2">
                    {lastMessage.content}
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  {conv.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2.5 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold rounded-full shadow-sm min-w-[24px]">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
