# Nodio: Apple Notes-Style Organization Features

## Overview

Transform Nodio into an Apple Notes-like experience with comprehensive folder organization, tagging, and project management capabilities.

---

## 📋 Feature Requirements

### 1. Folder Management System

#### 1.1 Create Folders

- **UI**: Long-press on home screen or dedicated "+" button in folder view
- **Behavior**:
  - Modal with text input for folder name
  - Default name: "New Folder" (editable immediately)
  - Validation: Prevent empty names, duplicate names (case-insensitive)
  - Auto-focus on input field
  - Cancel/Save buttons
- **Data**: Store folder with unique ID, name, creation date, color/icon (optional)

#### 1.2 Edit Folder Names

- **UI**: Long-press folder → "Rename" option
- **Behavior**:
  - Inline editing or modal (similar to Apple Notes)
  - Pre-fill current name
  - Same validation as create
  - Auto-save on blur/enter

#### 1.3 Delete Folders

- **UI**: Long-press folder → "Delete" option → Confirmation alert
- **Behavior**:
  - Show confirmation: "Delete folder and move all projects to 'All Projects'?"
  - Option to move projects to another folder or delete projects
  - Cannot delete if it's the default "All Projects" folder
  - Smooth animation on deletion

#### 1.4 Folder Hierarchy

- **Structure**: Flat hierarchy (no nested folders initially)
- **Default Folder**: "All Projects" (shows all projects, cannot be deleted)
- **Folder View**: Tap folder to see projects inside
- **Breadcrumb**: Show current folder path in header

---

### 2. Tag System

#### 2.1 Create Tags

- **UI**:
  - In project editor: Tag button/icon
  - Tag input field with autocomplete
  - Color-coded tags (auto-assigned or user-selected)
- **Behavior**:
  - Create tags on-the-fly while typing
  - Show existing tags as suggestions
  - Prevent duplicate tags (case-insensitive)
  - Visual tag chips with colors

#### 2.2 Apply Tags to Projects

- **UI**:
  - Tag selector in project editor
  - Multiple tag selection
  - Visual tag chips on project cards
- **Behavior**:
  - Projects can have multiple tags
  - Tags visible on project cards (max 3 visible, "+X more" indicator)
  - Tap tag to filter projects by that tag

#### 2.3 Manage Tags

- **UI**:
  - Tags view/section in settings or home
  - List all tags with usage count
  - Edit tag name/color
  - Delete unused tags
- **Behavior**:
  - Show tag usage count
  - Warn before deleting tags in use
  - Bulk tag management

#### 2.4 Tag Filtering

- **UI**:
  - Tag filter chips in home screen
  - "Filter by Tag" option
- **Behavior**:
  - Filter projects by selected tag(s)
  - Multiple tag selection (AND/OR logic)
  - Clear filters easily

---

### 3. Project Title Editing

#### 3.1 Edit Title in List View

- **UI**:
  - Long-press project card → "Rename" option
  - Or tap title directly (if enabled)
- **Behavior**:
  - Inline editing or modal
  - Auto-focus, select all text
  - Save on blur/enter, cancel on escape
  - Validation: Prevent empty titles

#### 3.2 Edit Title in Editor View

- **UI**:
  - Tap title in editor header
  - Or dedicated edit button
- **Behavior**:
  - Same as list view
  - Auto-save
  - Show character count (optional)

---

### 4. Record Inside Folders

#### 4.1 Folder Context for Recording

- **UI**:
  - When inside a folder, show folder context
  - Record button creates project in current folder
- **Behavior**:
  - New projects inherit current folder
  - Can change folder during/after recording
  - Visual indicator showing target folder

#### 4.2 Recording Flow

- **Pre-Recording**:
  - Show folder selector (optional, defaults to current)
  - Quick folder switch
- **Post-Recording**:
  - Project created in selected folder
  - Option to move immediately after creation

---

### 5. Move Projects Between Folders

#### 5.1 Move from List View

- **UI**:
  - Long-press project → "Move to Folder" option
  - Folder picker modal
- **Behavior**:
  - Show all folders in picker
  - Current folder highlighted
  - Smooth animation on move
  - Undo option (optional, 3-second window)

#### 5.2 Move from Editor View

- **UI**:
  - Folder indicator in header (tappable)
  - Or settings menu → "Move to Folder"
- **Behavior**:
  - Same folder picker
  - Update immediately
  - Show confirmation toast

#### 5.3 Bulk Move

- **UI**:
  - Selection mode (long-press to enter)
  - Select multiple projects
  - "Move Selected" button
- **Behavior**:
  - Move all selected to chosen folder
  - Progress indicator for bulk operations

---

### 6. Enhanced UI/UX (Apple Notes Style)

#### 6.1 Home Screen Improvements

- **Layout**:
  - Folder list at top (horizontal scroll or grid)
  - Projects list below
  - Search bar always visible
  - Filter chips (tags, folders, date)
- **Visual**:
  - Clean, minimal design
  - Subtle shadows and borders
  - Smooth animations
  - Haptic feedback on interactions

#### 6.2 Folder View

- **Header**:
  - Folder name (editable)
  - Project count
  - Back button
  - Options menu (rename, delete, etc.)
- **Content**:
  - Projects in folder
  - Empty state with helpful message
  - "Add Project" button

#### 6.3 Project Card Enhancements

- **Display**:
  - Folder indicator (small icon/badge)
  - Tags (color-coded chips)
  - Thumbnail preview (if available)
  - Last modified time
- **Interactions**:
  - Swipe actions (move, delete, tag)
  - Long-press menu
  - Tap to open

#### 6.4 Empty States

- **No Projects**:
  - Friendly illustration
  - "Create your first project" CTA
- **No Folders**:
  - "Organize with folders" message
  - Quick create button
- **No Tags**:
  - "Add tags to organize" hint

---

### 7. Data Model Updates

#### 7.1 Folder Interface

```typescript
interface Folder {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  color?: string; // Optional color for visual distinction
  icon?: string; // Optional icon
  projectCount?: number; // Computed
}
```

#### 7.2 Tag Interface

```typescript
interface Tag {
  id: string;
  name: string;
  color: string; // Hex color for tag chip
  createdAt: Date;
  projectCount?: number; // Computed
}
```

#### 7.3 Project Interface Updates

```typescript
interface Project {
  id: string;
  title: string;
  date: Date;
  updatedAt: Date; // New: track last modification
  audioUri: string;
  transcript: string;
  scenes: Scene[];
  folderId: string | null; // New: folder reference
  tags: string[]; // New: array of tag IDs
  thumbnailUrl?: string; // Optional: for preview
}
```

---

### 8. State Management Updates

#### 8.1 Store Enhancements

- **Folders State**:
  - `folders: Folder[]`
  - `currentFolderId: string | null`
  - Actions: `createFolder`, `updateFolder`, `deleteFolder`, `setCurrentFolder`
- **Tags State**:
  - `tags: Tag[]`
  - Actions: `createTag`, `updateTag`, `deleteTag`, `addTagToProject`, `removeTagFromProject`
- **Project State Updates**:
  - `updateProjectTitle`
  - `moveProjectToFolder`
  - `addTagsToProject`
  - `removeTagsFromProject`
  - `bulkMoveProjects`

#### 8.2 Persistence

- **Storage**:
  - AsyncStorage or similar for local persistence
  - Sync with backend (future)
  - Optimistic updates with rollback

---

### 9. Implementation Phases

#### Phase 1: Core Folder System

1. Update data models
2. Create folder store/state
3. Folder CRUD operations
4. Basic folder UI (list, create, delete)
5. Project-folder association
6. Folder filtering

#### Phase 2: Project Management

1. Title editing (list + editor)
2. Move projects between folders
3. Record in folder context
4. Folder view screen

#### Phase 3: Tag System

1. Tag data model
2. Tag store/state
3. Tag creation and management
4. Tag UI components
5. Tag filtering
6. Tag display on cards

#### Phase 4: UI/UX Polish

1. Apple Notes-style design
2. Animations and transitions
3. Haptic feedback
4. Empty states
5. Loading states
6. Error handling

#### Phase 5: Advanced Features

1. Bulk operations
2. Search improvements (folder + tag aware)
3. Sort options (by folder, tag, date)
4. Folder colors/icons
5. Export/import

---

### 10. Technical Considerations

#### 10.1 Performance

- Virtualized lists for large project counts
- Lazy loading of folder contents
- Debounced search/filter
- Optimized re-renders (React.memo, useMemo)

#### 10.2 Accessibility

- Screen reader support
- Keyboard navigation
- High contrast mode
- Font scaling support

#### 10.3 Error Handling

- Network errors (if syncing)
- Validation errors
- Storage errors
- User-friendly error messages

#### 10.4 Testing

- Unit tests for store actions
- Component tests for UI
- Integration tests for flows
- E2E tests for critical paths

---

### 11. Design Principles

#### 11.1 Apple Notes Inspiration

- Clean, minimal interface
- Intuitive gestures (swipe, long-press)
- Smooth animations
- Consistent spacing and typography
- Native feel

#### 11.2 User Experience

- Discoverable features
- Forgiving interactions (undo, confirmation)
- Fast performance
- Clear visual feedback
- Helpful empty states

#### 11.3 Visual Design

- Consistent color scheme
- Proper hierarchy
- Readable typography
- Appropriate spacing
- Subtle shadows and borders

---

## 🎯 Success Criteria

1. ✅ Users can create, edit, and delete folders
2. ✅ Users can organize projects into folders
3. ✅ Users can tag projects and filter by tags
4. ✅ Users can edit project titles easily
5. ✅ Users can record directly into folders
6. ✅ Users can move projects between folders
7. ✅ UI feels polished and Apple Notes-like
8. ✅ All operations are smooth and responsive
9. ✅ Data persists correctly
10. ✅ App handles edge cases gracefully

---

## 📝 Notes

- Start with Phase 1 and iterate
- Get user feedback early
- Prioritize core folder functionality
- Tags can be added after folders are stable
- Consider future features: nested folders, smart folders, folder templates
