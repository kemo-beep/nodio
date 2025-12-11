# Nodio - App Design Document

## Executive Summary

**Nodio** is an AI-powered mobile application that transforms voice recordings into structured content through transcription, AI-powered text processing, and multimedia generation. The app enables users to record audio, get instant transcriptions, apply AI transformations (summarization, rewriting, translation), and create various content formats including videos, mind maps, journal entries, and more.

**Vision**: "Voice Notes + Gemini AI + Video Creation" in one seamless mobile experience.

---

## 1. Application Overview

### 1.1 Purpose

Nodio empowers users to:

- Capture ideas, stories, lectures, or any audio content
- Automatically transcribe audio to text
- Transform transcripts using AI (summarize, rewrite, translate)
- Generate multimedia content (videos, mind maps, bullet points, journal entries)
- Organize content with folders and tags
- Create AI-generated video scenes from transcripts

### 1.2 Target Users

- Content creators and storytellers
- Students and educators
- Journal writers
- Meeting note takers
- Creative professionals
- Anyone who wants to transform voice into structured content

### 1.3 Core Value Proposition

1. **Seamless Voice-to-Content Pipeline**: Record → Transcribe → Transform → Create
2. **AI-Powered Intelligence**: Leverages Google Gemini AI for all transformations
3. **Local-First Architecture**: All data stored locally with SQLite for privacy and offline access
4. **Rich Content Generation**: Multiple output formats from a single transcript
5. **Professional UI/UX**: Designed with attention to detail and modern mobile design principles

---

## 2. Core Features

### 2.1 Audio Recording & Transcription

#### Recording

- **High-quality audio recording** using Expo AV
- **Persistent storage** in app document directory
- **Permission handling** for microphone access
- **Real-time recording state** with visual feedback

#### Transcription

- **Dual transcription providers**:
  - **Primary**: Local Whisper server (FastAPI backend)
  - **Fallback**: Google Gemini API (gemini-2.0-flash-exp)
- **Automatic transcription** after recording stops
- **Error handling** with user-friendly messages
- **Support for multiple audio formats** (m4a, mp3, wav, mp4, ogg)

**Implementation**: `services/AudioService.ts`, `services/AIService.ts`

### 2.2 Project Management

#### Projects

- **Core entity** representing a recording with transcript
- **Metadata**: Title, date, folder, tags, audio URI, transcript
- **CRUD operations**: Create, read, update, delete
- **Folder organization**: Projects can be organized in folders
- **Tag system**: Multiple tags per project for flexible categorization

#### Folders

- **Hierarchical folder structure** (nested folders supported)
- **Navigation stack** for folder browsing
- **Default "All Projects" folder**
- **Folder metadata**: Name, color, icon, parent folder

#### Tags

- **User-created tags** with custom colors
- **Many-to-many relationship** with projects
- **Tag filtering** on home screen
- **Unique tag names**

**Implementation**: `store/useProjectStore.ts`, `store/useFolderStore.ts`, `store/useTagStore.ts`

### 2.3 Text Transformation Tools

#### Writing Tools

1. **Summarize**: Generate concise summaries of transcripts
2. **Rewrite**: Improve clarity and flow while maintaining meaning
3. **Translate**: Translate to multiple languages

#### Features

- **Inline editing** with real-time preview
- **AI processing indicators** during transformation
- **Error handling** with retry options
- **History tracking** (rewrite_history table for git-like versioning)

**Implementation**: `components/WritingTools.tsx`, `services/AIService.ts`

### 2.4 Content Creation

#### Create Tab Options

1. **Bullet Points**: Extract key points as organized list
2. **Mind Map**: Generate visual mind map (image or text-based)
3. **Journal Entry**: Transform into narrative journal format
4. **Meeting Notes**: Create structured meeting notes with action items
5. **Todo List**: Extract actionable items as checklist
6. **Illustration**: Generate visual illustrations (placeholder)
7. **Video**: Create video with AI-generated scenes (in development)

#### Features

- **AI-powered generation** using Gemini models
- **Multiple output formats** (text, images, structured data)
- **Export options** (copy, share, download)
- **Error handling** with fallback to simple transformations

**Implementation**: `components/CreateTab.tsx`, `services/AIService.ts`

### 2.5 Video Generation (Planned)

#### Scene Generation

- **AI scene breakdown**: Transcript → Scenes with descriptions
- **Image prompt generation**: Detailed prompts for each scene
- **Scene management**: Merge, split, reorder, edit scenes
- **Multiple images per scene**: Support for variations

#### Video Structure

- **Videos table**: Projects can have multiple videos
- **Scenes table**: Scenes belong to videos (not directly to projects)
- **Scene images**: Multiple images per scene with sequence ordering
- **Duration control**: Customizable scene durations

**Implementation**: `database/schema.ts` (videos, scenes, scene_images tables), `services/AIService.ts` (generateScenes method)

### 2.6 Organization & Discovery

#### Home Screen Features

- **Search**: Full-text search across projects (title and transcript)
- **Filtering**: By folder, tag, date
- **Sorting**: Recent, oldest, alphabetical
- **Folder navigation**: Breadcrumb-style navigation
- **Empty states**: Helpful messages when no content exists

#### Project Actions

- **Rename**: Inline title editing
- **Move to folder**: Change project location
- **Tag management**: Add/remove tags
- **Delete**: Remove projects with confirmation

**Implementation**: `app/(tabs)/index.tsx`

---

## 3. Technical Architecture

### 3.1 Technology Stack

#### Frontend

- **Framework**: React Native with Expo (~54.0.27)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand (v5.0.9)
- **UI Components**: React Native core + Ionicons
- **Animations**: React Native Reanimated (v4.1.1)
- **Audio**: Expo AV (v16.0.8)
- **File System**: Expo FileSystem (v19.0.20)
- **Database**: Expo SQLite (~15.0.0)

#### Backend Services

- **Transcription**:
  - Local Whisper server (FastAPI/Python)
  - Google Gemini API (gemini-2.0-flash-exp)
- **AI Processing**: Google Gemini API
  - Text transformations: gemini-2.0-flash-exp
  - Image generation: gemini-3-pro-image-preview
- **Server**: Python FastAPI with Whisper integration

#### Design System

- **Theme**: Custom theme system (`constants/Colors.ts`, `constants/theme.ts`)
- **Typography**: System fonts with custom weights
- **Colors**: Adaptive light/dark mode support
- **Components**: Reusable UI components in `components/` directory

### 3.2 Architecture Patterns

#### Data Flow

```
UI Components
    ↓
Zustand Stores (Reactive State)
    ↓
Repository Layer (Data Access)
    ↓
SQLite Database (Persistence)
```

#### Key Principles

1. **Local-First**: All data stored locally in SQLite
2. **Repository Pattern**: Data access abstracted through repositories
3. **Store Pattern**: Zustand stores for reactive UI state
4. **Service Layer**: Business logic in service classes (AIService, AudioService)

### 3.3 Database Architecture

#### Core Tables

- **folders**: Hierarchical folder structure
- **tags**: User-created tags
- **projects**: Main project/recording entity
- **project_tags**: Many-to-many relationship

#### Extended Tables

- **videos**: Video entities (projects can have multiple videos)
- **scenes**: Video scenes (belong to videos)
- **scene_images**: Multiple images per scene
- **project_summaries**: AI-generated summaries
- **rewrite_history**: Git-like version history
- **translations**: Multi-language translations
- **audio_bullet_points**: Extracted bullet points
- **mind_maps**: Mind map data (text or image)
- **journal_entries**: Journal entries
- **create_content**: Various content types

#### Database Features

- **Foreign keys**: Referential integrity with CASCADE deletes
- **Indexes**: Optimized queries on frequently accessed columns
- **Migrations**: Version-based schema migration system
- **Transactions**: ACID-compliant operations

**Implementation**: `database/schema.ts`, `database/index.ts`, `database/repositories/`

### 3.4 State Management

#### Zustand Stores

1. **useProjectStore**: Projects, current project, recording state
2. **useFolderStore**: Folders, navigation stack, current folder
3. **useTagStore**: Tags, tag operations
4. **useThemeStore**: Theme preferences (light/dark)

#### Store Features

- **Reactive updates**: UI automatically updates on state changes
- **Database sync**: Stores sync with SQLite database
- **Optimistic updates**: UI updates immediately, database syncs in background
- **Error handling**: Graceful error handling with user feedback

**Implementation**: `store/useProjectStore.ts`, `store/useFolderStore.ts`, `store/useTagStore.ts`

### 3.5 Service Layer

#### AIService

- **Transcription**: Audio → Text (Whisper/Gemini)
- **Text Transformation**: Summarize, rewrite, translate
- **Scene Generation**: Transcript → Video scenes
- **Content Generation**: Bullet points, mind maps, journal entries, etc.
- **Error Handling**: Fallback to simple transformations when AI unavailable

#### AudioService

- **Recording**: Start/stop audio recording
- **Playback**: Play recorded audio
- **File Management**: Save, delete, get info
- **Permissions**: Request microphone permissions

**Implementation**: `services/AIService.ts`, `services/AudioService.ts`

---

## 4. User Flows

### 4.1 Recording Flow

1. User taps record button (central FAB)
2. App requests microphone permission (if needed)
3. Recording starts, visual feedback shown
4. User taps again to stop
5. Audio saved to permanent storage
6. Transcription begins (with loading indicator)
7. Project created with transcript
8. User navigated to editor screen

### 4.2 Editing Flow

1. User opens project from home screen
2. Editor screen shows: Title, metadata, audio player, tabs
3. **Notes Tab**: Writing tools, AI summary
4. **Transcript Tab**: Editable transcript
5. **Create Tab**: Content generation options
6. User can apply transformations, generate content, edit text

### 4.3 Organization Flow

1. User creates folders from home screen
2. Projects can be moved to folders
3. Tags can be added to projects
4. Search and filter by folder/tag
5. Navigate folder hierarchy with breadcrumbs

### 4.4 Content Creation Flow

1. User opens Create tab in editor
2. Selects content type (bullet points, mind map, etc.)
3. AI generates content (with loading indicator)
4. Content displayed (text or image)
5. User can copy, share, or export

---

## 5. UI/UX Design

### 5.1 Design Principles

- **Modern iOS Design**: Follows Apple Human Interface Guidelines
- **Clean & Minimal**: Focus on content, reduce clutter
- **Consistent Spacing**: 8px/16px grid system
- **Clear Hierarchy**: Typography and color establish importance
- **Smooth Animations**: React Native Reanimated for fluid interactions
- **Haptic Feedback**: Tactile feedback for important actions

### 5.2 Screen Layouts

#### Home Screen (`app/(tabs)/index.tsx`)

- **Header**: Title, back button (when in folder), create folder button
- **Search Bar**: Full-width search with clear button
- **Filter Tabs**: Segmented control (All, Recent)
- **Content List**: Folders and projects in unified list
- **FAB**: Central record button (only in root view)

#### Editor Screen (`app/editor/[id].tsx`)

- **Header**: Back button, share button
- **Title Section**: Editable title, metadata, tags
- **Audio Player**: Playback controls
- **Tab Bar**: Segmented control (Notes, Transcript, Create)
- **Tab Content**: Context-specific content

#### Create Tab (`components/CreateTab.tsx`)

- **Option Grid**: 2-column grid of creation options
- **Content View**: Generated content with actions
- **Loading States**: Activity indicators during generation

### 5.3 Component Library

#### Reusable Components

- **ProjectCard**: Project preview card
- **FolderListItem**: Folder item in list
- **AudioPlayer**: Audio playback controls
- **TitleEditor**: Inline title editing
- **TagChip**: Tag display with remove option
- **TagSelector**: Modal for tag selection
- **WritingTools**: Text transformation tools
- **RecordButton**: Central recording button

**Location**: `components/` directory

### 5.4 Theme System

#### Color Palette

- **Primary**: Blue (#2F54EB) - Actions, highlights
- **Background**: White/Light gray - Main background
- **Surface**: Light gray - Cards, containers
- **Text**: Black/Gray - Content text
- **Text Secondary**: Medium gray - Metadata
- **Border**: Light gray - Dividers

**Implementation**: `constants/Colors.ts`, `constants/theme.ts`

---

## 6. Data Models

### 6.1 Project Model

```typescript
interface Project {
  id: string;
  title: string;
  date: Date;
  updatedAt: Date;
  audioUri: string;
  transcript: string;
  folderId: string | null;
  tags: string[];
  videos: Video[];
  thumbnailUrl?: string;
}
```

### 6.2 Folder Model

```typescript
interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
  icon?: string;
  createdAt: number;
  updatedAt: number;
}
```

### 6.3 Tag Model

```typescript
interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}
```

### 6.4 Video/Scene Model

```typescript
interface Video {
  id: string;
  projectId: string;
  title: string | null;
  scenes: Scene[];
}

interface Scene {
  id: string;
  videoId: string;
  description: string;
  duration: number;
  sequenceOrder: number;
  images: SceneImage[];
}

interface SceneImage {
  id: string;
  sceneId: string;
  imagePrompt: string;
  imageUrl: string | null;
  sequenceOrder: number;
}
```

---

## 7. API Integration

### 7.1 Transcription API

#### Local Whisper Server

- **Endpoint**: `{WHISPER_SERVER_URL}/whisper/transcribe`
- **Method**: POST
- **Format**: multipart/form-data
- **Response**: JSON with `text` field

#### Google Gemini API

- **Model**: gemini-2.0-flash-exp
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`
- **Method**: POST
- **Format**: JSON with base64 audio
- **Response**: JSON with transcript in `candidates[0].content.parts[0].text`

### 7.2 AI Processing API

#### Text Transformation

- **Model**: gemini-2.0-flash-exp
- **Operations**: Summarize, rewrite, translate
- **Input**: Text + operation type
- **Output**: Transformed text

#### Content Generation

- **Model**: gemini-2.0-flash-exp (text), gemini-3-pro-image-preview (images)
- **Operations**: Bullet points, mind maps, journal entries, meeting notes, todo lists
- **Input**: Transcript
- **Output**: Generated content (text or image)

#### Scene Generation

- **Model**: gemini-2.0-flash-exp
- **Input**: Transcript
- **Output**: JSON array of scenes with descriptions and image prompts

**Implementation**: `services/AIService.ts`

---

## 8. File Structure

```
nodio/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home screen
│   │   └── explore.tsx     # Account/explore screen
│   ├── editor/            # Editor screens
│   │   └── [id].tsx       # Project editor
│   └── preview/           # Preview screens
│       └── [id].tsx       # Video preview
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components
│   └── [Component].tsx    # Feature components
├── constants/              # Constants and themes
│   ├── Colors.ts          # Color palette
│   ├── Styles.ts          # Common styles
│   └── theme.ts           # Theme configuration
├── database/               # Database layer
│   ├── index.ts           # Database initialization
│   ├── schema.ts          # Schema definitions
│   ├── types.ts           # TypeScript types
│   └── repositories/      # Data access layer
├── services/               # Business logic
│   ├── AIService.ts       # AI operations
│   ├── AudioService.ts    # Audio operations
│   └── MockAIService.ts   # Mock data (development)
├── store/                  # Zustand stores
│   ├── useProjectStore.ts
│   ├── useFolderStore.ts
│   ├── useTagStore.ts
│   └── useThemeStore.ts
├── server/                 # Backend server (Python)
│   ├── server.py          # FastAPI server
│   └── requirements.txt   # Python dependencies
└── docs/                   # Documentation
    ├── summary.md         # This document
    ├── raw_idea.md        # Original concept
    └── database-plan.md   # Database design
```

---

## 9. Key Features in Detail

### 9.1 Local-First Architecture

#### Benefits

- **Privacy**: All data stored locally, no cloud required
- **Offline Access**: Full functionality without internet
- **Performance**: Fast queries with SQLite
- **Data Ownership**: User owns their data

#### Implementation

- SQLite database for all persistent data
- File system for audio recordings
- Zustand stores for reactive UI state
- Repository pattern for data access

### 9.2 AI Integration

#### Providers

1. **Primary**: Local Whisper server (privacy-focused)
2. **Fallback**: Google Gemini API (cloud-based)

#### Models Used

- **gemini-2.0-flash-exp**: Text processing, transcription
- **gemini-3-pro-image-preview**: Image generation

#### Features

- Automatic fallback between providers
- Error handling with user-friendly messages
- Loading indicators during processing
- Retry mechanisms for failed operations

### 9.3 Content Generation

#### Supported Formats

1. **Text-based**: Bullet points, journal entries, meeting notes, todo lists
2. **Visual**: Mind maps (image or text)
3. **Structured**: Meeting notes with sections
4. **Actionable**: Todo lists with checkboxes

#### AI Prompts

- Carefully crafted prompts for each content type
- Temperature settings optimized for each use case
- JSON response format for structured data
- Fallback to simple transformations when AI unavailable

### 9.4 Organization System

#### Folders

- Hierarchical structure (nested folders)
- Navigation stack for breadcrumb navigation
- Default "All Projects" folder
- Visual indicators (color, icon)

#### Tags

- User-created tags with custom colors
- Many-to-many relationship with projects
- Tag filtering on home screen
- Quick tag management

---

## 10. Development & Deployment

### 10.1 Development Setup

#### Prerequisites

- Node.js and npm
- Expo CLI
- Python 3.10+ (for local Whisper server)
- iOS Simulator or Android Emulator

#### Setup Steps

1. Install dependencies: `npm install`
2. Configure environment variables (`.env`):
   - `EXPO_PUBLIC_WHISPER_SERVER_URL` (optional)
   - `EXPO_PUBLIC_GEMINI_API_KEY` (optional)
   - `EXPO_PUBLIC_TRANSCRIPTION_PROVIDER` (local/gemini/auto)
3. Start Expo: `npx expo start`
4. (Optional) Start Whisper server: `cd server && ./start.sh`

### 10.2 Environment Configuration

#### Local Whisper Server (Recommended)

- Free and private
- No API costs
- Full control over data
- Setup: See `docs/whisper-server-setup.md`

#### Google Gemini API

- Requires API key
- Cloud-based
- Pay-per-use
- Setup: Add `EXPO_PUBLIC_GEMINI_API_KEY` to `.env`

### 10.3 Database Migrations

#### Migration System

- Version-based schema tracking
- Automatic migration on app start
- Current version: 2
- Migration from v1 to v2: Added videos and scene_images tables

**Implementation**: `database/index.ts` (migrateDatabase function)

---

## 11. Future Enhancements

### 11.1 Planned Features

#### Video Generation

- Complete video creation pipeline
- Scene image generation with AI
- Video stitching with FFmpeg
- Subtitle generation
- Background music integration
- Export to MP4/GIF

#### Advanced AI Features

- Speaker diarization (multiple speakers)
- Auto punctuation and formatting
- Style transformations (professional, casual, etc.)
- Content expansion/shortening
- Auto B-roll generation

#### Collaboration

- Cloud sync (optional)
- Share projects with others
- Collaborative editing
- Export to various formats

#### UI/UX Improvements

- Dark mode support
- Custom themes
- Advanced search with filters
- Batch operations
- Keyboard shortcuts

### 11.2 Technical Improvements

#### Performance

- Lazy loading for large transcripts
- Image caching
- Background processing
- Optimized database queries

#### Reliability

- Better error handling
- Offline queue for API calls
- Data backup/restore
- Conflict resolution for sync

#### Developer Experience

- Unit tests
- Integration tests
- E2E tests
- CI/CD pipeline
- Code documentation

---

## 12. Design Philosophy

### 12.1 User Experience

- **Simplicity**: Minimal steps to achieve goals
- **Feedback**: Clear indicators for all actions
- **Error Recovery**: Helpful error messages with recovery options
- **Performance**: Fast, responsive interactions
- **Accessibility**: Support for accessibility features

### 12.2 Code Quality

- **TypeScript**: Full type safety
- **Modularity**: Clear separation of concerns
- **Reusability**: Shared components and utilities
- **Maintainability**: Well-documented code
- **Scalability**: Architecture supports growth

### 12.3 Privacy & Security

- **Local-First**: Data stored locally by default
- **No Tracking**: No analytics or tracking
- **User Control**: User owns their data
- **Optional Cloud**: Cloud sync is optional, not required

---

## 13. Conclusion

Nodio is a comprehensive voice-to-content platform that combines powerful AI capabilities with a clean, intuitive interface. The local-first architecture ensures privacy and performance, while the flexible content generation system enables users to transform their voice recordings into various useful formats.

The app is built with modern technologies and follows best practices for mobile app development, making it maintainable and scalable for future enhancements.

---

## Appendix

### A. Key Dependencies

- `expo`: ~54.0.27
- `expo-router`: ~6.0.17
- `expo-sqlite`: ~15.0.0
- `expo-av`: ^16.0.8
- `zustand`: ^5.0.9
- `react-native-reanimated`: ~4.1.1
- `@expo/vector-icons`: ^15.0.3

### B. Database Schema Version

- Current: 2
- Migration support: Yes
- Foreign keys: Enabled
- Indexes: Optimized for common queries

### C. API Endpoints

- Local Whisper: `/whisper/transcribe`
- Gemini Text: `/v1beta/models/gemini-2.0-flash-exp:generateContent`
- Gemini Image: `/v1beta/models/gemini-3-pro-image-preview:generateContent`

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-27  
**Maintained By**: Development Team
