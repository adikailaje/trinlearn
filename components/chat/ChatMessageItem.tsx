
import React from 'react';
import { ChatMessage } from '../../types';
import { UserCircleIcon } from '../Icons';

interface ChatMessageItemProps {
  message: ChatMessage;
  currentUserId: string;
  partnerProfilePictureUrl?: string;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, currentUserId, partnerProfilePictureUrl }) => {
  const isSender = message.senderId === currentUserId;
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
      {!isSender && (
        partnerProfilePictureUrl ? (
          <img src={partnerProfilePictureUrl} alt="Partner" className="w-6 h-6 rounded-full object-cover self-start" />
        ) : (
          <UserCircleIcon className="w-6 h-6 text-neutral-500 self-start" />
        )
      )}
      <div 
        className={`max-w-[70%] p-2.5 rounded-xl shadow ${
          isSender 
            ? 'bg-red-600 text-white rounded-br-none' 
            : 'bg-neutral-700 text-neutral-100 rounded-bl-none'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className={`text-[10px] mt-1 ${isSender ? 'text-red-200 text-right' : 'text-neutral-400 text-left'}`}>
          {timestamp} {isSender && message.isRead && <span className="ml-1 opacity-75">(Read)</span>}
        </p>
      </div>
      {/* Placeholder for sender's PFP if desired, usually not shown for own messages for cleaner UI */}
    </div>
  );
};

export default ChatMessageItem;
