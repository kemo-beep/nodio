import { create } from 'zustand';
import { ProjectRepository } from '../database/repositories/ProjectRepository';
import { Project } from '../services/MockAIService';

interface ProjectState {
    projects: Project[];
    currentProject: Project | null;
    isRecording: boolean;
    isProcessing: boolean;
    isLoaded: boolean;

    // Actions
    loadProjects: () => Promise<void>;
    addProject: (project: Project) => Promise<void>;
    setCurrentProject: (projectId: string) => Promise<void>;
    updateProjectTranscript: (projectId: string, transcript: string) => Promise<void>;
    updateProjectTitle: (projectId: string, title: string) => Promise<void>;
    moveProjectToFolder: (projectId: string, folderId: string | null) => Promise<void>;
    addTagsToProject: (projectId: string, tagIds: string[]) => Promise<void>;
    removeTagFromProject: (projectId: string, tagId: string) => Promise<void>;
    deleteProject: (projectId: string) => Promise<void>;
    getProjectsByFolder: (folderId: string | null) => Project[];
    getProjectsByTag: (tagId: string) => Project[];
    setRecording: (isRecording: boolean) => void;
    setProcessing: (isProcessing: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    currentProject: null,
    isRecording: false,
    isProcessing: false,
    isLoaded: false,

    loadProjects: async () => {
        try {
            const projects = await ProjectRepository.getAll();
            set({ projects, isLoaded: true });
        } catch (error) {
            console.error('Failed to load projects:', error);
            set({ projects: [], isLoaded: true });
        }
    },

    addProject: async (project) => {
        try {
            await ProjectRepository.create(project);
            set((state) => ({
                projects: [project, ...state.projects]
            }));
        } catch (error) {
            console.error('Failed to add project:', error);
            throw error;
        }
    },

    setCurrentProject: async (projectId) => {
        const state = get();
        // Try to get from state first
        let project = state.projects.find(p => p.id === projectId);
        
        // If not in state, load from database
        if (!project) {
            try {
                project = await ProjectRepository.getById(projectId);
                if (project) {
                    set((state) => ({
                        projects: [project!, ...state.projects.filter(p => p.id !== projectId)]
                    }));
                }
            } catch (error) {
                console.error('Failed to load project:', error);
            }
        }
        
        set({ currentProject: project || null });
    },

    updateProjectTranscript: async (projectId, transcript) => {
        try {
            await ProjectRepository.updateTranscript(projectId, transcript);
            set((state) => {
                const updatedProjects = state.projects.map(p =>
                    p.id === projectId ? { ...p, transcript, updatedAt: new Date() } : p
                );
                return {
                    projects: updatedProjects,
                    currentProject: state.currentProject?.id === projectId
                        ? { ...state.currentProject, transcript, updatedAt: new Date() }
                        : state.currentProject
                };
            });
        } catch (error) {
            console.error('Failed to update transcript:', error);
            throw error;
        }
    },


    updateProjectTitle: async (projectId, title) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;
        
        try {
            await ProjectRepository.updateTitle(projectId, trimmedTitle);
            set((state) => {
                const updatedProjects = state.projects.map(p =>
                    p.id === projectId ? { ...p, title: trimmedTitle, updatedAt: new Date() } : p
                );
                return {
                    projects: updatedProjects,
                    currentProject: state.currentProject?.id === projectId
                        ? { ...state.currentProject, title: trimmedTitle, updatedAt: new Date() }
                        : state.currentProject
                };
            });
        } catch (error) {
            console.error('Failed to update title:', error);
            throw error;
        }
    },

    moveProjectToFolder: async (projectId, folderId) => {
        try {
            await ProjectRepository.moveToFolder(projectId, folderId);
            set((state) => {
                const updatedProjects = state.projects.map(p =>
                    p.id === projectId ? { ...p, folderId, updatedAt: new Date() } : p
                );
                return {
                    projects: updatedProjects,
                    currentProject: state.currentProject?.id === projectId
                        ? { ...state.currentProject, folderId, updatedAt: new Date() }
                        : state.currentProject
                };
            });
        } catch (error) {
            console.error('Failed to move project:', error);
            throw error;
        }
    },

    addTagsToProject: async (projectId, tagIds) => {
        try {
            await ProjectRepository.addTags(projectId, tagIds);
            set((state) => {
                const project = state.projects.find(p => p.id === projectId);
                if (!project) return state;
                
                const existingTags = project.tags || [];
                const newTags = [...new Set([...existingTags, ...tagIds])];
                
                const updatedProjects = state.projects.map(p =>
                    p.id === projectId ? { ...p, tags: newTags, updatedAt: new Date() } : p
                );
                return {
                    projects: updatedProjects,
                    currentProject: state.currentProject?.id === projectId
                        ? { ...state.currentProject, tags: newTags, updatedAt: new Date() }
                        : state.currentProject
                };
            });
        } catch (error) {
            console.error('Failed to add tags:', error);
            throw error;
        }
    },

    removeTagFromProject: async (projectId, tagId) => {
        try {
            await ProjectRepository.removeTag(projectId, tagId);
            set((state) => {
                const project = state.projects.find(p => p.id === projectId);
                if (!project) return state;
                
                const updatedTags = (project.tags || []).filter(t => t !== tagId);
                
                const updatedProjects = state.projects.map(p =>
                    p.id === projectId ? { ...p, tags: updatedTags, updatedAt: new Date() } : p
                );
                return {
                    projects: updatedProjects,
                    currentProject: state.currentProject?.id === projectId
                        ? { ...state.currentProject, tags: updatedTags, updatedAt: new Date() }
                        : state.currentProject
                };
            });
        } catch (error) {
            console.error('Failed to remove tag:', error);
            throw error;
        }
    },

    deleteProject: async (projectId) => {
        try {
            await ProjectRepository.delete(projectId);
            set((state) => ({
                projects: state.projects.filter(p => p.id !== projectId),
                currentProject: state.currentProject?.id === projectId ? null : state.currentProject
            }));
        } catch (error) {
            console.error('Failed to delete project:', error);
            throw error;
        }
    },

    getProjectsByFolder: (folderId) => {
        if (folderId === null) {
            // Return all projects
            return get().projects;
        }
        return get().projects.filter(p => p.folderId === folderId);
    },

    getProjectsByTag: (tagId) => {
        return get().projects.filter(p => (p.tags || []).includes(tagId));
    },

    setRecording: (isRecording) => set({ isRecording }),
    setProcessing: (isProcessing) => set({ isProcessing }),
}));
