import * as SQLite from 'expo-sqlite';
import { SceneImage } from '../../services/MockAIService';
import { executeQuery, executeUpdate } from '../index';
import { SceneImageRow } from '../types';

export class SceneImageRepository {
    // Convert database row to domain model
    private static rowToSceneImage(row: SceneImageRow): SceneImage {
        return {
            id: row.id,
            imagePrompt: row.image_prompt,
            imageUrl: row.image_url || '',
            sequenceOrder: row.sequence_order,
        };
    }

    // Convert domain model to database row
    static sceneImageToRow(sceneImage: SceneImage, sceneId: string): SceneImageRow {
        return {
            id: sceneImage.id,
            scene_id: sceneId,
            image_prompt: sceneImage.imagePrompt,
            image_url: sceneImage.imageUrl || null,
            sequence_order: sceneImage.sequenceOrder,
            created_at: Date.now(),
        };
    }

    // Get all images for a scene
    static async getBySceneId(sceneId: string): Promise<SceneImage[]> {
        const rows = await executeQuery<SceneImageRow>(
            'SELECT * FROM scene_images WHERE scene_id = ? ORDER BY sequence_order',
            [sceneId]
        );
        return rows.map(this.rowToSceneImage);
    }

    // Get images for multiple scenes
    static async getBySceneIds(sceneIds: string[]): Promise<Map<string, SceneImage[]>> {
        if (sceneIds.length === 0) return new Map();
        
        const placeholders = sceneIds.map(() => '?').join(',');
        const rows = await executeQuery<SceneImageRow>(
            `SELECT * FROM scene_images WHERE scene_id IN (${placeholders}) ORDER BY scene_id, sequence_order`,
            sceneIds
        );
        
        const map = new Map<string, SceneImage[]>();
        for (const row of rows) {
            if (!map.has(row.scene_id)) {
                map.set(row.scene_id, []);
            }
            map.get(row.scene_id)!.push(this.rowToSceneImage(row));
        }
        
        return map;
    }

    // Create scene image (for use in transactions)
    static async createInTransaction(
        sceneImage: SceneImage,
        sceneId: string,
        db: SQLite.SQLiteDatabase
    ): Promise<void> {
        const row = this.sceneImageToRow(sceneImage, sceneId);
        await db.runAsync(
            `INSERT INTO scene_images (id, scene_id, image_prompt, image_url, sequence_order, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [row.id, row.scene_id, row.image_prompt, row.image_url, row.sequence_order, row.created_at]
        );
    }

    // Create scene image
    static async create(sceneImage: SceneImage, sceneId: string): Promise<void> {
        const row = this.sceneImageToRow(sceneImage, sceneId);
        await executeUpdate(
            `INSERT INTO scene_images (id, scene_id, image_prompt, image_url, sequence_order, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [row.id, row.scene_id, row.image_prompt, row.image_url, row.sequence_order, row.created_at]
        );
    }

    // Update scene image
    static async update(id: string, updates: Partial<SceneImage>): Promise<void> {
        const setParts: string[] = [];
        const values: any[] = [];

        if (updates.imagePrompt !== undefined) {
            setParts.push('image_prompt = ?');
            values.push(updates.imagePrompt);
        }
        if (updates.imageUrl !== undefined) {
            setParts.push('image_url = ?');
            values.push(updates.imageUrl);
        }
        if (updates.sequenceOrder !== undefined) {
            setParts.push('sequence_order = ?');
            values.push(updates.sequenceOrder);
        }

        if (setParts.length === 0) return;

        values.push(id);
        await executeUpdate(
            `UPDATE scene_images SET ${setParts.join(', ')} WHERE id = ?`,
            values
        );
    }

    // Delete scene image
    static async delete(id: string): Promise<void> {
        await executeUpdate('DELETE FROM scene_images WHERE id = ?', [id]);
    }

    // Delete all images for a scene
    static async deleteBySceneId(sceneId: string, db?: SQLite.SQLiteDatabase): Promise<void> {
        if (db) {
            await db.runAsync('DELETE FROM scene_images WHERE scene_id = ?', [sceneId]);
        } else {
            await executeUpdate('DELETE FROM scene_images WHERE scene_id = ?', [sceneId]);
        }
    }
}

