import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Tag } from '../services/MockAIService';

interface TagChipProps {
    tag: Tag;
    onPress?: () => void;
    onRemove?: () => void;
    size?: 'small' | 'medium' | 'large';
    showRemove?: boolean;
}

export const TagChip: React.FC<TagChipProps> = ({ 
    tag, 
    onPress, 
    onRemove, 
    size = 'medium',
    showRemove = false 
}) => {
    const sizeStyles = {
        small: { padding: 4, paddingHorizontal: 8, fontSize: 11 },
        medium: { padding: 6, paddingHorizontal: 10, fontSize: 13 },
        large: { padding: 8, paddingHorizontal: 12, fontSize: 15 },
    };

    const style = sizeStyles[size];

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={[
                styles.container,
                { backgroundColor: tag.color + '20' },
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    { color: tag.color, fontSize: style.fontSize },
                ]}
                numberOfLines={1}
            >
                {tag.name}
            </Text>
            {showRemove && onRemove && (
                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    style={styles.removeButton}
                >
                    <Ionicons name="close-circle" size={14} color={tag.color} />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 6,
    },
    text: {
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    removeButton: {
        marginLeft: 4,
        padding: 2,
    },
});

