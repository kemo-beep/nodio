import * as SQLite from 'expo-sqlite';
import { Scene, Video } from '../../services/MockAIService';
import { executeQuery, executeQueryOne, executeTransaction, executeUpdate } from '../index';
import { VideoRow } from '../types';
import { SceneRepository } from './SceneRepository';

export class VideoRepository {
    // Convert database row to domain model
    private static async rowToVideo(row: VideoRow, scenes: Scene[] = []): Promise<Video> {
        return {
            id: row.id,
            projectId: row.project_id,
            title: row.title || undefined,
            scenes: scenes,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }

    // Convert domain model to database row
    private static videoToRow(video: Video): VideoRow {
        return {
            id: video.id,
            project_id: video.projectId,
            title: video.title || null,
            created_at: video.createdAt.getTime(),
            updated_at: video.updatedAt.getTime(),
        };
    }

    // Get all videos for a project
    static async getByProjectId(projectId: string): Promise<Video[]> {
        const rows = await executeQuery<VideoRow>(
            'SELECT * FROM videos WHERE project_id = ? ORDER BY created_at DESC',
            [projectId]
        );
        
        const videos: Video[] = [];
        for (const row of rows) {
            const scenes = await SceneRepository.getByVideoId(row.id);
            videos.push(await this.rowToVideo(row, scenes));
        }
        
        return videos;
    }

    // Get video by ID
    static async getById(id: string): Promise<Video | null> {
        const row = await executeQueryOne<VideoRow>(
            'SELECT * FROM videos WHERE id = ?',
            [id]
        );
        
        if (!row) return null;
        
        const scenes = await SceneRepository.getByVideoId(id);
        return await this.rowToVideo(row, scenes);
    }

    // Create video with scenes
    static async create(video: Video, db?: SQLite.SQLiteDatabase): Promise<void> {
        const row = this.videoToRow(video);
        
        if (db) {
            // Use transaction database
            await db.runAsync(
                `INSERT INTO videos (id, project_id, title, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?)`,
                [row.id, row.project_id, row.title, row.created_at, row.updated_at]
            );

            // Insert scenes with their images
            for (let i = 0; i < video.scenes.length; i++) {
                const scene = video.scenes[i];
                await SceneRepository.create(scene, video.id, i, db);
            }
        } else {
            // Create new transaction
            await executeTransaction(async (transactionDb) => {
                await transactionDb.runAsync(
                    `INSERT INTO videos (id, project_id, title, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?)`,
                    [row.id, row.project_id, row.title, row.created_at, row.updated_at]
                );

                // Insert scenes with their images
                for (let i = 0; i < video.scenes.length; i++) {
                    const scene = video.scenes[i];
                    await SceneRepository.create(scene, video.id, i, transactionDb);
                }
            });
        }
    }

    // Update video
    static async update(id: string, updates: Partial<Video>): Promise<void> {
        const video = await this.getById(id);
        if (!video) {
            throw new Error(`Video with id ${id} not found`);
        }

        const updated: Video = {
            ...video,
            ...updates,
            updatedAt: new Date(),
        };

        const row = this.videoToRow(updated);
        await executeUpdate(
            `UPDATE videos 
             SET title = ?, updated_at = ?
             WHERE id = ?`,
            [row.title, row.updated_at, id]
        );
    }

    // Update video scenes
    static async updateScenes(id: string, scenes: Scene[]): Promise<void> {
        await executeTransaction(async (db) => {
            // Delete existing scenes (cascade will delete images)
            await db.runAsync('DELETE FROM scenes WHERE video_id = ?', [id]);
            
            // Insert new scenes
            for (let i = 0; i < scenes.length; i++) {
                const scene = scenes[i];
                await SceneRepository.create(scene, id, i, db);
            }
        });
    }

    // Delete video
    static async delete(id: string): Promise<void> {
        await executeUpdate('DELETE FROM videos WHERE id = ?', [id]);
    }
}

