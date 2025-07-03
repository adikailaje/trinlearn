

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, ChatMessage, Role } from '../types';
import { chatService } from '../services/chatService';
import { Loader } from '../components/Loader';
import { ChevronLeftIcon, PaperAirplaneIcon, UserCircleIcon } from '../components/Icons';
import ChatMessageItem from '../components/chat/ChatMessageItem';

interface ChatConversationPageProps {
  currentUser: User;
  chatPartner: User;
  onNavigateBack: () => void;
}

const ChatConversationPage: React.FC<ChatConversationPageProps> = ({ currentUser, chatPartner, onNavigateBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationId = React.useMemo(() => {
    // Helper function to generate a consistent ID
    const ids = [currentUser.id, chatPartner.id].sort();
    return ids.join('_');
  }, [currentUser.id, chatPartner.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedMessages = await chatService.getMessages(conversationId, currentUser.id);
      setMessages(fetchedMessages);
    } catch (e: any) {
      setError(e.message || "Could not load messages.");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUser.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listener for new messages
  useEffect(() => {
    const handleNewMessageEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.conversationId === conversationId) {
        fetchMessages(); // Re-fetch messages for this conversation
      }
    };
    document.addEventListener('chatMessage', handleNewMessageEvent);
    return () => document.removeEventListener('chatMessage', handleNewMessageEvent);
  }, [conversationId, fetchMessages]);


  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessageContent.trim() || isSending) return;

    setIsSending(true);
    setError(null);
    try {
      await chatService.sendMessage(currentUser, chatPartner.id, newMessageContent.trim());
      setNewMessageContent('');
      // The event listener will handle re-fetching messages.
    } catch (e: any) {
      setError(e.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };
  
  const getRoleDisplayName = (role: User['role']) => {
    switch(role) {
        case Role.SuperAdmin: return "Super Admin";
        case Role.Admin: return "Owner";
        case Role.Manager: return "Manager";
        case Role.User: return "Employee";
        default: return role;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0D0D] text-neutral-200">
      {/* Header is now handled by PageHeader via MainWrapper */}
      <main className="flex-grow container mx-auto p-3 sm:p-4 flex flex-col overflow-hidden">
       <div className="mb-4 flex items-center justify-start">
            <button
                onClick={onNavigateBack}
                className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors p-2 rounded-md hover:bg-neutral-700/50 -ml-2"
                aria-label="Back to Chat List"
            >
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Back
            </button>
        </div>
        <div className="flex-grow overflow-y-auto space-y-3 pr-1 mb-3">
          {isLoading && <div className="flex justify-center py-10"><Loader size="md" /><p className="ml-2 text-neutral-400">Loading messages...</p></div>}
          {!isLoading && error && <p className="text-center text-red-400 py-5">Error: {error}</p>}
          {!isLoading && !error && messages.length === 0 && <p className="text-center text-neutral-500 py-10 italic">No messages yet. Start the conversation!</p>}
          
          {messages.map(msg => (
            <ChatMessageItem key={msg.id} message={msg} currentUserId={currentUser.id} partnerProfilePictureUrl={chatPartner.profilePictureUrl} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="mt-auto p-1 sm:p-2 bg-[#1A1A1A] border-t border-[#2C2C2C] sticky bottom-0">
          <div className="flex items-center gap-2">
            <textarea
              value={newMessageContent}
              onChange={(e) => setNewMessageContent(e.target.value)}
              placeholder="Type a message..."
              rows={1}
              className="flex-grow p-2.5 rounded-lg bg-[#252525] border border-[#383838] text-neutral-100 placeholder-neutral-500 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              type="submit"
              disabled={isSending || !newMessageContent.trim()}
              className="p-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              title="Send Message"
            >
              {isSending ? <Loader size="sm" className="w-5 h-5" /> : <PaperAirplaneIcon className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ChatConversationPage;
