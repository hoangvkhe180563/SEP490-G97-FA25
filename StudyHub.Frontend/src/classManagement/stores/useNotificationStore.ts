import { axiosInstance } from "@/lib/axios";
import { create } from "zustand";
import * as signalR from "@microsoft/signalr";
import { toast } from "react-hot-toast";
import { createClassConnection } from "@/lib/signalR";

interface NotificationState {
  connection: signalR.HubConnection | null;
  unreadCount: Record<string, number>; // classId -> số thông báo chưa đọc

  connect: () => Promise<void>;
  joinClass: (classId: string) => Promise<void>;
  leaveClass: (classId: string) => Promise<void>;
  markAllAsRead: (classId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  connection: null,
  unreadCount: {},

  connect: async () => {
    if (get().connection) return;

    const connection = createClassConnection();
    // Lắng nghe event khi có thông báo mới
    connection.on("NewNotification", (classId: string, title: string) => {
      set((state) => ({
        unreadCount: {
          ...state.unreadCount,
          [classId]: (state.unreadCount[classId] || 0) + 1,
        },
      }));
      toast.success(`📢 Lớp ${classId} có thông báo mới: ${title}`);
    });

    connection.on("KickedFromClass", async (classId: string) => {
      console.warn(`🚫 You were kicked from class ${classId}`);

      await get().leaveClass(classId);
      set((state) => {
        const newUnread = { ...state.unreadCount };
        delete newUnread[classId];
        return { unreadCount: newUnread };
      });
      toast.error(`Bạn đã bị xoá khỏi lớp ${classId}`);
    });

    await connection.start();
    console.log("✅ Connected to SignalR");
    set({ connection });
  },

  joinClass: async (classId) => {
    const connection = get().connection;
    if (connection) await connection.invoke("JoinClass", classId);
  },

  leaveClass: async (classId) => {
    const connection = get().connection;
    if (connection) await connection.invoke("LeaveClass", classId);
  },

  markAllAsRead: async (classId) => {
    axiosInstance.post(`/Class/${classId}/notifications/read`);

    set((state) => ({
      unreadCount: { ...state.unreadCount, [classId]: 0 },
    }));
  },
}));
