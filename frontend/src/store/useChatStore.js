import { create } from 'zustand';

const useChatStore = create((set) => ({
  conversations: [],
  selectedConversation: null,
  unreadCount: 0,

  setConversations: (conversations) => set({ conversations }),
  
  setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
  
  addMessage: (message) => set((state) => ({
    conversations: state.conversations.map(conv => {
      if (conv.lastMessage.conversation.participants.includes(message.sender._id)) {
        return {
          ...conv,
          lastMessage: message,
          unreadCount: state.selectedConversation?.otherUser._id === message.sender._id 
            ? conv.unreadCount 
            : conv.unreadCount + 1
        };
      }
      return conv;
    })
  })),

  markAsRead: (conversationId) => set((state) => ({
    conversations: state.conversations.map(conv =>
      conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
    )
  })),

  calculateUnreadCount: () => set((state) => ({
    unreadCount: state.conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
  }))
}));

export default useChatStore;