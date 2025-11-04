import { create } from "zustand";
import type { UserOnlineState } from "../interfaces/stores";
import { devtools } from "zustand/middleware";
import type { HubConnection } from "@microsoft/signalr";
import { createPresenceConnection } from "@/lib/signalR";
import type { UserOnline } from "../interfaces/user-online";

export const useUserOnlineStore = create<UserOnlineState>()(
  devtools(
    (set) => ({
      onlineCount: 0,
      onlineUsers: [],
      isPresenceConnected: false,
      // presence connection (module-level)
      startPresence: async () => {
        try {
          // lazy module-level connection
          if ((window as any).__presenceConn) return;
          const conn: HubConnection = createPresenceConnection();
          (window as any).__presenceConn = conn;
          const normalize = (arr: any[]): UserOnline[] =>
            (arr || []).map((u: any) => ({
              userId: String(u?.userId ?? u?.UserId ?? u?.id ?? u?.Id ?? "")
                .toLowerCase()
                .trim(),
              fullName: u?.fullName ?? u?.FullName ?? u?.displayName ?? "",
              roles: u?.roles ?? u?.Roles ?? [],
              isOnline: u?.isOnline === true,
              lastSeen: u?.lastSeen ?? u?.LastSeen ?? null,
            }));

          conn.on("PresenceChanged", (data: any) => {
            set({ onlineUsers: normalize(data ?? []) });
          });
          conn.on("OnlineCount", (c: number) => {
            set({ onlineCount: c });
          });
          conn.on("OnlineUsers", (data: any) => {
            set({ onlineUsers: normalize(data ?? []) });
          });

          await conn.start();
          set({ isPresenceConnected: true });
          // request initial values
          try {
            await conn.invoke("GetOnlineCount");
            // server may return raw objects — we listen on OnlineUsers handler which will normalize
            await conn.invoke("GetOnlineUsers");
          } catch (err) {
            // not critical — server might not implement these on older deployments
            console.warn("initial presence invoke failed", err);
          }
        } catch (err) {
          console.error("presence start failed", err);
        }
      },
      stopPresence: async () => {
        try {
          const conn: HubConnection | undefined = (window as any)
            .__presenceConn;
          if (conn) {
            await conn.stop();
            delete (window as any).__presenceConn;
          }
          set({ isPresenceConnected: false, onlineUsers: [], onlineCount: 0 });
        } catch (err) {
          console.error("presence stop failed", err);
        }
      },
    }),
    { name: "user-online-store" }
  )
);
