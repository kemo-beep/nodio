import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Colors';
import { useFolderStore } from '../store/useFolderStore';

interface FolderPickerProps {
    visible: boolean;
    currentFolderId: string | null;
    onSelect: (folderId: string | null) => void;
    onClose: () => void;
}

export const FolderPicker: React.FC<FolderPickerProps> = ({ visible, currentFolderId, onSelect, onClose }) => {
    const { folders } = useFolderStore();

    const handleSelect = (folderId: string | null) => {
        onSelect(folderId);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Move to Folder</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {folders.map((folder) => {
                            const isSelected = folder.id === currentFolderId;
                            return (
                                <TouchableOpacity
                                    key={folder.id}
                                    style={[styles.folderItem, isSelected && styles.folderItemSelected]}
                                    onPress={() => handleSelect(folder.id)}
                                >
                                    <View style={styles.folderItemContent}>
                                        <View style={[styles.folderIcon, folder.color && { backgroundColor: folder.color + '20' }]}>
                                            <Ionicons
                                                name={folder.icon as any || 'folder'}
                                                size={20}
                                                color={folder.color || Theme.primary}
                                            />
                                        </View>
                                        <Text style={styles.folderName}>{folder.name}</Text>
                                    </View>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={24} color={Theme.primary} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: Theme.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
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
    folderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: Theme.surface,
    },
    folderItemSelected: {
        backgroundColor: Theme.primary + '10',
        borderWidth: 1,
        borderColor: Theme.primary,
    },
    folderItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    folderIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,122,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    folderName: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.text,
    },
});

