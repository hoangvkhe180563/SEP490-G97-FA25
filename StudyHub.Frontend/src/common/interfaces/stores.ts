import type { UserOnline } from "./user-online";

interface UserOnlineState {
  // presence
  onlineCount: number;
  onlineUsers: UserOnline[];
  isPresenceConnected: boolean;
  startPresence: () => Promise<void>;
  stopPresence: () => Promise<void>;
  getUserStatus: (userId: string) => Promise<any | null>;
}
export type { UserOnlineState };
