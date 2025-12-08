import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Colors';

interface TranscriptEditorProps {
    text: string;
    onChangeText: (text: string) => void;
    onToolPress: (tool: 'summarize' | 'rewrite' | 'translate') => void;
    isProcessing: boolean;
}

export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
    text,
    onChangeText,
    onToolPress,
    isProcessing
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.toolbar}>
                <ToolButton
                    icon="flash"
                    label="Summarize"
                    onPress={() => onToolPress('summarize')}
                    disabled={isProcessing}
                />
                <ToolButton
                    icon="create"
                    label="Rewrite"
                    onPress={() => onToolPress('rewrite')}
                    disabled={isProcessing}
                />
                <ToolButton
                    icon="language"
                    label="Translate"
                    onPress={() => onToolPress('translate')}
                    disabled={isProcessing}
                />
            </View>
            <TextInput
                style={styles.input}
                multiline
                value={text}
                onChangeText={onChangeText}
                placeholder="Start speaking or typing..."
                placeholderTextColor={Theme.textTertiary}
                textAlignVertical="top"
            />
        </View>
    );
};

const ToolButton = ({ icon, label, onPress, disabled }: any) => (
    <TouchableOpacity
        style={[styles.toolButton, disabled && { opacity: 0.5 }]}
        onPress={onPress}
        disabled={disabled}
    >
        <Ionicons name={icon} size={16} color={Theme.text} />
        <Text style={styles.toolLabel}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    toolbar: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: Theme.border,
        gap: 8,
    },
    toolButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surfaceHighlight,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    toolLabel: {
        color: Theme.text,
        fontSize: 13,
        fontWeight: '600',
    },
    input: {
        flex: 1,
        padding: 16,
        fontSize: 17,
        lineHeight: 24,
        color: Theme.text,
    },
});
