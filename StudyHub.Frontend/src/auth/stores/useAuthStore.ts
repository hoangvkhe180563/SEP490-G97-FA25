import { create } from "zustand";
import type { AuthState } from "../interfaces/stores";

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  token: null,
  isLoading: false,
  error: null,
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // On success
      set({ isAuthenticated: true, token: "fake-jwt-token" });
    } catch (error) {
      set({ error: "Login failed" });
      console.log(error);
    } finally {
      set({ isLoading: false });
    }
  },
  logout: () => {
    set({ isAuthenticated: false, token: null });
  },
}));

export { useAuthStore };
