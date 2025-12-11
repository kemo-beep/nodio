import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
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
                headerStyle: {
                    backgroundColor: Theme.background,
                },
                headerTintColor: Theme.primary, // Yellow back button
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -8 }}
                    >
                        <Ionicons name="chevron-back" size={28} color={Theme.primary} />
                        <Text style={{ fontSize: 17, color: Theme.primary, marginLeft: -4 }}>Projects</Text>
                    </TouchableOpacity>
                ),
                headerRight: () => (
                    <TouchableOpacity
                        onPress={() => router.push(`/preview/${currentProject.id}`)}
                        style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                        }}
                    >
                        <Ionicons name="share-outline" size={24} color={Theme.primary} />
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
                        textStyle={Theme.typography.largeTitle}
                    />
                    <View style={styles.metadataContainer}>
                        <Text style={styles.metadata}>
                            {formatDate(currentProject.date)}
                        </Text>
                        {currentProject.folderId && (
                            <Text style={styles.metadata}>
                                {' '}{getFolderById(currentProject.folderId)?.name || 'Folder'}
                            </Text>
                        )}
                    </View>

                    {/* Tags Section */}
                    {/* ... (Tags section remains similar but maybe subtler) ... */}
                    <View style={styles.tagsSection}>
                        {/* Simplified tags for now, or keep as is but cleaner */}
                        <View style={styles.tagsHeader}>
                            <Text style={styles.tagsSectionTitle}>Tags</Text>
                            <TouchableOpacity
                                onPress={() => setTagSelectorVisible(true)}
                                style={styles.addTagButton}
                            >
                                <Ionicons name="add-circle" size={20} color={Theme.primary} />
                                <Text style={styles.addTagText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                        {/* ... existing tag logic ... */}
                        {currentProject.tags && currentProject.tags.length > 0 ? (
                            <View style={styles.tagsContainer}>
                                {currentProject.tags.map((tagId) => {
                                    const tag = getTagById(tagId);
                                    if (!tag) return null;
                                    return (
                                        <View key={tagId} style={styles.tagWrapper}>
                                            <TagChip
                                                tag={tag}
                                                size="small"
                                                showRemove
                                                onRemove={() => removeTagFromProject(currentProject.id, tagId)}
                                            />
                                        </View>
                                    );
                                })}
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Audio Player */}
                {currentProject.audioUri && (
                    <View style={styles.audioPlayerContainer}>
                        <AudioPlayer audioUri={currentProject.audioUri} />
                    </View>
                )}

                {/* Tabs - Segmented Control Style */}
                <View style={styles.tabBarContainer}>
                    <View style={styles.segmentedControl}>
                        <TouchableOpacity
                            style={[styles.segment, activeTab === 'notes' && styles.segmentActive]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setActiveTab('notes');
                            }}
                        >
                            <Text style={[styles.segmentText, activeTab === 'notes' && styles.segmentTextActive]}>Notes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segment, activeTab === 'transcript' && styles.segmentActive]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setActiveTab('transcript');
                            }}
                        >
                            <Text style={[styles.segmentText, activeTab === 'transcript' && styles.segmentTextActive]}>Transcript</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segment, activeTab === 'create' && styles.segmentActive]}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setActiveTab('create');
                            }}
                        >
                            <Text style={[styles.segmentText, activeTab === 'create' && styles.segmentTextActive]}>Create</Text>
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
        paddingTop: 5,
        paddingBottom: 40,
    },
    titleSection: {
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    titleEditor: {
        marginBottom: 4,
    },
    metadataContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    metadata: {
        fontSize: 15,
        color: Theme.textSecondary,
        fontWeight: '400',
    },
    metadataSeparator: {
        display: 'none',
    },
    tagsSection: {
        marginTop: 0,
        paddingTop: 0,
        borderTopWidth: 0,
    },
    tagsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    tagsSectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Theme.textSecondary,
        marginRight: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    addTagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addTagText: {
        fontSize: 13,
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
        display: 'none',
    },
    emptyTagsText: {
        display: 'none',
    },
    audioPlayerContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    tabBarContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: 'rgba(118, 118, 128, 0.12)',
        borderRadius: 8,
        padding: 2,
    },
    segment: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    segmentActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '500',
        color: Theme.text,
    },
    segmentTextActive: {
        fontWeight: '600',
    },
    tabBar: {
        display: 'none',
    },
    tab: {
        display: 'none',
    },
    activeTab: {
        display: 'none',
    },
    tabText: {
        display: 'none',
    },
    activeTabText: {
        display: 'none',
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
    },
    toolsSectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Theme.textSecondary,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    toolsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    toolCard: {
        flex: 1,
        backgroundColor: Theme.surfaceSecondary,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    toolCardDisabled: {
        opacity: 0.5,
    },
    toolIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Theme.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    toolCardLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: Theme.text,
    },
    summarySection: {
        marginTop: 8,
    },
    summarySectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 12,
    },
    summaryBox: {
        backgroundColor: Theme.surfaceSecondary,
        borderRadius: 12,
        padding: 16,
    },
    summaryText: {
        fontSize: 17,
        lineHeight: 24,
        color: Theme.text,
    },
    emptySummaryBox: {
        backgroundColor: Theme.surfaceSecondary,
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    emptySummaryText: {
        fontSize: 15,
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
        padding: 20,
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
