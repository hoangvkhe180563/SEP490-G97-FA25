import { create } from "zustand";
import type { AppUserState } from "../interfaces/stores";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";

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
}));
