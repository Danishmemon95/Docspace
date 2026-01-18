import { create } from "zustand";
import { axiosInstance } from "../libs/axios";
import { toast } from "../hooks/use-toast";
import { persist } from 'zustand/middleware';

interface User {
    authUser: {
        id: string;
        email: string;
        name: string;
    } | null;
    isAuthenticated: boolean;
    isLoggingin: boolean;
    isCheckingAuth: boolean;
    isSigningup: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<User>()(
    persist(
        (set) => ({
            authUser: null,
            isAuthenticated: false,
            isLoggingin: false,
            isCheckingAuth: false,
            isSigningup: false,

            login: async (email: string, password: string) => {
                try {
                    set({ isLoggingin: true });
                    const response = await axiosInstance.post("/auth/login", { email, password })
                    set({ authUser: response.data.data, isAuthenticated: true });
                    console.log("response", response)
                    toast({ title: "Login successful", status: "success" });
                    return { success: true };
                } catch (error: any) {
                    toast({ title: "Login failed", description: error.response?.data?.message || error.message, status: "error" });
                    return { success: false, error: error.response?.data?.message || error.message };
                } finally {
                    set({ isLoggingin: false });
                }
            },

            signup: async (name: string, email: string, password: string) => {
                try {
                    set({ isSigningup: true });
                    const response = await axiosInstance.post("/auth/signup", { name, email, password });
                    set({ authUser: response.data, isAuthenticated: true });
                    toast({ title: "Signup successful", status: "success" });
                    return { success: true };
                } catch (error: any) {
                    toast({ title: "Signup failed", description: error.response?.data?.message || error.message, status: "error" });
                    return { success: false, error: error.response?.data?.message || error.message };
                } finally {
                    set({ isSigningup: false });
                }
            },

            logout: async () => {
                try {
                    await axiosInstance.post("/auth/logout");
                    set({ authUser: null, isAuthenticated: false });
                } catch (error) {
                    toast({ title: "Logout failed", status: "error" });
                }
            },

            checkAuth: async () => {
                try {
                    set({ isCheckingAuth: true });
                    const response = await axiosInstance.get("/auth/check");
                    set({ authUser: response.data, isAuthenticated: true });
                } catch (error) {
                    set({ authUser: null, isAuthenticated: false });
                } finally {
                    set({ isCheckingAuth: false });
                }
            }
        }),
        {
            name: "auth"
        }
    )
)