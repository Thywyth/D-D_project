/**
 * Auth Store — Handles user authentication, JWT storage, and persistence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IUserPublic } from '../../../shared/types/index';
import { api } from '../services/api';

interface AuthResponse {
  user: IUserPublic;
  token: string;
}

interface AuthState {
  user: IUserPublic | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: IUserPublic, token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<IUserPublic>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      login: async (email, password) => {
        const { user, token } = await api.post<AuthResponse>('/auth/login', {
          email,
          password,
        });
        set({ user, token, isAuthenticated: true });
      },

      register: async (username, email, password) => {
        const { user, token } = await api.post<AuthResponse>(
          '/auth/register',
          { username, email, password },
        );
        set({ user, token, isAuthenticated: true });
      },

      fetchMe: async () => {
        try {
          const user = await api.get<IUserPublic>('/auth/me');
          set({ user, isAuthenticated: true });
        } catch {
          // Token expired or invalid
          get().logout();
        }
      },

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'dnd-auth-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
