import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const Loader = ({ fullScreen = false, size = 'large', color = '#2563EB' }) => {
    if (fullScreen) {
        return (
            <View style={styles.fullScreen}>
                <ActivityIndicator size={size} color={color} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ActivityIndicator size={size} color={color} />
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    container: {
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Loader;
