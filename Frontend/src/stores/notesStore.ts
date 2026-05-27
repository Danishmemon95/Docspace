import { create } from "zustand/react";
import { axiosInstance } from "../libs/axios";
import { toast } from "../hooks/use-toast";
import { type ThemeMode } from "./categoryStore";
import { useCategoryStore } from "./categoryStore";
import type { Note } from "../Types/Note";

// ── Theme persistence helpers (bypass zustand middleware to avoid TS issues) ──
const THEME_KEY = "docspace-theme";

function loadTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch { }
  return "system";
}

function saveTheme(theme: ThemeMode) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch { }
}

interface NoteStore {
  theme: ThemeMode;
  selectedNoteId: string | null;
  sidebarCollapsed: boolean;
  selectedCategoryId: string | null;
  noteById: Note | null;
  isLoadingNote: boolean;

  createNote: (name: string, categoryId: string) => Promise<{ success: boolean; error?: string }>;
  getById: (id: string) => Promise<void>;
  updateNote: (id: string, content: any, title: string) => Promise<{ success: boolean; error?: string }>;
  deleteNote: (id: string) => Promise<{ success: boolean; error?: string }>;
  duplicateNote: (id: string) => Promise<{ success: boolean; error?: string }>;
  moveNote: (noteId: string, newCategoryId: string) => Promise<{ success: boolean; error?: string }>;
  reorderNotes: (orderedNotes: { _id: string; order: number }[], categoryId: string, optimisticNotes: Note[]) => Promise<{ success: boolean; error?: string }>;

  setSelectedNote: (id: string | null) => void;
  setSelectedCategory: (id: string | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: ThemeMode) => void;
}

// Helper to access categoryStore sync methods outside of React components
const getCategorySync = () => useCategoryStore.getState();

export const useNotesStore = create<NoteStore>()(
  (set: (partial: Partial<NoteStore> | ((state: NoteStore) => Partial<NoteStore>)) => void) => ({
    theme: loadTheme(),
    selectedNoteId: null,
    sidebarCollapsed: false,
    selectedCategoryId: null,
    noteById: null,
    isLoadingNote: false,

    createNote: async (name: string, categoryId: string) => {
      try {
        const res = await axiosInstance.post("/note", { title: name, categoryId });
        const newNote: Note = res.data.data;
        getCategorySync().syncAddNote(newNote);
        return { success: true };
      } catch (error: any) {
        toast({
          title: "Create note failed",
          description: error.response?.data?.message || error.message,
        });
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    getById: async (id: string) => {
      // Show skeleton — only triggered on note open/switch, not on auto-save
      set({ isLoadingNote: true, noteById: null });
      try {
        const res = await axiosInstance.get(`/note/${id}`);
        set({ noteById: res.data.data });
      } catch (error: any) {
        toast({
          title: "Failed to fetch note",
          description: error.response?.data?.message || error.message,
        });
      } finally {
        set({ isLoadingNote: false });
      }
    },

    updateNote: async (id: string, content: any, title: string) => {
      // Silent debounced save — no loading state, no skeleton
      try {
        const res = await axiosInstance.put(`/note/${id}`, { content, title });
        const updatedNote: Note = res.data.data;
        getCategorySync().syncUpdateNote(updatedNote);
        return { success: true };
      } catch (error: any) {
        toast({
          title: "Update note failed",
          description: error.response?.data?.message || error.message,
        });
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    deleteNote: async (id: string) => {
      try {
        await axiosInstance.delete(`/note/${id}`);
        getCategorySync().syncDeleteNote(id);
        set((state: NoteStore) => ({
          selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
        }));
        return { success: true };
      } catch (error: any) {
        toast({
          title: "Delete note failed",
          description: error.response?.data?.message || error.message,
        });
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    duplicateNote: async (id: string) => {
      try {
        const res = await axiosInstance.post(`/note/${id}/duplicate`);
        const duplicatedNote: Note = res.data.data;
        getCategorySync().syncAddNote(duplicatedNote);
        return { success: true };
      } catch (error: any) {
        toast({
          title: "Duplicate note failed",
          description: error.response?.data?.message || error.message,
        });
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    moveNote: async (noteId: string, newCategoryId: string) => {
      try {
        const res = await axiosInstance.put(`/note/${noteId}/move`, { newCategoryId });
        const movedNote: Note = res.data.data;
        getCategorySync().syncMoveNote(noteId, newCategoryId, movedNote);
        return { success: true };
      } catch (error: any) {
        toast({
          title: "Move note failed",
          description: error.response?.data?.message || error.message,
        });
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    reorderNotes: async (
      orderedNotes: { _id: string; order: number }[],
      categoryId: string,
      optimisticNotes: Note[]
    ) => {
      getCategorySync().syncReorderNotes(categoryId, optimisticNotes);

      try {
        await axiosInstance.put("/note/reorder", {
          orderedNoteIds: orderedNotes.map((note) => ({
            id: note._id,
            order: note.order,
          })),
        });
        return { success: true };
      } catch (error: any) {
        getCategorySync().getCategory();
        toast({
          title: "Reorder failed",
          description: error.response?.data?.message || error.message,
        });
        return { success: false, error: error.response?.data?.message || error.message };
      }
    },

    setSelectedNote: (id: string | null) => set({ selectedNoteId: id }),
    setSelectedCategory: (id: string | null) => set({ selectedCategoryId: id }),
    toggleSidebar: () => set((state: NoteStore) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    setTheme: (theme: ThemeMode) => {
      saveTheme(theme);
      set({ theme });
    },
  })
);
