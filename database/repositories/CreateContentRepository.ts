import { executeQuery, executeQueryOne, executeUpdate } from '../index';
import { CreateContentRow } from '../types';

export type CreateContentType = 'meeting_notes' | 'todo_list' | 'illustration' | 'video';

export interface CreateContent {
    id: string;
    projectId: string;
    contentType: CreateContentType;
    contentData: string; // JSON or text depending on type
    createdAt: Date;
    updatedAt: Date;
}

export class CreateContentRepository {
    // Convert database row to domain model
    private static rowToContent(row: CreateContentRow): CreateContent {
        return {
            id: row.id,
            projectId: row.project_id,
            contentType: row.content_type as CreateContentType,
            contentData: row.content_data,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }

    // Convert domain model to database row
    private static contentToRow(content: CreateContent): CreateContentRow {
        return {
            id: content.id,
            project_id: content.projectId,
            content_type: content.contentType,
            content_data: content.contentData,
            created_at: content.createdAt.getTime(),
            updated_at: content.updatedAt.getTime(),
        };
    }

    // Get all content for a project
    static async getByProjectId(projectId: string): Promise<CreateContent[]> {
        const rows = await executeQuery<CreateContentRow>(
            'SELECT * FROM create_content WHERE project_id = ? ORDER BY created_at DESC',
            [projectId]
        );
        return rows.map(this.rowToContent);
    }

    // Get content by type for a project
    static async getByProjectAndType(projectId: string, contentType: CreateContentType): Promise<CreateContent | null> {
        const row = await executeQueryOne<CreateContentRow>(
            'SELECT * FROM create_content WHERE project_id = ? AND content_type = ? ORDER BY created_at DESC LIMIT 1',
            [projectId, contentType]
        );
        return row ? this.rowToContent(row) : null;
    }

    // Get content by ID
    static async getById(id: string): Promise<CreateContent | null> {
        const row = await executeQueryOne<CreateContentRow>(
            'SELECT * FROM create_content WHERE id = ?',
            [id]
        );
        return row ? this.rowToContent(row) : null;
    }

    // Create content
    static async create(content: CreateContent): Promise<void> {
        const row = this.contentToRow(content);
        await executeUpdate(
            `INSERT INTO create_content (id, project_id, content_type, content_data, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [row.id, row.project_id, row.content_type, row.content_data, row.created_at, row.updated_at]
        );
    }

    // Update content
    static async update(id: string, contentData: string): Promise<void> {
        await executeUpdate(
            'UPDATE create_content SET content_data = ?, updated_at = ? WHERE id = ?',
            [contentData, Date.now(), id]
        );
    }

    // Delete content
    static async delete(id: string): Promise<void> {
        await executeUpdate('DELETE FROM create_content WHERE id = ?', [id]);
    }
}

