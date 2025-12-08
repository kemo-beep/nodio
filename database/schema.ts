// Database schema definitions

export const SCHEMA_VERSION = 2;

export const createSchema = () => {
    return `
        -- Enable foreign keys
        PRAGMA foreign_keys = ON;

        -- Folders table
        CREATE TABLE IF NOT EXISTS folders (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
            color TEXT,
            icon TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);

        -- Tags table
        CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

        -- Projects table
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            audio_uri TEXT NOT NULL,
            transcript TEXT NOT NULL DEFAULT '',
            folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
            thumbnail_url TEXT,
            date INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_projects_folder ON projects(folder_id);
        CREATE INDEX IF NOT EXISTS idx_projects_date ON projects(date DESC);
        CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);

        -- Project tags junction table
        CREATE TABLE IF NOT EXISTS project_tags (
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
            PRIMARY KEY (project_id, tag_id)
        );

        CREATE INDEX IF NOT EXISTS idx_project_tags_project ON project_tags(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_tags_tag ON project_tags(tag_id);

        -- Videos table
        CREATE TABLE IF NOT EXISTS videos (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            title TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_videos_project ON videos(project_id);

        -- Scenes table (now references videos instead of projects)
        CREATE TABLE IF NOT EXISTS scenes (
            id TEXT PRIMARY KEY,
            video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
            description TEXT NOT NULL,
            duration INTEGER NOT NULL DEFAULT 3000,
            sequence_order INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_scenes_video ON scenes(video_id);
        CREATE INDEX IF NOT EXISTS idx_scenes_sequence ON scenes(video_id, sequence_order);

        -- Scene images table (multiple images per scene)
        CREATE TABLE IF NOT EXISTS scene_images (
            id TEXT PRIMARY KEY,
            scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
            image_prompt TEXT NOT NULL,
            image_url TEXT,
            sequence_order INTEGER NOT NULL,
            created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_scene_images_scene ON scene_images(scene_id);
        CREATE INDEX IF NOT EXISTS idx_scene_images_sequence ON scene_images(scene_id, sequence_order);

        -- Project summaries table
        CREATE TABLE IF NOT EXISTS project_summaries (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            summary_text TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            UNIQUE(project_id)
        );

        CREATE INDEX IF NOT EXISTS idx_summaries_project ON project_summaries(project_id);

        -- Rewrite history table
        CREATE TABLE IF NOT EXISTS rewrite_history (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            transcript_text TEXT NOT NULL,
            rewrite_type TEXT NOT NULL,
            target_language TEXT,
            parent_rewrite_id TEXT REFERENCES rewrite_history(id),
            created_at INTEGER NOT NULL,
            metadata TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_rewrite_project ON rewrite_history(project_id);
        CREATE INDEX IF NOT EXISTS idx_rewrite_created ON rewrite_history(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_rewrite_parent ON rewrite_history(parent_rewrite_id);

        -- Translations table
        CREATE TABLE IF NOT EXISTS translations (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            source_text TEXT NOT NULL,
            translated_text TEXT NOT NULL,
            target_language TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_translations_project ON translations(project_id);
        CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(target_language);

        -- Audio bullet points table
        CREATE TABLE IF NOT EXISTS audio_bullet_points (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            bullet_points_text TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            UNIQUE(project_id)
        );

        CREATE INDEX IF NOT EXISTS idx_bullets_project ON audio_bullet_points(project_id);

        -- Mind maps table
        CREATE TABLE IF NOT EXISTS mind_maps (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            mind_map_data TEXT NOT NULL,
            image_uri TEXT,
            format TEXT NOT NULL DEFAULT 'text',
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            UNIQUE(project_id)
        );

        CREATE INDEX IF NOT EXISTS idx_mindmaps_project ON mind_maps(project_id);

        -- Journal entries table
        CREATE TABLE IF NOT EXISTS journal_entries (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            entry_text TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            UNIQUE(project_id)
        );

        CREATE INDEX IF NOT EXISTS idx_journal_project ON journal_entries(project_id);

        -- Create content table
        CREATE TABLE IF NOT EXISTS create_content (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            content_type TEXT NOT NULL,
            content_data TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_create_content_project ON create_content(project_id);
        CREATE INDEX IF NOT EXISTS idx_create_content_type ON create_content(content_type);

        -- Database metadata table
        CREATE TABLE IF NOT EXISTS database_metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `;
};

export const initializeDefaultData = () => {
    return `
        -- Insert default "All Projects" folder if it doesn't exist
        INSERT OR IGNORE INTO folders (id, name, parent_id, created_at, updated_at)
        VALUES ('all-projects', 'All Projects', NULL, ${Date.now()}, ${Date.now()});
    `;
};

