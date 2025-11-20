// src/forumManagement/stores/useForumSignalRStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { HubConnection } from "@microsoft/signalr";
import { createForumFuncConnection } from "@/lib/signalR";

interface ForumSignalRState {
  isForumConnected: boolean;
  typingUsers: Array<{ postId: number; userId: string; isTyping: boolean }>;

  startForum: () => Promise<void>;
  stopForum: () => Promise<void>;
  joinSchoolForum: (schoolId: number) => Promise<void>;
  leaveSchoolForum: (schoolId: number) => Promise<void>;
  joinPost: (postId: number) => Promise<void>;
  leavePost: (postId: number) => Promise<void>;
  sendTyping: (postId: number, isTyping: boolean) => Promise<void>;

  onReceiveNewPost?: (dto: any) => void;
  onReceiveNewComment?: (dto: any) => void;
  onCommentDeleted?: (commentId: number) => void;
  onPostUpdated?: (dto: any) => void;
  onPostDeleted?: (postId: number) => void;
  onCommentUpdated?: (dto: any) => void;
  onUserTyping?: (payload: any) => void;
}

export const useForumSignalRStore = create<ForumSignalRState>()(
  devtools(
    (set, get) => ({
      isForumConnected: false,
      typingUsers: [],

      startForum: async () => {
        try {
          const existingConn = (window as any).__forumConn;

          if (existingConn?.state === "Connected") {
            set({ isForumConnected: true });
            return;
          }

          if (existingConn?.state === "Connecting") {
            await new Promise((resolve) => {
              const checkInterval = setInterval(() => {
                if (existingConn.state === "Connected") {
                  clearInterval(checkInterval);
                  set({ isForumConnected: true });
                  resolve(true);
                }
              }, 100);
              setTimeout(() => {
                clearInterval(checkInterval);
                resolve(false);
              }, 5000);
            });
            return;
          }

          if (existingConn) {
            try {
              await existingConn.stop();
              await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (e) {
              console.log("Error stopping old connection:", e);
            }
            delete (window as any).__forumConn;
          }

          const conn: HubConnection = createForumFuncConnection();
          (window as any).__forumConn = conn;

          conn.onclose(async (error) => {
            console.log("SignalR disconnected:", error);
            set({ isForumConnected: false, typingUsers: [] });
            delete (window as any).__forumConn;
          });

          conn.on("ReceiveNewPost", (dto: any) => {
            const handler = get().onReceiveNewPost;
            if (handler) handler(dto);
          });

          conn.on("ReceiveNewComment", (dto: any) => {
            const handler = get().onReceiveNewComment;
            if (handler) handler(dto);
          });

          conn.on("CommentDeleted", (commentId: number) => {
            const handler = get().onCommentDeleted;
            if (handler) handler(commentId);
          });

          conn.on("PostUpdated", (dto: any) => {
            console.log("PostUpdated signal received:", dto);
            const handler = get().onPostUpdated;
            if (handler) handler(dto);
          });

          conn.on("PostDeleted", (postId: number) => {
            const handler = get().onPostDeleted;
            if (handler) handler(postId);
          });

          conn.on("CommentUpdated", (dto: any) => {
            const handler = get().onCommentUpdated;
            if (handler) handler(dto);
          });

          conn.on("UserTyping", (payload: any) => {
            try {
              set((state) => {
                const list = state.typingUsers.filter(
                  (t) =>
                    t.postId !== payload?.postId || t.userId !== payload?.userId
                );
                if (payload?.isTyping) {
                  list.push({
                    postId: payload?.postId,
                    userId: payload?.userId,
                    isTyping: true,
                  });
                }
                return { typingUsers: list };
              });
            } catch (err) {
              console.error("UserTyping handler error", err);
            }
          });

          await conn.start();
          set({ isForumConnected: true });
          console.log("Forum connection started successfully");
        } catch (error) {
          console.error("Failed to start forum connection:", error);
          const existingConn = (window as any).__forumConn;
          if (existingConn) {
            try {
              await existingConn.stop();
            } catch (e) {
              console.error("Error stopping connection after failure:", e);
            }
          }
          delete (window as any).__forumConn;
          set({ isForumConnected: false, typingUsers: [] });
        }
      },

      stopForum: async () => {
        const conn: HubConnection | undefined = (window as any).__forumConn;
        if (conn) {
          try {
            await conn.stop();
          } catch (e) {
            console.error("Error stopping connection:", e);
          }
          delete (window as any).__forumConn;
        }
        set({ isForumConnected: false, typingUsers: [] });
      },

      joinSchoolForum: async (schoolId: number) => {
        const conn: HubConnection | undefined = (window as any).__forumConn;
        if (!conn || conn.state !== "Connected") {
          console.warn("Connection not ready for joinSchoolForum");
          return;
        }
        try {
          await conn.invoke("JoinSchoolForum", schoolId);
          console.log(`Joined school forum: ${schoolId}`);
        } catch (err) {
          console.error("Error joining school forum:", err);
        }
      },

      leaveSchoolForum: async (schoolId: number) => {
        const conn: HubConnection | undefined = (window as any).__forumConn;
        if (!conn) return;
        try {
          await conn.invoke("LeaveSchoolForum", schoolId);
          console.log(`Left school forum: ${schoolId}`);
        } catch (err) {
          console.error("Error leaving school forum:", err);
        }
      },

      joinPost: async (postId: number) => {
        const conn: HubConnection | undefined = (window as any).__forumConn;
        if (!conn || conn.state !== "Connected") {
          console.warn("Connection not ready for joinPost");
          return;
        }
        try {
          await conn.invoke("JoinPost", postId);
          console.log(`Joined post: ${postId}`);
        } catch (err) {
          console.error("Error joining post:", err);
        }
      },

      leavePost: async (postId: number) => {
        const conn: HubConnection | undefined = (window as any).__forumConn;
        if (!conn || conn.state !== "Connected") {
          console.warn("Connection not ready for leavePost");
          return;
        }
        try {
          await conn.invoke("LeavePost", postId);
          console.log(`Left post: ${postId}`);
        } catch (err) {
          console.error("Error leaving post:", err);
        }
      },

      sendTyping: async (postId: number, isTyping: boolean) => {
        const conn: HubConnection | undefined = (window as any).__forumConn;
        if (!conn || conn.state !== "Connected") return;
        try {
          await conn.invoke("TypingInPost", postId, isTyping);
        } catch (err) {
          // Not critical, just log
          console.debug("Error sending typing status:", err);
        }
      },
    }),
    { name: "forum-signalr-store" }
  )
);
