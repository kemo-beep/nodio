import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface RecordButtonProps {
    isRecording: boolean;
    onPress: () => void;
}

export const RecordButton: React.FC<RecordButtonProps> = ({ isRecording, onPress }) => {
    const scale = useSharedValue(1);
    const shadowOpacity = useSharedValue(0.3);

    useEffect(() => {
        if (isRecording) {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 800 }),
                    withTiming(1, { duration: 800 })
                ),
                -1,
                true
            );
            shadowOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.6, { duration: 800 }),
                    withTiming(0.3, { duration: 800 })
                ),
                -1,
                true
            );
        } else {
            scale.value = withSpring(1);
            shadowOpacity.value = withTiming(0.3);
        }
    }, [isRecording]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        shadowOpacity: shadowOpacity.value,
    }));

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            style={styles.container}
        >
            <Animated.View style={[styles.button, animatedStyle]}>
                <Ionicons
                    name={isRecording ? "square" : "mic"}
                    size={28}
                    color="#FFF"
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 72,
        height: 72,
    },
    button: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2F54EB', // Brand Blue
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2F54EB',
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        shadowOpacity: 0.4,
        elevation: 10,
        borderWidth: 4,
        borderColor: '#FFFFFF', // White border to separate from content/tab bar
    },
});
