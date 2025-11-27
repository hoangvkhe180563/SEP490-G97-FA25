import { create } from "zustand";
import type { MessageState } from "../interfaces/stores";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import type { HubConnection } from "@microsoft/signalr";
import { createChatConnection } from "@/lib/signalR";
import { useConversationStore } from "@/qaManagement/stores/useConversationStore";
import { devtools } from "zustand/middleware";

export const useMessageStore = create<MessageState>()(
  devtools(
    (set) => ({
      messages: [],
      files: [],
      // realtime
      isChatConnected: false,
      typingUsers: [],
      isLoading: false,
      success: false,
      message: "",
      // start a SignalR chat connection (module-level cached on window)
      startChat: async () => {
        try {
          if ((window as any).__chatConn) return;
          const conn: HubConnection = createChatConnection();
          (window as any).__chatConn = conn;

          const normalizeMsg = (d: any) => ({
            id: d?.id ?? d?.Id ?? String(Date.now()),
            conversationId: String(
              d?.conversationId ?? d?.ConversationId ?? ""
            ),
            senderId: String(
              d?.senderId ?? d?.SenderId ?? d?.sender ?? d?.userId ?? ""
            ).toString(),
            content: d?.content ?? d?.Content ?? "",
            createdAt: new Date(
              d?.createdAt ?? d?.CreatedAt ?? Date.now()
            ).toISOString(),
          });

          conn.on("ReceiveMessage", (dto: any) => {
            try {
              const msg = normalizeMsg(dto);
              console.log("ReceiveMessage", msg);
              set((state: any) => {
                const exists = (state.messages || []).some(
                  (m: any) => String(m.id) === String(msg.id)
                );
                if (exists) return {} as any;
                return { messages: [...(state.messages || []), msg] } as any;
              });
              // If we're currently viewing this conversation, mark it read for current user
              try {
                const convId = String(msg.conversationId || "");
                if (convId) {
                  // fire-and-forget: upsertRead will optimistically set unreadCount on the conversation store
                  useConversationStore.getState().upsertRead?.(convId);
                }
              } catch (err) {
                console.warn("auto upsertRead on ReceiveMessage failed", err);
              }
            } catch (err) {
              console.error("ReceiveMessage handler error", err);
            }
          });

          conn.on("UserTyping", (payload: any) => {
            // payload: { ConversationId, UserId, IsTyping }
            try {
              set((state: any) => {
                const list = (state.typingUsers || []).filter(
                  (t: any) =>
                    t.conversationId !== payload?.conversationId ||
                    t.userId !== payload?.userId
                );
                if (payload?.isTyping)
                  list.push({
                    conversationId: payload?.conversationId,
                    userId: payload?.userId,
                    isTyping: true,
                  });
                return { typingUsers: list } as any;
              });
            } catch (err) {
              console.error("UserTyping handler error", err);
            }
          });

          await conn.start();
          set({ isChatConnected: true });
        } catch (err) {
          console.error("startChat failed", err);
        }
      },
      stopChat: async () => {
        try {
          const conn: HubConnection | undefined = (window as any).__chatConn;
          if (conn) {
            await conn.stop();
            delete (window as any).__chatConn;
          }
          set({ isChatConnected: false, typingUsers: [] });
        } catch (err) {
          console.error("stopChat failed", err);
        }
      },
      joinConversation: async (conversationId: string) => {
        try {
          const conn: HubConnection | undefined = (window as any).__chatConn;
          if (!conn) return;
          await conn.invoke("JoinConversation", conversationId);
        } catch (err) {
          console.error("joinConversation failed", err);
        }
      },
      leaveConversation: async (conversationId: string) => {
        try {
          const conn: HubConnection | undefined = (window as any).__chatConn;
          if (!conn) return;
          await conn.invoke("LeaveConversation", conversationId);
        } catch (err) {
          console.error("leaveConversation failed", err);
        }
      },
      sendTyping: async (conversationId: string, isTyping: boolean) => {
        try {
          const conn: HubConnection | undefined = (window as any).__chatConn;
          if (!conn) return;
          await conn.invoke("Typing", conversationId, isTyping);
        } catch (err) {
          // not critical
        }
      },
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
      getFilesByConversationId: async (conversationId: string) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.get(
            `/QAConversationFile/conversation/${conversationId}`
          );
          const body = resp.data;
          // body.data expected: array of file records
          set({
            files: body?.data ?? [],
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
      uploadFile: async (conversationId: string, file: File) => {
        set({ isLoading: true });
        try {
          const fd = new FormData();
          fd.append("conversationId", conversationId);
          fd.append("file", file);

          const resp = await axiosInstance.post(
            `/QAConversationFile/upload`,
            fd,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          const body = resp.data;
          // after upload, we can refresh files
          try {
            await (useMessageStore
              .getState()
              .getFilesByConversationId?.(conversationId) as any);
          } catch {
            // ignore
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
      sendMessage: async (message) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.post(`/QAMessage`, message);
          const body = resp.data;
          if (body?.success) {
            set((state: any) => {
              // remove any optimistic temporary messages that match this server message
              const serverId = String(body.data?.id ?? body.data?.Id ?? "");
              const serverContent =
                body.data?.content ?? body.data?.Content ?? "";
              const serverSender = String(
                body.data?.senderId ?? body.data?.SenderId ?? ""
              );

              const filtered = (state.messages || []).filter((m: any) => {
                const mid = String(m.id ?? "");
                // drop temp ids that start with tmp- and match content & sender
                if (
                  mid.startsWith("tmp-") &&
                  (m.content ?? m.Content) === serverContent
                ) {
                  const mSender = String(m.senderId ?? m.SenderId ?? "");
                  if (!mSender || mSender === serverSender) return false; // remove this temp
                }
                // also avoid keeping any duplicate server message if already present
                if (String(m.id) === serverId) return false;
                return true;
              });

              // append server message if not already present
              const exists = filtered.some(
                (m: any) => String(m.id) === serverId
              );
              const next = exists ? filtered : [...filtered, body.data];
              return {
                messages: next,
                success: true,
                message: body?.message ?? "",
              } as any;
            });
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
    }),
    { name: "qa-message-store" }
  )
);
