import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Image,
    Platform,
    Share
} from 'react-native';
import {
    User,
    Settings,
    Lock,
    LogOut,
    ChevronRight,
    ShieldCheck,
    Mail,
    Phone,
    Share2,
    LayoutDashboard,
    Home,
    Calendar,
    FileText,
    ShieldAlert,
    HelpCircle,
    Handshake,
    Info,
    Headphones,
    Trash2,
} from 'lucide-react-native';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const ProfileScreen = ({ navigation }) => {
    const user = useAuthStore((state) => state?.user);
    const logout = useAuthStore((state) => state?.logout);

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out of your account?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        if (logout) await logout();
                    }
                }
            ]
        );
    };

    const handleAccountDeletion = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently erased within 72 hours as per our policy.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Request Deletion",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { data } = await api.delete('/users/delete-account');
                            if (data?.success) {
                                Alert.alert("Request Submitted", data.message);
                                if (logout) await logout();
                            }
                        } catch (error) {
                            Alert.alert("Error", error?.response?.data?.message || "Something went wrong. Please try again later.");
                        }
                    }
                }
            ]
        );
    };


    const MenuItem = ({ icon: Icon, title, subtitle, onPress, color = "#111827", isLast = false }) => (
        <TouchableOpacity
            style={[styles.menuItem, isLast && styles.lastMenuItem]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.menuIconBox, { backgroundColor: color + '10' }]}>
                <Icon size={20} color={color} />
            </View>
            <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ChangePassword')}>
                    <Settings size={22} color="#4B5563" />
                </TouchableOpacity>
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        {user?.avatar?.url ? (
                            <Image source={{ uri: user.avatar.url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitial}>
                                    {user?.name?.charAt(0) || 'U'}
                                </Text>
                            </View>
                        )}
                        <View style={styles.verifiedBadge}>
                            <ShieldCheck size={14} color="#FFFFFF" />
                        </View>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.name || 'User'}</Text>
                        {user?.customId && (
                            <Text style={styles.customIdText}>ID: {user.customId}</Text>
                        )}
                        <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'STUDENT'}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('EditProfile')}
                >
                    <Text style={styles.editBtnText}>Edit Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Account Management */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Management</Text>
                <View style={styles.menuBox}>
                    <MenuItem
                        icon={LayoutDashboard}
                        title="Dashboard"
                        subtitle="Analytics & Overview"
                        color="#2563EB"
                        onPress={() => {
                            if (user?.role === 'admin') navigation.navigate('AdminDashboard');
                            else if (user?.role === 'owner') navigation.navigate('OwnerDashboard');
                            else navigation.navigate('StudentDashboard');
                        }}
                    />
                    {user?.role === 'owner' && (
                        <>
                            <MenuItem
                                icon={Home}
                                title="My Rooms"
                                subtitle="Manage your listings"
                                color="#2563EB"
                                onPress={() => navigation.navigate('MyRooms')}
                            />
                            <MenuItem
                                icon={Calendar}
                                title="Visits"
                                subtitle="Visit requests & scheduling"
                                color="#10B981"
                                onPress={() => navigation.navigate('Visits')}
                            />
                        </>
                    )}
                    <MenuItem
                        icon={Lock}
                        title="Security"
                        subtitle="Password & Privacy"
                        color="#F59E0B"
                        onPress={() => navigation.navigate('ChangePassword')}
                        isLast
                    />
                </View>
            </View>

            {user?.role === 'owner' && (
                <View style={[styles.section, { marginTop: 20 }]}>
                    <Text style={styles.sectionLabel}>Priority Support</Text>
                    <View style={styles.menuBox}>
                        <MenuItem
                            icon={Headphones}
                            title="Support Center"
                            subtitle="Direct help from HomeSarthi Team"
                            color="#2563EB"
                            onPress={() => navigation.navigate('Support')}
                            isLast
                        />
                    </View>
                </View>
            )}

            {/* Support & Legal */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Support & Legal</Text>
                <View style={styles.menuBox}>
                    <MenuItem
                        icon={Info}
                        title="About HomeSarthi"
                        subtitle="Our mission and story"
                        color="#2563EB"
                        onPress={() => navigation.navigate('Info', { type: 'about' })}
                    />
                    <MenuItem
                        icon={Mail}
                        title="Contact Us"
                        subtitle="Get help and support"
                        color="#10B981"
                        onPress={() => navigation.navigate('Info', { type: 'contact' })}
                    />
                    <MenuItem
                        icon={ShieldAlert}
                        title="Safety Guidelines"
                        subtitle="Stay safe while searching"
                        color="#F59E0B"
                        onPress={() => navigation.navigate('Info', { type: 'safety' })}
                    />
                    <MenuItem
                        icon={Handshake}
                        title="Terms & Conditions"
                        subtitle="Platform usage rules"
                        color="#6366F1"
                        onPress={() => navigation.navigate('Info', { type: 'terms' })}
                    />
                    <MenuItem
                        icon={FileText}
                        title="Privacy Policy"
                        subtitle="How we handle your data"
                        color="#8B5CF6"
                        onPress={() => navigation.navigate('Info', { type: 'privacy' })}
                        isLast
                    />
                </View>
            </View>

            {/* App Settings */}
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>App Settings</Text>
                <View style={styles.menuBox}>
                    <MenuItem
                        icon={LogOut}
                        title="Logout"
                        subtitle="Sign out of your account"
                        color="#EF4444"
                        onPress={handleLogout}
                    />
                    <MenuItem
                        icon={Trash2}
                        title="Delete Account"
                        subtitle="Permanent data erasure request"
                        color="#6B7280"
                        onPress={handleAccountDeletion}
                        isLast
                    />
                </View>
            </View>

            {/* Support Info */}
            <View style={styles.footer}>
                <Text style={styles.versionText}>HomeSarthi Mobile v1.0.1</Text>
                <Text style={styles.copyText}>© 2026 KineTrexa Software Pvt. Ltd.</Text>
            </View>

            <View style={{ height: 20 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        position: 'relative',
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    avatarPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#10B981',
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    userInfo: {
        marginLeft: 16,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    userRole: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '900',
        marginTop: 4,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    customIdText: {
        fontSize: 12,
        color: '#2563EB',
        fontWeight: 'bold',
        marginTop: 2,
    },
    editBtn: {
        marginTop: 24,
        backgroundColor: '#F9FAFB',
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    editBtnText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4B5563',
    },
    section: {
        marginTop: 32,
        paddingHorizontal: 20,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    menuBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    lastMenuItem: {
        borderBottomWidth: 0,
    },
    menuIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuInfo: {
        flex: 1,
        marginLeft: 16,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    menuSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    copyText: {
        fontSize: 10,
        color: '#D1D5DB',
        marginTop: 4,
    }
});

export default ProfileScreen;
