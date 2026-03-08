import { create } from "zustand";
import { axiosInstance } from "../libs/axios";
import { toast } from "../hooks/use-toast";
import { type ThemeMode } from "./categoryStore";

export interface Note {
  _id: string;
  title: string;
  order: number;
  content: any;
  categoryId: string;
  deleted_at: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean
}

interface NoteStore {
  notes: Note[];
  theme: ThemeMode;
  selectedNoteId: string | null;
  sidebarCollapsed: boolean;
  selectedCategoryId: string | null;
  noteById: Note | null;

  createNote: (name: string, categoryId: string) => Promise<{ success: boolean; error?: string }>;
  getById: (id: string) => Promise<void>;
  updateNote: (id: string, content: any, title: string) => Promise<{ success: boolean; error?: string }>;
  deleteNote: (id: string) => Promise<{ success: boolean; error?: string }>;
  duplicateNote: (id: string) => Promise<{ success: boolean; error?: string }>;
  moveNote: (noteId: string, newCategoryId: string) => Promise<{ success: boolean; error?: string }>;
  reorderNotes: (orderedNotes: { _id: string; order: number }[]) => Promise<{ success: boolean; error?: string }>;

  setSelectedNote: (id: string | null) => void;
  setSelectedCategory: (id: string | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useNotesStore = create<NoteStore>()(
  (set, get) => ({
    notes: [],
    theme: 'system',
    selectedNoteId: null,
    sidebarCollapsed: false,
    selectedCategoryId: null,
    noteById: null,

    createNote: async (name: string, categoryId: string) => {
      try {
        const res = await axiosInstance.post("/note", { title: name, categoryId });
        const newNote = res.data.data;
        console.log("create Note res", res)
        set({ notes: [...get().notes, newNote], });
        return { success: true };
      } catch (error: any) {
        toast({ title: "Create note failed", description: error.response?.data?.message || error.message, });
        return { success: false, error: error.response?.data?.message || error.message, };
      }
    },

    getById: async (id: string) => {
      try {
        const res = await axiosInstance.get(`/note/${id}`);
        set({ noteById: res.data.data });
      } catch (error: any) {
        toast({ title: "Failed to fetch note", description: error.response?.data?.message || error.message, });
      }
    },

    updateNote: async (id: string, content: any, title: string) => {
      try {
        const res = await axiosInstance.put(`/note/${id}`, { content, title });
        const updatedNote = res.data.data;
        set({
          notes: get().notes.map((note) =>
            note._id === id ? { ...note, ...updatedNote } : note
          ),
        });
        console.log("update Note res", res)
        return { success: true };
      }
      catch (error: any) {
        toast({ title: "Update note failed", description: error.response?.data?.message || error.message, });
        return { success: false, error: error.response?.data?.message || error.message, };
      }
    },

    deleteNote: async (id: string) => {
      try {
        const res = await axiosInstance.delete(`/note/${id}`);
        set({ notes: get().notes.filter((note) => note._id !== id), });
        console.log("delete Note res", res)
        return { success: true };
      }
      catch (error: any) {
        toast({ title: "Delete note failed", description: error.response?.data?.message || error.message, });
        return { success: false, error: error.response?.data?.message || error.message, };
      }
    },

    duplicateNote: async (id: string) => {
      try {
        const res = await axiosInstance.post(`/note/${id}/duplicate`);
        const duplicatedNote = res.data.data;
        set({ notes: [...get().notes, duplicatedNote], });
        console.log("duplicate Note res", res)
        return { success: true };
      } catch (error: any) {
        toast({ title: "Duplicate note failed", description: error.response?.data?.message || error.message, });
        return { success: false, error: error.response?.data?.message || error.message, };
      }
    },

    moveNote: async (noteId: string, newCategoryId: string) => {
      try {
        const res = await axiosInstance.put(`/note/${noteId}/move`, { newCategoryId });
        const movedNote = res.data.data;
        set({
          notes: get().notes.map((note) =>
            note._id === noteId ? { ...note, ...movedNote } : note
          ),
        });
        console.log("move Note res", res)
        return { success: true };
      }
      catch (error: any) {
        toast({ title: "Move note failed", description: error.response?.data?.message || error.message, });
        return { success: false, error: error.response?.data?.message || error.message, };
      }
    },

    reorderNotes: async (orderedNotes) => {
      try {
        const payload = {
          orderedNoteIds: orderedNotes.map((note) => ({
            id: note._id,
            order: note.order,
          })),
        };
        const res = await axiosInstance.put("/note/reorder", payload);
        set({ notes: res.data.data ?? [], });
        console.log("reorder Note res", res)
        return { success: true };
      }
      catch (error: any) {
        toast({ title: "Reorder notes failed", description: error.response?.data?.message || error.message, });
        return { success: false, error: error.response?.data?.message || error.message, };
      }
    },

    setSelectedNote: (id: string | null) => {
      set({ selectedNoteId: id });
    },
    setSelectedCategory: (id: string | null) => {
      set({ selectedCategoryId: id });
    },
    toggleSidebar: () => {
      set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
    },
    setTheme: (theme: ThemeMode) => {
      set({ theme });
    },
  })
)