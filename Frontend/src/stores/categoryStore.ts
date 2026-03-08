import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../libs/axios";
import { toast } from "../hooks/use-toast";
import type { Note } from "./notesStore";


export interface CategoryItem {
    _id: string;
    category_name: string;
    icon: string;
    order: number;
    notes: Note[];
    noteCount: number;
    isDefault: boolean;
}

interface CategoryStore {
    categories: CategoryItem[];
    isUpdating: boolean;
    isFetching: boolean;
    getCategory: () => Promise<void>;
    updateCategory: (
        id: string,
        name: string,
        icon: string
    ) => Promise<{ success: boolean; error?: string }>;
    createCategory: (
        name: string,
        icon: string
    ) => Promise<{ success: boolean; error?: string }>;
    deleteCategory: (
        id: string
    ) => Promise<{ success: boolean; error?: string }>;

    reorderCategories: (
        orderedCategories: { _id: string; order: number }[]
    ) => Promise<{ success: boolean; error?: string }>;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export const useCategoryStore = create<CategoryStore>()(
    persist(
        (set, get) => ({
            categories: [],
            isUpdating: false,
            isFetching: false,

            getCategory: async () => {
                try {
                    set({ isFetching: true });
                    const res = await axiosInstance.get("/category/with-notes");
                    set({ categories: res.data.data ?? [], });
                    console.log("res get category", res)
                } catch (error: any) {
                    toast({ title: "Failed to fetch categories", description: error.response?.data?.message || error.message, });
                } finally {
                    set({ isFetching: false });
                }
            },

            createCategory: async (name: string, icon: string) => {
                try {
                    set({ isUpdating: true });
                    const res = await axiosInstance.post("/category", { name, icon });
                    const newCategory = res.data.data;
                    console.log("res create category", res)
                    set({
                        categories: [
                            ...get().categories,
                            {
                                ...newCategory,
                                notes: newCategory.notes ?? [],
                                noteCount: newCategory.noteCount ?? 0,
                            },
                        ],
                    });
                    return { success: true };
                } catch (error: any) {
                    toast({
                        title: "Create category failed",
                        description: error.response?.data?.message || error.message,
                    });
                    return { success: false, error: error.response?.data?.message || error.message, };
                } finally {
                    set({ isUpdating: false });
                }
            },

            updateCategory: async (id: string, name: string, icon: string) => {
                try {
                    set({ isUpdating: true });
                    const res = await axiosInstance.put(`/category/${id}`, { name, icon });
                    const updatedCategory = res.data.data;
                    set({
                        categories: get().categories.map((cat) =>
                            cat._id === id ? { ...cat, ...updatedCategory } : cat
                        ),
                    });
                    console.log("res update category", res)
                    return { success: true };
                } catch (error: any) {
                    toast({ title: "Update category failed", description: error.response?.data?.message || error.message, });
                    return { success: false, error: error.response?.data?.message || error.message, };
                } finally {
                    set({ isUpdating: false });
                }
            },

            deleteCategory: async (id: string) => {
                try {
                    set({ isUpdating: true });
                    const res = await axiosInstance.delete(`/category/${id}`);
                    set({ categories: get().categories.filter((cat) => cat._id !== id), });
                    console.log("res delete category", res)
                    return { success: true };
                } catch (error: any) {
                    toast({ title: "Delete category failed", description: error.response?.data?.message || error.message, });
                    return { success: false, error: error.response?.data?.message || error.message, };
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
                    set({ categories: res.data.data ?? [], });
                    console.log("res reorder category", res)
                    return { success: true };
                } catch (error: any) {
                    toast({ title: "Reorder categories failed", description: error.response?.data?.message || error.message, });
                    return { success: false, error: error.response?.data?.message || error.message, };
                } finally {
                    set({ isUpdating: false });
                }
            },

        }),
        { name: "category-store", }
    )
);
