import * as SQLite from 'expo-sqlite';
import { Scene } from '../../services/MockAIService';
import { executeQuery, executeUpdate } from '../index';
import { SceneRow } from '../types';
import { SceneImageRepository } from './SceneImageRepository';

export class SceneRepository {
    // Convert database row to domain model
    private static async rowToScene(row: SceneRow, images: any[] = []): Promise<Scene> {
        return {
            id: row.id,
            description: row.description,
            duration: row.duration,
            images: images || [],
        };
    }

    // Convert domain model to database row
    static sceneToRow(scene: Scene, videoId: string, sequenceOrder: number): SceneRow {
        return {
            id: scene.id,
            video_id: videoId,
            description: scene.description,
            duration: scene.duration,
            sequence_order: sequenceOrder,
            created_at: Date.now(),
        };
    }

    // Get scenes by video ID
    static async getByVideoId(videoId: string): Promise<Scene[]> {
        const rows = await executeQuery<SceneRow>(
            'SELECT * FROM scenes WHERE video_id = ? ORDER BY sequence_order',
            [videoId]
        );
        
        if (rows.length === 0) return [];
        
        // Get all scene IDs
        const sceneIds = rows.map(r => r.id);
        
        // Load all images for these scenes
        const imagesMap = await SceneImageRepository.getBySceneIds(sceneIds);
        
        // Build scenes with their images
        const scenes: Scene[] = [];
        for (const row of rows) {
            const images = imagesMap.get(row.id) || [];
            scenes.push(await this.rowToScene(row, images));
        }
        
        return scenes;
    }

    // Create scene with images (for use in transactions)
    static async create(
        scene: Scene,
        videoId: string,
        sequenceOrder: number,
        db?: SQLite.SQLiteDatabase
    ): Promise<void> {
        const row = this.sceneToRow(scene, videoId, sequenceOrder);
        
        if (db) {
            // Use transaction database
            await db.runAsync(
                `INSERT INTO scenes (id, video_id, description, duration, sequence_order, created_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [row.id, row.video_id, row.description, row.duration, row.sequence_order, row.created_at]
            );
            
            // Insert scene images (if any)
            const images = scene.images || [];
            if (Array.isArray(images) && images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    const image = images[i];
                    await SceneImageRepository.createInTransaction(image, row.id, db);
                }
            }
        } else {
            // Use regular update (will need transaction wrapper)
            await executeUpdate(
                `INSERT INTO scenes (id, video_id, description, duration, sequence_order, created_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [row.id, row.video_id, row.description, row.duration, row.sequence_order, row.created_at]
            );
            
            // Insert scene images (if any)
            const images = scene.images || [];
            if (Array.isArray(images) && images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    const image = images[i];
                    await SceneImageRepository.create(image, row.id);
                }
            }
        }
    }

    // Update scene
    static async update(id: string, updates: Partial<Scene>): Promise<void> {
        const setParts: string[] = [];
        const values: any[] = [];

        if (updates.description !== undefined) {
            setParts.push('description = ?');
            values.push(updates.description);
        }
        if (updates.duration !== undefined) {
            setParts.push('duration = ?');
            values.push(updates.duration);
        }

        if (setParts.length > 0) {
            values.push(id);
            await executeUpdate(
                `UPDATE scenes SET ${setParts.join(', ')} WHERE id = ?`,
                values
            );
        }

        // Update images if provided
        if (updates.images !== undefined) {
            // Delete existing images
            await SceneImageRepository.deleteBySceneId(id);
            
            // Insert new images
            for (let i = 0; i < updates.images.length; i++) {
                const image = updates.images[i];
                await SceneImageRepository.create(image, id);
            }
        }
    }

    // Delete scene (cascade will delete images)
    static async delete(id: string): Promise<void> {
        await executeUpdate('DELETE FROM scenes WHERE id = ?', [id]);
    }
}
