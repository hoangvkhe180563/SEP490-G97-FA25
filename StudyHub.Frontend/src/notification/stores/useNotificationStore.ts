import { axiosInstance } from "@/lib/axios";
import { create } from "zustand";
import type { HubConnection } from "@microsoft/signalr";
import { toast } from "react-hot-toast";
import { createNotificationConnection } from "@/lib/signalR"; // hub thông báo user
import { useAuthStore } from "@/auth/stores/useAuthStore";
import type { NotificationState, NotificationItem, NotificationFetchOptions } from "@/notification/interfaces/notification";
import resolveNotificationLinkString from "@/notification/utils/routeBuilder"; // <- new resolver

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
  base?: string; 
  action?: string; 
  params?: any; 
  perRoleLinks?: Record<string, string>;
  [key: string]: any;
}

type UserNotificationState = NotificationState & {
  connection: HubConnection | null;
  addNewNotificationListener: (fn: (payload: NotificationPayload) => void) => void;
  removeNewNotificationListener: (fn: (payload: NotificationPayload) => void) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  hasFetchedUnread: boolean;
};

// IMPORTANT: pass the StateCreator directly (no extra "()") to avoid TS mismatch
export const useNotificationStore = create<UserNotificationState>((set, get) => {
  const listeners: Set<(payload: NotificationPayload) => void> = new Set();
  const recentIds: Set<string> = new Set();
  const toastedIds: Set<string> = new Set(); // avoid duplicate toasts for same id

  // local helper to count unread from items if needed
  const recalcUnread = (items: NotificationItem[]) =>
    items.reduce((acc, n) => acc + ((n.read?.isRead ?? false) ? 0 : 1), 0);

  const normalizeApiItem = (n: any): NotificationItem => ({
    ...n,
    read: {
      ...(n.read ?? {}),
      isRead: n.isRead ?? n.read?.isRead ?? false,
      readAt: n.readAt ?? n.read?.readAt,
    },
  });

  const getRoleStrings = (): string[] => {
    const authUser = useAuthStore.getState().user;
    if (!authUser) return [];

    const rawRoles = Array.isArray(authUser.roles) ? authUser.roles : [];
    const flattened = rawRoles
      .filter(Boolean)
      .map((r) => String(r).trim().toLowerCase());

    const seen = new Set<string>();
    const unique: string[] = [];
    for (const r of flattened) {
      if (!seen.has(r)) {
        seen.add(r);
        unique.push(r);
      }
    }

    return unique;
  };

  const resolveLinkForPayload = (payload: NotificationPayload, roleStrings: string[]): string | null => {
    if (!payload) return null;

    const hasSchoolAdmin = roleStrings.some((r) => r.includes("school") && r.includes("admin"));
    const hasAdmin = roleStrings.some((r) => r.includes("admin"));
    const hasManager = roleStrings.some((r) => r.includes("manager"));
    const hasTeacher = roleStrings.some((r) => r.includes("teacher"));
    const hasStudent = roleStrings.some((r) => r.includes("student"));

    const isManager = hasSchoolAdmin || hasAdmin || hasManager;

    const perRoleLinks = payload.perRoleLinks ?? payload.metadata?.perRoleLinks;
    if (perRoleLinks && typeof perRoleLinks === "object") {
      if (isManager) {
        const v = perRoleLinks["manager"] ?? perRoleLinks["Manager"] ?? perRoleLinks["MANAGER"];
        if (typeof v === "string" && v.length) return v;
      }
      if (hasTeacher) {
        const v = perRoleLinks["teacher"] ?? perRoleLinks["Teacher"] ?? perRoleLinks["TEACHER"];
        if (typeof v === "string" && v.length) return v;
      }
      if (hasStudent) {
        const v = perRoleLinks["student"] ?? perRoleLinks["Student"] ?? perRoleLinks["STUDENT"];
        if (typeof v === "string" && v.length) return v;
      }
      for (const k of Object.keys(perRoleLinks)) {
        const v = perRoleLinks[k];
        if (!v) continue;
        if (roleStrings.some((r) => r === k.toLowerCase() || r.includes(k.toLowerCase()))) return v;
      }
    }

    const rawLink =
      payload.linkUrl ??
      payload.LinkUrl ??
      payload.metadata?.linkUrl ??
      (payload.metadata && (payload.metadata.linkUrl ?? payload.metadata.LinkUrl)) ??
      null;

    if (rawLink && typeof rawLink === "string") {
      try {
        const resolved = resolveNotificationLinkString(String(rawLink), roleStrings);
        if (resolved) return resolved;
        return String(rawLink).trim() || null;
      } catch (e) {
        console.warn("resolveNotificationLinkString failed", e);
        return String(rawLink).trim() || null;
      }
    }

    return null;
  };

  // Helper: authoritative unread count from server (robust parsing)
  const fetchUnreadFromServer = async (): Promise<number> => {
    try {
      const res = await axiosInstance.get("/notification/me/unread-count");
      const data = res.data ?? {};
      const candidates = [
        data.unread,
        data.Unread,
        data.unreadCount,
        data.UnreadCount,
        data.count,
        data.total,
        data.TotalUnread,
      ];
      for (const c of candidates) {
        if (typeof c === "number" && !Number.isNaN(c)) return Number(c);
        if (typeof c === "string" && !Number.isNaN(Number(c))) return Number(c);
      }
      if (typeof data === "number" && !Number.isNaN(data)) return Number(data);
      if (typeof data === "string" && !Number.isNaN(Number(data))) return Number(data);
      return 0;
    } catch (err) {
      console.warn("fetchUnreadFromServer failed", err);
      return get().unreadCount ?? 0;
    }
  };

  // Helper: update unreadCount in store by fetching authoritative value
  const updateUnreadFromServer = async () => {
    const unread = await fetchUnreadFromServer();
    set({ unreadCount: unread, hasFetchedUnread: true });
    return unread;
  };

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
    hasFetchedUnread: false,

    reset: () =>
      set({
        items: [],
        unreadCount: 0,
        isLoading: false,
        isLoadingMore: false,
        error: null,
        hasMore: true,
        offset: 0,
        hasFetchedUnread: false,
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
        const rawFetched = res.data ?? [];
        const normalized = rawFetched.map(normalizeApiItem);

        const roleStrings = getRoleStrings();
        console.debug("Notifications.fetch - resolving links, roles:", roleStrings);
        const itemsWithLinks = normalized.map((it: any) => {
          const payloadGuess: NotificationPayload = {
            ...it,
            metadata: it.metadata ?? {},
            id: it.id,
            linkUrl: it.linkUrl,
            targetGroupId: it.targetGroupId,
            targetUserId: it.targetUserId,
            base: it.base,
            action: it.action,
            params: it.params,
            perRoleLinks: it.perRoleLinks ?? it.metadata?.perRoleLinks,
          };
          const resolved = resolveLinkForPayload(payloadGuess, roleStrings);
          it.linkUrl = resolved ?? it.linkUrl;
          console.debug("Resolved link for notification", it.id, "->", it.linkUrl);
          return it;
        });

        set((state) => {
          const merged = reset ? itemsWithLinks : [...state.items, ...itemsWithLinks];
          return {
            items: merged,
            offset: reset ? itemsWithLinks.length : state.offset + itemsWithLinks.length,
            hasMore: itemsWithLinks.length === limit,
            isLoading: false,
            isLoadingMore: false,
            // do NOT overwrite authoritative unreadCount here to avoid shrinking when lazy-loading partial pages
            error: null,
          };
        });

        // After fetching a page, refresh authoritative unread count from server
        await updateUnreadFromServer();
      } catch (err: any) {
        set({
          isLoading: false,
          isLoadingMore: false,
          error: err?.message ?? "Fetch notifications failed",
        });
      }
    },

    // match updated NotificationState: optional force, return authoritative number
    fetchUnreadCount: async (force = false) => {
      if (!force && get().hasFetchedUnread) return;
      return updateUnreadFromServer();
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
        // ensure authoritative
        await updateUnreadFromServer();
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
        // ensure authoritative
        await updateUnreadFromServer();
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

      // remove any existing handlers for this event to avoid duplicates
      try {
        connection.off("NotificationCreated");
      } catch (e) {
        // ignore if off not available
      }

      connection.on("NotificationCreated", (payload: NotificationPayload) => {
        try {
          if (!payload) return;
          const id = String(payload.id ?? payload.Id ?? "");
          // Deduplicate by id quickly
          if (id) {
            if (recentIds.has(id)) {
              console.debug("[NotificationCreated] duplicate ignored by recentIds", id);
              return;
            }
            recentIds.add(id);
            if (recentIds.size > 500) {
              // keep recentIds bounded
              const first = recentIds.values().next().value;
              if (first) recentIds.delete(first);
            }
          }

          const roleStrings = getRoleStrings();
          const resolved = resolveLinkForPayload(payload, roleStrings);
          const finalLink = resolved ?? (typeof payload.linkUrl === "string" ? payload.linkUrl : undefined);

          console.debug("[NotificationCreated] payload:", payload, "roles:", roleStrings, "resolvedLink:", finalLink);

          const incomingIsRead = payload.isRead ?? false;

          const item: NotificationItem = {
            id: id || crypto.randomUUID(),
            title: payload.title  ?? "Thông báo mới",
            body: payload.body ?? "",
            targetType: payload.targetType ,
            targetUserId: payload.targetUserId ,
            targetGroupId: payload.targetGroupId ,
            priority: payload.priority ?? payload.Priority,
            isActive: true,
            createdAt: payload.createdAt,
            createdBy: payload.createdBy ,
            metadata: {
              ...(payload.metadata ?? {}),
            },
            linkUrl: finalLink ?? undefined,
            read: { isRead: incomingIsRead, readAt: payload.readAt },
          };

          // notify listeners (external subscribers)
          listeners.forEach((fn) => {
            try {
              fn(payload);
            } catch (e) {
              console.error("notification listener error", e);
            }
          });

          // Merge / dedupe logic with improved unreadCount update:
          set((state) => {
            const existingIndex = state.items.findIndex((it) => it.id === item.id);
            const isNew = existingIndex < 0;

            let nextItems: NotificationItem[];
            let prevItem: NotificationItem | undefined = undefined;
            if (!isNew) {
              // replace existing item
              nextItems = state.items.slice();
              prevItem = nextItems[existingIndex];
              nextItems[existingIndex] = { ...nextItems[existingIndex], ...item };
            } else {
              nextItems = [item, ...state.items];
            }

            const prevUnread = typeof state.unreadCount === "number" ? state.unreadCount : undefined;
            const localUnread = recalcUnread(nextItems);

            let nextUnread: number;

            if (isNew) {
              // If we have an authoritative previous count, increment it (if unread).
              if (typeof prevUnread === "number") {
                nextUnread = prevUnread + (incomingIsRead ? 0 : 1);
              } else {
                // fall back to local calculation
                nextUnread = localUnread;
              }
            } else {
              // existing item: if previously marked read but now incoming is unread, increment
              const prevWasRead = !!(prevItem && (prevItem.read?.isRead ?? false));
              if (prevWasRead && !incomingIsRead) {
                nextUnread = (typeof prevUnread === "number" ? prevUnread : localUnread) + 1;
              } else {
                // otherwise keep previous authoritative if exists, else recalc
                nextUnread = typeof prevUnread === "number" ? prevUnread : localUnread;
              }
            }

            // Ensure non-negative and at least localUnread
            nextUnread = Math.max(0, Math.max(nextUnread, localUnread));

            console.debug("[NotificationCreated] id:", item.id, "isNew:", isNew, "incomingIsRead:", incomingIsRead, "prevUnread:", prevUnread, "localUnread:", localUnread, "nextUnread:", nextUnread);

            return {
              items: nextItems,
              unreadCount: nextUnread,
            };
          });

          // toast once per id (safeguard against duplicate handler or duplicated events)
          if (item.id && !toastedIds.has(item.id)) {
            toastedIds.add(item.id);
            if (toastedIds.size > 500) {
              const first = toastedIds.values().next().value;
              if (first) toastedIds.delete(first);
            }
            const title = item.title ?? "Thông báo mới";
            toast.success(`📢 ${title}`);
          }
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
          // remove handlers to avoid dupes when reconnecting
          try {
            conn.off("NotificationCreated");
          } catch { /* ignore */ }
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