import { Project } from '../../services/MockAIService';
import { executeQuery, executeQueryOne, executeTransaction, executeUpdate } from '../index';
import { ProjectRow, ProjectTagRow } from '../types';
import { VideoRepository } from './VideoRepository';

export class ProjectRepository {
    // Convert database row to domain model
    private static async rowToProject(row: ProjectRow, tags: string[] = []): Promise<Project> {
        const videos = await VideoRepository.getByProjectId(row.id);
        return {
            id: row.id,
            title: row.title,
            date: new Date(row.date),
            updatedAt: new Date(row.updated_at),
            audioUri: row.audio_uri,
            transcript: row.transcript,
            videos: videos,
            folderId: row.folder_id,
            tags: tags,
            thumbnailUrl: row.thumbnail_url || undefined,
        };
    }

    // Convert domain model to database row
    private static projectToRow(project: Project): ProjectRow {
        return {
            id: project.id,
            title: project.title,
            audio_uri: project.audioUri,
            transcript: project.transcript,
            folder_id: project.folderId || null,
            thumbnail_url: project.thumbnailUrl || null,
            date: project.date.getTime(),
            created_at: project.date.getTime(), // Use date as created_at if not available
            updated_at: project.updatedAt.getTime(),
        };
    }

    // Get all projects
    static async getAll(): Promise<Project[]> {
        const rows = await executeQuery<ProjectRow>(
            'SELECT * FROM projects ORDER BY updated_at DESC'
        );
        
        const projects: Project[] = [];
        for (const row of rows) {
            const tags = await this.getProjectTags(row.id);
            projects.push(await this.rowToProject(row, tags));
        }
        
        return projects;
    }

    // Get project by ID
    static async getById(id: string): Promise<Project | null> {
        const row = await executeQueryOne<ProjectRow>(
            'SELECT * FROM projects WHERE id = ?',
            [id]
        );
        
        if (!row) return null;
        
        const tags = await this.getProjectTags(id);
        return await this.rowToProject(row, tags);
    }

    // Get projects by folder ID
    static async getByFolderId(folderId: string | null): Promise<Project[]> {
        const rows = await executeQuery<ProjectRow>(
            'SELECT * FROM projects WHERE folder_id = ? ORDER BY updated_at DESC',
            [folderId]
        );
        
        const projects: Project[] = [];
        for (const row of rows) {
            const tags = await this.getProjectTags(row.id);
            projects.push(await this.rowToProject(row, tags));
        }
        
        return projects;
    }

    // Get projects by tag ID
    static async getByTagId(tagId: string): Promise<Project[]> {
        const rows = await executeQuery<ProjectRow>(
            `SELECT p.* FROM projects p
             INNER JOIN project_tags pt ON p.id = pt.project_id
             WHERE pt.tag_id = ?
             ORDER BY p.updated_at DESC`,
            [tagId]
        );
        
        const projects: Project[] = [];
        for (const row of rows) {
            const tags = await this.getProjectTags(row.id);
            projects.push(await this.rowToProject(row, tags));
        }
        
        return projects;
    }

    // Get project tags
    private static async getProjectTags(projectId: string): Promise<string[]> {
        const rows = await executeQuery<ProjectTagRow>(
            'SELECT tag_id FROM project_tags WHERE project_id = ?',
            [projectId]
        );
        return rows.map(row => row.tag_id);
    }

    // Create project
    static async create(project: Project): Promise<void> {
        await executeTransaction(async (db) => {
            const row = this.projectToRow(project);
            
            // Insert project
            await db.runAsync(
                `INSERT INTO projects (id, title, audio_uri, transcript, folder_id, thumbnail_url, date, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [row.id, row.title, row.audio_uri, row.transcript, row.folder_id, row.thumbnail_url, row.date, row.created_at, row.updated_at]
            );

            // Insert videos with their scenes
            for (const video of project.videos) {
                await VideoRepository.create(video, db);
            }

            // Insert tags
            if (project.tags && project.tags.length > 0) {
                for (const tagId of project.tags) {
                    await db.runAsync(
                        'INSERT OR IGNORE INTO project_tags (project_id, tag_id) VALUES (?, ?)',
                        [project.id, tagId]
                    );
                }
            }
        });
    }

    // Update project
    static async update(id: string, updates: Partial<Project>): Promise<void> {
        const project = await this.getById(id);
        if (!project) {
            throw new Error(`Project with id ${id} not found`);
        }

        const updated: Project = {
            ...project,
            ...updates,
            updatedAt: new Date(),
        };

        const row = this.projectToRow(updated);
        await executeUpdate(
            `UPDATE projects 
             SET title = ?, transcript = ?, folder_id = ?, thumbnail_url = ?, updated_at = ?
             WHERE id = ?`,
            [row.title, row.transcript, row.folder_id, row.thumbnail_url, row.updated_at, id]
        );
    }

    // Update project transcript
    static async updateTranscript(id: string, transcript: string): Promise<void> {
        await executeUpdate(
            'UPDATE projects SET transcript = ?, updated_at = ? WHERE id = ?',
            [transcript, Date.now(), id]
        );
    }

    // Update project title
    static async updateTitle(id: string, title: string): Promise<void> {
        await executeUpdate(
            'UPDATE projects SET title = ?, updated_at = ? WHERE id = ?',
            [title.trim(), Date.now(), id]
        );
    }

    // Move project to folder
    static async moveToFolder(id: string, folderId: string | null): Promise<void> {
        await executeUpdate(
            'UPDATE projects SET folder_id = ?, updated_at = ? WHERE id = ?',
            [folderId, Date.now(), id]
        );
    }

    // Add tags to project
    static async addTags(id: string, tagIds: string[]): Promise<void> {
        await executeTransaction(async (db) => {
            for (const tagId of tagIds) {
                await db.runAsync(
                    'INSERT OR IGNORE INTO project_tags (project_id, tag_id) VALUES (?, ?)',
                    [id, tagId]
                );
            }
        });
    }

    // Remove tag from project
    static async removeTag(id: string, tagId: string): Promise<void> {
        await executeUpdate(
            'DELETE FROM project_tags WHERE project_id = ? AND tag_id = ?',
            [id, tagId]
        );
    }

    // Note: Scenes are now managed through videos, so this method is deprecated
    // Use VideoRepository.updateScenes() instead

    // Delete project
    static async delete(id: string): Promise<void> {
        await executeUpdate('DELETE FROM projects WHERE id = ?', [id]);
    }

    // Search projects
    static async search(query: string): Promise<Project[]> {
        const searchTerm = `%${query.toLowerCase()}%`;
        const rows = await executeQuery<ProjectRow>(
            `SELECT * FROM projects 
             WHERE LOWER(title) LIKE ? OR LOWER(transcript) LIKE ?
             ORDER BY updated_at DESC`,
            [searchTerm, searchTerm]
        );
        
        const projects: Project[] = [];
        for (const row of rows) {
            const tags = await this.getProjectTags(row.id);
            projects.push(await this.rowToProject(row, tags));
        }
        
        return projects;
    }
}

