# Local-First Database Implementation Plan

## Overview

This document outlines the comprehensive plan for implementing a local-first database system for the Nodio mobile app. The database will store all user data locally, ensuring the app works offline and provides a fast, responsive experience.

## Goals

1. **Local-First Architecture**: All data stored locally, works completely offline
2. **Data Persistence**: Survive app restarts, device reboots
3. **Performance**: Fast queries and updates
4. **Data Integrity**: ACID transactions, referential integrity
5. **Future Sync Ready**: Database structure supports future cloud sync
6. **Migration Path**: Smooth transition from in-memory Zustand stores

## Technology Choice

**expo-sqlite** - SQLite database for React Native/Expo

- ✅ Built-in to Expo, no native modules needed
- ✅ Full SQL support with transactions
- ✅ Excellent performance for local-first apps
- ✅ ACID compliant
- ✅ Can be extended for sync later (via WatermelonDB or custom sync)

## Database Schema Design

### Core Tables

#### 1. `folders`

Stores folder hierarchy and metadata.

```sql
CREATE TABLE folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
    color TEXT,
    icon TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX idx_folders_parent ON folders(parent_id);
```

#### 2. `tags`

Stores user-created tags.

```sql
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_tags_name ON tags(name);
```

#### 3. `projects`

Main table for projects/recordings.

```sql
CREATE TABLE projects (
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

CREATE INDEX idx_projects_folder ON projects(folder_id);
CREATE INDEX idx_projects_date ON projects(date DESC);
CREATE INDEX idx_projects_updated ON projects(updated_at DESC);
```

#### 4. `project_tags`

Many-to-many relationship between projects and tags.

```sql
CREATE TABLE project_tags (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, tag_id)
);

CREATE INDEX idx_project_tags_project ON project_tags(project_id);
CREATE INDEX idx_project_tags_tag ON project_tags(tag_id);
```

#### 5. `scenes`

Stores video scenes for projects.

```sql
CREATE TABLE scenes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    image_prompt TEXT NOT NULL,
    image_url TEXT,
    duration INTEGER NOT NULL DEFAULT 3000,
    sequence_order INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_scenes_project ON scenes(project_id);
CREATE INDEX idx_scenes_sequence ON scenes(project_id, sequence_order);
```

### Extended Data Tables

#### 6. `project_summaries`

Stores AI-generated summaries for projects.

```sql
CREATE TABLE project_summaries (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(project_id) -- One summary per project (latest)
);

CREATE INDEX idx_summaries_project ON project_summaries(project_id);
```

#### 7. `rewrite_history`

Git-like history for transcript rewrites.

```sql
CREATE TABLE rewrite_history (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    transcript_text TEXT NOT NULL,
    rewrite_type TEXT NOT NULL, -- 'rewrite', 'translate', 'summarize', 'manual'
    target_language TEXT, -- For translations
    parent_rewrite_id TEXT REFERENCES rewrite_history(id), -- For branching
    created_at INTEGER NOT NULL,
    metadata TEXT -- JSON for additional info
);

CREATE INDEX idx_rewrite_project ON rewrite_history(project_id);
CREATE INDEX idx_rewrite_created ON rewrite_history(created_at DESC);
CREATE INDEX idx_rewrite_parent ON rewrite_history(parent_rewrite_id);
```

#### 8. `translations`

Stores translations of transcripts.

```sql
CREATE TABLE translations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_text TEXT NOT NULL, -- Original transcript or specific text
    translated_text TEXT NOT NULL,
    target_language TEXT NOT NULL, -- ISO 639-1 code (e.g., 'es', 'fr', 'de')
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX idx_translations_project ON translations(project_id);
CREATE INDEX idx_translations_language ON translations(target_language);
```

#### 9. `audio_bullet_points`

Stores extracted bullet points from audio/transcript.

```sql
CREATE TABLE audio_bullet_points (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    bullet_points_text TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(project_id) -- One bullet point set per project
);

CREATE INDEX idx_bullets_project ON audio_bullet_points(project_id);
```

#### 10. `mind_maps`

Stores mind map data (can be text or image URI).

```sql
CREATE TABLE mind_maps (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    mind_map_data TEXT NOT NULL, -- Text structure or JSON
    image_uri TEXT, -- If generated as image
    format TEXT NOT NULL DEFAULT 'text', -- 'text' or 'image'
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(project_id) -- One mind map per project
);

CREATE INDEX idx_mindmaps_project ON mind_maps(project_id);
```

#### 11. `journal_entries`

Stores journal entries created from transcripts.

```sql
CREATE TABLE journal_entries (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    entry_text TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(project_id) -- One journal entry per project
);

CREATE INDEX idx_journal_project ON journal_entries(project_id);
```

#### 12. `create_content`

Stores various content created from transcripts (meeting notes, todo lists, etc.).

```sql
CREATE TABLE create_content (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL, -- 'meeting_notes', 'todo_list', 'illustration', 'video'
    content_data TEXT NOT NULL, -- JSON or text depending on type
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX idx_create_content_project ON create_content(project_id);
CREATE INDEX idx_create_content_type ON create_content(content_type);
```

### Metadata & Sync Tables (Future)

#### 13. `database_metadata`

Stores database version and migration info.

```sql
CREATE TABLE database_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

#### 14. `sync_queue` (Future)

For future cloud sync implementation.

```sql
CREATE TABLE sync_queue (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL, -- 'insert', 'update', 'delete'
    data TEXT, -- JSON of the record
    created_at INTEGER NOT NULL,
    synced_at INTEGER
);

CREATE INDEX idx_sync_queue_pending ON sync_queue(synced_at) WHERE synced_at IS NULL;
```

## Data Access Layer

### Architecture

```
┌─────────────────┐
│   UI Components │
└────────┬────────┘
         │
┌────────▼────────┐
│  Zustand Stores │  (Keep for reactive state)
└────────┬────────┘
         │
┌────────▼────────┐
│  Database Layer │  (New: SQLite operations)
└────────┬────────┘
         │
┌────────▼────────┐
│   expo-sqlite   │
└─────────────────┘
```

### Database Service Structure

```
database/
├── index.ts                 # Main database instance
├── schema.ts                # Schema definitions
├── migrations.ts            # Migration system
├── repositories/
│   ├── FolderRepository.ts
│   ├── TagRepository.ts
│   ├── ProjectRepository.ts
│   ├── SceneRepository.ts
│   ├── SummaryRepository.ts
│   ├── RewriteHistoryRepository.ts
│   ├── TranslationRepository.ts
│   ├── BulletPointsRepository.ts
│   ├── MindMapRepository.ts
│   ├── JournalRepository.ts
│   └── CreateContentRepository.ts
└── types.ts                 # TypeScript types matching schema
```

## Integration Strategy

### Phase 1: Database Setup

1. Install `expo-sqlite`
2. Create database schema
3. Set up migration system
4. Create database service layer

### Phase 2: Repository Implementation

1. Implement all repositories
2. Add CRUD operations
3. Add query helpers
4. Add transaction support

### Phase 3: Zustand Integration

1. Modify Zustand stores to use database
2. Add persistence middleware
3. Load data on app start
4. Sync state changes to database

### Phase 4: Data Migration

1. Create migration from in-memory to database
2. Handle existing data (if any)
3. Test data integrity

### Phase 5: Extended Features

1. Implement rewrite history (git-like)
2. Add all extended data types
3. Add search functionality
4. Add backup/export

## Key Features

### 1. Rewrite History (Git-like)

The `rewrite_history` table supports:

- **Linear History**: Each rewrite points to a parent
- **Branching**: Multiple rewrite paths from same source
- **Metadata**: Store rewrite type, language, etc.
- **Time Travel**: Restore any previous version

Example flow:

```
Original Transcript (id: r1)
  ├─ Rewrite 1 (id: r2, parent: r1)
  │   └─ Rewrite 2 (id: r3, parent: r2)
  └─ Translation (id: r4, parent: r1)
      └─ Rewrite of Translation (id: r5, parent: r4)
```

### 2. Data Relationships

- **Projects ↔ Folders**: Many-to-one (project belongs to one folder)
- **Projects ↔ Tags**: Many-to-many (via `project_tags`)
- **Projects ↔ Scenes**: One-to-many
- **Projects ↔ Summaries**: One-to-one (latest)
- **Projects ↔ Rewrite History**: One-to-many
- **Projects ↔ Translations**: One-to-many (multiple languages)
- **Projects ↔ Other Content**: One-to-many (multiple types)

### 3. Query Patterns

Common queries:

- Get all projects in a folder
- Get projects by tag
- Get latest summary for a project
- Get rewrite history for a project
- Search projects by title/transcript
- Get all translations for a project

### 4. Performance Optimizations

- Indexes on foreign keys and frequently queried columns
- Batch operations for bulk updates
- Lazy loading for large text fields
- Pagination for lists

## Migration Path

### Step 1: Add Database (Non-Breaking)

- Install database alongside existing stores
- Start persisting new data
- Keep reading from Zustand stores

### Step 2: Dual Write

- Write to both Zustand and database
- Read from database when available
- Fallback to Zustand for missing data

### Step 3: Full Migration

- Load all data from database on startup
- Remove Zustand persistence
- Database becomes single source of truth

## Future Enhancements

### Cloud Sync (Future)

- Add `sync_queue` table
- Implement conflict resolution
- Add sync status indicators
- Background sync

### Backup & Export

- Export database to JSON
- Import from JSON
- Cloud backup integration

### Search

- Full-text search on transcripts
- Search across all content types
- Tag-based filtering

### Analytics

- Track usage patterns
- Content statistics
- Storage usage

## Testing Strategy

1. **Unit Tests**: Test each repository independently
2. **Integration Tests**: Test database operations end-to-end
3. **Migration Tests**: Test schema migrations
4. **Performance Tests**: Test with large datasets
5. **Data Integrity Tests**: Test foreign keys and constraints

## Implementation Checklist

- [ ] Install expo-sqlite
- [ ] Create database schema
- [ ] Set up migration system
- [ ] Implement FolderRepository
- [ ] Implement TagRepository
- [ ] Implement ProjectRepository
- [ ] Implement SceneRepository
- [ ] Implement SummaryRepository
- [ ] Implement RewriteHistoryRepository
- [ ] Implement TranslationRepository
- [ ] Implement BulletPointsRepository
- [ ] Implement MindMapRepository
- [ ] Implement JournalRepository
- [ ] Implement CreateContentRepository
- [ ] Integrate with FolderStore
- [ ] Integrate with TagStore
- [ ] Integrate with ProjectStore
- [ ] Add data loading on app start
- [ ] Add persistence on state changes
- [ ] Test data migration
- [ ] Add error handling
- [ ] Add logging
- [ ] Performance optimization
- [ ] Documentation

## Notes

- All timestamps stored as Unix timestamps (INTEGER)
- Text fields use TEXT type (SQLite handles this efficiently)
- JSON stored as TEXT (SQLite doesn't have native JSON, but we can parse)
- Foreign keys enabled for referential integrity
- CASCADE deletes for related data cleanup
- Unique constraints where appropriate

## Dependencies

```json
{
  "expo-sqlite": "~15.0.0"
}
```
