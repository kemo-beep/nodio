import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FolderListItem } from '../../components/FolderListItem';
import { FolderModal } from '../../components/FolderModal';
import { ProjectActionMenu } from '../../components/ProjectActionMenu';
import { ProjectCard } from '../../components/ProjectCard';
import { TagSelector } from '../../components/TagSelector';
import { TitleEditor } from '../../components/TitleEditor';
import { Theme } from '../../constants/Colors';
import { Folder } from '../../services/MockAIService';
import { useFolderStore } from '../../store/useFolderStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useTagStore } from '../../store/useTagStore';

type FilterType = 'all' | 'recent' | 'oldest' | 'folder' | 'project' | 'tag' | 'search' | 'filter' | 'sort' | 'order' | 'direction';
type ViewMode = 'folders' | 'folder-content';

export default function HomeScreen() {
  const router = useRouter();
  const { projects, getProjectsByFolder, updateProjectTitle, moveProjectToFolder, deleteProject, addTagsToProject, removeTagFromProject, loadProjects } = useProjectStore();
  const {
    folders,
    currentFolderId,
    folderNavigationStack,
    navigateToFolder,
    navigateBack,
    setCurrentFolder,
    getFolderById,
    getFoldersByParent
  } = useFolderStore();
  const { tags } = useTagStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [tagSelectorProjectId, setTagSelectorProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('folders');

  const currentFolder = currentFolderId ? getFolderById(currentFolderId) : null;

  // Get folders and projects for current view
  const baseFolders = useMemo(() => {
    if (viewMode === 'folders') {
      // Show all root folders (no parent, excluding "All Projects")
      return folders.filter(f => !f.parentId && f.id !== 'all-projects');
    } else {
      // Show subfolders of current folder
      return getFoldersByParent(currentFolderId);
    }
  }, [folders, currentFolderId, viewMode, getFoldersByParent]);

  const baseProjects = useMemo(() => {
    if (viewMode === 'folders') {
      // Show all projects that don't belong to any folder (root level)
      return projects.filter(p => !p.folderId);
    } else {
      // Show projects in current folder
      return getProjectsByFolder(currentFolderId);
    }
  }, [projects, currentFolderId, viewMode, getProjectsByFolder]);

  // Filter folders by search query
  const filteredFolders = useMemo(() => {
    let filtered = [...baseFolders];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((folder) =>
        folder.name.toLowerCase().includes(query)
      );
    }

    // Sort folders alphabetically
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [baseFolders, searchQuery]);

  // Filter projects by search, tags, and sort
  const filteredProjects = useMemo(() => {
    let filtered = [...baseProjects];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.transcript.toLowerCase().includes(query)
      );
    }

    // Apply tag filter
    if (selectedTagIds.length > 0) {
      filtered = filtered.filter((project) => {
        const projectTags = project.tags || [];
        return selectedTagIds.some(tagId => projectTags.includes(tagId));
      });
    }

    // Apply sort/filter
    switch (filterType) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'folder':
        filtered.sort((a, b) => a.folderId?.localeCompare(b.folderId || '') || 0);
        break;
      case 'project':
        filtered.sort((a, b) => a.title.localeCompare(b.title || '') || 0);
        break;
      case 'tag':
        filtered.sort((a, b) => {
          const aTags = (a.tags || []).sort().join(',');
          const bTags = (b.tags || []).sort().join(',');
          return aTags.localeCompare(bTags);
        });
        break;
      case 'search':
        filtered.sort((a, b) => a.title.localeCompare(b.title || '') || 0);
        break;
      case 'filter':
        // No 'filter' property on Project, fall through to default
        break;
      case 'sort':
        // No 'sort' property on Project, fall through to default
        break;
      case 'order':
        filtered.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
        break;
      case 'direction':
        filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
      default:
        filtered.sort((a, b) => new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime());
    }

    return filtered;
  }, [baseProjects, searchQuery, filterType, selectedTagIds]);

  // Combined list of folders and projects for both views
  const combinedItems = useMemo(() => {
    const items: { type: 'folder' | 'project'; data: any }[] = [];

    // Add folders first
    filteredFolders.forEach(folder => {
      items.push({ type: 'folder', data: folder });
    });

    // Then add projects
    filteredProjects.forEach(project => {
      items.push({ type: 'project', data: project });
    });

    return items;
  }, [filteredFolders, filteredProjects]);

  const handleFolderPress = async (folder: Folder) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigateToFolder(folder.id);
    setViewMode('folder-content');
    // Reload projects to ensure we have the latest data from database
    await loadProjects();
  };

  const handleFolderLongPress = (folder: Folder) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingFolder(folder);
    setShowFolderModal(true);
  };

  const handleCreateFolder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingFolder(null);
    setShowFolderModal(true);
  };

  const handleBackPress = async () => {
    if (folderNavigationStack.length > 0) {
      navigateBack();
      if (folderNavigationStack.length === 1) {
        setViewMode('folders');
        setCurrentFolder(null);
      }
      // Reload projects when navigating back to ensure we have latest data
      await loadProjects();
    } else {
      setViewMode('folders');
      setCurrentFolder(null);
      // Reload projects when going back to root
      await loadProjects();
    }
  };

  const handleProjectLongPress = (projectId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingProjectId(projectId);
  };

  const handleRenameProject = (projectId: string) => {
    setEditingProjectId(projectId);
  };

  const handleSaveProjectTitle = (projectId: string, newTitle: string) => {
    updateProjectTitle(projectId, newTitle);
    setEditingProjectId(null);
  };

  const handleMoveProject = (projectId: string, folderId: string | null) => {
    moveProjectToFolder(projectId, folderId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProject(projectId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleTagProject = (projectId: string) => {
    setTagSelectorProjectId(projectId);
    setShowTagSelector(true);
  };

  const handleToggleTagFilter = (tagId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleClearTagFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTagIds([]);
  };

  const filterOptions: { label: string; value: FilterType; icon: string }[] = [
    { label: 'All', value: 'all', icon: 'grid-outline' },
    { label: 'Recent', value: 'recent', icon: 'time-outline' },
    { label: 'Oldest', value: 'oldest', icon: 'calendar-outline' },
    { label: 'Folder', value: 'folder', icon: 'folder-outline' },
    { label: 'Project', value: 'project', icon: 'document-outline' },
    { label: 'Tag', value: 'tag', icon: 'pricetag-outline' },
    { label: 'Search', value: 'search', icon: 'search-outline' },
    { label: 'Filter', value: 'filter', icon: 'filter-outline' },
    { label: 'Sort', value: 'sort', icon: 'swap-vertical-outline' },
    { label: 'Order', value: 'order', icon: 'arrow-up-outline' },
    { label: 'Direction', value: 'direction', icon: 'arrow-down-outline' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Theme.background, Theme.background]} // Use solid background for now, or subtle gradient
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.headerContent}>
              {viewMode === 'folder-content' ? (
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                  <Ionicons name="chevron-back" size={28} color={Theme.primary} />
                  <Text style={styles.backButtonText}>Projects</Text>
                </TouchableOpacity>
              ) : null}
              <View style={styles.headerTitle}>
                <Text style={styles.headerTitleText}>
                  {viewMode === 'folder-content' && currentFolder ? currentFolder.name : 'Projects'}
                </Text>
              </View>
              <View style={styles.headerActions}>
                {viewMode === 'folders' && (
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleCreateFolder}
                  >
                    <Ionicons name="folder-open-outline" size={24} color={Theme.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Search and Filters */}
            <View style={styles.searchFilterSection}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Theme.textSecondary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor={Theme.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearButton}
                  >
                    <Ionicons name="close-circle" size={18} color={Theme.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Simplified Filter - Just Segmented Control Concept */}
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[styles.segment, filterType === 'all' && styles.segmentActive]}
                  onPress={() => setFilterType('all')}
                >
                  <Text style={[styles.segmentText, filterType === 'all' && styles.segmentTextActive]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segment, filterType === 'recent' && styles.segmentActive]}
                  onPress={() => setFilterType('recent')}
                >
                  <Text style={[styles.segmentText, filterType === 'recent' && styles.segmentTextActive]}>Recent</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Content */}
        <FlatList
          data={combinedItems}
          renderItem={({ item }) => {
            if (item.type === 'folder') {
              return (
                <FolderListItem
                  folder={item.data}
                  onPress={() => handleFolderPress(item.data)}
                  onLongPress={() => handleFolderLongPress(item.data)}
                />
              );
            } else {
              const project = item.data;
              if (editingProjectId === project.id) {
                return (
                  <View style={styles.projectCardWrapper}>
                    <View style={styles.projectCardContainer}>
                      <TitleEditor
                        title={project.title}
                        onSave={(newTitle) => handleSaveProjectTitle(project.id, newTitle)}
                        onCancel={() => setEditingProjectId(null)}
                        style={styles.titleEditor}
                      />
                      <ProjectActionMenu
                        project={project}
                        onRename={() => handleRenameProject(project.id)}
                        onMove={(folderId) => handleMoveProject(project.id, folderId)}
                        onDelete={() => handleDeleteProject(project.id)}
                        onTag={() => handleTagProject(project.id)}
                      />
                    </View>
                  </View>
                );
              }
              return (
                <View style={styles.projectCardWrapper}>
                  <ProjectCard
                    project={project}
                    onPress={() => router.push(`/editor/${project.id}`)}
                    onLongPress={() => handleProjectLongPress(project.id)}
                  />
                </View>
              );
            }
          }}
          keyExtractor={(item) => `${item.type}-${item.data.id}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIconContainer}>
                <Ionicons
                  name={searchQuery ? "search" : "mic-outline"}
                  size={48}
                  color={Theme.primary}
                  style={{ opacity: 0.8 }}
                />
              </View>
              <Text style={styles.emptyStateTitle}>
                {searchQuery ? 'No results found' : 'No projects yet'}
              </Text>
              <Text style={styles.emptyStateText}>
                {searchQuery || selectedTagIds.length > 0
                  ? 'Try adjusting your search or filters.'
                  : viewMode === 'folders'
                    ? 'Start recording your first idea or create a folder to get organized.'
                    : 'This folder is empty.'}
              </Text>
            </View>
          }
        />

        {/* New Folder Button - Only in folders view */}
        {viewMode === 'folders' && (
          <TouchableOpacity
            style={styles.fab}
            onPress={handleCreateFolder}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#2F54EB', '#597EF7']}
              style={styles.fabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add" size={32} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {/* Folder Modal */}
      <FolderModal
        visible={showFolderModal}
        folder={editingFolder}
        onClose={() => {
          setShowFolderModal(false);
          setEditingFolder(null);
        }}
        onDelete={() => {
          if (currentFolderId === editingFolder?.id) {
            handleBackPress();
          }
        }}
      />

      {/* Tag Selector Modal */}
      {tagSelectorProjectId && (
        <TagSelector
          visible={showTagSelector}
          selectedTagIds={projects.find(p => p.id === tagSelectorProjectId)?.tags || []}
          onSelect={(tagIds) => {
            const project = projects.find(p => p.id === tagSelectorProjectId);
            if (!project) return;

            const currentTags = project.tags || [];
            const addedTags = tagIds.filter(id => !currentTags.includes(id));
            const removedTags = currentTags.filter(id => !tagIds.includes(id));

            if (addedTags.length > 0) {
              addTagsToProject(tagSelectorProjectId, addedTags);
            }
            removedTags.forEach(tagId => {
              removeTagFromProject(tagSelectorProjectId, tagId);
            });
          }}
          onClose={() => {
            setShowTagSelector(false);
            setTagSelectorProjectId(null);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: Theme.background,
    zIndex: 100,
  },
  headerSafeArea: {
    backgroundColor: Theme.background,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 17,
    color: Theme.primary,
    marginLeft: -4,
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleText: {
    ...Theme.typography.largeTitle,
    color: Theme.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  searchFilterSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: Theme.text,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: 8,
    padding: 2,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.text,
  },
  segmentTextActive: {
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  projectCardWrapper: {
    paddingHorizontal: 0, // Full width
  },
  projectCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.surface,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.border,
  },
  titleEditor: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: Theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.primary, // Solid color for Apple style
  },
});
