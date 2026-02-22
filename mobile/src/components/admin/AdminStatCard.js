import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');

const AdminStatCard = ({ title, value, icon, color = '#2563EB', trend, onPress }) => {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${color}10` }]}>
                {icon}
            </View>
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <Text style={styles.value}>{value}</Text>
                {trend && (
                    <Text style={[styles.trend, { color: trend.startsWith('+') ? '#10B981' : '#EF4444' }]}>
                        {trend}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        width: (width - 48) / 2,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    value: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 2,
    },
    trend: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
    },
});

export default AdminStatCard;
