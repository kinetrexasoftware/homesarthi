import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Send } from 'lucide-react-native';

const ChatInput = ({ onSend, loading }) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (!message.trim() || loading) return;
        onSend(message.trim());
        setMessage('');
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Type a message..."
                value={message}
                onChangeText={setMessage}
                multiline
                placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
                style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!message.trim() || loading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <Send size={20} color="#FFFFFF" />
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    },
    input: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: '#111827',
        maxHeight: 100,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    sendBtnDisabled: {
        backgroundColor: '#93C5FD',
    },
});

export default ChatInput;
