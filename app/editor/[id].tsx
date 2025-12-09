import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AudioPlayer } from '../../components/AudioPlayer';
import { CreateTab } from '../../components/CreateTab';
import { TagChip } from '../../components/TagChip';
import { TagSelector } from '../../components/TagSelector';
import { TitleEditor } from '../../components/TitleEditor';
import { WritingTools } from '../../components/WritingTools';
import { Theme } from '../../constants/Colors';
import { CommonStyles } from '../../constants/Styles';
import AIService from '../../services/AIService';
import { useFolderStore } from '../../store/useFolderStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useTagStore } from '../../store/useTagStore';

export default function EditorScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const {
        setCurrentProject,
        currentProject,
        updateProjectTranscript,
        updateProjectTitle,
        addTagsToProject,
        removeTagFromProject,
    } = useProjectStore();
    const { getFolderById } = useFolderStore();
    const { getTagById } = useTagStore();

    const [activeTab, setActiveTab] = useState<'notes' | 'transcript' | 'create'>('notes');
    const [isProcessing, setIsProcessing] = useState(false);
    const [summary, setSummary] = useState<string>('');
    const [audioDuration, setAudioDuration] = useState<number>(0);
    const [isLoadingSummary, setIsLoadingSummary] = useState(false);
    const [writingToolVisible, setWritingToolVisible] = useState(false);
    const [selectedTool, setSelectedTool] = useState<'summarize' | 'rewrite' | 'translate' | null>(null);
    const [tagSelectorVisible, setTagSelectorVisible] = useState(false);

    useEffect(() => {
        if (id) {
            setCurrentProject(id as string).catch((error) => {
                console.error('Failed to load project:', error);
            });
        }
    }, [id, setCurrentProject]);

    const loadAudioDuration = useCallback(async () => {
        if (!currentProject?.audioUri) return;

        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: currentProject.audioUri },
                { shouldPlay: false }
            );
            const status = await sound.getStatusAsync();
            if (status.isLoaded && status.durationMillis) {
                setAudioDuration(status.durationMillis);
            }
            await sound.unloadAsync();
        } catch (error) {
            console.error('Failed to load audio duration:', error);
        }
    }, [currentProject?.audioUri]);

    const loadSummary = useCallback(async () => {
        if (!currentProject?.transcript) return;

        setIsLoadingSummary(true);
        try {
            const generatedSummary = await AIService.transformText(currentProject.transcript, 'summarize');
            setSummary(generatedSummary);
        } catch (error) {
            console.error('Failed to generate summary:', error);
            // Fallback to a simple summary
            const sentences = currentProject.transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
            setSummary(sentences.slice(0, 2).join('. ') + '.');
        } finally {
            setIsLoadingSummary(false);
        }
    }, [currentProject?.transcript]);

    useEffect(() => {
        if (currentProject) {
            loadAudioDuration();
            loadSummary();
        }
    }, [currentProject, loadAudioDuration, loadSummary]);

    if (!currentProject) {
        return (
            <SafeAreaView style={CommonStyles.container}>
                <View style={styles.center}>
                    <Text style={CommonStyles.text}>Project not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const formatDate = (date: Date) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    };

    const formatDuration = (milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    };

    const handleToolPress = (tool: 'summarize' | 'rewrite' | 'translate') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedTool(tool);
        setWritingToolVisible(true);
    };

    const handleTransformText = async (text: string, tool: 'summarize' | 'rewrite' | 'translate', targetLanguage?: string): Promise<string> => {
        setIsProcessing(true);
        try {
            const transformedText = await AIService.transformText(text, tool, targetLanguage);
            return transformedText;
        } catch (error) {
            console.error('Text transformation error:', error);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApplyTransformation = (transformedText: string) => {
        if (selectedTool === 'summarize') {
            setSummary(transformedText);
        } else {
            updateProjectTranscript(currentProject.id, transformedText);
        }
        // Show success feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    return (
        <SafeAreaView style={CommonStyles.container}>
            <Stack.Screen options={{
                headerShown: true,
                title: '',
                headerTransparent: true,
                headerBackground: () => (
                    <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
                ),
                headerTintColor: Theme.text,
                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => router.push(`/preview/${currentProject.id}`)}
                        style={{
                            backgroundColor: Theme.primary + '15',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 16,
                        }}
                    >
                        <Text style={{ color: Theme.primary, fontSize: 15, fontWeight: '600' }}>Preview</Text>
                    </TouchableOpacity>
                )
            }} />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Title Section */}
                <View style={styles.titleSection}>
                    <TitleEditor
                        title={currentProject.title}
                        onSave={(newTitle) => updateProjectTitle(currentProject.id, newTitle)}
                        placeholder="Untitled Project"
                        style={styles.titleEditor}
                    />
                    <View style={styles.metadataContainer}>
                        <Text style={styles.metadata}>
                            {formatDate(currentProject.date)} • {formatDuration(audioDuration)}
                        </Text>
                        {currentProject.folderId && (
                            <>
                                <Text style={styles.metadataSeparator}>•</Text>
                                <Text style={styles.metadata}>
                                    {getFolderById(currentProject.folderId)?.name || 'Folder'}
                                </Text>
                            </>
                        )}
                    </View>

                    {/* Tags Section */}
                    <View style={styles.tagsSection}>
                        <View style={styles.tagsHeader}>
                            <Text style={styles.tagsSectionTitle}>Tags</Text>
                            <TouchableOpacity
                                onPress={() => setTagSelectorVisible(true)}
                                style={styles.addTagButton}
                            >
                                <Ionicons name="add-circle-outline" size={20} color={Theme.primary} />
                                <Text style={styles.addTagText}>Add Tags</Text>
                            </TouchableOpacity>
                        </View>
                        {currentProject.tags && currentProject.tags.length > 0 ? (
                            <View style={styles.tagsContainer}>
                                {currentProject.tags.map((tagId) => {
                                    const tag = getTagById(tagId);
                                    if (!tag) return null;
                                    return (
                                        <View key={tagId} style={styles.tagWrapper}>
                                            <TagChip
                                                tag={tag}
                                                size="medium"
                                                showRemove
                                                onRemove={() => removeTagFromProject(currentProject.id, tagId)}
                                            />
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={styles.emptyTagsContainer}>
                                <Text style={styles.emptyTagsText}>
                                    No tags. Tap &quot;Add Tags&quot; to organize this project.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Audio Player */}
                {currentProject.audioUri && (
                    <View style={styles.audioPlayerContainer}>
                        <AudioPlayer audioUri={currentProject.audioUri} />
                    </View>
                )}

                {/* Tabs */}
                <View style={styles.tabBarContainer}>
                    <View style={styles.tabBar}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'notes' && styles.activeTab]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setActiveTab('notes');
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>AI Notes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'transcript' && styles.activeTab]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setActiveTab('transcript');
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, activeTab === 'transcript' && styles.activeTabText]}>Transcript</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'create' && styles.activeTab]}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setActiveTab('create');
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabText, activeTab === 'create' && styles.activeTabText]}>Create</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                    {activeTab === 'notes' && (
                        <View style={styles.notesContainer}>
                            {/* Writing Tools */}
                            <View style={styles.toolsSection}>
                                <Text style={styles.toolsSectionTitle}>Writing Tools</Text>
                                <View style={styles.toolsGrid}>
                                    <TouchableOpacity
                                        style={[styles.toolCard, isProcessing && styles.toolCardDisabled]}
                                        onPress={() => handleToolPress('summarize')}
                                        disabled={isProcessing}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.toolIconContainer}>
                                            <Ionicons name="flash" size={20} color={Theme.primary} />
                                        </View>
                                        <Text style={styles.toolCardLabel}>Summarize</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.toolCard, isProcessing && styles.toolCardDisabled]}
                                        onPress={() => handleToolPress('rewrite')}
                                        disabled={isProcessing}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.toolIconContainer}>
                                            <Ionicons name="create" size={20} color={Theme.primary} />
                                        </View>
                                        <Text style={styles.toolCardLabel}>Rewrite</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.toolCard, isProcessing && styles.toolCardDisabled]}
                                        onPress={() => handleToolPress('translate')}
                                        disabled={isProcessing}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.toolIconContainer}>
                                            <Ionicons name="language" size={20} color={Theme.primary} />
                                        </View>
                                        <Text style={styles.toolCardLabel}>Translate</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Summary Section */}
                            <View style={styles.summarySection}>
                                <Text style={styles.summarySectionTitle}>AI Summary</Text>
                                {isLoadingSummary ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color={Theme.primary} />
                                        <Text style={styles.loadingTextSmall}>Generating summary...</Text>
                                    </View>
                                ) : summary ? (
                                    <View style={styles.summaryBox}>
                                        <Text style={styles.summaryText}>{summary}</Text>
                                    </View>
                                ) : (
                                    <View style={styles.emptySummaryBox}>
                                        <Ionicons name="document-text-outline" size={32} color={Theme.textTertiary} />
                                        <Text style={styles.emptySummaryText}>
                                            Click &quot;Summarize&quot; above to generate an AI summary of your transcript.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {activeTab === 'transcript' && (
                        <View style={styles.transcriptContainer}>
                            <TextInput
                                style={styles.transcriptInput}
                                multiline
                                value={currentProject.transcript}
                                onChangeText={(text) => updateProjectTranscript(currentProject.id, text)}
                                placeholder="Start speaking or typing..."
                                placeholderTextColor={Theme.textTertiary}
                                textAlignVertical="top"
                                onBlur={() => Keyboard.dismiss()}
                            />
                        </View>
                    )}

                    {activeTab === 'create' && (
                        <CreateTab transcript={currentProject.transcript} />
                    )}
                </View>
            </ScrollView>

            {/* Writing Tools Modal */}
            <WritingTools
                visible={writingToolVisible}
                originalText={currentProject.transcript}
                toolType={selectedTool}
                onClose={() => {
                    setWritingToolVisible(false);
                    setSelectedTool(null);
                }}
                onApply={handleApplyTransformation}
                onTransform={handleTransformText}
                isProcessing={isProcessing}
            />

            {isProcessing && !writingToolVisible && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Theme.primary} />
                    <Text style={styles.loadingText}>AI Processing...</Text>
                </View>
            )}

            {/* Tag Selector Modal */}
            <TagSelector
                visible={tagSelectorVisible}
                selectedTagIds={currentProject.tags || []}
                onSelect={(tagIds) => {
                    const currentTags = currentProject.tags || [];
                    const addedTags = tagIds.filter(id => !currentTags.includes(id));
                    const removedTags = currentTags.filter(id => !tagIds.includes(id));

                    if (addedTags.length > 0) {
                        addTagsToProject(currentProject.id, addedTags);
                    }
                    removedTags.forEach(tagId => {
                        removeTagFromProject(currentProject.id, tagId);
                    });
                }}
                onClose={() => setTagSelectorVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 100, // Space for transparent header
        paddingBottom: 40,
    },
    titleSection: {
        padding: 20,
        paddingBottom: 12,
    },
    titleEditor: {
        marginBottom: 8,
    },
    metadataContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    metadata: {
        fontSize: 13,
        color: Theme.textSecondary,
        fontWeight: '500',
    },
    metadataSeparator: {
        fontSize: 13,
        color: Theme.textTertiary,
        marginHorizontal: 6,
    },
    tagsSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Theme.border,
    },
    tagsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    tagsSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Theme.text,
    },
    addTagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 4,
    },
    addTagText: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.primary,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagWrapper: {
        marginBottom: 4,
    },
    emptyTagsContainer: {
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: Theme.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Theme.border,
        borderStyle: 'dashed',
    },
    emptyTagsText: {
        fontSize: 13,
        color: Theme.textSecondary,
        textAlign: 'center',
    },
    audioPlayerContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    tabBarContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: Theme.surface,
        borderRadius: 20,
        padding: 4,
        ...Theme.shadows.medium,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 16,
    },
    activeTab: {
        backgroundColor: Theme.primary,
        shadowColor: Theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.textSecondary,
    },
    activeTabText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    tabContent: {
        flex: 1,
        minHeight: 400,
    },
    notesContainer: {
        padding: 20,
    },
    toolsSection: {
        marginBottom: 24,
        alignSelf: 'center',
        width: '85%',
    },
    toolsSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 10,
    },
    toolsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    toolCard: {
        width: '31%',
        backgroundColor: Theme.surface,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        ...Theme.shadows.small,
    },
    toolCardDisabled: {
        opacity: 0.5,
    },
    toolIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Theme.surfaceHighlight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    toolCardLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Theme.text,
    },
    summarySection: {
        marginTop: 8,
    },
    summarySectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 12,
    },
    summaryBox: {
        backgroundColor: Theme.surfaceHighlight,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    summaryText: {
        fontSize: 16,
        lineHeight: 24,
        color: Theme.text,
    },
    emptySummaryBox: {
        backgroundColor: Theme.surfaceHighlight,
        borderRadius: 12,
        padding: 24,
        borderWidth: 1,
        borderColor: Theme.border,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    emptySummaryText: {
        fontSize: 14,
        color: Theme.textSecondary,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 20,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 20,
    },
    loadingTextSmall: {
        fontSize: 15,
        color: Theme.textSecondary,
    },
    transcriptContainer: {
        flex: 1,
    },
    transcriptInput: {
        flex: 1,
        padding: 16,
        fontSize: 17,
        lineHeight: 24,
        color: Theme.text,
        minHeight: 400,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#FFF',
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
    },
});
