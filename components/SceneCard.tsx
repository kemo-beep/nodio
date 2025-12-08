import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Theme } from '../constants/Colors';
import { CommonStyles } from '../constants/Styles';
import { Scene } from '../services/MockAIService';

interface SceneCardProps {
    scene: Scene;
    index: number;
    onRegenerate: () => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({ scene, index, onRegenerate }) => {
    return (
        <Animated.View
            entering={FadeInRight.delay(index * 100).springify()}
            style={[styles.container, CommonStyles.shadowSmall]}
        >
            <View style={styles.header}>
                <Text style={styles.sceneNumber}>Scene {index + 1}</Text>
                <Text style={styles.duration}>{(scene.duration / 1000).toFixed(1)}s</Text>
            </View>

            <View style={styles.imageContainer}>
                <Image source={{ uri: scene.imageUrl }} style={styles.image} />
                <TouchableOpacity style={styles.regenerateBtn} onPress={onRegenerate}>
                    <Ionicons name="refresh" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            <Text style={styles.description}>{scene.description}</Text>
            <Text style={styles.prompt}>Prompt: {scene.imagePrompt}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Theme.surfaceHighlight,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sceneNumber: {
        fontSize: 15,
        fontWeight: '700',
        color: Theme.text,
    },
    duration: {
        fontSize: 13,
        color: Theme.textSecondary,
    },
    imageContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        backgroundColor: '#333',
    },
    regenerateBtn: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    description: {
        fontSize: 15,
        color: Theme.text,
        lineHeight: 22,
        marginBottom: 8,
    },
    prompt: {
        fontSize: 12,
        color: Theme.textTertiary,
        fontStyle: 'italic',
    },
});
