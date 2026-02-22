import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

export const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }

        try {
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

            const isExpoGo = Constants.executionEnvironment === 'storeClient';
            console.log(`[PushService] Env: ${Constants.executionEnvironment}, ProjectId: ${projectId}`);

            if (isExpoGo && !projectId) {
                console.warn('Skipping push token registration in Expo Go without Project ID. Use "npx expo login" and "eas build:configure".');
                return null;
            }

            if (!projectId) {
                token = (await Notifications.getExpoPushTokenAsync()).data;
            } else {
                token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            }
            console.log("Expo Push Token:", token);
        } catch (e) {
            if (e.message.includes('No "projectId" found') || e.message.includes('No "projectId" found in app.json')) {
                console.log('Push notifications configuration pending. Run "eas build:configure" to fix.');
            } else {
                console.error('Error fetching push token:', e);
            }
        }
    } else {
        alert('Must use physical device for Push Notifications');
    }

    // Send token to backend
    if (token) {
        try {
            await api.post('/auth/push-token', { pushToken: token });
        } catch (error) {
            console.error('Error sending push token to backend:', error);
        }
    }

    return token;
};
