import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MessageBubble = ({ item, isOwn }) => {
    return (
        <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
            <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
                {item.content}
            </Text>
            <Text style={[styles.time, isOwn ? styles.ownTime : styles.otherTime]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    bubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
        marginBottom: 8,
    },
    ownBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#2563EB',
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    text: {
        fontSize: 15,
        lineHeight: 20,
    },
    ownText: {
        color: '#FFFFFF',
    },
    otherText: {
        color: '#111827',
    },
    time: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    ownTime: {
        color: 'rgba(255,255,255,0.7)',
    },
    otherTime: {
        color: '#9CA3AF',
    },
});

export default MessageBubble;
