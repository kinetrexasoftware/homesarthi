import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EmptyState = ({ icon, title, description, action }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>{icon || '📭'}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            {action && (
                <View style={styles.actionContainer}>
                    {action}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 60,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    actionContainer: {
        marginTop: 10,
        width: '100%',
    },
});

export default EmptyState;
