import { create } from "zustand";
import type { TopicState } from "../interfaces/stores";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";

export const useTopicStore = create<TopicState>()((set) => ({
  topics: [],
  isLoading: false,
  isSaving: false,
  isDeleting: false,
  isSearching: false,
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
    set({ isSaving: true });
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
      set({ isSaving: false });
    }
  },
  updateTopic: async (id: number, dto: any) => {
    set({ isSaving: true });
    try {
      const resp = await axiosInstance.put(`/QATopic/${id}`, dto);
      const body = resp.data;
      if (body?.success) {
        set((state: any) => ({
          topics: (state.topics || []).map((t: any) =>
            String(t.id) === String(id) ? body.data : t
          ),
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
      set({ isSaving: false });
    }
  },
  deleteTopic: async (id: number) => {
    set({ isDeleting: true });
    try {
      const resp = await axiosInstance.delete(`/QATopic/${id}`);
      const body = resp.data;
      if (body?.success) {
        // If backend returns the updated topic object, use it; otherwise mark isActive=false locally
        const updatedPayload = body?.data ?? { id, isActive: false };
        set((state: any) => ({
          topics: (state.topics || []).map((t: any) =>
            String(t.id) === String(id) ? { ...t, ...updatedPayload } : t
          ),
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
      set({ isDeleting: false });
    }
  },
  searchTopics: async (q?: string, subjectId?: number) => {
    set({ isSearching: true });
    try {
      const params = [] as string[];
      if (q) params.push(`q=${encodeURIComponent(q)}`);
      if (subjectId) params.push(`subjectId=${subjectId}`);
      const url = `/QATopic/search?${params.join("&")}`;
      const resp = await axiosInstance.get(url);
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
      set({ isSearching: false });
    }
  },
  getSubjects: async () => {
    try {
      const resp = await axiosInstance.get(`/Subject/allsubject`);
      return resp.data?.data ?? resp.data;
    } catch (err: any) {
      console.error(err);
      return [];
    }
  },
}));

export default useTopicStore;
