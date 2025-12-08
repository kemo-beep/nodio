import { executeQueryOne, executeUpdate } from '../index';
import { AudioBulletPointsRow } from '../types';

export class BulletPointsRepository {
    // Get bullet points for project
    static async getByProjectId(projectId: string): Promise<string | null> {
        const row = await executeQueryOne<AudioBulletPointsRow>(
            'SELECT * FROM audio_bullet_points WHERE project_id = ?',
            [projectId]
        );
        return row ? row.bullet_points_text : null;
    }

    // Create or update bullet points
    static async upsert(projectId: string, bulletPointsText: string): Promise<void> {
        const now = Date.now();
        await executeUpdate(
            `INSERT INTO audio_bullet_points (id, project_id, bullet_points_text, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(project_id) DO UPDATE SET
             bullet_points_text = excluded.bullet_points_text,
             updated_at = excluded.updated_at`,
            [`bullets-${projectId}`, projectId, bulletPointsText, now, now]
        );
    }

    // Delete bullet points
    static async delete(projectId: string): Promise<void> {
        await executeUpdate(
            'DELETE FROM audio_bullet_points WHERE project_id = ?',
            [projectId]
        );
    }
}

