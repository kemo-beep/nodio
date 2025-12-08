import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { VideoPlayer } from '../../components/VideoPlayer';
import { Theme } from '../../constants/Colors';
import { useProjectStore } from '../../store/useProjectStore';

export default function PreviewScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { currentProject } = useProjectStore();
    const [isPlaying, setIsPlaying] = useState(false);

    if (!currentProject) return null;

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{
                headerShown: false,
            }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                    <Ionicons name="close" size={28} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.playerContainer}>
                <VideoPlayer
                    scenes={currentProject.scenes}
                    isPlaying={isPlaying}
                    onComplete={() => setIsPlaying(false)}
                />
            </View>

            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.playBtn}
                    onPress={() => setIsPlaying(!isPlaying)}
                >
                    <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={40}
                        color="#FFF"
                        style={{ marginLeft: isPlaying ? 0 : 4 }}
                    />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    controls: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    playBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Theme.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
