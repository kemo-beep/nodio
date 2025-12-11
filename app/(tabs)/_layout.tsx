import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { RecordButton } from '@/components/RecordButton';
import { Theme } from '@/constants/Colors';
import AIService from '@/services/AIService';
import AudioService from '@/services/AudioService';
import { useFolderStore } from '@/store/useFolderStore';
import { useProjectStore } from '@/store/useProjectStore';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    projects,
    isRecording,
    isProcessing,
    setRecording,
    addProject,
    setProcessing
  } = useProjectStore();
  const { currentFolderId, folderNavigationStack } = useFolderStore();

  useEffect(() => {
    AudioService.requestPermissions();
  }, []);

  const handleRecordPress = async () => {
    if (isRecording) {
      // Stop Recording
      setRecording(false);
      setProcessing(true);

      try {
        const uri = await AudioService.stopRecording();

        if (!uri) {
          setProcessing(false);
          Alert.alert(
            "Recording Error",
            "Failed to save your recording. Please try again.",
            [{ text: "OK" }]
          );
          return;
        }

        // Verify the audio file exists
        const fileInfo = await AudioService.getRecordingInfo(uri);
        if (!fileInfo || !fileInfo.exists) {
          setProcessing(false);
          Alert.alert(
            "Recording Error",
            "The recording file could not be found. Please try recording again.",
            [{ text: "OK" }]
          );
          return;
        }

        // Transcribe audio
        let transcript: string;
        try {
          transcript = await AIService.transcribeAudio(uri);
          if (!transcript || transcript.trim().length === 0) {
            throw new Error("Empty transcript received");
          }
        } catch (transcribeError: any) {
          console.error("Transcription error:", transcribeError);
          setProcessing(false);

          // Check if it's an API key error
          const errorMessage = transcribeError?.message || "Unknown error";
          const isApiKeyError = errorMessage.includes('API key') || errorMessage.includes('not configured');

          Alert.alert(
            "Transcription Error",
            isApiKeyError
              ? "OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment variables."
              : `Failed to transcribe your audio: ${errorMessage}. The recording was saved, but transcription failed. Please try again.`,
            [{ text: "OK" }]
          );
          return;
        }

        // Create new project with just the transcript
        // User can create videos/scenes/summaries/etc. from the Create tab later
        // Get the current folder ID from the navigation stack (most recent folder)
        const folderId = folderNavigationStack.length > 0
          ? folderNavigationStack[folderNavigationStack.length - 1]
          : currentFolderId;

        const projectId = Date.now().toString();
        const now = new Date();
        const newProject = {
          id: projectId,
          title: `Project ${projects.length + 1}`,
          date: now,
          updatedAt: now,
          audioUri: uri,
          transcript,
          videos: [], // Empty - user creates videos from Create tab
          folderId: folderId, // Use folder from navigation stack or current folder
          tags: [],
        };

        console.log('Creating project with folderId:', folderId, 'currentFolderId:', currentFolderId, 'stack:', folderNavigationStack);

        // Save to store and database
        await addProject(newProject);
        setProcessing(false);

        // Navigate to editor
        router.push(`/editor/${projectId}`);
      } catch (error) {
        console.error("Recording processing error:", error);
        setProcessing(false);
        Alert.alert(
          "Error",
          "An unexpected error occurred while processing your recording. Please try again.",
          [{ text: "OK" }]
        );
      }
    } else {
      // Start Recording
      try {
        // Check permissions first
        const hasPermission = await AudioService.requestPermissions();
        if (!hasPermission) {
          Alert.alert(
            "Permission Required",
            "Microphone permission is required to record audio. Please enable it in your device settings.",
            [{ text: "OK" }]
          );
          return;
        }

        const recording = await AudioService.startRecording();
        if (recording) {
          setRecording(true);
        } else {
          Alert.alert(
            "Recording Error",
            "Could not start recording. Please check your microphone and try again.",
            [{ text: "OK" }]
          );
        }
      } catch (error) {
        console.error("Start recording error:", error);
        Alert.alert(
          "Recording Error",
          "Failed to start recording. Please try again.",
          [{ text: "OK" }]
        );
      }
    }
  };

  return (
    <View style={styles.container}>


      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Theme.primary,
          tabBarInactiveTintColor: '#8E8E93',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            position: 'absolute',
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: 'rgba(0,0,0,0.1)',
            elevation: 0,
            height: 84, // Standard iOS tab bar height (49 + 34 safe area)
            paddingBottom: 30,
            paddingTop: 8,
            backgroundColor: Theme.background,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={focused ? 26 : 24}
                name={focused ? "home" : "home-outline"}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Account',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={focused ? 26 : 24}
                name={focused ? "person" : "person-outline"}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
      {/* Central Record Button */}
      <View style={[styles.recordButtonContainer, { bottom: 30 }]}>
        <RecordButton
          isRecording={isRecording}
          onPress={handleRecordPress}
        />
      </View>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <BlurView
            tint="light"
            intensity={80}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.processingContent}>
            <ActivityIndicator size="large" color="#2F54EB" />
            <Text style={styles.processingText}>Processing your recording...</Text>
            <Text style={styles.processingSubtext}>Transcribing audio and generating scenes</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarBackground: {
    display: 'none',
  },
  iconContainer: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  recordButtonContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: -36, // Half of button width (72/2)
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 200,
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  processingSubtext: {
    marginTop: 8,
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
