

import React, { useState, useEffect, useCallback } from 'react';
import { User, ChatConversation, Role } from '../types';
import { chatService } from '../services/chatService';
import { Loader } from '../components/Loader';
import { PlusCircleIcon, UserCircleIcon, ExclamationTriangleIcon } from '../components/Icons'; 
import ConversationListItem from '../components/chat/ConversationListItem';

interface ChatListPageProps {
  currentUser: User;
  onNavigateToConversation: (partner: User) => void;
}

const ChatListPage: React.FC<ChatListPageProps> = ({ currentUser, onNavigateToConversation }) => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [eligibleUsers, setEligibleUsers] = useState<User[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const convos = await chatService.getConversations(currentUser.id);
      setConversations(convos);
    } catch (e: any) {
      setError(e.message || "Could not load conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUser.id]);

  const fetchEligibleUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const users = await chatService.getUsersForChat(currentUser);
      setEligibleUsers(users);
    } catch (e: any) {
      setError(e.message || "Could not load users to chat with.");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchConversations();
    fetchEligibleUsers();
  }, [fetchConversations, fetchEligibleUsers]);
  
  // Listener for chatMessage events to refresh conversation list (e.g., for unread counts)
  useEffect(() => {
    const handleNewMessageEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.unreadCountUpdate || !customEvent.detail?.conversationId) {
        fetchConversations(); // Refresh if it's an unread count update or general new message
      } else {
         // If a specific conversation got a new message, update its preview
         const { conversationId } = customEvent.detail;
         const relevantConvo = conversations.find(c => c.id === conversationId);
         if(relevantConvo) fetchConversations(); // A bit broad, but ensures consistency
      }
    };
    document.addEventListener('chatMessage', handleNewMessageEvent);
    return () => document.removeEventListener('chatMessage', handleNewMessageEvent);
  }, [fetchConversations, conversations]);


  const handleStartNewChat = (partner: User) => {
    setShowNewChatModal(false);
    onNavigateToConversation(partner);
  };

  const getRoleDisplayName = (role: Role) => {
    switch(role) {
        case Role.SuperAdmin: return "Super Admin";
        case Role.Admin: return "Owner";
        case Role.Manager: return "Manager";
        case Role.User: return "Employee";
        default: return role;
    }
  };


  return (
    <div className="flex-grow p-4 md:p-6 space-y-6 bg-[#0D0D0D] text-neutral-200 pb-24">
      {/* Title is now handled by PageHeader via MainWrapper */}
      <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center px-3 py-2 rounded-md font-semibold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors"
            title="Start a new chat"
          >
            <PlusCircleIcon className="w-5 h-5 mr-1.5" /> New Chat
          </button>
      </div>


      {isLoadingConversations && (
        <div className="flex justify-center items-center py-10">
          <Loader size="md" /><p className="ml-3 text-neutral-400">Loading conversations...</p>
        </div>
      )}
      {error && (
        <div className="text-center py-6 text-red-400 bg-[#1A1A1A] p-4 rounded-lg border border-red-700">
          <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      )}
      {!isLoadingConversations && !error && conversations.length === 0 && (
        <div className="text-center py-10 bg-[#1A1A1A] rounded-lg shadow-xl border border-[#2C2C2C] p-6">
          
          <ExclamationTriangleIcon className="w-16 h-16 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-500 text-lg">No active conversations.</p>
          <p className="text-neutral-600 text-sm mt-2">Click "New Chat" to start a conversation.</p>
        </div>
      )}
      {!isLoadingConversations && !error && conversations.length > 0 && (
        <div className="space-y-3">
          {conversations.map(convo => {
            const partnerId = convo.participantIds.find(id => id !== currentUser.id);
            const partnerDetails = partnerId ? convo.participantDetails[partnerId] : null;
            if (!partnerDetails) return null; // Should not happen in valid conversation
            
            // Construct a User-like object for the partner for navigation
            const partnerUser: User = {
                id: partnerId!,
                username: partnerDetails.username,
                role: partnerDetails.role,
                profilePictureUrl: partnerDetails.profilePictureUrl
            };
            
            return (
                <ConversationListItem 
                    key={convo.id} 
                    conversation={convo} 
                    currentUser={currentUser}
                    partnerDetails={partnerDetails}
                    onClick={() => onNavigateToConversation(partnerUser)} 
                />
            );
           })}
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] p-5 sm:p-6 rounded-lg shadow-xl border border-[#2C2C2C] w-full max-w-md text-neutral-200 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#2C2C2C]">
              <h3 className="text-lg sm:text-xl font-semibold text-neutral-100">Start New Chat</h3>
              <button onClick={() => setShowNewChatModal(false)} className="p-1 text-neutral-500 hover:text-neutral-200 transition-colors rounded-full hover:bg-neutral-700/50 -mt-1 -mr-1">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {isLoadingUsers && <div className="flex justify-center py-5"><Loader size="sm" /> <span className="ml-2 text-neutral-400">Loading users...</span></div>}
            {!isLoadingUsers && eligibleUsers.length === 0 && <p className="text-neutral-500 italic text-center py-5">No users available to chat with based on your role.</p>}
            
            <div className="flex-grow overflow-y-auto space-y-2 pr-1">
              {eligibleUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleStartNewChat(user)}
                  className="w-full flex items-center p-2.5 rounded-md hover:bg-neutral-700/60 transition-colors text-left"
                >
                  {user.profilePictureUrl ? (
                    <img src={user.profilePictureUrl} alt={user.username} className="w-8 h-8 rounded-full mr-3 object-cover" />
                  ) : (
                    <UserCircleIcon className="w-8 h-8 text-neutral-500 mr-3" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-neutral-100">{user.username}</p>
                    <p className="text-xs text-neutral-500">{getRoleDisplayName(user.role)}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-[#2C2C2C] flex justify-end">
                <button onClick={() => setShowNewChatModal(false)} className="px-4 py-2 rounded-md text-sm font-medium text-neutral-300 bg-neutral-600 hover:bg-neutral-500 transition-colors">
                    Cancel
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatListPage;
