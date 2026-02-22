import { create } from 'zustand';

const useChatStore = create((set) => ({
    conversations: [],
    selectedConversation: null,
    unreadCount: 0,

    setConversations: (conversations) => set({ conversations }),

    setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),

    addMessage: (message) => set((state) => ({
        conversations: state.conversations.map(conv => {
            // Check if participants matches the message
            const isRelevant = conv.participants?.some(p => p._id === message.sender?._id || p === message.sender?._id);
            if (isRelevant) {
                return {
                    ...conv,
                    lastMessage: message,
                    unreadCount: state.selectedConversation?._id === conv._id
                        ? conv.unreadCount
                        : (conv.unreadCount || 0) + 1
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
        unreadCount: state.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
    }))
}));

export default useChatStore;
