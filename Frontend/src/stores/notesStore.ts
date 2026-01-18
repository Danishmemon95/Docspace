import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Note {
  id: string;
  title: string;
  categoryId: string;
  content: any; // BlockNote JSON content
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  archived: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

interface NotesState {
  // Data
  notes: Note[];
  categories: Category[];
  profile: UserProfile;
  theme: ThemeMode;
  
  // Selection
  selectedCategoryId: string | null;
  selectedNoteId: string | null;
  
  // Sidebar
  sidebarCollapsed: boolean;
  
  // Actions - Categories
  addCategory: (name: string, color?: string, icon?: string) => void;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (categories: Category[]) => void;
  
  // Actions - Notes
  addNote: (categoryId: string, title?: string) => string;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id'>>) => void;
  deleteNote: (id: string) => void;
  duplicateNote: (id: string) => string;
  moveNote: (noteId: string, toCategoryId: string) => void;
  reorderNotes: (notes: Note[]) => void;
  
  // Actions - Selection
  setSelectedCategory: (id: string | null) => void;
  setSelectedNote: (id: string | null) => void;
  
  // Actions - Sidebar
  toggleSidebar: () => void;
  
  // Actions - Profile & Theme
  updateProfile: (updates: Partial<UserProfile>) => void;
  setTheme: (theme: ThemeMode) => void;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'uncategorized', name: 'Uncategorized', color: 'gray', icon: 'inbox', order: 0 },
];

const WELCOME_NOTE_CONTENT = [
  {
    type: "heading",
    props: { level: 1 },
    content: [{ type: "text", text: "Welcome to Block Notes! 📝", styles: {} }]
  },
  {
    type: "paragraph",
    content: [{ type: "text", text: "This is your new block-based notes application. Start typing to create amazing notes!", styles: {} }]
  },
  {
    type: "heading",
    props: { level: 2 },
    content: [{ type: "text", text: "Getting Started", styles: {} }]
  },
  {
    type: "bulletListItem",
    content: [{ type: "text", text: "Create categories in the sidebar to organize your notes", styles: {} }]
  },
  {
    type: "bulletListItem",
    content: [{ type: "text", text: "Use the / command to add different block types", styles: {} }]
  },
  {
    type: "bulletListItem",
    content: [{ type: "text", text: "Drag and drop notes between categories", styles: {} }]
  },
  {
    type: "bulletListItem",
    content: [{ type: "text", text: "Export notes as PDF from the menu", styles: {} }]
  }
];

const DEFAULT_NOTES: Note[] = [
  {
    id: 'welcome-note',
    title: 'Welcome to Block Notes',
    categoryId: 'uncategorized',
    content: WELCOME_NOTE_CONTENT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: true,
    archived: false,
  },
];

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      // Initial state
      notes: DEFAULT_NOTES,
      categories: DEFAULT_CATEGORIES,
      profile: {
        name: 'User',
        email: 'user@example.com',
        avatar: '',
      },
      theme: 'system',
      selectedCategoryId: null,
      selectedNoteId: 'welcome-note',
      sidebarCollapsed: false,
      
      // Category actions
      addCategory: (name, color = 'blue', icon = 'folder') => {
        const newCategory: Category = {
          id: uuidv4(),
          name,
          color,
          icon,
          order: get().categories.length,
        };
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
      },
      
      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, ...updates } : cat
          ),
        }));
      },
      
      deleteCategory: (id) => {
        if (id === 'uncategorized') return;
        
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
          notes: state.notes.map((note) =>
            note.categoryId === id
              ? { ...note, categoryId: 'uncategorized' }
              : note
          ),
          selectedCategoryId:
            state.selectedCategoryId === id ? null : state.selectedCategoryId,
        }));
      },
      
      reorderCategories: (categories) => {
        set({ categories });
      },
      
      // Note actions
      addNote: (categoryId, title = 'Untitled') => {
        const id = uuidv4();
        const newNote: Note = {
          id,
          title,
          categoryId,
          content: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pinned: false,
          archived: false,
        };
        set((state) => ({
          notes: [newNote, ...state.notes],
          selectedNoteId: id,
        }));
        return id;
      },
      
      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: new Date().toISOString() }
              : note
          ),
        }));
      },
      
      deleteNote: (id) => {
        set((state) => {
          const remainingNotes = state.notes.filter((note) => note.id !== id);
          return {
            notes: remainingNotes,
            selectedNoteId:
              state.selectedNoteId === id
                ? remainingNotes[0]?.id || null
                : state.selectedNoteId,
          };
        });
      },
      
      duplicateNote: (id) => {
        const note = get().notes.find((n) => n.id === id);
        if (!note) return '';
        
        const newId = uuidv4();
        const newNote: Note = {
          ...note,
          id: newId,
          title: `${note.title} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pinned: false,
        };
        
        set((state) => ({
          notes: [newNote, ...state.notes],
          selectedNoteId: newId,
        }));
        
        return newId;
      },
      
      moveNote: (noteId, toCategoryId) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === noteId ? { ...note, categoryId: toCategoryId } : note
          ),
        }));
      },
      
      reorderNotes: (notes) => {
        set({ notes });
      },
      
      // Selection actions
      setSelectedCategory: (id) => {
        set({ selectedCategoryId: id });
      },
      
      setSelectedNote: (id) => {
        set({ selectedNoteId: id });
      },
      
      // Sidebar actions
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      
      // Profile & Theme actions
      updateProfile: (updates) => {
        set((state) => ({
          profile: { ...state.profile, ...updates },
        }));
      },
      
      setTheme: (theme) => {
        set({ theme });
      },
    }),
    {
      name: 'block-notes-storage',
    }
  )
);
