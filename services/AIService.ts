import * as FileSystem from 'expo-file-system/legacy';
import { Scene } from './MockAIService';

// Transcription service configuration
// Priority: Local Whisper Server > Google Gemini API
const WHISPER_SERVER_URL = process.env.EXPO_PUBLIC_WHISPER_SERVER_URL || 'https://sampling-arrow-threaded-yards.trycloudflare.com';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
// Using gemini-2.0-flash-exp for better performance
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// Transcription provider preference
type TranscriptionProvider = 'local' | 'gemini' | 'auto';
const TRANSCRIPTION_PROVIDER: TranscriptionProvider = 
    (process.env.EXPO_PUBLIC_TRANSCRIPTION_PROVIDER as TranscriptionProvider) || 'auto';

class AIService {
    private async readAudioFile(uri: string): Promise<{ uri: string; name: string; type: string }> {
        // For React Native, we can use the file URI directly
        // The file should be accessible via the URI
        const filename = uri.split('/').pop() || 'recording.m4a';
        return {
            uri,
            name: filename,
            type: 'audio/m4a', // Adjust based on actual file type
        };
    }

    /**
     * Transcribe audio using local Whisper server or Google Gemini API
     * Priority: local server > Google Gemini API (if configured)
     */
    async transcribeAudio(audioUri: string): Promise<string> {
        // Verify the audio file exists
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        if (!fileInfo.exists) {
            throw new Error('Audio file does not exist');
        }

        // Debug: Log configuration
        console.log('🔍 Transcription Config:', {
            provider: TRANSCRIPTION_PROVIDER,
            whisperUrl: WHISPER_SERVER_URL,
            hasGeminiKey: !!GEMINI_API_KEY,
        });

        // Determine which provider to use
        // PRIORITY: Local server is ALWAYS preferred if available
        // Only use Gemini if local server is not available
        const hasLocalServerConfigured = WHISPER_SERVER_URL && WHISPER_SERVER_URL.trim() !== '';
        
        // Always use local if server URL is configured, regardless of provider setting
        // Only use Gemini if:
        //   1. No local server URL is configured AND provider is 'gemini', OR
        //   2. Provider is explicitly 'gemini' AND no local server (but we prefer local if available)
        const useLocal = hasLocalServerConfigured || TRANSCRIPTION_PROVIDER === 'local';

        console.log('🎯 Using provider:', useLocal ? 'LOCAL' : 'GEMINI');

        if (useLocal) {
            try {
                console.log('📡 Attempting local transcription...');
                return await this.transcribeWithLocalServer(audioUri);
            } catch (localError: any) {
                console.warn('⚠️ Local transcription failed:', localError.message);
                // Fallback to Gemini if local fails and Gemini is configured
                if (GEMINI_API_KEY && TRANSCRIPTION_PROVIDER !== 'local') {
                    console.log('🔄 Falling back to Google Gemini...');
                    return await this.transcribeWithGemini(audioUri);
                }
                throw localError;
            }
        } else {
            // Use Gemini
            if (!GEMINI_API_KEY) {
                const errorMsg = TRANSCRIPTION_PROVIDER === 'gemini'
                    ? 'Google Gemini API key not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY in your .env file.'
                    : 'No transcription service configured. Please set either:\n' +
                      '1. EXPO_PUBLIC_WHISPER_SERVER_URL for local Whisper server (see docs/whisper-server-setup.md), or\n' +
                      '2. EXPO_PUBLIC_GEMINI_API_KEY for Google Gemini API';
                throw new Error(errorMsg);
            }
            console.log('📡 Using Google Gemini for transcription...');
            return await this.transcribeWithGemini(audioUri);
        }
    }

    /**
     * Transcribe using local Whisper server (WhisperLiveKit or custom backend)
     */
    private async transcribeWithLocalServer(audioUri: string): Promise<string> {
        try {
            // Determine file extension and MIME type
            const { mimeType, fileName } = this.getAudioFileInfo(audioUri);

            // Try different endpoint formats that WhisperLiveKit or custom servers might use
            // Prioritize /whisper/transcribe since it's confirmed to work
            const endpoints = [
                `${WHISPER_SERVER_URL}/whisper/transcribe`,
                `${WHISPER_SERVER_URL}/transcribe`,
                `${WHISPER_SERVER_URL}/api/transcribe`,
                `${WHISPER_SERVER_URL}/v1/audio/transcriptions`,
            ];

            let lastError: Error | null = null;

            for (const endpoint of endpoints) {
                try {
                    console.log(`🔄 Trying endpoint: ${endpoint}`);
                    
                    // Try multipart/form-data format first (what our FastAPI server expects)
                    const formData = new FormData();
                    formData.append('file', {
                        uri: audioUri,
                        type: mimeType,
                        name: fileName,
                    } as any);

                    const formResponse = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            // Don't set Content-Type - let fetch set it with boundary
                        },
                        body: formData,
                    });

                    if (formResponse.ok) {
                        // Try to parse as JSON first (our server returns JSON)
                        try {
                            const data = await formResponse.json();
                            const transcript = data.text || data.transcript || data.transcription;
                            if (transcript && transcript.trim().length > 0) {
                                console.log('✅ Transcription successful from:', endpoint);
                                return transcript.trim();
                            }
                        } catch {
                            // If not JSON, try as text
                            const transcript = await formResponse.text();
                            if (transcript && transcript.trim().length > 0) {
                                console.log('✅ Transcription successful from:', endpoint);
                                return transcript.trim();
                            }
                        }
                    } else {
                        const errorText = await formResponse.text();
                        console.warn(`❌ Endpoint ${endpoint} failed: ${formResponse.status} - ${errorText}`);
                    }
                } catch (endpointError: any) {
                    console.warn(`❌ Endpoint ${endpoint} error:`, endpointError.message);
                    lastError = endpointError;
                    continue; // Try next endpoint
                }
            }

            throw lastError || new Error('All transcription endpoints failed');
        } catch (error: any) {
            console.error('Local transcription error:', error);
            throw new Error(`Local transcription failed: ${error?.message || 'Server unavailable'}`);
        }
    }

    /**
     * Transcribe using Google Gemini API
     * Gemini can process audio files directly
     */
    private async transcribeWithGemini(audioUri: string): Promise<string> {
        if (!GEMINI_API_KEY) {
            throw new Error('Google Gemini API key not configured');
        }

        try {
            const { mimeType } = this.getAudioFileInfo(audioUri);
            
            // Read audio file as base64
            const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Determine MIME type for Gemini (Gemini expects specific formats)
            let geminiMimeType = mimeType;
            if (mimeType === 'audio/m4a') {
                geminiMimeType = 'audio/mp4'; // Gemini prefers mp4 for m4a files
            }

            // Prepare the request for Gemini
            // Gemini 1.5 Flash supports audio input via inline_data (base64)
            const requestBody = {
                contents: [{
                    parts: [
                        {
                            text: "Please transcribe this audio file accurately. Return only the transcript text, no additional commentary or explanation."
                        },
                        {
                            inline_data: {
                                mime_type: geminiMimeType,
                                data: base64Audio
                            }
                        }
                    ]
                }]
            };

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Transcription failed: ${response.status}`;
                
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error?.message || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                
                console.error('Gemini API Error:', errorMessage);
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            // Extract transcript from Gemini response
            const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!transcript || transcript.trim().length === 0) {
                throw new Error('Empty transcript received from Gemini API');
            }

            return transcript.trim();
        } catch (error: any) {
            console.error('Gemini transcription error:', error);
            throw error;
        }
    }

    /**
     * Get audio file MIME type and filename from URI
     */
    private getAudioFileInfo(audioUri: string): { mimeType: string; fileName: string } {
        const uriLower = audioUri.toLowerCase();
        let mimeType = 'audio/m4a';
        let fileName = 'recording.m4a';
        
        if (uriLower.endsWith('.m4a')) {
            mimeType = 'audio/m4a';
            fileName = 'recording.m4a';
        } else if (uriLower.endsWith('.mp3')) {
            mimeType = 'audio/mpeg';
            fileName = 'recording.mp3';
        } else if (uriLower.endsWith('.wav')) {
            mimeType = 'audio/wav';
            fileName = 'recording.wav';
        } else if (uriLower.endsWith('.mp4')) {
            mimeType = 'audio/mp4';
            fileName = 'recording.mp4';
        } else if (uriLower.endsWith('.ogg') || uriLower.endsWith('.oga')) {
            mimeType = 'audio/ogg';
            fileName = 'recording.ogg';
        }

        return { mimeType, fileName };
    }

    async generateScenes(transcript: string): Promise<Scene[]> {
        // Use Gemini to generate scenes from transcript
        if (!GEMINI_API_KEY) {
            // Fallback to simple scene generation
            return this.generateSimpleScenes(transcript);
        }

        try {
            // Use Google Gemini to generate scenes from transcript
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are a video scene generator. Break down the given transcript into 2-5 scenes. 
For each scene, provide:
1. A brief description (1-2 sentences)
2. A detailed image generation prompt
3. An estimated duration in milliseconds (typically 2000-5000ms)

IMPORTANT: Return ONLY a valid JSON array, no markdown, no code blocks, no explanations. Just the raw JSON array.

Example format:
[{"id":"1","description":"scene description","imagePrompt":"detailed image prompt","duration":3000}]

Generate scenes for this transcript:\n\n${transcript}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        responseMimeType: "application/json"
                    }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini Scene Generation Error:', errorText);
                return this.generateSimpleScenes(transcript);
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!content) {
                return this.generateSimpleScenes(transcript);
            }

            // Parse the JSON response
            // Gemini often wraps JSON in markdown code blocks, so we need to extract it
            try {
                let jsonString = content.trim();
                
                // Remove markdown code blocks if present
                jsonString = jsonString.replace(/^```json\s*/i, '');
                jsonString = jsonString.replace(/^```\s*/i, '');
                jsonString = jsonString.replace(/\s*```$/i, '');
                jsonString = jsonString.trim();
                
                // Try to extract JSON array if it's embedded in text
                const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    jsonString = jsonMatch[0];
                }
                
                const scenes = JSON.parse(jsonString);
                // Add imageUrl placeholder (will be generated later)
                return scenes.map((scene: any, index: number) => ({
                    ...scene,
                    id: scene.id || (index + 1).toString(),
                    imageUrl: `https://picsum.photos/seed/scene${scene.id || index}/800/600`,
                }));
            } catch (parseError) {
                console.error('Failed to parse scene JSON:', parseError);
                return this.generateSimpleScenes(transcript);
            }
        } catch (error) {
            console.error('Scene generation error:', error);
            return this.generateSimpleScenes(transcript);
        }
    }

    private generateSimpleScenes(transcript: string): Scene[] {
        // Simple fallback: split transcript into sentences and create scenes
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const scenes: Scene[] = [];

        sentences.forEach((sentence, index) => {
            const trimmed = sentence.trim();
            if (trimmed.length > 0) {
                scenes.push({
                    id: (index + 1).toString(),
                    description: trimmed.substring(0, 100) + (trimmed.length > 100 ? '...' : ''),
                    imagePrompt: trimmed,
                    imageUrl: `https://picsum.photos/seed/scene${index + 1}/800/600`,
                    duration: 3000,
                });
            }
        });

        // If no scenes created, create at least one
        if (scenes.length === 0) {
            scenes.push({
                id: '1',
                description: transcript.substring(0, 100) + (transcript.length > 100 ? '...' : ''),
                imagePrompt: transcript,
                imageUrl: 'https://picsum.photos/seed/default/800/600',
                duration: 3000,
            });
        }

        return scenes;
    }

    async regenerateImage(sceneId: string): Promise<string> {
        // Mock implementation - can be replaced with real image generation API
        await new Promise(resolve => setTimeout(resolve, 1500));
        return `https://picsum.photos/seed/${Math.random()}/800/600`;
    }

    async transformText(text: string, type: 'summarize' | 'rewrite' | 'translate', targetLanguage?: string): Promise<string> {
        if (!GEMINI_API_KEY) {
            // Fallback to simple transformations
            return this.simpleTransformText(text, type);
        }

        try {
            let prompt = '';
            
            switch (type) {
                case 'summarize':
                    prompt = 'You are a text summarizer. Provide a concise summary of the given text. Return only the summary, no additional commentary.';
                    break;
                case 'rewrite':
                    prompt = 'You are a text rewriter. Rewrite the given text to improve clarity and flow while maintaining the original meaning. Return only the rewritten text.';
                    break;
                case 'translate':
                    const language = targetLanguage || 'Spanish';
                    prompt = `You are a translator. Translate the given text to ${language}. Return only the translated text, no additional commentary or explanations.`;
                    break;
            }

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${prompt}\n\nText:\n${text}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                    }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API Error:', errorText);
                return this.simpleTransformText(text, type);
            }

            const data = await response.json();
            const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!result || result.trim().length === 0) {
                throw new Error('Empty response from Gemini API');
            }
            
            return result.trim();
        } catch (error) {
            console.error('Text transformation error:', error);
            return this.simpleTransformText(text, type);
        }
    }

    private simpleTransformText(text: string, type: 'summarize' | 'rewrite' | 'translate'): string {
        // Simple fallback transformations
        if (type === 'summarize') {
            return text.split('.').slice(0, 2).join('.') + '.';
        }
        if (type === 'rewrite') {
            return text; // Return as-is for rewrite
        }
        if (type === 'translate') {
            return text; // Return as-is for translate (would need real translation service)
        }
        return text;
    }

    /**
     * Create bullet points from transcript using Gemini AI
     */
    async createBulletPoints(transcript: string): Promise<string> {
        if (!GEMINI_API_KEY) {
            return this.simpleBulletPoints(transcript);
        }

        try {
            const prompt = `You are a content organizer. Extract the key points from the following transcript and format them as a clear, well-organized bullet point list. 
Each bullet point should be concise but informative. Use proper bullet formatting with "•" or "-" symbols.

Return ONLY the bullet points, no additional commentary or explanations.

Transcript:
${transcript}`;

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                    }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API Error:', errorText);
                return this.simpleBulletPoints(transcript);
            }

            const data = await response.json();
            const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!result || result.trim().length === 0) {
                throw new Error('Empty response from Gemini API');
            }
            
            return result.trim();
        } catch (error) {
            console.error('Bullet points creation error:', error);
            return this.simpleBulletPoints(transcript);
        }
    }

    /**
     * Create journal entry from transcript using Gemini AI
     */
    async createJournalEntry(transcript: string): Promise<string> {
        if (!GEMINI_API_KEY) {
            return this.simpleJournalEntry(transcript);
        }

        try {
            const prompt = `You are a journal writer. Transform the following transcript into a well-written journal entry. 
The journal entry should:
- Have a natural, reflective tone
- Include the date (use today's date)
- Organize the content in a narrative format
- Add personal reflections and insights where appropriate
- Be engaging and readable

Return ONLY the journal entry, no additional commentary.

Transcript:
${transcript}`;

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.8,
                    }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API Error:', errorText);
                return this.simpleJournalEntry(transcript);
            }

            const data = await response.json();
            const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!result || result.trim().length === 0) {
                throw new Error('Empty response from Gemini API');
            }
            
            return result.trim();
        } catch (error) {
            console.error('Journal entry creation error:', error);
            return this.simpleJournalEntry(transcript);
        }
    }

    /**
     * Create meeting notes from transcript using Gemini AI
     */
    async createMeetingNotes(transcript: string): Promise<string> {
        if (!GEMINI_API_KEY) {
            return this.simpleMeetingNotes(transcript);
        }

        try {
            const prompt = `You are a meeting notes organizer. Transform the following transcript into professional meeting notes. 
The meeting notes should include:
- Meeting title/subject
- Key discussion points
- Decisions made
- Action items (if any)
- Next steps (if any)

Format it clearly with sections and bullet points where appropriate.

Return ONLY the meeting notes, no additional commentary.

Transcript:
${transcript}`;

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                    }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API Error:', errorText);
                return this.simpleMeetingNotes(transcript);
            }

            const data = await response.json();
            const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!result || result.trim().length === 0) {
                throw new Error('Empty response from Gemini API');
            }
            
            return result.trim();
        } catch (error) {
            console.error('Meeting notes creation error:', error);
            return this.simpleMeetingNotes(transcript);
        }
    }

    /**
     * Create todo list from transcript using Gemini AI
     */
    async createTodoList(transcript: string): Promise<string> {
        if (!GEMINI_API_KEY) {
            return this.simpleTodoList(transcript);
        }

        try {
            const prompt = `You are a task extractor. Extract all actionable items, tasks, and to-dos from the following transcript. 
Format them as a clear todo list with checkboxes [ ].

Each item should be:
- Actionable and specific
- Clear and concise
- In the order they appear or by priority

Return ONLY the todo list, no additional commentary.

Transcript:
${transcript}`;

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                    }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini API Error:', errorText);
                return this.simpleTodoList(transcript);
            }

            const data = await response.json();
            const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!result || result.trim().length === 0) {
                throw new Error('Empty response from Gemini API');
            }
            
            return result.trim();
        } catch (error) {
            console.error('Todo list creation error:', error);
            return this.simpleTodoList(transcript);
        }
    }

    /**
     * Create mind map image from transcript using Gemini 3 Pro Image Preview model
     */
    async createMindMapImage(transcript: string): Promise<string> {
        if (!GEMINI_API_KEY) {
            throw new Error('Google Gemini API key not configured for mind map generation');
        }

        try {
            // Use gemini-3-pro-image-preview model for image generation
            const MIND_MAP_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent';

            const prompt = `Create a visual mind map diagram based on the following transcript. 
The mind map should:
- Have a central topic in the center
- Show main branches with key concepts
- Include sub-branches with supporting details
- Be visually clear and organized
- Use colors and visual hierarchy to show relationships

Generate a mind map image that represents the structure and key ideas from this transcript:

${transcript}`;

            const response = await fetch(`${MIND_MAP_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                    }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini Mind Map API Error:', errorText);
                throw new Error(`Mind map generation failed: ${errorText}`);
            }

            const data = await response.json();
            
            // Log the full response for debugging
            console.log('Mind Map API Response:', JSON.stringify(data, null, 2));
            
            // Check for image in response (Gemini 3 Pro Image Preview returns images)
            const imagePart = data.candidates?.[0]?.content?.parts?.find((part: any) => part.inline_data);
            
            if (imagePart?.inline_data?.data) {
                // Return base64 data URI
                return `data:${imagePart.inline_data.mime_type || 'image/png'};base64,${imagePart.inline_data.data}`;
            }

            // If no image, check for text response with image URL or reference
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
                console.log('Mind Map text response:', textResponse);
                // Try to extract image URL if present
                const urlMatch = textResponse.match(/https?:\/\/[^\s]+\.(png|jpg|jpeg|gif|webp)/i);
                if (urlMatch) {
                    return urlMatch[0];
                }
                
                // If we got text but no image, the model might not support direct image generation
                // Fall back to generating a structured text-based mind map
                console.warn('Gemini model returned text instead of image. Generating text-based mind map structure.');
                return await this.generateTextBasedMindMap(transcript);
            }

            // If we get here, the response structure is unexpected
            console.error('Unexpected response structure:', data);
            throw new Error('No image data received from Gemini API. The model may not support direct image generation.');
        } catch (error: any) {
            console.error('Mind map image creation error:', error);
            throw error;
        }
    }

    /**
     * Generate a text-based mind map structure as fallback
     */
    private async generateTextBasedMindMap(transcript: string): Promise<string> {
        if (!GEMINI_API_KEY) {
            return this.simpleMindMapText(transcript);
        }

        try {
            const prompt = `Create a detailed mind map structure based on the following transcript. 
Format it as a hierarchical text structure showing:
- Central topic (main theme)
- Main branches (key concepts, 3-5 main points)
- Sub-branches (supporting details for each main point)

Use indentation and visual markers like this format:
CENTRAL TOPIC
  ├─ Main Branch 1
  │   ├─ Sub-branch 1.1
  │   └─ Sub-branch 1.2
  ├─ Main Branch 2
  │   ├─ Sub-branch 2.1
  │   └─ Sub-branch 2.2
  └─ Main Branch 3

Transcript:
${transcript}`;

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                    }
                }),
            });

            if (!response.ok) {
                return this.simpleMindMapText(transcript);
            }

            const data = await response.json();
            const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (result && result.trim().length > 0) {
                return result.trim();
            }
            
            return this.simpleMindMapText(transcript);
        } catch (error) {
            console.error('Text-based mind map generation error:', error);
            return this.simpleMindMapText(transcript);
        }
    }

    // Fallback methods
    private simpleBulletPoints(transcript: string): string {
        return transcript
            .split(/[.!?]+/)
            .filter(s => s.trim().length > 0)
            .slice(0, 8)
            .map(s => `• ${s.trim()}`)
            .join('\n');
    }

    private simpleJournalEntry(transcript: string): string {
        const date = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        return `Journal Entry - ${date}\n\n${transcript}\n\nReflection: This transcript captured important thoughts and discussions that I want to remember.`;
    }

    private simpleMeetingNotes(transcript: string): string {
        return `Meeting Notes\n\nKey Points:\n${transcript.split(/[.!?]+/).filter(s => s.trim().length > 0).slice(0, 5).map(s => `• ${s.trim()}`).join('\n')}\n\nAction Items:\n- Review and follow up on discussed topics`;
    }

    private simpleTodoList(transcript: string): string {
        return transcript
            .split(/[.!?]/)
            .filter(s => s.trim().length > 10)
            .slice(0, 5)
            .map(s => `[ ] ${s.trim()}`)
            .join('\n');
    }

    private simpleMindMapText(transcript: string): string {
        const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const mainPoints = sentences.slice(0, 4);
        const centralTopic = transcript.substring(0, 50).trim() + (transcript.length > 50 ? '...' : '');
        
        let mindMap = `CENTRAL TOPIC: ${centralTopic}\n\n`;
        mainPoints.forEach((point, index) => {
            mindMap += `  ├─ Main Point ${index + 1}: ${point.trim().substring(0, 60)}\n`;
        });
        
        return mindMap;
    }
}

export default new AIService();

