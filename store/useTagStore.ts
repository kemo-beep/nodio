import { create } from 'zustand';
import { TagRepository } from '../database/repositories/TagRepository';
import { Tag } from '../services/MockAIService';

const TAG_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
];

interface TagState {
    tags: Tag[];
    isLoaded: boolean;

    // Actions
    loadTags: () => Promise<void>;
    createTag: (name: string, color?: string) => Promise<string>;
    updateTag: (tagId: string, updates: Partial<Tag>) => Promise<void>;
    deleteTag: (tagId: string) => Promise<void>;
    getTagById: (tagId: string) => Tag | null;
    getTagByName: (name: string) => Tag | null;
    getOrCreateTag: (name: string) => Promise<string>;
    getAvailableColor: () => string;
}

export const useTagStore = create<TagState>((set, get) => ({
    tags: [],
    isLoaded: false,

    loadTags: async () => {
        try {
            const tags = await TagRepository.getAll();
            set({ tags, isLoaded: true });
        } catch (error) {
            console.error('Failed to load tags:', error);
            set({ tags: [], isLoaded: true });
        }
    },

    createTag: async (name, color) => {
        const trimmedName = name.trim().toLowerCase();
        // Check if tag already exists
        const existing = await TagRepository.getByName(trimmedName);
        if (existing) {
            return existing.id;
        }

        const newTag: Tag = {
            id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: trimmedName,
            color: color || get().getAvailableColor(),
            createdAt: new Date(),
        };
        
        try {
            await TagRepository.create(newTag);
            set((state) => ({
                tags: [...state.tags, newTag]
            }));
        } catch (error) {
            console.error('Failed to create tag:', error);
            throw error;
        }
        
        return newTag.id;
    },

    updateTag: async (tagId, updates) => {
        try {
            await TagRepository.update(tagId, updates);
            set((state) => ({
                tags: state.tags.map(t =>
                    t.id === tagId
                        ? { ...t, ...updates }
                        : t
                )
            }));
        } catch (error) {
            console.error('Failed to update tag:', error);
            throw error;
        }
    },

    deleteTag: async (tagId) => {
        try {
            await TagRepository.delete(tagId);
            set((state) => ({
                tags: state.tags.filter(t => t.id !== tagId)
            }));
        } catch (error) {
            console.error('Failed to delete tag:', error);
            throw error;
        }
    },

    getTagById: (tagId) => {
        return get().tags.find(t => t.id === tagId) || null;
    },

    getTagByName: (name) => {
        const trimmedName = name.trim().toLowerCase();
        return get().tags.find(t => t.name.toLowerCase() === trimmedName) || null;
    },

    getOrCreateTag: async (name) => {
        const existing = await TagRepository.getByName(name);
        if (existing) {
            // Make sure it's in state
            const state = get();
            if (!state.tags.find(t => t.id === existing.id)) {
                set({ tags: [...state.tags, existing] });
            }
            return existing.id;
        }
        return await get().createTag(name);
    },

    getAvailableColor: () => {
        const usedColors = get().tags.map(t => t.color);
        const available = TAG_COLORS.find(c => !usedColors.includes(c));
        return available || TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
    },
}));

