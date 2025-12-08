import { executeQueryOne, executeUpdate } from '../index';
import { MindMapRow } from '../types';

export interface MindMap {
    id: string;
    projectId: string;
    mindMapData: string; // Text structure or JSON
    imageUri?: string;
    format: 'text' | 'image';
    createdAt: Date;
    updatedAt: Date;
}

export class MindMapRepository {
    // Convert database row to domain model
    private static rowToMindMap(row: MindMapRow): MindMap {
        return {
            id: row.id,
            projectId: row.project_id,
            mindMapData: row.mind_map_data,
            imageUri: row.image_uri || undefined,
            format: row.format as 'text' | 'image',
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }

    // Convert domain model to database row
    private static mindMapToRow(mindMap: MindMap): MindMapRow {
        return {
            id: mindMap.id,
            project_id: mindMap.projectId,
            mind_map_data: mindMap.mindMapData,
            image_uri: mindMap.imageUri || null,
            format: mindMap.format,
            created_at: mindMap.createdAt.getTime(),
            updated_at: mindMap.updatedAt.getTime(),
        };
    }

    // Get mind map for project
    static async getByProjectId(projectId: string): Promise<MindMap | null> {
        const row = await executeQueryOne<MindMapRow>(
            'SELECT * FROM mind_maps WHERE project_id = ?',
            [projectId]
        );
        return row ? this.rowToMindMap(row) : null;
    }

    // Create or update mind map
    static async upsert(mindMap: MindMap): Promise<void> {
        const row = this.mindMapToRow(mindMap);
        await executeUpdate(
            `INSERT INTO mind_maps (id, project_id, mind_map_data, image_uri, format, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(project_id) DO UPDATE SET
             mind_map_data = excluded.mind_map_data,
             image_uri = excluded.image_uri,
             format = excluded.format,
             updated_at = excluded.updated_at`,
            [row.id, row.project_id, row.mind_map_data, row.image_uri, row.format, row.created_at, row.updated_at]
        );
    }

    // Delete mind map
    static async delete(projectId: string): Promise<void> {
        await executeUpdate(
            'DELETE FROM mind_maps WHERE project_id = ?',
            [projectId]
        );
    }
}

