import { create } from "zustand";
import type { ConversationState } from "../interfaces/stores";
import type { Conversation } from "../interfaces/conversation";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";

export const useConversationStore = create<ConversationState>()((set) => ({
  conversations: [],
  conversation: null,
  isLoading: false,
  success: false,
  message: "",
  getConversations: async () => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.get("/QAConversation");
      const body = resp.data;
      set({
        conversations: body?.data ?? [],
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
  getConversationById: async (id: string) => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.get(`/QAConversation/${id}`);
      const body = resp.data;
      // update or add conversation
      set((state: any) => ({
        conversations: state.conversations.map((c: Conversation) =>
          String(c.id) === String(id) ? body?.data ?? c : c
        ),
        conversation: body?.data ?? null,
        success: body?.success ?? true,
        message: body?.message ?? "",
      }));
      return body;
    } catch (err: any) {
      set({ success: false, message: axiosMessageErrorHandler(err) });
      console.error(err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  createConversation: async (conversation) => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.post(`/QAConversation`, conversation);
      const body = resp.data;
      if (body?.success) {
        set((state: any) => ({
          conversations: [...(state.conversations || []), body.data],
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
  getMine: async () => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.get(`/QAConversation/mine`);
      const body = resp.data;
      set({
        conversations: body?.data ?? [],
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
  getTeachersWithConversationsForCurrentStudent: async () => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.get(
        `/QAConversation/teachers/with-conversations`
      );
      const body = resp.data;
      // store as conversations? we'll keep message for now and return data
      set({ success: body?.success ?? true, message: body?.message ?? "" });
      return body;
    } catch (err: any) {
      set({ success: false, message: axiosMessageErrorHandler(err) });
      console.error(err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  getStudentsWithConversationsForCurrentTeacher: async () => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.get(
        `/QAConversation/students/with-conversations`
      );
      const body = resp.data;
      set({ success: body?.success ?? true, message: body?.message ?? "" });
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
