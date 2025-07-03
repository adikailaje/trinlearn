
import { User, Role, ChatMessage, ChatConversation, ChatParticipantDetails } from '../types';
import { authService } from './authService'; // To get user list and details

const CHAT_CONVERSATIONS_KEY = 'trin_chat_conversations';
const CHAT_MESSAGES_KEY_PREFIX = 'trin_chat_messages_';

// Helper to simulate async operations
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateConversationId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

// Role-based communication rules
const canChatWith = (currentUserRole: Role, targetUserRole: Role): boolean => {
  switch (currentUserRole) {
    case Role.SuperAdmin:
      return [Role.Admin, Role.Manager].includes(targetUserRole);
    case Role.Admin: // Owner
      return [Role.Manager, Role.SuperAdmin].includes(targetUserRole);
    case Role.Manager:
      return [Role.User, Role.Admin, Role.SuperAdmin].includes(targetUserRole);
    case Role.User: // Employee
      return targetUserRole === Role.Manager;
    default:
      return false;
  }
};

export const chatService = {
  getUsersForChat: async (currentUser: User): Promise<User[]> => {
    await simulateDelay(100);
    const allUsersRaw = await authService.getAllUsersRaw(); // This returns Omit<User, 'profilePictureUrl'>[]
    
    // Need to enrich with PFP for display in chat UI
    const allUsersWithPfp: User[] = await Promise.all(
      allUsersRaw.map(async (rawUser) => {
        const pfp = localStorage.getItem(`user_pfp_${rawUser.id}`);
        return { ...rawUser, profilePictureUrl: pfp || undefined };
      })
    );

    return allUsersWithPfp.filter(user => 
      user.id !== currentUser.id && canChatWith(currentUser.role, user.role)
    ).sort((a, b) => a.username.localeCompare(b.username));
  },

  getConversations: async (currentUserId: string): Promise<ChatConversation[]> => {
    await simulateDelay(150);
    const conversationsJson = localStorage.getItem(CHAT_CONVERSATIONS_KEY);
    const allConversations: ChatConversation[] = conversationsJson ? JSON.parse(conversationsJson) : [];
    
    return allConversations
      .filter(convo => convo.participantIds.includes(currentUserId))
      .map(convo => ({ // Ensure unreadCount is initialized for current user
        ...convo,
        unreadCountByUserId: {
          ...convo.unreadCountByUserId,
          [currentUserId]: convo.unreadCountByUserId?.[currentUserId] || 0,
        }
      }))
      .sort((a, b) => 
        new Date(b.lastMessageTimestamp || 0).getTime() - new Date(a.lastMessageTimestamp || 0).getTime()
      );
  },

  getMessages: async (conversationId: string, currentUserId: string): Promise<ChatMessage[]> => {
    await simulateDelay(100);
    const messagesKey = `${CHAT_MESSAGES_KEY_PREFIX}${conversationId}`;
    const messagesJson = localStorage.getItem(messagesKey);
    const messages: ChatMessage[] = messagesJson ? JSON.parse(messagesJson) : [];

    // Mark messages as read for the current user if they are the receiver
    let updated = false;
    const updatedMessages = messages.map(msg => {
      if (msg.receiverId === currentUserId && !msg.isRead) {
        updated = true;
        return { ...msg, isRead: true };
      }
      return msg;
    });

    if (updated) {
      localStorage.setItem(messagesKey, JSON.stringify(updatedMessages));
      // Also update unread count in conversation
      await chatService.markConversationAsRead(conversationId, currentUserId);
      // Dispatch an event so ChatListPage can update unread counts
      document.dispatchEvent(new CustomEvent('chatMessage', { detail: { conversationId, unreadCountUpdate: true } }));
    }
    
    return updatedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  sendMessage: async (sender: User, receiverId: string, content: string): Promise<ChatMessage> => {
    await simulateDelay(50);
    const conversationId = generateConversationId(sender.id, receiverId);
    const messagesKey = `${CHAT_MESSAGES_KEY_PREFIX}${conversationId}`;
    
    const messagesJson = localStorage.getItem(messagesKey);
    const messages: ChatMessage[] = messagesJson ? JSON.parse(messagesJson) : [];

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      conversationId,
      senderId: sender.id,
      senderUsername: sender.username,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    messages.push(newMessage);
    localStorage.setItem(messagesKey, JSON.stringify(messages));

    // Update or create conversation
    const conversationsJson = localStorage.getItem(CHAT_CONVERSATIONS_KEY);
    let conversations: ChatConversation[] = conversationsJson ? JSON.parse(conversationsJson) : [];
    let conversation = conversations.find(c => c.id === conversationId);

    if (!conversation) {
      const receiverRaw = (await authService.getAllUsersRaw()).find(u => u.id === receiverId);
      if (!receiverRaw) throw new Error("Receiver not found for new conversation.");
      
      const receiverPfp = localStorage.getItem(`user_pfp_${receiverId}`);
      const senderPfp = localStorage.getItem(`user_pfp_${sender.id}`);

      const participantDetails: { [userId: string]: ChatParticipantDetails } = {
        [sender.id]: { username: sender.username, role: sender.role, profilePictureUrl: senderPfp || undefined },
        [receiverId]: { username: receiverRaw.username, role: receiverRaw.role, profilePictureUrl: receiverPfp || undefined },
      };

      conversation = {
        id: conversationId,
        participantIds: [sender.id, receiverId],
        participantDetails,
        lastMessagePreview: content,
        lastMessageTimestamp: newMessage.timestamp,
        lastMessageSenderId: sender.id,
        unreadCountByUserId: { [receiverId]: 1, [sender.id]: 0 } 
      };
      conversations.push(conversation);
    } else {
      conversation.lastMessagePreview = content;
      conversation.lastMessageTimestamp = newMessage.timestamp;
      conversation.lastMessageSenderId = sender.id;
      conversation.unreadCountByUserId = {
        ...conversation.unreadCountByUserId,
        [receiverId]: (conversation.unreadCountByUserId?.[receiverId] || 0) + 1,
      };
      conversations = conversations.map(c => c.id === conversationId ? conversation! : c);
    }
    localStorage.setItem(CHAT_CONVERSATIONS_KEY, JSON.stringify(conversations));

    // Dispatch custom event for pseudo real-time update
    document.dispatchEvent(new CustomEvent('chatMessage', { detail: { conversationId } }));

    return newMessage;
  },

  markConversationAsRead: async (conversationId: string, userId: string): Promise<void> => {
    await simulateDelay(30);
    const conversationsJson = localStorage.getItem(CHAT_CONVERSATIONS_KEY);
    let conversations: ChatConversation[] = conversationsJson ? JSON.parse(conversationsJson) : [];
    const convoIndex = conversations.findIndex(c => c.id === conversationId);
    if (convoIndex > -1) {
      conversations[convoIndex].unreadCountByUserId = {
        ...conversations[convoIndex].unreadCountByUserId,
        [userId]: 0,
      };
      localStorage.setItem(CHAT_CONVERSATIONS_KEY, JSON.stringify(conversations));
    }
  },
};
