import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Colors';

type ToolType = 'summarize' | 'rewrite' | 'translate';

interface WritingToolsProps {
    visible: boolean;
    originalText: string;
    toolType: ToolType | null;
    onClose: () => void;
    onApply: (transformedText: string) => void;
    onTransform: (text: string, tool: ToolType) => Promise<string>;
    isProcessing: boolean;
}

export const WritingTools: React.FC<WritingToolsProps> = ({
    visible,
    originalText,
    toolType,
    onClose,
    onApply,
    onTransform,
    isProcessing
}) => {
    const [transformedText, setTransformedText] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    React.useEffect(() => {
        if (visible && toolType && originalText) {
            generateTransformation();
        } else {
            setTransformedText('');
        }
    }, [visible, toolType, originalText]);

    const generateTransformation = async () => {
        if (!toolType || !originalText) return;
        
        setIsGenerating(true);
        try {
            const result = await onTransform(originalText, toolType);
            setTransformedText(result);
        } catch (error) {
            console.error('Transformation error:', error);
            setTransformedText('Failed to generate transformation. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApply = () => {
        if (transformedText) {
            onApply(transformedText);
            onClose();
        }
    };

    const handleRegenerate = () => {
        generateTransformation();
    };

    const getToolLabel = () => {
        switch (toolType) {
            case 'summarize':
                return 'Summarize';
            case 'rewrite':
                return 'Rewrite';
            case 'translate':
                return 'Translate';
            default:
                return 'Writing Tools';
        }
    };

    const getToolDescription = () => {
        switch (toolType) {
            case 'summarize':
                return 'Create a concise summary';
            case 'rewrite':
                return 'Improve clarity and flow';
            case 'translate':
                return 'Translate to Spanish';
            default:
                return '';
        }
    };

    if (!toolType) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Ionicons name="sparkles" size={24} color={Theme.primary} />
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle}>{getToolLabel()}</Text>
                                <Text style={styles.headerDescription}>{getToolDescription()}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                        {isGenerating ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={Theme.primary} />
                                <Text style={styles.loadingText}>Generating...</Text>
                            </View>
                        ) : (
                            <>
                                {/* Original Text Preview */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionLabel}>Original</Text>
                                    <View style={styles.textContainer}>
                                        <Text style={styles.previewText} numberOfLines={3}>
                                            {originalText}
                                        </Text>
                                    </View>
                                </View>

                                {/* Transformed Text */}
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Text style={styles.sectionLabel}>Result</Text>
                                        <TouchableOpacity
                                            onPress={handleRegenerate}
                                            style={styles.regenerateButton}
                                            disabled={isGenerating}
                                        >
                                            <Ionicons name="refresh" size={16} color={Theme.primary} />
                                            <Text style={styles.regenerateText}>Regenerate</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <TextInput
                                        style={styles.resultInput}
                                        multiline
                                        value={transformedText}
                                        onChangeText={setTransformedText}
                                        placeholder="Transformed text will appear here..."
                                        placeholderTextColor={Theme.textTertiary}
                                        textAlignVertical="top"
                                    />
                                </View>
                            </>
                        )}
                    </ScrollView>

                    {/* Footer Actions */}
                    {!isGenerating && transformedText && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={onClose}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={handleApply}
                            >
                                <Text style={styles.applyButtonText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: Theme.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingBottom: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Theme.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 2,
    },
    headerDescription: {
        fontSize: 14,
        color: Theme.textSecondary,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: Theme.textSecondary,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Theme.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    textContainer: {
        backgroundColor: Theme.surfaceHighlight,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    previewText: {
        fontSize: 15,
        lineHeight: 22,
        color: Theme.textSecondary,
    },
    resultInput: {
        backgroundColor: Theme.surfaceHighlight,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        lineHeight: 24,
        color: Theme.text,
        minHeight: 200,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    regenerateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: Theme.primary + '15',
        borderRadius: 8,
    },
    regenerateText: {
        fontSize: 13,
        fontWeight: '600',
        color: Theme.primary,
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: Theme.border,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: Theme.surfaceHighlight,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.text,
    },
    applyButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: Theme.primary,
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

