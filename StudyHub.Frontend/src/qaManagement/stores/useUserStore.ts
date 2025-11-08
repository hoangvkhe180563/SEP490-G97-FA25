import { create } from "zustand";
import type { AppUserState } from "../interfaces/stores";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import { useUserOnlineStore } from "@/common/stores/useUserOnlineStore";

export const useQAUserStore = create<AppUserState>()((set) => ({
  teachers: [],
  connectedTeachers: [],
  students: [],
  connectedStudents: [],
  isLoading: false,
  success: false,
  message: "",
  getTeachers: async () => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.get(`/QAConversation/teachers`);
      const body = resp.data;
      set({
        teachers: body?.data ?? [],
        success: body?.success ?? true,
        message: body?.message ?? "",
      });
      return body;
    } catch (err: any) {
      set({ success: false, message: axiosMessageErrorHandler(err) });
      console.error(err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  getConnectedTeachers: async () => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.get(
        `/QAConversation/teachers/with-conversations`
      );
      const body = resp.data;
      set({
        connectedTeachers: body?.data ?? [],
        success: body?.success ?? true,
        message: body?.message ?? "",
      });
      return body;
    } catch (err: any) {
      set({ success: false, message: axiosMessageErrorHandler(err) });
      console.error(err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  getStudents: async () => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.get(`/QAConversation/students`);
      const body = resp.data;
      set({
        students: body?.data ?? [],
        success: body?.success ?? true,
        message: body?.message ?? "",
      });
      return body;
    } catch (err: any) {
      set({ success: false, message: axiosMessageErrorHandler(err) });
      console.error(err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  getConnectedStudents: async () => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.get(
        `/QAConversation/students/with-conversations`
      );
      const body = resp.data;
      set({
        connectedStudents: body?.data ?? [],
        success: body?.success ?? true,
        message: body?.message ?? "",
      });
      return body;
    } catch (err: any) {
      set({ success: false, message: axiosMessageErrorHandler(err) });
      console.error(err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  getUserStatus: async (userId: string) => {
    if (!userId) return null;
    try {
      // Prefer the shared presence store's snapshot when available
      const normalizedId = String(userId ?? "")
        .toLowerCase()
        .trim();
      const local = (useUserOnlineStore.getState().onlineUsers || []).find(
        (u: any) =>
          String(u?.userId ?? "")
            .toLowerCase()
            .trim() === normalizedId
      );
      if (local) return local;
      // fallback to server endpoint
      const resp = await axiosInstance.get(
        `/QAConversation/presence/user/${userId}`
      );
      const d = resp?.data?.data ?? null;
      if (!d) return null;
      // normalize server response to the same shape as onlineUsers
      const normalized = {
        userId: String(d?.userId ?? d?.UserId ?? d?.id ?? d?.Id ?? "")
          .toLowerCase()
          .trim(),
        fullName: d?.fullName ?? d?.FullName ?? d?.displayName ?? "",
        roles: d?.roles ?? d?.Roles ?? [],
        isOnline: d?.isOnline === true,
        lastSeen: d?.lastSeen ?? d?.LastSeen ?? null,
      };
      return normalized;
    } catch (err) {
      console.error("getUserStatus failed", err);
      return null;
    }
  },
}));
