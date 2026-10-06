import { create } from "zustand";
import {
  fetchCurrentUser as fetchSessionUser,
  logout as logoutRequest,
} from "@/lib/api";
import type { User } from "@/types";

interface AuthState {
  currentUser: User | null;
  isLoading: boolean;
  hasFetched: boolean;
  fetchCurrentUser: () => Promise<User | null>;
  clearAuth: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoading: false,
  hasFetched: false,
  fetchCurrentUser: async () => {
    set({ isLoading: true });

    try {
      const user = await fetchSessionUser();
      set({
        currentUser: user,
        isLoading: false,
        hasFetched: true,
      });
      return user;
    } catch (error) {
      set({
        currentUser: null,
        isLoading: false,
        hasFetched: true,
      });
      throw error;
    }
  },
  clearAuth: () =>
    set({
      currentUser: null,
      isLoading: false,
      hasFetched: true,
    }),
  logout: async () => {
    await logoutRequest();
    set({
      currentUser: null,
      isLoading: false,
      hasFetched: true,
    });
  },
}));
