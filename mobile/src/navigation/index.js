import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, MessageSquare, Calendar, User, Search, LayoutDashboard } from 'lucide-react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import RoomDetailsScreen from '../screens/RoomDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import MyRoomsScreen from '../screens/MyRoomsScreen';
import CreateRoomScreen from '../screens/CreateRoomScreen';
import EditRoomScreen from '../screens/EditRoomScreen';
import VisitsScreen from '../screens/VisitsScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatDetailScreen from '../screens/ChatDetailScreen';
import OwnerDashboardScreen from '../screens/OwnerDashboardScreen';
import StudentDashboardScreen from '../screens/StudentDashboardScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminUserManagementScreen from '../screens/AdminUserManagementScreen';
import AdminRoomsScreen from '../screens/AdminRoomsScreen';
import AdminReportsScreen from '../screens/AdminReportsScreen';
import AdminAuditScreen from '../screens/AdminAuditScreen';
import AdminAnalyticsScreen from '../screens/AdminAnalyticsScreen';
import HomeScreen from '../screens/HomeScreen';
import InfoScreen from '../screens/InfoScreen';
import SavedRoomsScreen from '../screens/SavedRoomsScreen';
import SupportScreen from '../screens/SupportScreen';
import TicketDetailScreen from '../screens/TicketDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import useAuthStore from '../store/authStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
    const user = useAuthStore((state) => state?.user);
    const insets = useSafeAreaInsets();
    const isOwner = user?.role === 'owner';
    const isAdmin = user?.role === 'admin';

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    if (route.name === 'Home') return <Home color={color} size={size} />;
                    if (route.name === 'Explore') return <Search color={color} size={size} />;
                    if (route.name === 'Dashboard') return <LayoutDashboard color={color} size={size} />;
                    if (route.name === 'Chat') return <MessageSquare color={color} size={size} />;
                    if (route.name === 'Profile') return <User color={color} size={size} />;
                },
                tabBarActiveTintColor: '#000000',
                tabBarInactiveTintColor: '#535353',
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarStyle: {
                    height: 65 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 12,
                    borderTopWidth: 0,
                    backgroundColor: '#FFFFFF',
                    elevation: 10,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                }
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Explore" component={DashboardScreen} />
            {isAdmin ? (
                <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
            ) : isOwner ? (
                <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} />
            ) : (
                <Tab.Screen name="Dashboard" component={StudentDashboardScreen} />
            )}
            <Tab.Screen name="Chat" component={ChatListScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const isAuthenticated = useAuthStore((state) => state?.isAuthenticated ?? false);
    const loading = useAuthStore((state) => state?.loading ?? true);
    const user = useAuthStore((state) => state?.user);
    const isFirstLogin = user?.isFirstLogin ?? false;
    const navigationRef = useRef();

    // Global scroll-to-top on navigation (excluding chat screens)
    useEffect(() => {
        const unsubscribe = navigationRef.current?.addListener('state', () => {
            const currentRoute = navigationRef.current?.getCurrentRoute();
            const routeName = currentRoute?.name;

            // Exclude chat screens from auto-scroll
            if (routeName && !routeName.includes('Chat')) {
                // Scroll to top is handled by individual ScrollView/FlatList components
                // This ensures consistent behavior across all screens
            }
        });

        return unsubscribe;
    }, []);

    if (loading && !isAuthenticated) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                {isAuthenticated ? (
                    isFirstLogin ? (
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    ) : (
                        <>
                            <Stack.Screen name="MainTabs" component={MainTabs} />
                            <Stack.Screen name="RoomDetails" component={RoomDetailsScreen} />
                            <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
                            <Stack.Screen name="EditRoom" component={EditRoomScreen} />
                            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
                            <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
                            <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
                            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                            <Stack.Screen name="AdminUserManagement" component={AdminUserManagementScreen} />
                            <Stack.Screen name="AdminRooms" component={AdminRoomsScreen} />
                            <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
                            <Stack.Screen name="AdminAudit" component={AdminAuditScreen} />
                            <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
                            <Stack.Screen name="MyRooms" component={MyRoomsScreen} />
                            <Stack.Screen name="Visits" component={VisitsScreen} />
                            <Stack.Screen name="SavedRooms" component={SavedRoomsScreen} />
                            <Stack.Screen name="Support" component={SupportScreen} />
                            <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
                            <Stack.Screen name="Notifications" component={NotificationsScreen} />
                            <Stack.Screen name="Info" component={InfoScreen} />
                        </>
                    )
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
