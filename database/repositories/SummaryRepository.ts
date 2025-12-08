import { executeQueryOne, executeUpdate } from '../index';
import { ProjectSummaryRow } from '../types';

export class SummaryRepository {
    // Get summary for project
    static async getByProjectId(projectId: string): Promise<string | null> {
        const row = await executeQueryOne<ProjectSummaryRow>(
            'SELECT * FROM project_summaries WHERE project_id = ?',
            [projectId]
        );
        return row ? row.summary_text : null;
    }

    // Create or update summary
    static async upsert(projectId: string, summaryText: string): Promise<void> {
        const now = Date.now();
        await executeUpdate(
            `INSERT INTO project_summaries (id, project_id, summary_text, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(project_id) DO UPDATE SET
             summary_text = excluded.summary_text,
             updated_at = excluded.updated_at`,
            [`summary-${projectId}`, projectId, summaryText, now, now]
        );
    }

    // Delete summary
    static async delete(projectId: string): Promise<void> {
        await executeUpdate(
            'DELETE FROM project_summaries WHERE project_id = ?',
            [projectId]
        );
    }
}

