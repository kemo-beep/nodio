import { Tag } from '../../services/MockAIService';
import { executeQuery, executeQueryOne, executeUpdate } from '../index';
import { TagRow } from '../types';

export class TagRepository {
    // Convert database row to domain model
    private static rowToTag(row: TagRow): Tag {
        return {
            id: row.id,
            name: row.name,
            color: row.color,
            createdAt: new Date(row.created_at),
        };
    }

    // Convert domain model to database row
    private static tagToRow(tag: Tag): TagRow {
        return {
            id: tag.id,
            name: tag.name,
            color: tag.color,
            created_at: tag.createdAt.getTime(),
        };
    }

    // Get all tags
    static async getAll(): Promise<Tag[]> {
        const rows = await executeQuery<TagRow>('SELECT * FROM tags ORDER BY name');
        return rows.map(this.rowToTag);
    }

    // Get tag by ID
    static async getById(id: string): Promise<Tag | null> {
        const row = await executeQueryOne<TagRow>(
            'SELECT * FROM tags WHERE id = ?',
            [id]
        );
        return row ? this.rowToTag(row) : null;
    }

    // Get tag by name (case-insensitive)
    static async getByName(name: string): Promise<Tag | null> {
        const row = await executeQueryOne<TagRow>(
            'SELECT * FROM tags WHERE LOWER(name) = LOWER(?)',
            [name.trim()]
        );
        return row ? this.rowToTag(row) : null;
    }

    // Create tag
    static async create(tag: Tag): Promise<void> {
        const row = this.tagToRow(tag);
        await executeUpdate(
            `INSERT INTO tags (id, name, color, created_at)
             VALUES (?, ?, ?, ?)`,
            [row.id, row.name, row.color, row.created_at]
        );
    }

    // Update tag
    static async update(id: string, updates: Partial<Tag>): Promise<void> {
        const tag = await this.getById(id);
        if (!tag) {
            throw new Error(`Tag with id ${id} not found`);
        }

        const updated: Tag = {
            ...tag,
            ...updates,
        };

        const row = this.tagToRow(updated);
        await executeUpdate(
            `UPDATE tags SET name = ?, color = ? WHERE id = ?`,
            [row.name, row.color, id]
        );
    }

    // Delete tag
    static async delete(id: string): Promise<void> {
        await executeUpdate('DELETE FROM tags WHERE id = ?', [id]);
    }
}

