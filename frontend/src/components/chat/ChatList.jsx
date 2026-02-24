import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { MessageCircle, RefreshCw, Home, Search, MoreVertical, Filter, MessageSquare } from 'lucide-react';

const ChatList = ({ conversations, selectedConversation, onSelectConversation, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations?.filter(conv => {
    const otherUser = conv.otherUser || conv.lastMessage?.sender;
    const name = otherUser?.name?.toLowerCase() || '';
    const lastMsg = conv.lastMessage?.content?.toLowerCase() || '';
    const roomTitle = conv.room?.title?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    return name.includes(query) || lastMsg.includes(query) || roomTitle.includes(query);
  }) || [];
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 bg-[#111b21]">
        <div className="w-24 h-24 bg-[#202c33] rounded-full flex items-center justify-center mb-6">
          <MessageCircle size={40} className="text-[#00a884]" />
        </div>
        <h3 className="text-gray-200 text-xl font-medium mb-2">No chats yet</h3>
        <p className="text-center text-sm font-bold opacity-60">Start chatting from a room listing to see your messages here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#111b21]">
      {/* WhatsApp Header */}
      <div className="px-4 py-3 bg-[#202c33] flex justify-between items-center flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#374248] flex items-center justify-center text-[#aebac1]">
          <MessageSquare size={22} className="fill-[#00a884] text-[#00a884]" />
        </div>
        <div className="flex items-center gap-6 text-[#aebac1]">
          <MessageCircle size={20} className="cursor-pointer" />
          <MoreVertical size={20} className="cursor-pointer" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-2 bg-[#111b21] flex-shrink-0">
        <div className="bg-[#202c33] rounded-lg flex items-center px-4 py-1.5 gap-4 shadow-sm border border-transparent focus-within:border-[#00a884] transition-all">
          <Search size={18} className="text-[#aebac1]" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-[#d1d7db] text-sm w-full placeholder:text-[#8696a0]"
          />
          <Filter size={18} className="text-[#aebac1] cursor-pointer hover:text-[#00a884]" />
        </div>
      </div>

      {/* Conversations List */}
      <div className="overflow-y-auto flex-1 custom-scrollbar bg-[#111b21] min-h-0 pt-2">
        {filteredConversations.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-20 text-[#8696a0]">
            <Search size={40} className="mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">No results found</p>
          </div>
        )}
        {filteredConversations.map((conv) => {
          const otherUser = conv.otherUser || conv.lastMessage?.sender;
          const isSelected = selectedConversation?._id === conv._id;
          const lastMessage = conv.lastMessage;

          if (!otherUser) return null;

          return (
            <div
              key={conv._id}
              onClick={() => onSelectConversation(conv)}
              className={`flex items-center gap-3 px-4 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 group relative ${isSelected ? 'bg-[#2a3942] shadow-md' : 'hover:bg-[#202c33]'
                }`}
            >
              <div className="py-2.5 flex-shrink-0">
                {otherUser.avatar?.url ? (
                  <img
                    src={otherUser.avatar.url}
                    alt={otherUser.name}
                    className="w-12 h-12 rounded-full object-cover border border-[#222d34]"
                  />
                ) : (
                  <div className="w-12 h-12 bg-[#6a7175] rounded-full flex items-center justify-center text-white font-bold text-xl uppercase border border-[#222d34]">
                    {(otherUser.name || 'U')[0]}
                  </div>
                )}
              </div>

              <div className={`flex-1 min-w-0 py-3 border-b border-[#222d34] group-last:border-none flex flex-col justify-center h-full`}>
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium text-[#d1d7db] truncate text-base">
                    {otherUser.name || 'Unknown User'}
                  </h4>
                  {lastMessage?.createdAt && (
                    <span className={`text-[11px] font-bold ${conv.unreadCount > 0 ? 'text-[#00a884]' : 'text-[#8696a0]'} ml-auto`}>
                      {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false }).replace('about ', '')}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <div className="flex items-center gap-1 min-w-0">
                    {lastMessage?.content ? (
                      <p className={`text-sm truncate font-bold ${conv.unreadCount > 0 ? 'text-[#e9edef]' : 'text-[#8696a0]'}`}>
                        {lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-xs text-[#8696a0] italic font-bold">New conversation started</p>
                    )}
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="flex-shrink-0 bg-[#00a884] text-[#111b21] text-[11px] font-black min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 ml-2">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>

                {conv.room && (
                  <div className="flex items-center gap-1 text-[10px] text-[#00a884] font-black mt-1 uppercase tracking-tighter opacity-80">
                    <Home size={10} />
                    <span className="truncate max-w-[150px]">{conv.room.title}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
