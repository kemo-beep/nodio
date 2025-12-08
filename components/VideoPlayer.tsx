import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/Colors';
import { Scene } from '../services/MockAIService';

interface VideoPlayerProps {
    scenes: Scene[];
    isPlaying: boolean;
    onComplete: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ scenes, isPlaying, onComplete }) => {
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);
    const sceneStartTimeRef = useRef<number>(0);

    useEffect(() => {
        if (isPlaying) {
            startPlayback();
        } else {
            stopPlayback();
        }
        return () => stopPlayback();
    }, [isPlaying]);

    const startPlayback = () => {
        startTimeRef.current = Date.now();
        sceneStartTimeRef.current = Date.now();

        timerRef.current = setInterval(() => {
            const now = Date.now();
            const currentScene = scenes[currentSceneIndex];
            const sceneElapsed = now - sceneStartTimeRef.current;

            if (sceneElapsed >= currentScene.duration) {
                // Move to next scene
                if (currentSceneIndex < scenes.length - 1) {
                    setCurrentSceneIndex(prev => prev + 1);
                    sceneStartTimeRef.current = now;
                } else {
                    // Finished
                    stopPlayback();
                    onComplete();
                }
            }
        }, 50);
    };

    const stopPlayback = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const currentScene = scenes[currentSceneIndex];

    return (
        <View style={styles.container}>
            <Image
                source={{ uri: currentScene.imageUrl }}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.subtitleContainer}>
                <Text style={styles.subtitle}>{currentScene.description}</Text>
            </View>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, {
                    width: `${((currentSceneIndex + 1) / scenes.length) * 100}%`
                }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').width * (16 / 9),
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    subtitleContainer: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 12,
        borderRadius: 8,
    },
    subtitle: {
        color: '#FFF',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Theme.primary,
    },
});
