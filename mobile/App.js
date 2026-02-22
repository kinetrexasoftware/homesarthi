import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation';
import useAuthStore from './src/store/authStore';
import { registerForPushNotificationsAsync } from './src/services/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

import { Alert } from 'react-native';
import { getSocket } from './src/services/socket';

// ... existing imports

export default function App() {
  const checkSession = useAuthStore((state) => state?.checkSession);
  const user = useAuthStore((state) => state?.user);
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (typeof checkSession === 'function') {
      checkSession();
    }
  }, [checkSession]);

  // Socket Listener for Real-time Notifications
  useEffect(() => {
    let socket;
    const setupSocketListener = async () => {
      if (user) {
        socket = await getSocket();
        if (socket) {
          // 1. Handle regular notifications (Visits, Admin, etc.)
          socket.on('new_notification', (data) => {
            console.log('🔔 Socket Notification:', data);
            Alert.alert(
              data.title || 'New Notification',
              data.body,
              [{ text: 'OK' }]
            );
          });

          // 2. Handle incoming chat messages (Popups)
          socket.on('receive_message', (message) => {
            console.log('💬 New Message via Socket:', message);

            // Check current route – if we are already in ChatDetail with this user, don't show alert
            const currentRoute = navigationRef.current?.getCurrentRoute();
            const isInsideThisChat = currentRoute?.name === 'ChatDetail' &&
              (currentRoute?.params?.otherUser?._id === message.sender?._id ||
                currentRoute?.params?.userId === message.sender?._id);

            if (!isInsideThisChat) {
              Alert.alert(
                `New Message: ${message.sender?.name || 'User'}`,
                message.content,
                [
                  {
                    text: 'Reply',
                    onPress: () => navigationRef.current?.navigate('ChatDetail', {
                      userId: message.sender?._id,
                      otherUser: message.sender
                    })
                  },
                  { text: 'Dismiss', style: 'cancel' }
                ]
              );
            }
          });
        }
      }
    };

    setupSocketListener();

    return () => {
      if (socket) {
        socket.off('new_notification');
      }
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync();
    }
  }, [user]);

  useEffect(() => {
    const notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
