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
  pinnedNotes: Note[];
  isLoadingPinnedNotes: boolean;
  deletedNotes: Note[];
  isLoadingDeletedNotes: boolean;

  createNote: (name: string, categoryId: string) => Promise<{ success: boolean; error?: string }>;
  getById: (id: string) => Promise<void>;
  updateNote: (id: string, content: any, title: string) => Promise<{ success: boolean; error?: string }>;
  deleteNote: (id: string) => Promise<{ success: boolean; error?: string }>;
  duplicateNote: (id: string) => Promise<{ success: boolean; error?: string }>;
  togglePin: (noteId: string) => Promise<{ success: boolean; error?: string }>;
  moveNote: (noteId: string, newCategoryId: string) => Promise<{ success: boolean; error?: string }>;
  reorderNotes: (orderedNotes: { _id: string; order: number }[], categoryId: string, optimisticNotes: Note[]) => Promise<{ success: boolean; error?: string }>;
  getPinnedNotes: () => Promise<void>;
  getDeletedNotes: () => Promise<void>;
  restoreNote: (noteId: string) => Promise<{ success: boolean; error?: string }>;

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
    pinnedNotes: [],
    isLoadingPinnedNotes: false,
    deletedNotes: [],
    isLoadingDeletedNotes: false,

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
        // Refresh deleted notes list
        const deletedRes = await axiosInstance.get("/note/deleted/list");
        set((state: NoteStore) => ({
          selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId,
          deletedNotes: deletedRes.data.data,
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

    togglePin: async (noteId: string) => {
      try {
        const res = await axiosInstance.put(`/note/${noteId}/toggle-pin`);
        const updatedNote: Note = res.data.data;
        getCategorySync().syncUpdateNote(updatedNote);
        set((state: NoteStore) => ({
          noteById: state.noteById && state.noteById._id === updatedNote._id ? updatedNote : state.noteById,
          pinnedNotes: updatedNote.pinned
            ? [updatedNote, ...state.pinnedNotes.filter(n => n._id !== updatedNote._id)]
            : state.pinnedNotes.filter(n => n._id !== updatedNote._id),
        }));
        return { success: true };
      } catch (error: any) {
        toast({
          title: "Pin update failed",
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

    getPinnedNotes: async () => {
      set({ isLoadingPinnedNotes: true });
      try {
        const res = await axiosInstance.get("/note/pinned/list");
        set({ pinnedNotes: res.data.data });
      } catch (error: any) {
        toast({
          title: "Failed to fetch pinned notes",
          description: error.response?.data?.message || error.message,
        });
      } finally {
        set({ isLoadingPinnedNotes: false });
      }
    },

    getDeletedNotes: async () => {
      set({ isLoadingDeletedNotes: true });
      try {
        const res = await axiosInstance.get("/note/deleted/list");
        set({ deletedNotes: res.data.data });
      } catch (error: any) {
        toast({
          title: "Failed to fetch deleted notes",
          description: error.response?.data?.message || error.message,
        });
      } finally {
        set({ isLoadingDeletedNotes: false });
      }
    },

    restoreNote: async (noteId: string) => {
      try {
        const res = await axiosInstance.put(`/note/${noteId}/restore`);
        const restoredNote: Note = res.data.data;
        getCategorySync().syncAddNote(restoredNote);
        set((state: NoteStore) => ({
          deletedNotes: state.deletedNotes.filter(n => n._id !== noteId),
        }));
        toast({
          title: "Note restored",
          description: "Note has been restored successfully",
        });
        return { success: true };
      } catch (error: any) {
        toast({
          title: "Restore note failed",
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
