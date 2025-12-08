import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Colors';
import { Folder } from '../services/MockAIService';
import { useFolderStore } from '../store/useFolderStore';
import { useProjectStore } from '../store/useProjectStore';

interface FolderModalProps {
    visible: boolean;
    folder: Folder | null;
    onClose: () => void;
    onDelete?: () => void;
}

export const FolderModal: React.FC<FolderModalProps> = ({ visible, folder, onClose, onDelete }) => {
    const { createFolder, updateFolder, deleteFolder, folders, currentFolderId, getFolderById } = useFolderStore();
    const { getProjectsByFolder, moveProjectToFolder } = useProjectStore();
    const [folderName, setFolderName] = useState('');
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const isEditing = folder !== null;
    const isDefaultFolder = folder?.id === 'all-projects';

    useEffect(() => {
        if (folder) {
            setFolderName(folder.name);
            setSelectedParentId(folder.parentId || null);
        } else {
            setFolderName('');
            setSelectedParentId(currentFolderId); // Default to current folder when creating
        }
    }, [folder, visible, currentFolderId]);

    const handleSave = () => {
        const trimmedName = folderName.trim();
        if (!trimmedName) {
            Alert.alert('Invalid Name', 'Folder name cannot be empty.');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        if (isEditing) {
            if (isDefaultFolder) {
                Alert.alert('Cannot Edit', 'The "All Projects" folder cannot be renamed.');
                return;
            }
            updateFolder(folder.id, { name: trimmedName, parentId: selectedParentId });
        } else {
            createFolder(trimmedName, selectedParentId);
        }
        onClose();
    };

    const handleDelete = () => {
        if (!folder || isDefaultFolder) return;

        const projectsInFolder = getProjectsByFolder(folder.id);
        const projectCount = projectsInFolder.length;

        Alert.alert(
            'Delete Folder',
            projectCount > 0
                ? `This folder contains ${projectCount} ${projectCount === 1 ? 'project' : 'projects'}. What would you like to do?`
                : 'Are you sure you want to delete this folder?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                ...(projectCount > 0
                    ? [
                        {
                            text: 'Move to All Projects',
                            onPress: () => {
                                projectsInFolder.forEach(p => moveProjectToFolder(p.id, null));
                                deleteFolder(folder.id);
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                onClose();
                                if (onDelete) onDelete();
                            },
                        },
                    ]
                    : [
                        {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => {
                                deleteFolder(folder.id);
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                onClose();
                                if (onDelete) onDelete();
                            },
                        },
                    ]),
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {isEditing ? 'Edit Folder' : 'New Folder'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Theme.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.label}>Folder Name</Text>
                        <TextInput
                            style={styles.input}
                            value={folderName}
                            onChangeText={setFolderName}
                            placeholder="Enter folder name"
                            placeholderTextColor={Theme.textTertiary}
                            autoFocus
                            maxLength={50}
                            onSubmitEditing={handleSave}
                        />
                    </View>

                    <View style={styles.actions}>
                        {isEditing && !isDefaultFolder && (
                            <TouchableOpacity
                                style={[styles.button, styles.deleteButton]}
                                onPress={handleDelete}
                            >
                                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                        )}
                        <View style={styles.rightActions}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={onClose}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleSave}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: Theme.background,
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Theme.border,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Theme.text,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: Theme.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Theme.surface,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Theme.text,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: Theme.border,
    },
    rightActions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cancelButton: {
        backgroundColor: Theme.surface,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.textSecondary,
    },
    saveButton: {
        backgroundColor: Theme.primary,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    deleteButton: {
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
    },
});

