import { useState, useCallback, useEffect } from 'react';
import useChatStore from '../store/chatStore';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { Alert } from 'react-native';

export const useChat = () => {
    const {
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
        addMessage,
        markAsRead,
        calculateUnreadCount,
        unreadCount
    } = useChatStore();

    const [loading, setLoading] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const init = async () => {
            const s = await getSocket();
            setSocket(s);
        };
        init();
    }, []);

    const fetchConversations = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/chat/conversations');
            if (data?.success) {
                setConversations(data.data.conversations || []);
                calculateUnreadCount();
            }
        } catch (error) {
            console.error('Fetch conversations error:', error);
        } finally {
            setLoading(false);
        }
    }, [setConversations, calculateUnreadCount]);

    const sendMessage = async (recipientId, content, roomId = null) => {
        try {
            const { data } = await api.post('/chat/send', {
                recipientId,
                content,
                roomId
            });
            if (data?.success) {
                // If socket handles it by emitting 'message_sent', we don't need manual add
                // But often good to have local feedback
                // addMessage(data.data.message);
                return data.data.message;
            }
        } catch (error) {
            console.error('Send message error:', error);
            Alert.alert('Error', 'Failed to send message');
            return null;
        }
    };

    return {
        conversations,
        selectedConversation,
        unreadCount,
        loading,
        fetchConversations,
        sendMessage,
        setSelectedConversation,
        markAsRead
    };
};
