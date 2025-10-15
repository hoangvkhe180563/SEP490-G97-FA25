import { create } from "zustand";
import type { UserState } from "../interfaces/stores";
import { axiosInstance } from "@/lib/axios";

export const useAppUserStore = create<UserState>((set) => ({
  appUsers: [],
  appUser: undefined,
  success: false,
  message: "",
  isLoading: false,
  filterAppUsers: async (query: string) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get(`/AppUser?${query}`);
      const { data } = response;
      set({
        appUsers: data.users,
        meta: data.meta ?? null,
        success: data.success,
        message: data.message,
      });
      return data;
    } catch (error) {
      set({
        success: false,
        message: "Failed to fetch users",
      });
      console.log(error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  getAppUserById: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get(`/AppUser/${id}`);
      const { data } = response;
      set({
        appUser: data.user,
        success: data.success,
        message: data.message,
      });
      return data;
    } catch (error) {
      set({
        success: false,
        message: "Failed to fetch user",
      });
      console.log(error);
      return undefined;
    } finally {
      set({ isLoading: false });
    }
  },
}));
