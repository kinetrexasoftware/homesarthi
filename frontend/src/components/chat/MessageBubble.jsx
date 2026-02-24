import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

const MessageBubble = ({ message, isOwn }) => {
  const isRead = message.readBy && message.readBy.some(r => r.user);
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex group ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-1 mb-2 px-2`}>
      <div className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] min-w-[80px] relative px-3 py-1.5 shadow-md ${isOwn
        ? 'bg-[#005c4b] rounded-lg rounded-tr-none'
        : 'bg-[#202c33] rounded-lg rounded-tl-none'
        }`}>

        <p className="text-[14.5px] leading-relaxed text-[#e9edef] break-words whitespace-pre-wrap pb-1 font-medium">
          {message.content}
        </p>

        <div className={`flex items-center justify-end gap-1 -mt-1`}>
          <span className="text-[10px] font-bold text-[#8696a0] uppercase tracking-tighter opacity-70">
            {time}
          </span>
          {isOwn && (
            <span className="flex-shrink-0">
              {isRead ? (
                <CheckCheck size={14} className="text-[#53bdeb]" strokeWidth={3} />
              ) : (
                <Check size={14} className="text-[#8696a0]" strokeWidth={3} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
