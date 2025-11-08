import { create } from "zustand";
import type { TopicState } from "../interfaces/stores";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";

export const useTopicStore = create<TopicState>()((set) => ({
  topics: [],
  isLoading: false,
  success: false,
  message: "",
  getTopics: async () => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.get(`/QATopic`);
      const body = resp.data;
      set({
        topics: body?.data ?? [],
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
  getTopicsBySubject: async (subjectId: number) => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.get(`/QATopic/subject/${subjectId}`);
      const body = resp.data;
      set({
        topics: body?.data ?? [],
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
  createTopic: async (dto: any) => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.post(`/QATopic`, dto);
      const body = resp.data;
      if (body?.success) {
        set((state: any) => ({
          topics: [...(state.topics || []), body.data],
          success: true,
          message: body?.message ?? "",
        }));
      } else {
        set({ success: false, message: body?.message ?? "" });
      }
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
