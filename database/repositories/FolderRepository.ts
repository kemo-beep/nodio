import { Folder } from '../../services/MockAIService';
import { executeQuery, executeQueryOne, executeUpdate } from '../index';
import { FolderRow } from '../types';

export class FolderRepository {
    // Convert database row to domain model
    private static rowToFolder(row: FolderRow): Folder {
        return {
            id: row.id,
            name: row.name,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            parentId: row.parent_id,
            color: row.color || undefined,
            icon: row.icon || undefined,
        };
    }

    // Convert domain model to database row
    private static folderToRow(folder: Folder): FolderRow {
        return {
            id: folder.id,
            name: folder.name,
            parent_id: folder.parentId || null,
            color: folder.color || null,
            icon: folder.icon || null,
            created_at: folder.createdAt.getTime(),
            updated_at: folder.updatedAt.getTime(),
        };
    }

    // Get all folders
    static async getAll(): Promise<Folder[]> {
        const rows = await executeQuery<FolderRow>('SELECT * FROM folders ORDER BY name');
        return rows.map(this.rowToFolder);
    }

    // Get folder by ID
    static async getById(id: string): Promise<Folder | null> {
        const row = await executeQueryOne<FolderRow>(
            'SELECT * FROM folders WHERE id = ?',
            [id]
        );
        return row ? this.rowToFolder(row) : null;
    }

    // Get folders by parent ID
    static async getByParentId(parentId: string | null): Promise<Folder[]> {
        const rows = await executeQuery<FolderRow>(
            'SELECT * FROM folders WHERE parent_id = ? ORDER BY name',
            [parentId]
        );
        return rows.map(this.rowToFolder);
    }

    // Create folder
    static async create(folder: Folder): Promise<void> {
        const row = this.folderToRow(folder);
        await executeUpdate(
            `INSERT INTO folders (id, name, parent_id, color, icon, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [row.id, row.name, row.parent_id, row.color, row.icon, row.created_at, row.updated_at]
        );
    }

    // Update folder
    static async update(id: string, updates: Partial<Folder>): Promise<void> {
        const folder = await this.getById(id);
        if (!folder) {
            throw new Error(`Folder with id ${id} not found`);
        }

        const updated: Folder = {
            ...folder,
            ...updates,
            updatedAt: new Date(),
        };

        const row = this.folderToRow(updated);
        await executeUpdate(
            `UPDATE folders 
             SET name = ?, parent_id = ?, color = ?, icon = ?, updated_at = ?
             WHERE id = ?`,
            [row.name, row.parent_id, row.color, row.icon, row.updated_at, id]
        );
    }

    // Delete folder (cascade will handle nested folders)
    static async delete(id: string): Promise<void> {
        // Check if it's the default folder
        if (id === 'all-projects') {
            throw new Error('Cannot delete default folder');
        }

        await executeUpdate('DELETE FROM folders WHERE id = ?', [id]);
    }

    // Get folder path (breadcrumb)
    static async getPath(id: string): Promise<Folder[]> {
        const path: Folder[] = [];
        let currentId: string | null = id;

        while (currentId) {
            const folder = await this.getById(currentId);
            if (!folder) break;
            path.unshift(folder);
            currentId = folder.parentId || null;
        }

        return path;
    }
}

