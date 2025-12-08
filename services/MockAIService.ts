export interface SceneImage {
    id: string;
    imagePrompt: string;
    imageUrl: string;
    sequenceOrder: number;
}

export interface Scene {
    id: string;
    description: string;
    duration: number;
    images: SceneImage[];
}

export interface Video {
    id: string;
    projectId: string;
    title?: string;
    scenes: Scene[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Folder {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    color?: string;
    icon?: string;
    parentId?: string | null; // For nested folders
}

export interface Tag {
    id: string;
    name: string;
    color: string;
    createdAt: Date;
}

export interface Project {
    id: string;
    title: string;
    date: Date;
    updatedAt: Date;
    audioUri: string;
    transcript: string;
    videos: Video[];
    folderId: string | null;
    tags: string[];
    thumbnailUrl?: string;
}

const MOCK_TRANSCRIPT =
    "Then I walked into the forest and found a glowing blue mushroom. It was pulsing with a soft light, illuminating the ancient trees around it. I reached out to touch it, and suddenly, the world shifted.";

const MOCK_SCENES: Scene[] = [
    {
        id: '1',
        description: "A person enters a mysterious forest and discovers a glowing blue mushroom.",
        duration: 3000,
        images: [
            {
                id: 'img1-1',
                imagePrompt: "fantasy forest, glowing blue mushroom, soft light beams, magical atmosphere, cinematic style",
                imageUrl: "https://picsum.photos/seed/nodio1/800/600",
                sequenceOrder: 0,
            },
            {
                id: 'img1-2',
                imagePrompt: "wide shot of forest path leading to glowing mushroom",
                imageUrl: "https://picsum.photos/seed/nodio1-2/800/600",
                sequenceOrder: 1,
            },
        ],
    },
    {
        id: '2',
        description: "Close up of the glowing mushroom pulsing with light.",
        duration: 3000,
        images: [
            {
                id: 'img2-1',
                imagePrompt: "macro shot, glowing blue mushroom, bioluminescence, detailed texture, 8k",
                imageUrl: "https://picsum.photos/seed/nodio2/800/600",
                sequenceOrder: 0,
            },
        ],
    },
    {
        id: '3',
        description: "The person reaches out their hand to touch the mushroom.",
        duration: 3000,
        images: [
            {
                id: 'img3-1',
                imagePrompt: "hand reaching out, glowing light, mysterious energy, first person perspective",
                imageUrl: "https://picsum.photos/seed/nodio3/800/600",
                sequenceOrder: 0,
            },
        ],
    },
];

class MockAIService {
    async transcribeAudio(audioUri: string): Promise<string> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        return MOCK_TRANSCRIPT;
    }

    async generateScenes(transcript: string): Promise<Scene[]> {
        await new Promise(resolve => setTimeout(resolve, 2500));
        return MOCK_SCENES;
    }

    async regenerateImage(sceneImageId: string): Promise<string> {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return `https://picsum.photos/seed/${Math.random()}/800/600`;
    }

    async transformText(text: string, type: 'summarize' | 'rewrite' | 'translate'): Promise<string> {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (type === 'summarize') return "Found a magic mushroom in the forest. Touched it, world changed.";
        if (type === 'rewrite') return "The ancient woods whispered secrets as I stumbled upon a azure fungus, radiating an ethereal glow.";
        if (type === 'translate') return "Entonces entré en el bosque y encontré un hongo azul brillante.";
        return text;
    }
}

export default new MockAIService();
