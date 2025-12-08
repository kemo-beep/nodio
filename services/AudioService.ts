import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

class AudioService {
    private recording: Audio.Recording | null = null;
    private sound: Audio.Sound | null = null;
    private readonly recordingsDir: string;

    constructor() {
        // Create a directory for recordings in the app's document directory
        this.recordingsDir = `${FileSystem.documentDirectory}recordings/`;
    }

    async ensureRecordingsDirectory() {
        const dirInfo = await FileSystem.getInfoAsync(this.recordingsDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(this.recordingsDir, { intermediates: true });
        }
    }

    async requestPermissions() {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            return status === 'granted';
        } catch (err) {
            console.error('Failed to request audio permissions', err);
            return false;
        }
    }

    async startRecording() {
        try {
            // Ensure recordings directory exists
            await this.ensureRecordingsDirectory();

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            this.recording = recording;
            return recording;
        } catch (err) {
            console.error('Failed to start recording', err);
            return null;
        }
    }

    async stopRecording(): Promise<string | null> {
        if (!this.recording) {
            console.error('No active recording to stop');
            return null;
        }

        try {
            // Stop and unload the recording
            await this.recording.stopAndUnloadAsync();
            const tempUri = this.recording.getURI();
            
            if (!tempUri) {
                console.error('No URI returned from recording');
                this.recording = null;
                return null;
            }

            // Ensure recordings directory exists
            await this.ensureRecordingsDirectory();

            // Extract file extension from original URI, default to .m4a
            const uriExtension = tempUri.split('.').pop() || 'm4a';
            const timestamp = Date.now();
            const filename = `recording_${timestamp}.${uriExtension}`;
            const permanentUri = `${this.recordingsDir}${filename}`;

            // Copy the temporary file to permanent storage
            await FileSystem.copyAsync({
                from: tempUri,
                to: permanentUri,
            });

            // Clean up the temporary recording file
            try {
                const tempFileInfo = await FileSystem.getInfoAsync(tempUri);
                if (tempFileInfo.exists) {
                    await FileSystem.deleteAsync(tempUri, { idempotent: true });
                }
            } catch (cleanupErr) {
                // Non-critical error, just log it
                console.warn('Failed to cleanup temporary recording file', cleanupErr);
            }

            this.recording = null;
            return permanentUri;
        } catch (err) {
            console.error('Failed to stop and save recording', err);
            this.recording = null;
            return null;
        }
    }

    async playSound(uri: string) {
        try {
            if (this.sound) {
                await this.sound.unloadAsync();
            }

            const { sound } = await Audio.Sound.createAsync({ uri });
            this.sound = sound;
            await sound.playAsync();
        } catch (err) {
            console.error('Failed to play sound', err);
        }
    }

    async stopSound() {
        try {
            if (this.sound) {
                await this.sound.stopAsync();
            }
        } catch (err) {
            console.error('Failed to stop sound', err);
        }
    }

    async deleteRecording(uri: string): Promise<boolean> {
        try {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(uri, { idempotent: true });
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to delete recording', err);
            return false;
        }
    }

    async getRecordingInfo(uri: string) {
        try {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            return fileInfo;
        } catch (err) {
            console.error('Failed to get recording info', err);
            return null;
        }
    }
}

export default new AudioService();
