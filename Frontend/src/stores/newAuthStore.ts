import { create } from "zustand";
import { axiosInstance } from "../libs/axios";
import { toast } from "../hooks/use-toast";
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthUser {
    id: string;
    email: string;
    name: string;
}

interface AuthStore {
    authUser: AuthUser | null;
    isAuthenticated: boolean;
    isLoggingIn: boolean;
    isCheckingAuth: boolean;
    isSigningUp: boolean;
    isUpdatingProfile: boolean;

    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    updateUserName: (name: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            authUser: null,
            isAuthenticated: false,
            isLoggingIn: false,
            isCheckingAuth: false,
            isSigningUp: false,
            isUpdatingProfile: false,

            login: async (email, password) => {
                try {
                    set({ isLoggingIn: true });
                    const res = await axiosInstance.post("/auth/login", { email, password });
                    set({ authUser: res.data.data, isAuthenticated: true });
                    toast({ title: "Login successful" });
                    return { success: true };
                } catch (error: any) {
                    toast({
                        title: "Login failed",
                        description: error.response?.data?.message || error.message,
                    });
                    return { success: false, error: error.response?.data?.message || error.message };
                } finally {
                    set({ isLoggingIn: false });
                }
            },

            signup: async (name, email, password) => {
                try {
                    set({ isSigningUp: true });
                    const res = await axiosInstance.post("/auth/signup", { name, email, password });
                    set({ authUser: res.data.data, isAuthenticated: true });
                    toast({ title: "Signup successful" });
                    return { success: true };
                } catch (error: any) {
                    toast({
                        title: "Signup failed",
                        description: error.response?.data?.message || error.message,
                    });
                    return { success: false, error: error.response?.data?.message || error.message };
                } finally {
                    set({ isSigningUp: false });
                }
            },

            logout: async () => {
                try {
                    await axiosInstance.post("/auth/logout");
                } catch {
                    // Silent — even if the server call fails, we clear local state
                } finally {
                    set({ authUser: null, isAuthenticated: false });
                    // Clear persisted auth from localStorage
                    useAuthStore.persist.clearStorage();
                }
            },

            checkAuth: async () => {
                try {
                    set({ isCheckingAuth: true });
                    const res = await axiosInstance.get("/auth/check");
                    set({ authUser: res.data.user, isAuthenticated: true });
                } catch {
                    set({ authUser: null, isAuthenticated: false });
                } finally {
                    set({ isCheckingAuth: false });
                }
            },

            updateUserName: async (name) => {
                try {
                    set({ isUpdatingProfile: true });
                    const res = await axiosInstance.put("/auth/update-name", { name });
                    set({ authUser: res.data.data });
                    toast({
                        title: "Success",
                        description: "Your name has been updated",
                    });
                    return { success: true };
                } catch (error: any) {
                    toast({
                        title: "Update failed",
                        description: error.response?.data?.message || error.message,
                    });
                    return { success: false, error: error.response?.data?.message || error.message };
                } finally {
                    set({ isUpdatingProfile: false });
                }
            },
        }),
        {
            name: "auth-store",
            storage: createJSONStorage(() => localStorage),
            // Only persist what's needed — never persist loading states
            partialize: (state) => ({
                authUser: state.authUser,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);