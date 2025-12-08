// Database initialization and data loading

import { useFolderStore } from '../store/useFolderStore';
import { useProjectStore } from '../store/useProjectStore';
import { useTagStore } from '../store/useTagStore';
import { getDatabase } from './index';

/**
 * Initialize database and load all data into stores
 */
export const initializeDatabase = async (): Promise<void> => {
    try {
        // Initialize database connection
        await getDatabase();
        
        // Load data into stores in parallel
        await Promise.all([
            useFolderStore.getState().loadFolders(),
            useTagStore.getState().loadTags(),
            useProjectStore.getState().loadProjects(),
        ]);
        
        console.log('✅ Database initialized and data loaded');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        throw error;
    }
};

