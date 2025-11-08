import { create } from "zustand";
import type { ConversationState } from "../interfaces/stores";
import type { Conversation } from "../interfaces/conversation";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import type { HubConnection } from "@microsoft/signalr";
import { createReadConnection } from "@/lib/signalR";
import { devtools } from "zustand/middleware";

export const useConversationStore = create<ConversationState>()(
  devtools(
    (set) => ({
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
          const resp = await axiosInstance.post(
            `/QAConversation`,
            conversation
          );
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
          // ensure unreadCount defaults to 0 if backend didn't include
          const convs = (body?.data ?? []).map((c: any) => ({
            ...c,
            unreadCount: c?.unreadCount ?? 0,
          }));
          set({
            conversations: convs,
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
      // start QA read hub to receive UnreadCountUpdated events and perform UpsertRead
      startRead: async () => {
        try {
          if ((window as any).__readConn) return;
          const conn: HubConnection = createReadConnection();
          (window as any).__readConn = conn;

          conn.on("UnreadCountUpdated", (payload: any) => {
            try {
              const conversationId = String(
                payload?.conversationId ?? payload?.ConversationId ?? ""
              );
              const unread = Number(
                payload?.unreadCount ?? payload?.UnreadCount ?? 0
              );
              set((state: any) => ({
                conversations: (state.conversations || []).map((c: any) =>
                  String(c.id) === String(conversationId)
                    ? { ...c, unreadCount: unread }
                    : c
                ),
              }));
            } catch (err) {
              console.error("UnreadCountUpdated handler error", err);
            }
          });

          await conn.start();
        } catch (err) {
          console.error("startRead failed", err);
        }
      },
      stopRead: async () => {
        try {
          const conn: HubConnection | undefined = (window as any).__readConn;
          if (conn) {
            await conn.stop();
            delete (window as any).__readConn;
          }
        } catch (err) {
          console.error("stopRead failed", err);
        }
      },
      upsertRead: async (conversationId: string) => {
        try {
          const conn: HubConnection | undefined = (window as any).__readConn;
          if (!conn) return;
          await conn.invoke("UpsertRead", conversationId);
          // Optimistically set unreadCount to 0 for caller
          set((state: any) => ({
            conversations: (state.conversations || []).map((c: any) =>
              String(c.id) === String(conversationId)
                ? { ...c, unreadCount: 0 }
                : c
            ),
          }));
        } catch (err) {
          console.error("upsertRead failed", err);
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
    }),
    { name: "qa-conversation-store" }
  )
);
