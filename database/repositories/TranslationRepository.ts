import { executeQuery, executeQueryOne, executeUpdate } from '../index';
import { TranslationRow } from '../types';

export interface Translation {
    id: string;
    projectId: string;
    sourceText: string;
    translatedText: string;
    targetLanguage: string; // ISO 639-1 code (e.g., 'es', 'fr', 'de')
    createdAt: Date;
    updatedAt: Date;
}

export class TranslationRepository {
    // Convert database row to domain model
    private static rowToTranslation(row: TranslationRow): Translation {
        return {
            id: row.id,
            projectId: row.project_id,
            sourceText: row.source_text,
            translatedText: row.translated_text,
            targetLanguage: row.target_language,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }

    // Convert domain model to database row
    private static translationToRow(translation: Translation): TranslationRow {
        return {
            id: translation.id,
            project_id: translation.projectId,
            source_text: translation.sourceText,
            translated_text: translation.translatedText,
            target_language: translation.targetLanguage,
            created_at: translation.createdAt.getTime(),
            updated_at: translation.updatedAt.getTime(),
        };
    }

    // Get all translations for a project
    static async getByProjectId(projectId: string): Promise<Translation[]> {
        const rows = await executeQuery<TranslationRow>(
            'SELECT * FROM translations WHERE project_id = ? ORDER BY updated_at DESC',
            [projectId]
        );
        return rows.map(this.rowToTranslation);
    }

    // Get translation by ID
    static async getById(id: string): Promise<Translation | null> {
        const row = await executeQueryOne<TranslationRow>(
            'SELECT * FROM translations WHERE id = ?',
            [id]
        );
        return row ? this.rowToTranslation(row) : null;
    }

    // Get translation by project and language
    static async getByProjectAndLanguage(projectId: string, targetLanguage: string): Promise<Translation | null> {
        const row = await executeQueryOne<TranslationRow>(
            'SELECT * FROM translations WHERE project_id = ? AND target_language = ? ORDER BY updated_at DESC LIMIT 1',
            [projectId, targetLanguage]
        );
        return row ? this.rowToTranslation(row) : null;
    }

    // Create translation
    static async create(translation: Translation): Promise<void> {
        const row = this.translationToRow(translation);
        await executeUpdate(
            `INSERT INTO translations (id, project_id, source_text, translated_text, target_language, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [row.id, row.project_id, row.source_text, row.translated_text, row.target_language, row.created_at, row.updated_at]
        );
    }

    // Update translation
    static async update(id: string, translatedText: string): Promise<void> {
        await executeUpdate(
            'UPDATE translations SET translated_text = ?, updated_at = ? WHERE id = ?',
            [translatedText, Date.now(), id]
        );
    }

    // Delete translation
    static async delete(id: string): Promise<void> {
        await executeUpdate('DELETE FROM translations WHERE id = ?', [id]);
    }
}

