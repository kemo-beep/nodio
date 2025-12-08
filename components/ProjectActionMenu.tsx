import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../constants/Colors';
import { Project } from '../services/MockAIService';
import { FolderPicker } from './FolderPicker';

interface ProjectActionMenuProps {
    project: Project;
    onRename: () => void;
    onMove: (folderId: string | null) => void;
    onDelete: () => void;
    onTag: () => void;
}

export const ProjectActionMenu: React.FC<ProjectActionMenuProps> = ({
    project,
    onRename,
    onMove,
    onDelete,
    onTag,
}) => {
    const [showFolderPicker, setShowFolderPicker] = useState(false);

    const showActionSheet = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancel', 'Rename', 'Move to Folder', 'Add Tags', 'Delete'],
                    destructiveButtonIndex: 4,
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        onRename();
                    } else if (buttonIndex === 2) {
                        setShowFolderPicker(true);
                    } else if (buttonIndex === 3) {
                        onTag();
                    } else if (buttonIndex === 4) {
                        handleDelete();
                    }
                }
            );
        } else {
            // Android - use Alert
            Alert.alert(
                'Project Options',
                '',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Rename', onPress: onRename },
                    { text: 'Move to Folder', onPress: () => setShowFolderPicker(true) },
                    { text: 'Add Tags', onPress: onTag },
                    { text: 'Delete', style: 'destructive', onPress: handleDelete },
                ]
            );
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Project',
            `Are you sure you want to delete "${project.title}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        onDelete();
                    },
                },
            ]
        );
    };

    return (
        <>
            <TouchableOpacity
                style={styles.menuButton}
                onPress={showActionSheet}
                activeOpacity={0.7}
            >
                <Ionicons name="ellipsis-horizontal" size={20} color={Theme.textSecondary} />
            </TouchableOpacity>

            <FolderPicker
                visible={showFolderPicker}
                currentFolderId={project.folderId}
                onSelect={onMove}
                onClose={() => setShowFolderPicker(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    menuButton: {
        padding: 8,
        marginLeft: 8,
    },
});

