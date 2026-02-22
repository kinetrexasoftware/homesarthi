import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

const Button = ({ title, onPress, loading, disabled, style, textStyle, variant = 'primary' }) => {
    const getButtonStyle = () => {
        if (variant === 'danger') return styles.dangerButton;
        if (variant === 'secondary') return styles.secondaryButton;
        return styles.primaryButton;
    };

    const getTextStyle = () => {
        if (variant === 'danger') return styles.dangerText;
        if (variant === 'secondary') return styles.secondaryText;
        return styles.primaryText;
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            disabled={loading || disabled}
            style={[
                styles.button,
                getButtonStyle(),
                (loading || disabled) && styles.disabledButton,
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? "#FFFFFF" : "#2563EB"} size="small" />
            ) : (
                <Text style={[
                    styles.text,
                    getTextStyle(),
                    textStyle
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 56,
        borderRadius: 16, // Increased radius for premium feel
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
    },
    primaryButton: {
        backgroundColor: '#2563EB',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#2563EB',
    },
    dangerButton: {
        backgroundColor: '#EF4444',
    },
    disabledButton: {
        opacity: 0.5,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    primaryText: {
        color: '#FFFFFF',
    },
    secondaryText: {
        color: '#2563EB',
    },
    dangerText: {
        color: '#FFFFFF',
    }
});

export default Button;
