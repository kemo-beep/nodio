import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Theme } from '../constants/Colors';
import { Project } from '../services/MockAIService';

interface ProjectCardProps {
    project: Project;
    onPress: () => void;
    index?: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress, index = 0 }) => {
    return (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <TouchableOpacity
                onPress={onPress}
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
                            {new Date(project.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Text>
                        <View style={styles.dot} />
                        <Text style={styles.scenes}>
                            {project.scenes.length} {project.scenes.length === 1 ? 'Scene' : 'Scenes'}
                        </Text>
                    </View>
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
});
