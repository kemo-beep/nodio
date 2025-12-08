import { executeQueryOne, executeUpdate } from '../index';
import { JournalEntryRow } from '../types';

export class JournalRepository {
    // Get journal entry for project
    static async getByProjectId(projectId: string): Promise<string | null> {
        const row = await executeQueryOne<JournalEntryRow>(
            'SELECT * FROM journal_entries WHERE project_id = ?',
            [projectId]
        );
        return row ? row.entry_text : null;
    }

    // Create or update journal entry
    static async upsert(projectId: string, entryText: string): Promise<void> {
        const now = Date.now();
        await executeUpdate(
            `INSERT INTO journal_entries (id, project_id, entry_text, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(project_id) DO UPDATE SET
             entry_text = excluded.entry_text,
             updated_at = excluded.updated_at`,
            [`journal-${projectId}`, projectId, entryText, now, now]
        );
    }

    // Delete journal entry
    static async delete(projectId: string): Promise<void> {
        await executeUpdate(
            'DELETE FROM journal_entries WHERE project_id = ?',
            [projectId]
        );
    }
}

