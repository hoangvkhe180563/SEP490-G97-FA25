import { axiosInstance } from "@/lib/axios";
import { create } from "zustand";
import type { HubConnection } from "@microsoft/signalr";
import { toast } from "react-hot-toast";
import { createNotificationConnection } from "@/lib/signalR"; // hub thông báo user
import { useAuthStore } from "@/auth/stores/useAuthStore";
import type { NotificationState, NotificationItem, NotificationFetchOptions } from "@/notification/interfaces/notification";

export interface NotificationPayload {
  id?: string;
  Id?: string;
  title?: string;
  Title?: string;
  body?: string;
  Body?: string;
  targetType?: string;
  TargetType?: string;
  targetUserId?: string;
  TargetUserId?: string;
  targetGroupId?: number | string;
  TargetGroupId?: number | string;
  createdAt?: string;
  CreatedAt?: string;
  createdBy?: string;
  appUserId?: string;
  AppUserId?: string;
  isRead?: boolean;
  readAt?: string;
  metadata?: any;
  priority?: string;
  Priority?: string;
  [key: string]: any;
}

type UserNotificationState = NotificationState & {
  connection: HubConnection | null;
  addNewNotificationListener: (fn: (payload: NotificationPayload) => void) => void;
  removeNewNotificationListener: (fn: (payload: NotificationPayload) => void) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

export const useNotificationStore = create<UserNotificationState>()((set, get) => {
  const listeners: Set<(payload: NotificationPayload) => void> = new Set();
  const recentIds: Set<string> = new Set();

  const recalcUnread = (items: NotificationItem[]) =>
    items.filter((n) => !(n.read?.isRead ?? false)).length;

  const normalizeApiItem = (n: any): NotificationItem => ({
    ...n,
    read: {
      ...(n.read ?? {}),
      isRead: n.isRead ?? n.read?.isRead ?? false,
      readAt: n.readAt ?? n.read?.readAt,
    },
  });

  return {
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
      await get().connect();
      set({ isNotificationConnected: true });
    },

    stopNotification: async () => {
      await get().disconnect();
      set({ isNotificationConnected: false });
    },

    fetchNotifications: async (opts?: NotificationFetchOptions) => {
      const includeRead = opts?.includeRead ?? false;
      const reset = opts?.reset ?? false;

      if (reset) {
        set({ isLoading: true, error: null, offset: 0 });
      } else {
        set({ isLoadingMore: true, error: null });
      }

      const limit = get().limit;
      const offset = reset ? 0 : get().offset;

      try {
        const res = await axiosInstance.get<NotificationItem[]>("/notification/me", {
          params: { includeRead, limit, offset },
        });
        const fetched = (res.data ?? []).map(normalizeApiItem);
        set((state) => {
          const merged = reset ? fetched : [...state.items, ...fetched];
          return {
            items: merged,
            offset: reset ? fetched.length : state.offset + fetched.length,
            hasMore: fetched.length === limit,
            isLoading: false,
            isLoadingMore: false,
            unreadCount: recalcUnread(merged),
            error: null,
          };
        });
      } catch (err: any) {
        set({
          isLoading: false,
          isLoadingMore: false,
          error: err?.message ?? "Fetch notifications failed",
        });
      }
    },

    fetchUnreadCount: async () => {
      try {
        const res = await axiosInstance.get<{ Unread: number }>("/notification/me/unread-count");
        set({ unreadCount: Number(res.data?.Unread ?? 0) });
      } catch (err) {
        console.warn("fetchUnreadCount failed", err);
      }
    },

    markRead: async (id: string) => {
      try {
        await axiosInstance.post(`/notification/${id}/mark-read`);
        set((state) => {
          const next = state.items.map((n) =>
            n.id === id ? { ...n, read: { ...(n.read ?? {}), isRead: true } } : n
          );
          return { items: next, unreadCount: recalcUnread(next) };
        });
      } catch (err) {
        console.warn("markRead failed", err);
      }
    },

    markReadBulk: async (ids: string[]) => {
      if (!ids?.length) return;
      try {
        await axiosInstance.post(`/notification/mark-read-bulk`, { ids });
        set((state) => {
          const setIds = new Set(ids);
          const next = state.items.map((n) =>
            setIds.has(n.id) ? { ...n, read: { ...(n.read ?? {}), isRead: true } } : n
          );
          return { items: next, unreadCount: recalcUnread(next) };
        });
      } catch (err) {
        console.warn("markReadBulk failed", err);
      }
    },

    loadMore: async () => {
      if (!get().hasMore || get().isLoadingMore) return;
      await get().fetchNotifications({ includeRead: true, reset: false });
    },

    joinGroup: async (groupId: number) => {
      const conn = get().connection;
      if (conn) {
        try {
          await conn.invoke("JoinGroup", groupId);
        } catch (err) {
          console.error("JoinGroup invoke failed", err);
        }
      }
    },

    leaveGroup: async (groupId: number) => {
      const conn = get().connection;
      if (conn) {
        try {
          await conn.invoke("LeaveGroup", groupId);
        } catch (err) {
          console.error("LeaveGroup invoke failed", err);
        }
      }
    },

    connection: null,

    addNewNotificationListener: (fn) => {
      listeners.add(fn);
    },

    removeNewNotificationListener: (fn) => {
      listeners.delete(fn);
    },

    connect: async () => {
      if (get().connection) return;

      const connection = createNotificationConnection();

      connection.on("NotificationCreated", (payload: NotificationPayload) => {
        try {
          if (!payload) return;
          const id = String(payload.id ?? payload.Id ?? "");
          if (id) {
            if (recentIds.has(id)) return;
            recentIds.add(id);
            if (recentIds.size > 200) {
              const first = recentIds.values().next().value;
              if (first) recentIds.delete(first);
            }
          }

          const item: NotificationItem = {
            id: id || crypto.randomUUID(),
            title: payload.title ?? payload.Title ?? "Thông báo mới",
            body: payload.body ?? payload.Body ?? "",
            targetType: payload.targetType ?? payload.TargetType,
            targetUserId: payload.targetUserId ?? payload.TargetUserId,
            targetGroupId: payload.targetGroupId ?? payload.TargetGroupId,
            priority: payload.priority ?? payload.Priority,
            isActive: true,
            createdAt: payload.createdAt ?? payload.CreatedAt ?? new Date().toISOString(),
            createdBy: payload.createdBy ?? payload.appUserId ?? payload.AppUserId,
            metadata: payload.metadata,
            read: { isRead: payload.isRead ?? false, readAt: payload.readAt },
          };

          listeners.forEach((fn) => {
            try {
              fn(payload);
            } catch (e) {
              console.error("notification listener error", e);
            }
          });

          set((state) => {
            const nextItems = [item, ...state.items];
            return {
              items: nextItems,
              unreadCount: recalcUnread(nextItems),
            };
          });

          const title = item.title ?? "Thông báo mới";
          toast.success(`📢 ${title}`);
        } catch (err) {
          console.error("NotificationCreated handler error", err);
        }
      });

      connection.onreconnected(async () => {
        const user = useAuthStore.getState().user;
        if (user?.id) {
          try {
            await connection.invoke("JoinUser", String(user.id));
          } catch (e) {
            console.warn("JoinUser after reconnect failed", e);
          }
        }
      });

      try {
        await connection.start();
        const user = useAuthStore.getState().user;
        if (user?.id) {
          try {
            await connection.invoke("JoinUser", String(user.id));
          } catch (e) {
            console.warn("JoinUser invoke failed", e);
          }
        }
        console.log("✅ Connected to SignalR (user notifications)");
        set({ connection, isNotificationConnected: true });
      } catch (err) {
        console.error("SignalR start failed", err);
        throw err;
      }
    },

    disconnect: async () => {
      const conn = get().connection;
      if (conn) {
        try {
          await conn.stop();
        } catch {
          /* ignore */
        }
      }
      set({ connection: null });
    },

    markAllAsRead: async () => {
      try {
        await axiosInstance.post(`/notifications/read-all`);
      } catch (err) {
        console.warn("markAllAsRead API failed", err);
      }
      set((state) => {
        const next = state.items.map((n) => ({ ...n, read: { ...(n.read ?? {}), isRead: true } }));
        return { items: next, unreadCount: 0 };
      });
    },
  };
});