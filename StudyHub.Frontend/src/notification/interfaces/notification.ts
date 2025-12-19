export interface  NotificationItem {
  id: string;
  title: string;
  body: string;
  linkUrl?: string;
  targetType?: string;
  targetUserId?: string | number;
  targetGroupId?: string | number;
  targetRoleId?: string | number;
  priority?: string;
  isActive?: boolean;
  expiresAt?: string;
  createdAt?: string;
  createdBy?: string;
  metadata?: any;
  read?: any;
}

export interface NotificationFetchOptions {
  includeRead?: boolean;
  reset?: boolean;
}

export interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  limit: number;
  offset: number;
  isNotificationConnected: boolean;
  hasFetchedUnread: boolean,
  reset: () => void;
  startNotification: () => Promise<void>;
  stopNotification: () => Promise<void>;
  joinGroup: (groupId: number) => Promise<void>;
  leaveGroup: (groupId: number) => Promise<void>;
  fetchNotifications: (opts?: NotificationFetchOptions) => Promise<void>;
  fetchUnreadCount: (force?: boolean) => Promise<number | void>;
  markRead: (id: string) => Promise<void>;
  markReadBulk: (ids: string[]) => Promise<void>;
  loadMore: () => Promise<void>;
}