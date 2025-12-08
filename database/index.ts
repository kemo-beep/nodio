import * as SQLite from 'expo-sqlite';
import { createSchema, initializeDefaultData, SCHEMA_VERSION } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    if (db) {
        return db;
    }

    // Open database
    db = await SQLite.openDatabaseAsync('nodio.db');

    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Check if database is initialized by trying to query metadata table
    let isInitialized = false;
    let currentVersion = 0;
    
    try {
        const result = await db.getFirstAsync<{ value: string }>(
            "SELECT value FROM database_metadata WHERE key = 'schema_version'"
        );
        if (result) {
            isInitialized = true;
            currentVersion = parseInt(result.value, 10);
        }
    } catch (error) {
        // Table doesn't exist yet, need to initialize
        isInitialized = false;
    }

    if (!isInitialized) {
        // Initialize database
        await db.execAsync(createSchema());
        await db.execAsync(initializeDefaultData());
        
        // Set schema version
        await db.runAsync(
            "INSERT INTO database_metadata (key, value) VALUES ('schema_version', ?)",
            [SCHEMA_VERSION.toString()]
        );
    } else if (currentVersion < SCHEMA_VERSION) {
        // Run migrations
        await migrateDatabase(db, currentVersion, SCHEMA_VERSION);
    }

    return db;
};

// Migration function
const migrateDatabase = async (
    db: SQLite.SQLiteDatabase,
    fromVersion: number,
    toVersion: number
): Promise<void> => {
    console.log(`Migrating database from version ${fromVersion} to ${toVersion}`);
    
    if (fromVersion === 1 && toVersion === 2) {
        // Migration from v1 to v2: Add videos table and migrate scenes
        try {
            // Check if videos table exists
            const tableCheck = await db.getFirstAsync<{ name: string }>(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='videos'"
            );
            
            if (!tableCheck) {
                // Create videos and scene_images tables
                await db.execAsync(`
                    -- Create videos table
                    CREATE TABLE IF NOT EXISTS videos (
                        id TEXT PRIMARY KEY,
                        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                        title TEXT,
                        created_at INTEGER NOT NULL,
                        updated_at INTEGER NOT NULL
                    );

                    CREATE INDEX IF NOT EXISTS idx_videos_project ON videos(project_id);

                    -- Create scene_images table
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
                `);

                // Migrate existing scenes: create a video for each project and migrate scenes
                const projects = await db.getAllAsync<{ id: string }>('SELECT id FROM projects');
                
                for (const project of projects) {
                    const videoId = `video-${project.id}`;
                    const now = Date.now();
                    
                    // Create a video for this project
                    await db.runAsync(
                        `INSERT INTO videos (id, project_id, title, created_at, updated_at)
                         VALUES (?, ?, ?, ?, ?)`,
                        [videoId, project.id, 'Main Video', now, now]
                    );
                    
                    // Get existing scenes for this project
                    const scenes = await db.getAllAsync<{
                        id: string;
                        description: string;
                        image_prompt: string;
                        image_url: string | null;
                        duration: number;
                        sequence_order: number;
                    }>(
                        'SELECT id, description, image_prompt, image_url, duration, sequence_order FROM scenes WHERE project_id = ?',
                        [project.id]
                    );
                    
                    // Update scenes to reference video instead of project
                    // First, add video_id column to scenes (SQLite doesn't support ALTER COLUMN, so we recreate)
                    await db.execAsync(`
                        -- Create new scenes table with video_id
                        CREATE TABLE scenes_new (
                            id TEXT PRIMARY KEY,
                            video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
                            description TEXT NOT NULL,
                            duration INTEGER NOT NULL DEFAULT 3000,
                            sequence_order INTEGER NOT NULL,
                            created_at INTEGER NOT NULL
                        );

                        CREATE INDEX idx_scenes_video ON scenes_new(video_id);
                        CREATE INDEX idx_scenes_sequence ON scenes_new(video_id, sequence_order);
                    `);
                    
                    // Copy scenes to new table with video_id
                    for (const scene of scenes) {
                        await db.runAsync(
                            `INSERT INTO scenes_new (id, video_id, description, duration, sequence_order, created_at)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [scene.id, videoId, scene.description, scene.duration, scene.sequence_order, Date.now()]
                        );
                        
                        // Create scene image from old scene data
                        const imageId = `img-${scene.id}-0`;
                        await db.runAsync(
                            `INSERT INTO scene_images (id, scene_id, image_prompt, image_url, sequence_order, created_at)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [imageId, scene.id, scene.image_prompt, scene.image_url, 0, Date.now()]
                        );
                    }
                    
                    // Drop old table and rename new one
                    await db.execAsync(`
                        DROP TABLE scenes;
                        ALTER TABLE scenes_new RENAME TO scenes;
                    `);
                }
            }
            
            // Update schema version
            await db.runAsync(
                "UPDATE database_metadata SET value = ? WHERE key = 'schema_version'",
                [toVersion.toString()]
            );
            
            console.log('✅ Database migration completed');
        } catch (error) {
            console.error('❌ Database migration failed:', error);
            throw error;
        }
    }
};

export const closeDatabase = async (): Promise<void> => {
    if (db) {
        await db.closeAsync();
        db = null;
    }
};

// Helper function to execute queries with error handling
export const executeQuery = async <T = any>(
    query: string,
    params: any[] = []
): Promise<T[]> => {
    const database = await getDatabase();
    try {
        const result = await database.getAllAsync<T>(query, params);
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Helper function to execute a single row query
export const executeQueryOne = async <T = any>(
    query: string,
    params: any[] = []
): Promise<T | null> => {
    const database = await getDatabase();
    try {
        const result = await database.getFirstAsync<T>(query, params);
        return result || null;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Helper function to execute insert/update/delete
export const executeUpdate = async (
    query: string,
    params: any[] = []
): Promise<SQLite.SQLiteRunResult> => {
    const database = await getDatabase();
    try {
        const result = await database.runAsync(query, params);
        return result;
    } catch (error) {
        console.error('Database update error:', error);
        throw error;
    }
};

// Helper function to execute a transaction
export const executeTransaction = async <T>(
    callback: (db: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> => {
    const database = await getDatabase();
    try {
        await database.execAsync('BEGIN TRANSACTION');
        const result = await callback(database);
        await database.execAsync('COMMIT');
        return result;
    } catch (error) {
        await database.execAsync('ROLLBACK');
        console.error('Transaction error:', error);
        throw error;
    }
};

