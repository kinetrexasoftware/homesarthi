import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

const MessageBubble = ({ message, isOwn }) => {
  const isRead = message.readBy && message.readBy.some(r => r.user);
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex group ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-1 mb-3 px-2`}>
      <div className={`max-w-[85%] sm:max-w-[70%] lg:max-w-[60%] min-w-[80px] relative px-3 py-2 ${isOwn
          ? 'bg-[#E7FFDB] rounded-2xl rounded-tr-none shadow-sm'
          : 'bg-white rounded-2xl rounded-tl-none shadow-sm border border-gray-100'
        }`}>
        {/* Tail (Simulated via rounded corners, but could use pseudo-elements for more realism) */}

        <p className="text-[14.5px] leading-[1.4] text-gray-800 break-words whitespace-pre-wrap pb-1">
          {message.content}
        </p>

        <div className={`flex items-center justify-end gap-1`}>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            {time}
          </span>
          {isOwn && (
            <span className="flex-shrink-0">
              {isRead ? (
                <CheckCheck size={12} className="text-blue-500" strokeWidth={3} />
              ) : (
                <Check size={12} className="text-gray-400" strokeWidth={3} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
