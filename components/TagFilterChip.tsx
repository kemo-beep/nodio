import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Theme } from '../constants/Colors';
import { Tag } from '../services/MockAIService';
import { TagChip } from './TagChip';

interface TagFilterChipProps {
    tag: Tag;
    isSelected: boolean;
    onPress: () => void;
    onRemove?: () => void;
}

export const TagFilterChip: React.FC<TagFilterChipProps> = ({
    tag,
    isSelected,
    onPress,
    onRemove,
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={[
                styles.container,
                isSelected && styles.containerSelected,
            ]}
        >
            <TagChip tag={tag} size="small" />
            {isSelected && (
                <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
            )}
            {onRemove && (
                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    style={styles.removeButton}
                >
                    <Ionicons name="close" size={14} color={Theme.textSecondary} />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.surface,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        gap: 6,
    },
    containerSelected: {
        backgroundColor: Theme.primary + '15',
        borderColor: Theme.primary,
    },
    selectedIndicator: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Theme.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
    },
    removeButton: {
        padding: 2,
        marginLeft: 4,
    },
});

