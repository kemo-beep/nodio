import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Colors';

interface AudioPlayerProps {
    audioUri: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUri }) => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadAudio();
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
            if (positionUpdateInterval.current) {
                clearInterval(positionUpdateInterval.current);
            }
        };
    }, [audioUri]);

    const loadAudio = async () => {
        try {
            if (sound) {
                await sound.unloadAsync();
            }

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: audioUri },
                { shouldPlay: false }
            );

            const status = await newSound.getStatusAsync();
            if (status.isLoaded) {
                setDuration(status.durationMillis || 0);
            }

            setSound(newSound);
        } catch (error) {
            console.error('Failed to load audio:', error);
        }
    };

    const updatePosition = async () => {
        if (sound) {
            try {
                const status = await sound.getStatusAsync();
                if (status.isLoaded && status.positionMillis !== undefined) {
                    setPosition(status.positionMillis);
                    if (status.didJustFinish) {
                        setIsPlaying(false);
                        setPosition(0);
                        if (positionUpdateInterval.current) {
                            clearInterval(positionUpdateInterval.current);
                            positionUpdateInterval.current = null;
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to update position:', error);
            }
        }
    };

    const togglePlayPause = async () => {
        if (!sound) return;

        try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                    if (positionUpdateInterval.current) {
                        clearInterval(positionUpdateInterval.current);
                        positionUpdateInterval.current = null;
                    }
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                    // Start updating position
                    positionUpdateInterval.current = setInterval(updatePosition, 100);
                }
            }
        } catch (error) {
            console.error('Failed to toggle play/pause:', error);
        }
    };

    const formatTime = (milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (position / duration) * 100 : 0;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={24}
                    color="#FFFFFF"
                />
            </TouchableOpacity>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(position)}</Text>
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: Theme.surfaceSecondary,
        borderRadius: 16,
        gap: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    playButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Theme.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Theme.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    progressContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Theme.primary,
        borderRadius: 2,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeText: {
        fontSize: 11,
        color: Theme.textSecondary,
        fontWeight: '500',
        fontVariant: ['tabular-nums'],
    },
});

