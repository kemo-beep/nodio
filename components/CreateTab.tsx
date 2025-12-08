import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Colors';

type CreateOption = 'bullet' | 'mindmap' | 'journal' | 'todo' | 'illustration' | 'video';

interface CreateTabProps {
    transcript: string;
    onContentCreated?: (type: CreateOption, content: string) => void;
}

export const CreateTab: React.FC<CreateTabProps> = ({ transcript, onContentCreated }) => {
    const [selectedOption, setSelectedOption] = useState<CreateOption | null>(null);
    const [content, setContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

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
        setSelectedOption(option);
        setIsGenerating(true);

        // Simulate AI generation (replace with actual AI service call)
        setTimeout(() => {
            let generatedContent = '';
            
            switch (option) {
                case 'bullet':
                    generatedContent = transcript
                        .split('.')
                        .filter(s => s.trim().length > 0)
                        .slice(0, 5)
                        .map(s => `• ${s.trim()}`)
                        .join('\n');
                    break;
                case 'mindmap':
                    generatedContent = `Central Topic: ${transcript.substring(0, 30)}...\n\nMain Branches:\n- Key Point 1\n- Key Point 2\n- Key Point 3`;
                    break;
                case 'journal':
                    generatedContent = `Today's Entry:\n\n${transcript}\n\nReflection: This was an interesting conversation that covered several important topics.`;
                    break;
                case 'todo':
                    generatedContent = transcript
                        .split(/[.!?]/)
                        .filter(s => s.trim().length > 10)
                        .slice(0, 3)
                        .map((s, i) => `[ ] ${s.trim()}`)
                        .join('\n');
                    break;
                case 'illustration':
                    generatedContent = 'Illustration generation in progress...\n\nThis would generate a visual representation based on the transcript.';
                    break;
                case 'video':
                    generatedContent = 'Video creation in progress...\n\nThis would create a video with scenes based on the transcript.';
                    break;
            }

            setContent(generatedContent);
            setIsGenerating(false);
            onContentCreated?.(option, generatedContent);
        }, 1500);
    };

    const handleClear = () => {
        setSelectedOption(null);
        setContent('');
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
                            <Ionicons name="hourglass-outline" size={32} color={Theme.primary} />
                            <Text style={styles.generatingText}>Generating content...</Text>
                        </View>
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

                    {!isGenerating && content && (
                        <View style={styles.contentActions}>
                            <TouchableOpacity style={styles.actionButton}>
                                <Ionicons name="copy-outline" size={18} color={Theme.primary} />
                                <Text style={styles.actionButtonText}>Copy</Text>
                            </TouchableOpacity>
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
});

