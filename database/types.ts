// TypeScript types matching database schema

export interface FolderRow {
    id: string;
    name: string;
    parent_id: string | null;
    color: string | null;
    icon: string | null;
    created_at: number;
    updated_at: number;
}

export interface TagRow {
    id: string;
    name: string;
    color: string;
    created_at: number;
}

export interface ProjectRow {
    id: string;
    title: string;
    audio_uri: string;
    transcript: string;
    folder_id: string | null;
    thumbnail_url: string | null;
    date: number;
    created_at: number;
    updated_at: number;
}

export interface ProjectTagRow {
    project_id: string;
    tag_id: string;
}

export interface VideoRow {
    id: string;
    project_id: string;
    title: string | null;
    created_at: number;
    updated_at: number;
}

export interface SceneRow {
    id: string;
    video_id: string;
    description: string;
    duration: number;
    sequence_order: number;
    created_at: number;
}

export interface SceneImageRow {
    id: string;
    scene_id: string;
    image_prompt: string;
    image_url: string | null;
    sequence_order: number;
    created_at: number;
}

export interface ProjectSummaryRow {
    id: string;
    project_id: string;
    summary_text: string;
    created_at: number;
    updated_at: number;
}

export interface RewriteHistoryRow {
    id: string;
    project_id: string;
    transcript_text: string;
    rewrite_type: 'rewrite' | 'translate' | 'summarize' | 'manual';
    target_language: string | null;
    parent_rewrite_id: string | null;
    created_at: number;
    metadata: string | null; // JSON string
}

export interface TranslationRow {
    id: string;
    project_id: string;
    source_text: string;
    translated_text: string;
    target_language: string;
    created_at: number;
    updated_at: number;
}

export interface AudioBulletPointsRow {
    id: string;
    project_id: string;
    bullet_points_text: string;
    created_at: number;
    updated_at: number;
}

export interface MindMapRow {
    id: string;
    project_id: string;
    mind_map_data: string;
    image_uri: string | null;
    format: 'text' | 'image';
    created_at: number;
    updated_at: number;
}

export interface JournalEntryRow {
    id: string;
    project_id: string;
    entry_text: string;
    created_at: number;
    updated_at: number;
}

export interface CreateContentRow {
    id: string;
    project_id: string;
    content_type: 'meeting_notes' | 'todo_list' | 'illustration' | 'video';
    content_data: string; // JSON or text
    created_at: number;
    updated_at: number;
}

export interface DatabaseMetadataRow {
    key: string;
    value: string;
}

