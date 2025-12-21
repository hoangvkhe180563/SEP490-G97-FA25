import React, { useEffect, useMemo, useState } from "react";
import { useNotificationStore } from "../stores/useNotificationStore";
import { NotificationCard } from "../components/notificationcard";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { Switch } from "@/common/components/ui/switch";
import { Label } from "@/common/components/ui/label";
import { Separator } from "@/common/components/ui/separator";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/common/components/ui/alert";

const ListNotifications: React.FC = () => {
  const {
    items,
    unreadCount,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markReadBulk,
    loadMore,
    reset,
    startNotification,
    stopNotification,
    isNotificationConnected,
  } = useNotificationStore();

  const [includeRead, setIncludeRead] = useState(true);

  // IDs of unread notifications
  const unreadIds = useMemo(
    () => items.filter((n) => !(n.read?.isRead ?? false)).map((n) => n.id),
    [items]
  );

  // Sort items: unread first (preserve newest-first within groups).
  const sortedItems = useMemo(() => {
    // Copy to avoid mutating store array
    const copy = (items ?? []).slice();

    // Helper to get epoch ms for createdAt (safe)
    const ts = (it: any) => {
      const v = it?.createdAt ?? it?.CreatedAt ?? "";
      const t = Date.parse(String(v));
      return Number.isFinite(t) ? t : 0;
    };

    copy.sort((a, b) => {
      const aRead = Boolean(a.read?.isRead);
      const bRead = Boolean(b.read?.isRead);

      if (aRead === bRead) {
        // same read status -> sort by createdAt desc (newest first)
        const ta = ts(a);
        const tb = ts(b);
        return tb - ta;
      }

      // unread (isRead === false) should come before read (isRead === true)
      return aRead ? 1 : -1;
    });

    return copy;
  }, [items]);

  useEffect(() => {
    // Start SignalR + fetch initial
    startNotification();
    reset();
    fetchNotifications({ includeRead, reset: true });
    fetchUnreadCount();

    return () => {
      stopNotification();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Re-fetch when toggling includeRead
    reset();
    fetchNotifications({ includeRead, reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeRead]);

  const handleMarkAll = async () => {
    if (!unreadIds.length) return;
    await markReadBulk(unreadIds);
  };

  return (
    <div className="flex flex-col gap-4 p-4 w-full h-full overflow-y-auto">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Thông báo</h2>
          <Badge variant="secondary">Chưa đọc: {unreadCount}</Badge>
          {isNotificationConnected && (
            <Badge variant="outline" className="text-green-600">
              ● Realtime
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="include-read"
              checked={includeRead}
              onCheckedChange={(checked) => setIncludeRead(checked)}
            />
            <Label htmlFor="include-read" className="text-sm">
              Hiện cả đã đọc
            </Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={!unreadIds.length}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      )}

      <div className="flex flex-col gap-3">
        {sortedItems.map((n) => {
          return (
            <div key={n.id} className="flex flex-col gap-1">
              <NotificationCard item={n} onMarkRead={markRead} />
            </div>
          );
        })}
      </div>

      {hasMore && (
        <Button
          onClick={loadMore}
          disabled={isLoadingMore}
          variant="outline"
          className="self-start"
        >
          {isLoadingMore ? "Đang tải..." : "Tải thêm"}
        </Button>
      )}
    </div>
  );
};

export default ListNotifications;