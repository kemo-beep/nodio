import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Colors';
import { Folder } from '../services/MockAIService';
import { useFolderStore } from '../store/useFolderStore';
import { useProjectStore } from '../store/useProjectStore';

interface FolderListItemProps {
    folder: Folder;
    onPress: () => void;
    onLongPress?: () => void;
    isSelected?: boolean;
}

export const FolderListItem: React.FC<FolderListItemProps> = ({ 
    folder, 
    onPress, 
    onLongPress,
    isSelected = false 
}) => {
    const { getProjectsByFolder } = useProjectStore();
    const { getFoldersByParent } = useFolderStore();
    const projectCount = getProjectsByFolder(folder.id).length;
    const subfolderCount = getFoldersByParent(folder.id).length;
    const totalCount = projectCount + subfolderCount;
    const isDefaultFolder = folder.id === 'all-projects';

    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            style={[styles.container, isSelected && styles.containerSelected]}
        >
            <View style={[styles.iconContainer, folder.color && { backgroundColor: folder.color + '20' }]}>
                <Ionicons 
                    name={folder.icon as any || (isDefaultFolder ? 'folder-outline' : 'folder')} 
                    size={22} 
                    color={folder.color || Theme.primary} 
                />
            </View>
            <View style={styles.content}>
                <Text style={styles.name} numberOfLines={1}>{folder.name}</Text>
            </View>
            {totalCount > 0 && (
                <Text style={styles.count}>{totalCount}</Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={Theme.textTertiary} style={styles.chevron} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'transparent',
    },
    containerSelected: {
        backgroundColor: Theme.surface,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: 'rgba(0,122,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 17,
        fontWeight: '400',
        color: Theme.text,
    },
    count: {
        fontSize: 15,
        color: Theme.textSecondary,
        fontWeight: '400',
        marginRight: 8,
    },
    chevron: {
        opacity: 0.5,
    },
});

