import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Colors';
import AIService from '../services/AIService';

type CreateOption = 'bullet' | 'mindmap' | 'journal' | 'meeting' | 'todo' | 'illustration' | 'video';

interface CreateTabProps {
    transcript: string;
    onContentCreated?: (type: CreateOption, content: string) => void;
}

export const CreateTab: React.FC<CreateTabProps> = ({ transcript, onContentCreated }) => {
    const [selectedOption, setSelectedOption] = useState<CreateOption | null>(null);
    const [content, setContent] = useState('');
    const [mindMapImageUri, setMindMapImageUri] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createOptions: { type: CreateOption; label: string; icon: string; description: string }[] = [
        {
            type: 'bullet',
            label: 'Bullet Points',
            icon: 'list',
            description: 'Extract key points as bullet list'
        },
        {
            type: 'mindmap',
            label: 'Mind Map',
            icon: 'git-network',
            description: 'Create a visual mind map structure'
        },
        {
            type: 'journal',
            label: 'Journal Entry',
            icon: 'book',
            description: 'Transform into a journal entry'
        },
        {
            type: 'meeting',
            label: 'Meeting Notes',
            icon: 'document-text',
            description: 'Create structured meeting notes'
        },
        {
            type: 'todo',
            label: 'Todo List',
            icon: 'checkbox',
            description: 'Extract actionable items'
        },
        {
            type: 'illustration',
            label: 'Illustration',
            icon: 'image',
            description: 'Generate visual illustration'
        },
        {
            type: 'video',
            label: 'Video',
            icon: 'videocam',
            description: 'Create video from transcript'
        },
    ];

    const handleOptionSelect = async (option: CreateOption) => {
        if (!transcript || transcript.trim().length === 0) {
            setError('No transcript available. Please ensure your project has a transcript.');
            return;
        }

        setSelectedOption(option);
        setIsGenerating(true);
        setError(null);
        setContent('');
        setMindMapImageUri(null);

        try {
            let generatedContent = '';
            let imageUri: string | null = null;

            switch (option) {
                case 'bullet':
                    generatedContent = await AIService.createBulletPoints(transcript);
                    break;
                case 'mindmap':
                    // Mind map tries to return an image, but falls back to text if image generation fails
                    try {
                        const result = await AIService.createMindMapImage(transcript);
                        // Check if it's a data URI (image) or URL (image) or text
                        if (result.startsWith('data:image/') || result.startsWith('http://') || result.startsWith('https://')) {
                            // It's an image
                            setMindMapImageUri(result);
                            generatedContent = 'Mind map image generated successfully.';
                        } else {
                            // It's a text-based mind map
                            generatedContent = result;
                            setContent(result);
                        }
                    } catch (err: any) {
                        // If image generation fails completely, generate text-based mind map
                        console.warn('Image generation failed, using text-based mind map:', err.message);
                        // Try to generate a structured text mind map
                        try {
                            generatedContent = await AIService.createBulletPoints(transcript);
                        } catch {
                            generatedContent = 'Failed to generate mind map. Please try again.';
                        }
                    }
                    break;
                case 'journal':
                    generatedContent = await AIService.createJournalEntry(transcript);
                    break;
                case 'meeting':
                    generatedContent = await AIService.createMeetingNotes(transcript);
                    break;
                case 'todo':
                    generatedContent = await AIService.createTodoList(transcript);
                    break;
                case 'illustration':
                    // For now, use a placeholder - can be enhanced later
                    generatedContent = 'Illustration generation feature coming soon.';
                    break;
                case 'video':
                    // Video generation uses existing generateScenes method
                    generatedContent = 'Video creation in progress...\n\nThis would create a video with scenes based on the transcript.';
                    break;
            }

            setContent(generatedContent);
            onContentCreated?.(option, generatedContent);
        } catch (err: any) {
            console.error('Content generation error:', err);
            setError(err.message || 'Failed to generate content. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClear = () => {
        setSelectedOption(null);
        setContent('');
        setMindMapImageUri(null);
        setError(null);
    };

    return (
        <View style={styles.container}>
            {!selectedOption ? (
                <ScrollView style={styles.optionsContainer} contentContainerStyle={styles.optionsContent}>
                    <Text style={styles.sectionTitle}>Create from Transcript</Text>
                    <Text style={styles.sectionDescription}>
                        Choose a format to transform your transcript
                    </Text>
                    
                    <View style={styles.optionsGrid}>
                        {createOptions.map((option) => (
                            <TouchableOpacity
                                key={option.type}
                                style={styles.optionCard}
                                onPress={() => handleOptionSelect(option.type)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.optionIconContainer}>
                                    <Ionicons name={option.icon as any} size={28} color={Theme.primary} />
                                </View>
                                <Text style={styles.optionLabel}>{option.label}</Text>
                                <Text style={styles.optionDescription}>{option.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            ) : (
                <View style={styles.contentContainer}>
                    <View style={styles.contentHeader}>
                        <View style={styles.contentHeaderLeft}>
                            <Ionicons 
                                name={createOptions.find(o => o.type === selectedOption)?.icon as any} 
                                size={20} 
                                color={Theme.primary} 
                            />
                            <Text style={styles.contentHeaderTitle}>
                                {createOptions.find(o => o.type === selectedOption)?.label}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={handleClear} style={styles.closeButton}>
                            <Ionicons name="close" size={20} color={Theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {isGenerating ? (
                        <View style={styles.generatingContainer}>
                            <ActivityIndicator size="large" color={Theme.primary} />
                            <Text style={styles.generatingText}>Generating content...</Text>
                            {selectedOption === 'mindmap' && (
                                <Text style={styles.generatingSubtext}>Creating mind map image...</Text>
                            )}
                        </View>
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle-outline" size={32} color={Theme.error || '#FF3B30'} />
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity 
                                style={styles.retryButton}
                                onPress={() => selectedOption && handleOptionSelect(selectedOption)}
                            >
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : selectedOption === 'mindmap' && mindMapImageUri && (mindMapImageUri.startsWith('data:image/') || mindMapImageUri.startsWith('http://') || mindMapImageUri.startsWith('https://')) ? (
                        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.imageContainer}>
                            <Image 
                                source={{ uri: mindMapImageUri }} 
                                style={styles.mindMapImage}
                                resizeMode="contain"
                            />
                        </ScrollView>
                    ) : (
                        <ScrollView style={styles.contentScroll}>
                            <TextInput
                                style={styles.contentInput}
                                multiline
                                value={content}
                                onChangeText={setContent}
                                placeholder="Generated content will appear here..."
                                placeholderTextColor={Theme.textTertiary}
                                textAlignVertical="top"
                            />
                        </ScrollView>
                    )}

                    {!isGenerating && !error && (content || mindMapImageUri) && (
                        <View style={styles.contentActions}>
                            {selectedOption !== 'mindmap' && (
                                <TouchableOpacity style={styles.actionButton}>
                                    <Ionicons name="copy-outline" size={18} color={Theme.primary} />
                                    <Text style={styles.actionButtonText}>Copy</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.actionButton}>
                                <Ionicons name="share-outline" size={18} color={Theme.primary} />
                                <Text style={styles.actionButtonText}>Share</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton}>
                                <Ionicons name="download-outline" size={18} color={Theme.primary} />
                                <Text style={styles.actionButtonText}>Export</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    optionsContainer: {
        flex: 1,
    },
    optionsContent: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 15,
        color: Theme.textSecondary,
        marginBottom: 24,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    optionCard: {
        width: '47%',
        backgroundColor: Theme.surfaceHighlight,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.border,
    },
    optionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Theme.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    optionDescription: {
        fontSize: 12,
        color: Theme.textSecondary,
        textAlign: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    contentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Theme.border,
    },
    contentHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contentHeaderTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Theme.text,
    },
    closeButton: {
        padding: 4,
    },
    generatingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    generatingText: {
        fontSize: 16,
        color: Theme.textSecondary,
    },
    contentScroll: {
        flex: 1,
    },
    contentInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        lineHeight: 24,
        color: Theme.text,
        minHeight: 200,
    },
    contentActions: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: Theme.border,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.surfaceHighlight,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.primary,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 12,
    },
    errorText: {
        fontSize: 15,
        color: Theme.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    retryButton: {
        marginTop: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Theme.primary,
        borderRadius: 8,
    },
    retryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
    imageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    mindMapImage: {
        width: '100%',
        minHeight: 400,
        borderRadius: 12,
        backgroundColor: Theme.surfaceHighlight,
    },
    generatingSubtext: {
        fontSize: 14,
        color: Theme.textTertiary,
        marginTop: 4,
    },
});

