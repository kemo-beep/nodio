# Nodio: AI-Powered Voice → Text → Story → Video Creation Tool

> An AI-powered Voice → Text → Story → Video creation tool. This is structured like something you'd hand to designers, developers, or investors.

## 🎙️ App Concept: Speak → Transcribe → Create → Edit → Publish

A powerful iOS app that lets users record audio, get instant transcription, then use AI to translate, summarize, rewrite, refine, and ultimately generate an AI-animated video with editable scenes.

**Think:** "Voice Notes + Gemini + Nana Banana Pro + CapCut" in one mobile app.

---

## ✨ Core User Flow

### 1. Speak

- User taps a big microphone button
- Records audio (voice memo, story, lecture, idea, vlog narration)
- **Optional:** Import an existing audio or video file

### 2. AI Transcription

Upload to backend LLM for:

- Accurate transcription
- Speaker diarization (optional)
- Auto punctuation

### 3. Text Toolbox

Once the transcript is ready, the user can choose tools:

- 🔁 **Translate** (any language)
- 📝 **Summarize**
- 💬 **Rewrite**
- ✍️ **Refine / Improve**
- 📌 **Highlight key points**
- 📚 **Expand or shorten text**
- ✨ **Style transforms:** Professional, friendly, storytelling, cinematic

All with an inline editor where the user can tweak text.

### 4. 🎬 Convert Transcript → Video Scenes

#### AI Scene Analyzer

The app will:

- Break transcript into scenes (default: every 1–2 sentences)
- For each scene:
  - Generate a one-line description
  - Generate an image prompt
  - Detect characters, objects, and action

#### Example

**Transcript sentence:**

> "Then I walked into the forest and found a glowing blue mushroom."

**Scene AI output:**

- **Description:** "A person enters a mysterious forest and discovers a glowing blue mushroom."
- **Image prompt:** `fantasy forest, glowing blue mushroom, soft light beams, magical atmosphere, cinematic style`

#### User Controls

User can:

- Merge or split scenes
- Edit scene descriptions
- Edit prompts
- Add new scenes
- Reorder scenes

### 5. 🖼️ AI Image Generation for Each Scene

**Options:**

- Midjourney (API-like proxy)
- OpenAI Image 4
- Stable Diffusion (local or cloud)
- Flux or LCM models (fast)

- Each scene gets 4 variations, user chooses one
- User can regenerate any scene

### 6. 🎞️ Auto-Stitched Video

The app automatically:

- Places each selected image into the timeline
- Adds transitions
- Adds background music (AI-generated or licensed)
- Adds subtitles from transcript

**Supports:**

- Aspect ratios (1:1, 16:9, 9:16)
- Duration per scene auto-calculated (or editable)
- User can preview instantly

### 7. ✂️ Full Scene & Video Editor

A simple timeline editor:

**Tap scene to edit:**

- Change text
- Regenerate image
- Upload your own image
- Adjust duration
- Apply filters

**Global settings:**

- Music
- Subtitles on/off
- Speed
- Export quality

**Export:**

- MP4
- GIF
- Instagram/TikTok ready formats

### 8. 🧠 Smart AI Enhancements

You can add powerful features:

- Auto B-roll generation (for vloggers)
- Lip-sync avatar narrator (optional)
- Camera moves for static AI images (Ken Burns effect)
- AI Voice Over (text → speech)
- Auto script improvement: "Make this more cinematic"

---

## 🎨 Art Style System for Scene & Video Generation

Users can choose a global art style for the entire video **OR** individually per scene.

### 🖼️ Supported Art Styles (Recommended)

#### 1. Ghibli Style

- Soft pastel colors
- Hand-drawn textures
- Gentle lighting
- Whimsical tone

**Prompt inject:**

```
"in Studio Ghibli art style, hand-painted, soft pastel colors, whimsical atmosphere"
```

#### 2. Disney/Pixar (3D Cinematic)

- Smooth, rounded characters
- Soft cinematic lighting
- High-quality 3D render look

**Prompt inject:**

```
"Disney Pixar 3D cinematic style, soft lighting, expressive characters, high-detail animation look"
```

#### 3. Mannequins (Cinematic 3D Photoreal)

- Life-size mannequins
- Clean, dramatic lighting
- Unreal Engine style

**Prompt inject:**

```
"cinematic 3D mannequin characters, Unreal Engine render, dramatic lighting, hyper-realistic materials"
```

#### 4. Low Poly (3D Rendered)

- Geometric shapes
- Flat shading
- Minimalistic 3D look

**Prompt inject:**

```
"low-poly 3D render, simple geometric shapes, clean edges, soft shadowing"
```

#### 5. Anime

- High-contrast shading
- Vibrant colors
- Clear outlines

**Prompt inject:**

```
"anime art style, bold outlines, vibrant colors, expressive poses"
```

#### 6. Photorealistic

- Real camera look
- Depth of field
- Natural lighting

**Prompt inject:**

```
"ultra-photorealistic, 50mm lens, real lighting, high-detail textures"
```

#### 7. Storybook / Watercolor

- Hand-painted watercolor look
- Soft diffuse edges

**Prompt inject:**

```
"storybook watercolor illustration, soft edges, hand-painted texture"
```

#### 8. Claymation

- Stop-motion look
- Clay textures
- Soft shadows

**Prompt inject:**

```
"claymation stop-motion style, visible clay texture, handcrafted look"
```

#### 9. Noir / Sketch / Ink

- Black-and-white high contrast
- Ink lines

**Prompt inject:**

```
"noir sketch style, ink shading, moody high-contrast lighting"
```

### 🎛️ Where This Fits In the App Flow

#### ✔ Level 1: Global Video Style

User picks 1 style that applies to all scenes.

**Useful for:**

- Consistent storytelling
- Fast editing
- Social media formats

#### ✔ Level 2: Scene-by-Scene Style

User can override for each scene:

- Scene 1 in Ghibli
- Scene 2 in Pixar
- Scene 3 in Low Poly
- Scene 4 Photorealistic

**Powerful for:**

- Dream sequences
- Flashbacks
- Creative contrast
- Educational videos

#### ✔ Level 3: Advanced Style Settings (optional)

- Lighting intensity
- Camera angle
- Color temperature
- Texture detail
- Motion blur
- Depth of field

> These only modify the selected style, not override it.

---

## 🛠️ Technical Implementation

### Backend

- **FastAPI or Go** (you already use both)
- **WebSocket** for real-time transcription
- **PostgreSQL** (session storage)
- **Supabase bucket**

### State Management

- **React Query** → for API calls (transcription, AI processing, video generation)
- **Zustand** → for local state (scenes, style, playback)

### UI / Animations

- **Reanimated 3 / React Native Gesture Handler** → smooth animations for timelines & scene editor

### Video & Media

- **Expo AV / Expo Video** → preview generated videos
- **FFmpegKit / react-native-ffmpeg** → stitch AI-generated images into a video timeline

### AI Integration

**Backend handles:**

- **Whisper / OpenAI** → transcription
- **Gemini(gemini-3-pro-preview model)** → refine / rewrite / scene breakdown / prompt generation
- **Image generation** → Google gemini-3-pro-image-preview
- **FFmpeg** → video stitching

> Frontend just sends audio + scene/style choices, receives processed video URL

### File Storage

- **Expo FileSystem** → cache recorded audio + video previews
- **Cloud Storage** → Supabase

### Optional Enhancements

- Offline Whisper model via react-native-tflite (if feasible)
- Push notifications when video is ready
- Background upload / processing



### Design
Make it look and feel like it is desgined and built by a billion dollar company in the silicon valley with decades of experience in building world-class mobile apps with amazing UI/UX design and well thought-out user experience and attention to detail.