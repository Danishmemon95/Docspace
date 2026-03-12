import { create } from "zustand";
import { axiosInstance } from "../libs/axios";
import { toast } from "../hooks/use-toast";
import type { Note } from "../Types/Note";

export interface CategoryItem {
    _id: string;
    category_name: string;
    icon: string;
    order: number;
    notes: Note[];
    noteCount: number;
    isDefault: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

interface CategoryStore {
    categories: CategoryItem[];
    isUpdating: boolean;
    isFetching: boolean;

    getCategory: () => Promise<void>;
    createCategory: (name: string, icon: string) => Promise<{ success: boolean; error?: string }>;
    updateCategory: (id: string, name: string, icon: string) => Promise<{ success: boolean; error?: string }>;
    deleteCategory: (id: string) => Promise<{ success: boolean; error?: string }>;
    reorderCategories: (orderedCategories: { _id: string; order: number }[]) => Promise<{ success: boolean; error?: string }>;

    // Sync helpers — called by notesStore after mutations, no API calls
    syncAddNote: (note: Note) => void;
    syncUpdateNote: (updatedNote: Note) => void;
    syncDeleteNote: (noteId: string) => void;
    syncMoveNote: (noteId: string, newCategoryId: string, updatedNote: Note) => void;
    syncReorderNotes: (categoryId: string, reorderedNotes: Note[]) => void;
}

export const useCategoryStore = create<CategoryStore>()(
    (set, get) => ({
        categories: [],
        isUpdating: false,
        isFetching: false,

        getCategory: async () => {
            try {
                set({ isFetching: true });
                const res = await axiosInstance.get("/category/with-notes");
                set({ categories: res.data.data ?? [] });
            } catch (error: any) {
                toast({
                    title: "Failed to fetch categories",
                    description: error.response?.data?.message || error.message,
                });
            } finally {
                set({ isFetching: false });
            }
        },

        createCategory: async (name, icon) => {
            try {
                set({ isUpdating: true });
                const res = await axiosInstance.post("/category", { name, icon });
                const newCategory: CategoryItem = {
                    ...res.data.data,
                    notes: res.data.data.notes ?? [],
                    noteCount: res.data.data.noteCount ?? 0,
                };
                set({ categories: [...get().categories, newCategory] });
                return { success: true };
            } catch (error: any) {
                toast({
                    title: "Create category failed",
                    description: error.response?.data?.message || error.message,
                });
                return { success: false, error: error.response?.data?.message || error.message };
            } finally {
                set({ isUpdating: false });
            }
        },

        updateCategory: async (id, name, icon) => {
            try {
                set({ isUpdating: true });
                const res = await axiosInstance.put(`/category/${id}`, { name, icon });
                const updatedCategory = res.data.data;
                set({
                    categories: get().categories.map((cat) =>
                        cat._id === id ? { ...cat, ...updatedCategory } : cat
                    ),
                });
                return { success: true };
            } catch (error: any) {
                toast({
                    title: "Update category failed",
                    description: error.response?.data?.message || error.message,
                });
                return { success: false, error: error.response?.data?.message || error.message };
            } finally {
                set({ isUpdating: false });
            }
        },

        deleteCategory: async (id) => {
            try {
                set({ isUpdating: true });
                await axiosInstance.delete(`/category/${id}`);
                set({ categories: get().categories.filter((cat) => cat._id !== id) });
                return { success: true };
            } catch (error: any) {
                toast({
                    title: "Delete category failed",
                    description: error.response?.data?.message || error.message,
                });
                return { success: false, error: error.response?.data?.message || error.message };
            } finally {
                set({ isUpdating: false });
            }
        },

        reorderCategories: async (orderedCategories) => {
            try {
                set({ isUpdating: true });
                const payload = {
                    categoryOrders: orderedCategories.map((cat) => ({
                        id: cat._id,
                        order: cat.order,
                    })),
                };
                const res = await axiosInstance.put("/category/reorder", payload);
                set({ categories: res.data.data ?? [] });
                return { success: true };
            } catch (error: any) {
                toast({
                    title: "Reorder categories failed",
                    description: error.response?.data?.message || error.message,
                });
                return { success: false, error: error.response?.data?.message || error.message };
            } finally {
                set({ isUpdating: false });
            }
        },

        // ─── Sync helpers (no API calls) ────────────────────────────────────────

        syncAddNote: (note) => {
            set({
                categories: get().categories.map((cat) =>
                    cat._id === note.categoryId
                        ? { ...cat, notes: [...cat.notes, note], noteCount: cat.noteCount + 1 }
                        : cat
                ),
            });
        },

        syncUpdateNote: (updatedNote) => {
            set({
                categories: get().categories.map((cat) =>
                    cat._id === updatedNote.categoryId
                        ? {
                            ...cat,
                            notes: cat.notes.map((n) =>
                                n._id === updatedNote._id ? { ...n, ...updatedNote } : n
                            ),
                        }
                        : cat
                ),
            });
        },

        syncDeleteNote: (noteId) => {
            set({
                categories: get().categories.map((cat) => {
                    const exists = cat.notes.some((n) => n._id === noteId);
                    if (!exists) return cat;
                    return {
                        ...cat,
                        notes: cat.notes.filter((n) => n._id !== noteId),
                        noteCount: Math.max(0, cat.noteCount - 1),
                    };
                }),
            });
        },

        syncMoveNote: (noteId, newCategoryId, updatedNote) => {
            set({
                categories: get().categories.map((cat) => {
                    // Remove from old category
                    if (cat.notes.some((n) => n._id === noteId) && cat._id !== newCategoryId) {
                        return {
                            ...cat,
                            notes: cat.notes.filter((n) => n._id !== noteId),
                            noteCount: Math.max(0, cat.noteCount - 1),
                        };
                    }
                    // Add to new category
                    if (cat._id === newCategoryId) {
                        return {
                            ...cat,
                            notes: [...cat.notes, updatedNote],
                            noteCount: cat.noteCount + 1,
                        };
                    }
                    return cat;
                }),
            });
        },

        syncReorderNotes: (categoryId, reorderedNotes) => {
            set({
                categories: get().categories.map((cat) =>
                    cat._id === categoryId ? { ...cat, notes: reorderedNotes } : cat
                ),
            });
        },
    }),
);