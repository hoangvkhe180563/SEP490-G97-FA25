import { create } from "zustand";
import type { MessageState } from "../interfaces/stores";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";

export const useMessageStore = create<MessageState>()((set) => ({
  messages: [],
  isLoading: false,
  success: false,
  message: "",
  getMessagesByConversationId: async (conversationId: string) => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.get(
        `/QAMessage/conversation/${conversationId}`
      );
      const body = resp.data;
      set({
        messages: body?.data ?? [],
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
  sendMessage: async (message) => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.post(`/QAMessage`, message);
      const body = resp.data;
      if (body?.success) {
        set((state: any) => ({
          messages: [...(state.messages || []), body.data],
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
  updateMessage: async (id: string, dto: any) => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.put(`/QAMessage/${id}`, dto);
      const body = resp.data;
      if (body?.success) {
        set((state: any) => ({
          messages: (state.messages || []).map((m: any) =>
            String(m.id) === String(id) ? body.data : m
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
      set({ isLoading: false });
    }
  },
  getAllMessages: async () => {
    set({ isLoading: true });
    try {
      const resp = await axiosInstance.get(`/QAMessage`);
      const body = resp.data;
      set({
        messages: body?.data ?? [],
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
