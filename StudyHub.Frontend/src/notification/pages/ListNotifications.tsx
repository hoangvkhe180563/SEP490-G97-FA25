import React, { useEffect, useMemo, useState } from "react";
import { useNotificationStore } from "../stores/useNotificationStore";
import { NotificationCard } from "../components/notificationcard";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { Switch } from "@/common/components/ui/switch";
import { Label } from "@/common/components/ui/label";
import { Separator } from "@/common/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/common/components/ui/alert";

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

  const unreadIds = useMemo(
    () => items.filter((n) => !(n.read?.isRead ??  false)).map((n) => n.id),
    [items]
  );

  useEffect(() => {
  // Start SignalR connection
  startNotification();

  // Initial fetch
  reset();
  fetchNotifications({ includeRead, reset: true });
  fetchUnreadCount();

  // Cleanup
  return () => {
    stopNotification();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Chỉ chạy 1 lần khi mount

useEffect(() => {
  // Re-fetch khi toggle includeRead
  reset();
  fetchNotifications({ includeRead, reset: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [includeRead]); // Chỉ phụ thuộc includeRead

  useEffect(() => {
    // Re-fetch khi toggle includeRead
    reset();
    fetchNotifications({ includeRead, reset: true });
  }, [includeRead]);

  const handleMarkAll = async () => {
    if (!unreadIds.length) return;
    await markReadBulk(unreadIds);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
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
          <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={!unreadIds.length}>
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

      {isLoading && <div className="text-sm text-muted-foreground">Đang tải...</div>}

      <div className="flex flex-col gap-3">
        {items.map((n) => (
          <NotificationCard key={n.id} item={n} onMarkRead={markRead} />
        ))}
      </div>

      {hasMore && (
        <Button onClick={loadMore} disabled={isLoadingMore} variant="outline" className="self-start">
          {isLoadingMore ? "Đang tải..." : "Tải thêm"}
        </Button>
      )}
      {!hasMore && !isLoading && (
        <div className="text-sm text-muted-foreground">Hết dữ liệu</div>
      )}
    </div>
  );
};

export default ListNotifications;