export interface Scene {
    id: string;
    description: string;
    imagePrompt: string;
    imageUrl: string;
    duration: number;
}

export interface Project {
    id: string;
    title: string;
    date: Date;
    audioUri: string;
    transcript: string;
    scenes: Scene[];
}

const MOCK_TRANSCRIPT =
    "Then I walked into the forest and found a glowing blue mushroom. It was pulsing with a soft light, illuminating the ancient trees around it. I reached out to touch it, and suddenly, the world shifted.";

const MOCK_SCENES: Scene[] = [
    {
        id: '1',
        description: "A person enters a mysterious forest and discovers a glowing blue mushroom.",
        imagePrompt: "fantasy forest, glowing blue mushroom, soft light beams, magical atmosphere, cinematic style",
        imageUrl: "https://picsum.photos/seed/nodio1/800/600",
        duration: 3000,
    },
    {
        id: '2',
        description: "Close up of the glowing mushroom pulsing with light.",
        imagePrompt: "macro shot, glowing blue mushroom, bioluminescence, detailed texture, 8k",
        imageUrl: "https://picsum.photos/seed/nodio2/800/600",
        duration: 3000,
    },
    {
        id: '3',
        description: "The person reaches out their hand to touch the mushroom.",
        imagePrompt: "hand reaching out, glowing light, mysterious energy, first person perspective",
        imageUrl: "https://picsum.photos/seed/nodio3/800/600",
        duration: 3000,
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

    async regenerateImage(sceneId: string): Promise<string> {
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
