interface UserOnline {
  userId: string;
  fullName?: string;
  roles?: string[];
  isOnline: boolean;
  // ISO string or null when currently online (server may send null to indicate "now")
  lastSeen?: string | null;
}

export type { UserOnline };
