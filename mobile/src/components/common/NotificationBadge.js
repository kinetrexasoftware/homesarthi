import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { getUnreadCount } from '../../services/notificationApi';

import { getSocket } from '../../services/socket';

const NotificationBadge = ({ size = 24, color = '#111827' }) => {
    const navigation = useNavigation();
    const [unreadCount, setUnreadCount] = useState(0);

    const loadUnreadCount = async () => {
        try {
            const count = await getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error loading unread count:', error);
            // Silently fail - don't crash the component
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        loadUnreadCount();
        let socket;

        // Socket listener
        const setupSocket = async () => {
            try {
                socket = await getSocket();
                if (socket) {
                    socket.on('new_notification', () => {
                        console.log('🔴 Badge: New notification, refreshing count');
                        loadUnreadCount();
                    });
                }
            } catch (e) {
                console.log('Badge socket error', e);
            }
        };
        setupSocket();

        // Refresh count every 30 seconds
        const interval = setInterval(loadUnreadCount, 30000);

        // Listen for navigation focus to refresh count (with null check)
        let unsubscribe = null;
        if (navigation?.addListener) {
            unsubscribe = navigation.addListener('focus', loadUnreadCount);
        }

        return () => {
            clearInterval(interval);
            if (unsubscribe) {
                unsubscribe();
            }
            if (socket) {
                socket.off('new_notification');
            }
        };
    }, []); // Empty dependency array to run only once

    const handlePress = () => {
        if (navigation?.navigate) {
            navigation.navigate('Notifications');
        }
    };

    return (
        <TouchableOpacity style={styles.container} onPress={handlePress}>
            <Bell size={size} color={color} />
            {unreadCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        padding: 8
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF'
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold'
    }
});

export default NotificationBadge;
