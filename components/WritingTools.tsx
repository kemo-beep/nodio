import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Colors';

type ToolType = 'summarize' | 'rewrite' | 'translate';

interface WritingToolsProps {
    visible: boolean;
    originalText: string;
    toolType: ToolType | null;
    onClose: () => void;
    onApply: (transformedText: string) => void;
    onTransform: (text: string, tool: ToolType, targetLanguage?: string) => Promise<string>;
    isProcessing: boolean;
}

const LANGUAGES = [
    { code: 'Spanish', name: 'Spanish' },
    { code: 'French', name: 'French' },
    { code: 'German', name: 'German' },
    { code: 'Italian', name: 'Italian' },
    { code: 'Portuguese', name: 'Portuguese' },
    { code: 'Chinese', name: 'Chinese' },
    { code: 'Japanese', name: 'Japanese' },
    { code: 'Korean', name: 'Korean' },
    { code: 'Arabic', name: 'Arabic' },
    { code: 'Russian', name: 'Russian' },
    { code: 'Hindi', name: 'Hindi' },
    { code: 'Dutch', name: 'Dutch' },
];

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
    const [selectedLanguage, setSelectedLanguage] = useState<string>('Spanish');
    const [showLanguagePicker, setShowLanguagePicker] = useState(false);

    React.useEffect(() => {
        if (visible && toolType) {
            if (toolType === 'translate') {
                setShowLanguagePicker(true);
                setTransformedText('');
            } else {
                setShowLanguagePicker(false);
                if (originalText) {
                    generateTransformation();
                }
            }
        } else {
            setTransformedText('');
            setShowLanguagePicker(false);
        }
    }, [visible, toolType]);

    const generateTransformation = async (language?: string) => {
        if (!toolType || !originalText) return;
        
        setIsGenerating(true);
        setTransformedText('');
        try {
            const result = await onTransform(originalText, toolType, language || selectedLanguage);
            if (result && result.trim().length > 0) {
                setTransformedText(result);
                setShowLanguagePicker(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                throw new Error('Empty response received');
            }
        } catch (error: any) {
            console.error('Transformation error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const errorMessage = error?.message || 'Unknown error';
            setTransformedText(`Failed to generate transformation. ${errorMessage.includes('API key') ? 'Please check your API configuration.' : 'Please try again.'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLanguageSelect = (language: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedLanguage(language);
        setShowLanguagePicker(false);
        generateTransformation(language);
    };

    const handleApply = () => {
        if (transformedText) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Keyboard.dismiss();
            onApply(transformedText);
            onClose();
        }
    };

    const handleRegenerate = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (toolType === 'translate') {
            generateTransformation(selectedLanguage);
        } else {
            generateTransformation();
        }
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Keyboard.dismiss();
        onClose();
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
                return `Translate to ${selectedLanguage}`;
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
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
                            <Ionicons name="close" size={24} color={Theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView 
                        style={styles.content} 
                        contentContainerStyle={styles.contentContainer}
                        keyboardShouldPersistTaps="handled"
                    >
                        {showLanguagePicker && toolType === 'translate' ? (
                            <View style={styles.languagePickerContainer}>
                                <Text style={styles.languagePickerTitle}>Select Target Language</Text>
                                <Text style={styles.languagePickerSubtitle}>Choose the language to translate to</Text>
                                <View style={styles.languageGrid}>
                                    {LANGUAGES.map((lang) => (
                                        <TouchableOpacity
                                            key={lang.code}
                                            style={[
                                                styles.languageOption,
                                                selectedLanguage === lang.code && styles.languageOptionSelected
                                            ]}
                                            onPress={() => handleLanguageSelect(lang.code)}
                                            activeOpacity={0.7}
                                        >
                                            {selectedLanguage === lang.code && (
                                                <Ionicons name="checkmark-circle" size={18} color={Theme.primary} style={styles.languageCheckIcon} />
                                            )}
                                            <Text style={[
                                                styles.languageOptionText,
                                                selectedLanguage === lang.code && styles.languageOptionTextSelected
                                            ]}>
                                                {lang.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ) : isGenerating ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={Theme.primary} />
                                <Text style={styles.loadingText}>Generating with AI...</Text>
                                <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
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
                                            activeOpacity={0.7}
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
                                        editable={!isGenerating}
                                    />
                                </View>
                            </>
                        )}
                    </ScrollView>

                    {/* Footer Actions */}
                    {!isGenerating && !showLanguagePicker && transformedText && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleClose}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.applyButton, !transformedText && styles.applyButtonDisabled]}
                                onPress={handleApply}
                                disabled={!transformedText}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="checkmark" size={18} color="#FFF" style={{ marginRight: 6 }} />
                                <Text style={styles.applyButtonText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    {showLanguagePicker && (
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleClose}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
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
        fontWeight: '600',
        color: Theme.text,
        marginTop: 12,
    },
    loadingSubtext: {
        fontSize: 14,
        color: Theme.textSecondary,
        marginTop: 4,
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
        flexDirection: 'row',
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: Theme.primary,
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    languagePickerContainer: {
        paddingVertical: 20,
    },
    languagePickerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Theme.text,
        marginBottom: 4,
    },
    languagePickerSubtitle: {
        fontSize: 14,
        color: Theme.textSecondary,
        marginBottom: 20,
    },
    languageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: Theme.surfaceHighlight,
        borderWidth: 1.5,
        borderColor: Theme.border,
        minWidth: '30%',
    },
    languageOptionSelected: {
        backgroundColor: Theme.primary + '20',
        borderColor: Theme.primary,
        borderWidth: 2,
    },
    languageCheckIcon: {
        marginRight: 6,
    },
    languageOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: Theme.text,
    },
    languageOptionTextSelected: {
        color: Theme.primary,
        fontWeight: '700',
    },
    applyButtonDisabled: {
        opacity: 0.5,
    },
});

