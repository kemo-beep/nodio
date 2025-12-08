import { create } from 'zustand';
import { Project, Scene } from '../services/MockAIService';

interface ProjectState {
    projects: Project[];
    currentProject: Project | null;
    isRecording: boolean;
    isProcessing: boolean;

    // Actions
    addProject: (project: Project) => void;
    setCurrentProject: (projectId: string) => void;
    updateProjectTranscript: (projectId: string, transcript: string) => void;
    updateProjectScenes: (projectId: string, scenes: Scene[]) => void;
    setRecording: (isRecording: boolean) => void;
    setProcessing: (isProcessing: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
    projects: [],
    currentProject: null,
    isRecording: false,
    isProcessing: false,

    addProject: (project) => set((state) => ({
        projects: [project, ...state.projects]
    })),

    setCurrentProject: (projectId) => set((state) => ({
        currentProject: state.projects.find(p => p.id === projectId) || null
    })),

    updateProjectTranscript: (projectId, transcript) => set((state) => {
        const updatedProjects = state.projects.map(p =>
            p.id === projectId ? { ...p, transcript } : p
        );
        return {
            projects: updatedProjects,
            currentProject: state.currentProject?.id === projectId
                ? { ...state.currentProject, transcript }
                : state.currentProject
        };
    }),

    updateProjectScenes: (projectId, scenes) => set((state) => {
        const updatedProjects = state.projects.map(p =>
            p.id === projectId ? { ...p, scenes } : p
        );
        return {
            projects: updatedProjects,
            currentProject: state.currentProject?.id === projectId
                ? { ...state.currentProject, scenes }
                : state.currentProject
        };
    }),

    setRecording: (isRecording) => set({ isRecording }),
    setProcessing: (isProcessing) => set({ isProcessing }),
}));
