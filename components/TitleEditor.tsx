import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Colors';

interface TitleEditorProps {
    title: string;
    onSave: (newTitle: string) => void;
    onCancel?: () => void;
    placeholder?: string;
    style?: any;
    textStyle?: any; // Using any to avoid strict type issues for now, or StyleProp<TextStyle>
}

export const TitleEditor: React.FC<TitleEditorProps> = ({
    title,
    onSave,
    onCancel,
    placeholder = 'Enter title',
    style,
    textStyle,
}) => {
    const [editingTitle, setEditingTitle] = useState(title);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setEditingTitle(title);
    }, [title]);

    const handleSave = () => {
        const trimmed = editingTitle.trim();
        if (trimmed) {
            onSave(trimmed);
        } else {
            setEditingTitle(title);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditingTitle(title);
        setIsEditing(false);
        if (onCancel) onCancel();
    };

    if (!isEditing) {
        return (
            <TouchableOpacity
                onPress={() => setIsEditing(true)}
                style={[styles.container, style]}
                activeOpacity={0.7}
            >
                <Text style={[styles.titleText, textStyle]} numberOfLines={1}>{title || placeholder}</Text>
                <Ionicons name="create-outline" size={16} color={Theme.textTertiary} style={styles.editIcon} />
            </TouchableOpacity>
        );
    }

    return (
        <View style={[styles.editingContainer, style]}>
            <TextInput
                style={[styles.input, textStyle]}
                value={editingTitle}
                onChangeText={setEditingTitle}
                placeholder={placeholder}
                placeholderTextColor={Theme.textTertiary}
                autoFocus
                onSubmitEditing={handleSave}
                onBlur={handleSave}
                maxLength={100}
            />
            <View style={styles.actions}>
                <TouchableOpacity onPress={handleCancel} style={styles.actionButton}>
                    <Ionicons name="close" size={16} color={Theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.actionButton}>
                    <Ionicons name="checkmark" size={16} color={Theme.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    titleText: {
        fontSize: 17,
        fontWeight: '600',
        color: Theme.text,
        flex: 1,
    },
    editIcon: {
        marginLeft: 8,
        opacity: 0.5,
    },
    editingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    input: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        color: Theme.text,
        padding: 0,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 8,
    },
    actionButton: {
        padding: 4,
    },
});

