import { axiosInstance } from "@/lib/axios";
import { create } from "zustand";
import type { HubConnection } from "@microsoft/signalr";
import { toast } from "react-hot-toast";
import { createClassConnection } from "@/lib/signalR";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import type { NotificationState, NotificationItem } from "@/notification/interfaces/notification";

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

// Mở rộng NotificationState (from interface/notification.ts) cho hub class
type ClassNotificationState = NotificationState & {
  connection: HubConnection | null;
  unreadCountByClass: Record<string, number>;
  addNewNotificationListener: (fn: (payload: NotificationPayload) => void) => void;
  removeNewNotificationListener: (fn: (payload: NotificationPayload) => void) => void;
  connect: () => Promise<void>;
  joinClass: (classId: string) => Promise<void>;
  leaveClass: (classId: string) => Promise<void>;
  markAllAsRead: (classId: string) => Promise<void>;
};

export const useNotificationStore = create<ClassNotificationState>((set, get) => {
  const listeners: Set<(payload: NotificationPayload) => void> = new Set();
  const recentNotificationIds: Set<string> = new Set();

  // helper: cập nhật unreadCount (tổng) từ map
  const recalcTotal = (map: Record<string, number>) =>
    Object.values(map || {}).reduce((sum, v) => sum + (Number.isFinite(v) ? Number(v) : 0), 0);

  return {
    // NotificationState fields
    items: [] as NotificationItem[],
    unreadCount: 0,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasMore: true,
    limit: 20,
    offset: 0,
    isNotificationConnected: false,

    reset: () =>
      set({
        items: [],
        unreadCount: 0,
        isLoading: false,
        isLoadingMore: false,
        error: null,
        hasMore: true,
        offset: 0,
      }),
    startNotification: async () => {
      // dùng hub class, tương đương connect()
      await get().connect();
      set({ isNotificationConnected: true });
    },
    stopNotification: async () => {
      const conn = get().connection;
      if (conn) {
        try {
          await conn.stop();
        } catch {
          /* ignore */
        }
      }
      set({ connection: null, isNotificationConnected: false });
    },
    joinGroup: async (groupId: number) => {
      await get().joinClass(String(groupId));
    },
    leaveGroup: async (groupId: number) => {
      await get().leaveClass(String(groupId));
    },
    fetchNotifications: async () => {
      // không triển khai danh sách chi tiết trong hub class; giữ items rỗng
      return;
    },
    fetchUnreadCount: async () => {
      // có thể gọi API khác nếu cần; hiện tính tổng từ map
      set((state) => ({ unreadCount: recalcTotal(state.unreadCountByClass) }));
    },
    markRead: async (id: string) => {
      // không có API mark read từng thông báo ở hub class; bỏ qua
      return;
    },
    markReadBulk: async () => {
      // không áp dụng
      return;
    },
    loadMore: async () => {
      // không áp dụng
      return;
    },

    // Extended fields
    connection: null,
    unreadCountByClass: {},

    addNewNotificationListener: (fn) => {
      listeners.add(fn);
    },

    removeNewNotificationListener: (fn) => {
      listeners.delete(fn);
    },

    connect: async () => {
      if (get().connection) return;

      const connection = createClassConnection();

      connection.on("NewNotification", (classId: string) => {
        try {
          set((state) => {
            const nextMap = {
              ...state.unreadCountByClass,
              [String(classId)]: (state.unreadCountByClass[String(classId)] || 0) + 1,
            };
            return {
              unreadCountByClass: nextMap,
              unreadCount: recalcTotal(nextMap),
            };
          });
        } catch (err) {
          console.error("NewNotification handler error", err);
        }
      });

      connection.on("NewNotificationFull", (payload: NotificationPayload) => {
        try {
          if (!payload) return;
          const id = String(payload.id ?? payload.Id ?? "");
          const cid = String(payload.classId ?? payload.ClassId ?? "");

          if (!id) {
            listeners.forEach((fn) => {
              try {
                fn(payload);
              } catch (e) {
                console.error("notification listener error", e);
              }
            });
            set((state) => {
              const nextMap = {
                ...state.unreadCountByClass,
                [cid]: (state.unreadCountByClass[cid] || 0) + 1,
              };
              return { unreadCountByClass: nextMap, unreadCount: recalcTotal(nextMap) };
            });
            return;
          }

          if (recentNotificationIds.has(id)) {
            set((state) => {
              const nextMap = {
                ...state.unreadCountByClass,
                [cid]: (state.unreadCountByClass[cid] || 0) + 1,
              };
              return { unreadCountByClass: nextMap, unreadCount: recalcTotal(nextMap) };
            });
            return;
          }
          recentNotificationIds.add(id);
          if (recentNotificationIds.size > 200) {
            const it = recentNotificationIds.values();
            const first = it.next().value;
            if (first) recentNotificationIds.delete(first);
          }

          set((state) => {
            const nextMap = {
              ...state.unreadCountByClass,
              [cid]: (state.unreadCountByClass[cid] || 0) + 1,
            };
            return { unreadCountByClass: nextMap, unreadCount: recalcTotal(nextMap) };
          });

          listeners.forEach((fn) => {
            try {
              fn(payload);
            } catch (e) {
              console.error("notification listener error", e);
            }
          });

          const currentUser = useAuthStore.getState().user;
          const createdBy = String(payload.createdBy ?? payload.appUserId ?? payload.AppUserId ?? "");
          if (currentUser && String(currentUser.id) === createdBy) return;

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

      connection.on("KickedFromClass", async (classId: string) => {
        console.warn(`🚫 You were kicked from class ${classId}`);
        try {
          await get().leaveClass(classId);
        } catch (e) {
          console.warn("leaveClass after kicked failed", e);
        }
        set((state) => {
          const copy = { ...state.unreadCountByClass };
          delete copy[classId];
          return { unreadCountByClass: copy, unreadCount: recalcTotal(copy) };
        });
        toast.error(`Bạn đã bị xoá khỏi lớp ${classId}`);
      });

      connection.on("NotificationCountUpdated", (payload: any) => {
        try {
          const classId = String(payload?.classId ?? payload?.ClassId ?? "");
          const unread = Number(payload?.unreadCount ?? payload?.UnreadCount ?? 0);
          set((state) => {
            const nextMap = { ...state.unreadCountByClass, [classId]: unread };
            return { unreadCountByClass: nextMap, unreadCount: recalcTotal(nextMap) };
          });
        } catch (err) {
          console.error("NotificationCountUpdated handler error", err);
        }
      });

      connection.onreconnected(async () => {
        try {
          const classes = Object.keys(get().unreadCountByClass || {});
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
        set({ connection, isNotificationConnected: true });
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
      set((state) => {
        const nextMap = { ...state.unreadCountByClass, [String(classId)]: 0 };
        return { unreadCountByClass: nextMap, unreadCount: recalcTotal(nextMap) };
      });
    },
  };
});