import { create } from 'zustand';
import { FolderRepository } from '../database/repositories/FolderRepository';
import { Folder } from '../services/MockAIService';

interface FolderState {
    folders: Folder[];
    currentFolderId: string | null;
    folderNavigationStack: string[]; // For breadcrumb navigation
    isLoaded: boolean;

    // Actions
    loadFolders: () => Promise<void>;
    createFolder: (name: string, parentId?: string | null, color?: string, icon?: string) => Promise<string>;
    updateFolder: (folderId: string, updates: Partial<Folder>) => Promise<void>;
    deleteFolder: (folderId: string) => Promise<void>;
    setCurrentFolder: (folderId: string | null) => void;
    navigateToFolder: (folderId: string) => void;
    navigateBack: () => void;
    getFolderById: (folderId: string | null) => Folder | null;
    getFoldersByParent: (parentId: string | null) => Folder[];
    getAllProjectsFolder: () => Folder;
    getFolderPath: (folderId: string) => Folder[];
}

const DEFAULT_FOLDER_ID = 'all-projects';

export const useFolderStore = create<FolderState>((set, get) => ({
    folders: [],
    currentFolderId: null,
    folderNavigationStack: [],
    isLoaded: false,

    loadFolders: async () => {
        try {
            const folders = await FolderRepository.getAll();
            set({ folders, isLoaded: true });
        } catch (error) {
            console.error('Failed to load folders:', error);
            // Fallback to default folder
            set({
                folders: [{
                    id: DEFAULT_FOLDER_ID,
                    name: 'All Projects',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    parentId: null,
                }],
                isLoaded: true
            });
        }
    },

    createFolder: async (name, parentId = null, color, icon) => {
        const newFolder: Folder = {
            id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            createdAt: new Date(),
            updatedAt: new Date(),
            parentId,
            color,
            icon,
        };
        
        try {
            await FolderRepository.create(newFolder);
            set((state) => ({
                folders: [...state.folders, newFolder]
            }));
        } catch (error) {
            console.error('Failed to create folder:', error);
            throw error;
        }
        
        return newFolder.id;
    },

    updateFolder: async (folderId, updates) => {
        if (folderId === DEFAULT_FOLDER_ID) {
            // Cannot modify default folder
            return;
        }
        
        try {
            await FolderRepository.update(folderId, updates);
            set((state) => ({
                folders: state.folders.map(f =>
                    f.id === folderId
                        ? { ...f, ...updates, updatedAt: new Date() }
                        : f
                )
            }));
        } catch (error) {
            console.error('Failed to update folder:', error);
            throw error;
        }
    },

    deleteFolder: async (folderId) => {
        if (folderId === DEFAULT_FOLDER_ID) {
            // Cannot delete default folder
            return;
        }
        
        try {
            // Find nested folders
            const state = get();
            const foldersToDelete = [folderId];
            const findNestedFolders = (parentId: string) => {
                state.folders.forEach(f => {
                    if (f.parentId === parentId) {
                        foldersToDelete.push(f.id);
                        findNestedFolders(f.id);
                    }
                });
            };
            findNestedFolders(folderId);

            // Delete from database
            for (const id of foldersToDelete) {
                await FolderRepository.delete(id);
            }

            // Update state
            set((state) => ({
                folders: state.folders.filter(f => !foldersToDelete.includes(f.id)),
                currentFolderId: foldersToDelete.includes(state.currentFolderId || '') ? null : state.currentFolderId,
                folderNavigationStack: state.folderNavigationStack.filter(id => !foldersToDelete.includes(id))
            }));
        } catch (error) {
            console.error('Failed to delete folder:', error);
            throw error;
        }
    },

    setCurrentFolder: (folderId) => set({ 
        currentFolderId: folderId,
        folderNavigationStack: folderId ? [folderId] : []
    }),

    navigateToFolder: (folderId) => {
        const state = get();
        const currentStack = state.folderNavigationStack;
        set({
            currentFolderId: folderId,
            folderNavigationStack: [...currentStack, folderId]
        });
    },

    navigateBack: () => {
        const state = get();
        const newStack = [...state.folderNavigationStack];
        newStack.pop();
        const newFolderId = newStack.length > 0 ? newStack[newStack.length - 1] : null;
        set({
            currentFolderId: newFolderId,
            folderNavigationStack: newStack
        });
    },

    getFolderById: (folderId) => {
        if (!folderId) return null;
        return get().folders.find(f => f.id === folderId) || null;
    },

    getFoldersByParent: (parentId) => {
        return get().folders.filter(f => f.parentId === parentId);
    },

    getAllProjectsFolder: () => {
        return get().folders.find(f => f.id === DEFAULT_FOLDER_ID)!;
    },

    getFolderPath: (folderId) => {
        const path: Folder[] = [];
        const folder = get().getFolderById(folderId);
        if (!folder) return path;

        let current: Folder | null = folder;
        while (current) {
            path.unshift(current);
            current = current.parentId ? get().getFolderById(current.parentId) : null;
        }
        return path;
    },
}));

