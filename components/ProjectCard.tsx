import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Theme } from '../constants/Colors';
import { Project } from '../services/MockAIService';
import { useTagStore } from '../store/useTagStore';

interface ProjectCardProps {
    project: Project;
    onPress: () => void;
    onLongPress?: () => void;
    index?: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress, onLongPress, index = 0 }) => {
    const { getTagById } = useTagStore();
    const tags = (project.tags || []).slice(0, 3).map(tagId => getTagById(tagId)).filter(Boolean);
    const remainingTagsCount = (project.tags || []).length - tags.length;

    return (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <TouchableOpacity
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.7}
                style={styles.container}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name="mic" size={20} color={Theme.primary} />
                </View>
                <View style={styles.content}>
                    <Text style={styles.title} numberOfLines={1}>{project.title}</Text>
                    <View style={styles.metaContainer}>
                        <Text style={styles.date}>
                            {new Date(project.updatedAt || project.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Text>
                        <View style={styles.dot} />
                        <Text style={styles.scenes}>
                            {(() => {
                                const totalScenes = project.videos?.reduce((sum, video) => sum + (video.scenes?.length || 0), 0) || 0;
                                if (totalScenes > 0) {
                                    return `${totalScenes} ${totalScenes === 1 ? 'Scene' : 'Scenes'}`;
                                }
                                const videoCount = project.videos?.length || 0;
                                if (videoCount > 0) {
                                    return `${videoCount} ${videoCount === 1 ? 'Video' : 'Videos'}`;
                                }
                                return 'No videos';
                            })()}
                        </Text>
                    </View>
                    {tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {tags.map((tag) => (
                                <View
                                    key={tag!.id}
                                    style={[styles.tagChip, { backgroundColor: tag!.color + '20' }]}
                                >
                                    <Text style={[styles.tagText, { color: tag!.color }]} numberOfLines={1}>
                                        {tag!.name}
                                    </Text>
                                </View>
                            ))}
                            {remainingTagsCount > 0 && (
                                <Text style={styles.moreTagsText}>+{remainingTagsCount}</Text>
                            )}
                        </View>
                    )}
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
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,122,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: Theme.text,
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    date: {
        fontSize: 13,
        color: Theme.textSecondary,
        fontWeight: '500',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: Theme.textTertiary,
        marginHorizontal: 6,
    },
    scenes: {
        fontSize: 13,
        color: Theme.textSecondary,
        fontWeight: '500',
    },
    arrowContainer: {
        marginLeft: 8,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 6,
    },
    tagChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 4,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    moreTagsText: {
        fontSize: 11,
        color: Theme.textSecondary,
        fontWeight: '500',
        marginTop: 2,
    },
});
