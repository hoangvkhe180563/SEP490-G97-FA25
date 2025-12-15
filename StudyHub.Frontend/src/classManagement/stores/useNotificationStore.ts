import { axiosInstance } from "@/lib/axios";
import { create } from "zustand";
import * as signalR from "@microsoft/signalr";
import type { HubConnection } from "@microsoft/signalr";
import { toast } from "react-hot-toast";
import { createClassConnection } from "@/lib/signalR";
import { useAuthStore } from "@/auth/stores/useAuthStore";

export interface NotificationPayload {
  id?: string;
  Id?: string;
  classId?: string;
  ClassId?: string;
  title?: string;
  Title?: string;
  createdBy?: string;
  appUserId?: string;
  AppUserId?: string;
  [key: string]: any;
}

export interface NotificationState {
  connection: HubConnection | null;
  unreadCount: Record<string, number>; // classId -> số thông báo chưa đọc

  addNewNotificationListener: (fn: (payload: NotificationPayload) => void) => void;
  removeNewNotificationListener: (fn: (payload: NotificationPayload) => void) => void;

  connect: () => Promise<void>;
  joinClass: (classId: string) => Promise<void>;
  leaveClass: (classId: string) => Promise<void>;
  markAllAsRead: (classId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => {
  // in-memory list of registered listeners for NewNotificationFull payloads
  const listeners: Set<(payload: NotificationPayload) => void> = new Set();
  // dedupe set for recently seen notification ids (avoid duplicate toast)
  const recentNotificationIds: Set<string> = new Set();

  return {
    connection: null,
    unreadCount: {},

    addNewNotificationListener: (fn) => {
      listeners.add(fn);
    },

    removeNewNotificationListener: (fn) => {
      listeners.delete(fn);
    },

    connect: async () => {
      if (get().connection) return;

      const connection = createClassConnection();

      // Compact event: only bump unread/snackbar NOT shown here to avoid duplicates
      connection.on("NewNotification", (classId: string, title: string) => {
        try {
          set((state) => ({
            unreadCount: {
              ...state.unreadCount,
              [String(classId)]: (state.unreadCount[String(classId)] || 0) + 1,
            },
          }));
          // do NOT show toast here to avoid duplicate popups
        } catch (err) {
          console.error("NewNotification handler error", err);
        }
      });

      // Full payload: use as single source of truth for showing toast and appending
      connection.on("NewNotificationFull", (payload: NotificationPayload) => {
        try {
          if (!payload) return;
          const id = String(payload.id ?? payload.Id ?? "");
          const cid = String(payload.classId ?? payload.ClassId ?? "");
          if (!id) {
            // fallback: if no id, still notify listeners but avoid toast
            listeners.forEach((fn) => {
              try {
                fn(payload);
              } catch (e) {
                console.error("notification listener error", e);
              }
            });
            // still bump unread (in case NewNotification missed)
            set((state) => ({
              unreadCount: {
                ...state.unreadCount,
                [cid]: (state.unreadCount[cid] || 0) + 1,
              },
            }));
            return;
          }

          // dedupe: skip if we've already processed this notification id recently
          if (recentNotificationIds.has(id)) {
            // still ensure unreadCount updated in case compact event missed
            set((state) => ({
              unreadCount: {
                ...state.unreadCount,
                [cid]: (state.unreadCount[cid] || 0) + 1,
              },
            }));
            return;
          }
          recentNotificationIds.add(id);
          // keep recent set bounded to avoid memory growth
          if (recentNotificationIds.size > 200) {
            const it = recentNotificationIds.values();
            const first = it.next().value;
            if (first) recentNotificationIds.delete(first);
          }

          // bump unread
          set((state) => ({
            unreadCount: {
              ...state.unreadCount,
              [cid]: (state.unreadCount[cid] || 0) + 1,
            },
          }));

          // notify registered UI listeners (so components can append to list)
          listeners.forEach((fn) => {
            try {
              fn(payload);
            } catch (e) {
              console.error("notification listener error", e);
            }
          });

          // toast: avoid showing toast for the creator themselves (they already see local UI)
          const currentUser = useAuthStore.getState().user;
          const createdBy = String(
            payload.createdBy ?? payload.appUserId ?? payload.AppUserId ?? ""
          );
          if (currentUser && String(currentUser.id) === createdBy) {
            // creator: skip toast to avoid duplicate confirmation
            return;
          }

          // show toast for other users (new notification)
          try {
            const title = payload.title ?? payload.Title ?? "Thông báo mới";
            toast.success(`📢 Lớp ${cid} có thông báo mới: ${title}`);
          } catch (tErr) {
            console.warn("toast error", tErr);
          }
        } catch (err) {
          console.error("NewNotificationFull handler error", err);
        }
      });

      // Kicked from class (server may send to a specific user)
      connection.on("KickedFromClass", async (classId: string) => {
        console.warn(`🚫 You were kicked from class ${classId}`);
        try {
          await get().leaveClass(classId);
        } catch (e) {
          console.warn("leaveClass after kicked failed", e);
        }
        set((state) => {
          const copy = { ...state.unreadCount };
          delete copy[classId];
          return { unreadCount: copy };
        });
        toast.error(`Bạn đã bị xoá khỏi lớp ${classId}`);
      });

      connection.on("NotificationCountUpdated", (payload: any) => {
        try {
          const classId = String(payload?.classId ?? payload?.ClassId ?? "");
          const unread = Number(payload?.unreadCount ?? payload?.UnreadCount ?? 0);
          set((state) => ({ unreadCount: { ...state.unreadCount, [classId]: unread } }));
        } catch (err) {
          console.error("NotificationCountUpdated handler error", err);
        }
      });

      connection.onreconnected(async () => {
        try {
          const classes = Object.keys(get().unreadCount || {});
          for (const cid of classes) {
            try {
              await get().joinClass(cid);
            } catch (e) {
              console.warn("rejoin class after reconnect failed", cid, e);
            }
          }
        } catch (e) {
          console.warn("onreconnected handler error", e);
        }
      });

      try {
        await connection.start();
        console.log("✅ Connected to SignalR (class notifications)");
        set({ connection });
      } catch (err) {
        console.error("SignalR start failed", err);
        throw err;
      }
    },

    joinClass: async (classId) => {
      const connection = get().connection;
      if (connection) {
        try {
          await connection.invoke("JoinClass", String(classId));
        } catch (err) {
          console.error("joinClass invoke failed", err);
        }
      }
    },

    leaveClass: async (classId) => {
      const connection = get().connection;
      if (connection) {
        try {
          await connection.invoke("LeaveClass", String(classId));
        } catch (err) {
          console.error("leaveClass invoke failed", err);
        }
      }
    },

    markAllAsRead: async (classId) => {
      try {
        await axiosInstance.post(`/Class/${classId}/notifications/read`);
      } catch (err) {
        console.warn("markAllAsRead API failed", err);
      }
      set((state) => ({ unreadCount: { ...state.unreadCount, [String(classId)]: 0 } }));
    },
  };
});