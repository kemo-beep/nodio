import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Colors';
import { useTagStore } from '../store/useTagStore';
import { TagChip } from './TagChip';

interface TagSelectorProps {
    visible: boolean;
    selectedTagIds: string[];
    onSelect: (tagIds: string[]) => void;
    onClose: () => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
    visible,
    selectedTagIds,
    onSelect,
    onClose,
}) => {
    const { tags, createTag, getOrCreateTag } = useTagStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [newTagName, setNewTagName] = useState('');

    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    const toggleTag = (tagId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const isSelected = selectedTagIds.includes(tagId);
        const newSelection = isSelected
            ? selectedTagIds.filter(id => id !== tagId)
            : [...selectedTagIds, tagId];
        onSelect(newSelection);
    };

    const handleCreateTag = () => {
        const trimmed = newTagName.trim();
        if (!trimmed) return;

        const tagId = getOrCreateTag(trimmed);
        if (!selectedTagIds.includes(tagId)) {
            onSelect([...selectedTagIds, tagId]);
        }
        setNewTagName('');
        setSearchQuery('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleSave = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Tags</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={Theme.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search-outline" size={20} color={Theme.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search tags..."
                                placeholderTextColor={Theme.textTertiary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Create New Tag */}
                        <View style={styles.createTagContainer}>
                            <TextInput
                                style={styles.createTagInput}
                                placeholder="Create new tag..."
                                placeholderTextColor={Theme.textTertiary}
                                value={newTagName}
                                onChangeText={setNewTagName}
                                onSubmitEditing={handleCreateTag}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TouchableOpacity
                                style={[styles.createButton, !newTagName.trim() && styles.createButtonDisabled]}
                                onPress={handleCreateTag}
                                disabled={!newTagName.trim()}
                            >
                                <Ionicons 
                                    name="add" 
                                    size={20} 
                                    color={newTagName.trim() ? Theme.primary : Theme.textTertiary} 
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Tags List */}
                        <ScrollView style={styles.tagsList} showsVerticalScrollIndicator={false}>
                            {filteredTags.length > 0 ? (
                                <View style={styles.tagsContainer}>
                                    {filteredTags.map((tag) => {
                                        const isSelected = selectedTagIds.includes(tag.id);
                                        return (
                                            <TouchableOpacity
                                                key={tag.id}
                                                onPress={() => toggleTag(tag.id)}
                                                style={[
                                                    styles.tagItem,
                                                    isSelected && styles.tagItemSelected,
                                                ]}
                                            >
                                                <TagChip tag={tag} size="medium" />
                                                {isSelected && (
                                                    <Ionicons
                                                        name="checkmark-circle"
                                                        size={20}
                                                        color={Theme.primary}
                                                        style={styles.checkIcon}
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ) : (
                                <View style={styles.emptyState}>
                                    <Ionicons name="pricetag-outline" size={48} color={Theme.textTertiary} />
                                    <Text style={styles.emptyStateText}>
                                        {searchQuery
                                            ? 'No tags found'
                                            : 'No tags yet. Create your first tag above!'}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Selected Tags Count */}
                        {selectedTagIds.length > 0 && (
                            <View style={styles.selectedCount}>
                                <Text style={styles.selectedCountText}>
                                    {selectedTagIds.length} {selectedTagIds.length === 1 ? 'tag' : 'tags'} selected
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: Theme.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Theme.border,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Theme.text,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 20,
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surface,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Theme.text,
        padding: 0,
    },
    createTagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surface,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 20,
        gap: 8,
        borderWidth: 1,
        borderColor: Theme.border,
    },
    createTagInput: {
        flex: 1,
        fontSize: 16,
        color: Theme.text,
        padding: 0,
    },
    createButton: {
        padding: 4,
    },
    createButtonDisabled: {
        opacity: 0.5,
    },
    tagsList: {
        flex: 1,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    tagItemSelected: {
        opacity: 0.8,
    },
    checkIcon: {
        marginLeft: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        marginTop: 12,
        fontSize: 14,
        color: Theme.textSecondary,
        textAlign: 'center',
    },
    selectedCount: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Theme.border,
    },
    selectedCountText: {
        fontSize: 14,
        color: Theme.textSecondary,
        fontWeight: '600',
        textAlign: 'center',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: Theme.border,
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: Theme.primary,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

