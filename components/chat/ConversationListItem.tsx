
import React from 'react';
import { ChatConversation, User, ChatParticipantDetails } from '../../types';
import { UserCircleIcon } from '../Icons';

interface ConversationListItemProps {
  conversation: ChatConversation;
  currentUser: User;
  partnerDetails: ChatParticipantDetails;
  onClick: () => void;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({ conversation, currentUser, partnerDetails, onClick }) => {
  const lastMessageTimestamp = conversation.lastMessageTimestamp 
    ? new Date(conversation.lastMessageTimestamp)
    : null;
  
  let displayTime = '';
  if (lastMessageTimestamp) {
    const today = new Date();
    if (lastMessageTimestamp.toDateString() === today.toDateString()) {
      displayTime = lastMessageTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      displayTime = lastMessageTimestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  const unreadCount = conversation.unreadCountByUserId?.[currentUser.id] || 0;
  const lastMessagePrefix = conversation.lastMessageSenderId === currentUser.id ? "You: " : "";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center p-3 rounded-lg hover:bg-neutral-700/50 transition-colors text-left"
    >
      {partnerDetails.profilePictureUrl ? (
        <img src={partnerDetails.profilePictureUrl} alt={partnerDetails.username} className="w-10 h-10 rounded-full mr-3 object-cover" />
      ) : (
        <UserCircleIcon className="w-10 h-10 text-neutral-500 mr-3" />
      )}
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-center">
          <p className={`text-sm font-medium ${unreadCount > 0 ? 'text-red-400' : 'text-neutral-100'} truncate`}>
            {partnerDetails.username}
          </p>
          {displayTime && <p className={`text-xs ${unreadCount > 0 ? 'text-red-400' : 'text-neutral-500'} whitespace-nowrap`}>{displayTime}</p>}
        </div>
        <div className="flex justify-between items-center">
          <p className={`text-xs ${unreadCount > 0 ? 'text-neutral-200' : 'text-neutral-400'} truncate`}>
            {lastMessagePrefix}{conversation.lastMessagePreview || 'No messages yet.'}
          </p>
          {unreadCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ConversationListItem;
