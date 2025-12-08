import { executeQuery, executeQueryOne, executeUpdate } from '../index';
import { RewriteHistoryRow } from '../types';

export interface RewriteHistoryEntry {
    id: string;
    projectId: string;
    transcriptText: string;
    rewriteType: 'rewrite' | 'translate' | 'summarize' | 'manual';
    targetLanguage?: string;
    parentRewriteId?: string;
    createdAt: Date;
    metadata?: any;
}

export class RewriteHistoryRepository {
    // Convert database row to domain model
    private static rowToEntry(row: RewriteHistoryRow): RewriteHistoryEntry {
        return {
            id: row.id,
            projectId: row.project_id,
            transcriptText: row.transcript_text,
            rewriteType: row.rewrite_type as any,
            targetLanguage: row.target_language || undefined,
            parentRewriteId: row.parent_rewrite_id || undefined,
            createdAt: new Date(row.created_at),
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        };
    }

    // Convert domain model to database row
    private static entryToRow(entry: RewriteHistoryEntry): RewriteHistoryRow {
        return {
            id: entry.id,
            project_id: entry.projectId,
            transcript_text: entry.transcriptText,
            rewrite_type: entry.rewriteType,
            target_language: entry.targetLanguage || null,
            parent_rewrite_id: entry.parentRewriteId || null,
            created_at: entry.createdAt.getTime(),
            metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        };
    }

    // Get all rewrite history for a project
    static async getByProjectId(projectId: string): Promise<RewriteHistoryEntry[]> {
        const rows = await executeQuery<RewriteHistoryRow>(
            'SELECT * FROM rewrite_history WHERE project_id = ? ORDER BY created_at DESC',
            [projectId]
        );
        return rows.map(this.rowToEntry);
    }

    // Get rewrite history entry by ID
    static async getById(id: string): Promise<RewriteHistoryEntry | null> {
        const row = await executeQueryOne<RewriteHistoryRow>(
            'SELECT * FROM rewrite_history WHERE id = ?',
            [id]
        );
        return row ? this.rowToEntry(row) : null;
    }

    // Get rewrite history tree (for git-like branching)
    static async getHistoryTree(projectId: string): Promise<RewriteHistoryEntry[]> {
        const rows = await executeQuery<RewriteHistoryRow>(
            `WITH RECURSIVE history_tree AS (
                SELECT * FROM rewrite_history WHERE project_id = ? AND parent_rewrite_id IS NULL
                UNION ALL
                SELECT rh.* FROM rewrite_history rh
                INNER JOIN history_tree ht ON rh.parent_rewrite_id = ht.id
            )
            SELECT * FROM history_tree ORDER BY created_at`,
            [projectId]
        );
        return rows.map(this.rowToEntry);
    }

    // Create rewrite history entry
    static async create(entry: RewriteHistoryEntry): Promise<void> {
        const row = this.entryToRow(entry);
        await executeUpdate(
            `INSERT INTO rewrite_history (id, project_id, transcript_text, rewrite_type, target_language, parent_rewrite_id, created_at, metadata)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [row.id, row.project_id, row.transcript_text, row.rewrite_type, row.target_language, row.parent_rewrite_id, row.created_at, row.metadata]
        );
    }

    // Delete rewrite history entry
    static async delete(id: string): Promise<void> {
        await executeUpdate('DELETE FROM rewrite_history WHERE id = ?', [id]);
    }

    // Get latest rewrite for a project
    static async getLatest(projectId: string): Promise<RewriteHistoryEntry | null> {
        const row = await executeQueryOne<RewriteHistoryRow>(
            'SELECT * FROM rewrite_history WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
            [projectId]
        );
        return row ? this.rowToEntry(row) : null;
    }
}

