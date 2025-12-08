import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Theme } from '../constants/Colors';
import { Folder } from '../services/MockAIService';
import { useProjectStore } from '../store/useProjectStore';

interface FolderCardProps {
    folder: Folder;
    onPress: () => void;
    onLongPress?: () => void;
    index?: number;
}

export const FolderCard: React.FC<FolderCardProps> = ({ folder, onPress, onLongPress, index = 0 }) => {
    const { getProjectsByFolder } = useProjectStore();
    const projectCount = getProjectsByFolder(folder.id).length;
    const isDefaultFolder = folder.id === 'all-projects';

    return (
        <Animated.View entering={FadeInRight.delay(index * 50).springify()}>
            <TouchableOpacity
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.7}
                style={styles.container}
            >
                <View style={[styles.iconContainer, folder.color && { backgroundColor: folder.color + '20' }]}>
                    <Ionicons 
                        name={folder.icon as any || (isDefaultFolder ? 'folder-outline' : 'folder')} 
                        size={24} 
                        color={folder.color || Theme.primary} 
                    />
                </View>
                <View style={styles.content}>
                    <Text style={styles.name} numberOfLines={1}>{folder.name}</Text>
                    <Text style={styles.count}>
                        {projectCount} {projectCount === 1 ? 'project' : 'projects'}
                    </Text>
                </View>
                <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={16} color={Theme.textTertiary} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,122,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 17,
        fontWeight: '600',
        color: Theme.text,
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    count: {
        fontSize: 13,
        color: Theme.textSecondary,
        fontWeight: '500',
    },
    arrowContainer: {
        marginLeft: 8,
    },
});

