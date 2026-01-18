import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// Mock user storage (in real app, this would be a backend)
const MOCK_USERS_KEY = 'block-notes-users';

const getStoredUsers = (): Record<string, { password: string; name: string }> => {
  const stored = localStorage.getItem(MOCK_USERS_KEY);
  return stored ? JSON.parse(stored) : {};
};

const saveUser = (email: string, password: string, name: string) => {
  const users = getStoredUsers();
  users[email] = { password, name };
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        // Simulate API delay
        await new Promise((r) => setTimeout(r, 500));

        const users = getStoredUsers();
        const storedUser = users[email];

        if (!storedUser) {
          return { success: false, error: 'User not found' };
        }

        if (storedUser.password !== password) {
          return { success: false, error: 'Invalid password' };
        }

        set({
          user: { id: email, email, name: storedUser.name },
          isAuthenticated: true,
        });

        return { success: true };
      },

      signup: async (name, email, password) => {
        // Simulate API delay
        await new Promise((r) => setTimeout(r, 500));

        const users = getStoredUsers();

        if (users[email]) {
          return { success: false, error: 'User already exists' };
        }

        saveUser(email, password, name);

        set({
          user: { id: email, email, name },
          isAuthenticated: true,
        });

        return { success: true };
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'block-notes-auth',
    }
  )
);
