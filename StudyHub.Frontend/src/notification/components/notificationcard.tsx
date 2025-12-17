import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import type { NotificationItem } from "../interfaces/notification";

interface Props {
  item: NotificationItem;
  onMarkRead?: (id: string) => void;
}

const priorityColor: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  high: "destructive",
  normal: "default",
  low: "secondary",
};

export const NotificationCard: React.FC<Props> = ({ item, onMarkRead }) => {
  const isRead = item.read?.isRead === true;
  const variant = priorityColor[item.priority?.toLowerCase?.() ?? ""] ?? "outline";
  const createdAt = item.createdAt ? new Date(item.createdAt) : null;

  const link = item.linkUrl ?? (item.metadata && (item.metadata.linkUrl ?? item.metadata.LinkUrl)) ?? null;

  const handleOpenLink = (e?: React.MouseEvent) => {
    // nếu gọi từ button/link con, cho phép mặc định xử lý
    try {
      if (!isRead && onMarkRead) {
        onMarkRead(item.id);
      }
    } catch {
      // ignore
    }

    if (!link) return;

    // nếu là đường dẫn nội bộ (bắt đầu bằng '/'), chuyển trong cùng tab
    if (String(link).startsWith("/")) {
      window.location.assign(String(link));
    } else {
      // mở ở tab mới cho url đầy đủ
      try {
        window.open(String(link), "_blank", "noopener,noreferrer");
      } catch {
        // fallback
        window.location.assign(String(link));
      }
    }
    // ngăn hành vi mặc định nếu cần
    e?.preventDefault();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpenLink();
    }
  };

  return (
    <Card
      className={`group ${isRead ? "bg-muted/40" : "hover:shadow-md"} cursor-pointer`}
      role={link ? "button" : undefined}
      tabIndex={link ? 0 : undefined}
      onClick={() => handleOpenLink()}
      onKeyDown={handleKey}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {createdAt ? createdAt.toLocaleString() : "—"}
          </CardDescription>
        </div>
        <Badge variant={variant} className="capitalize">
          {item.priority ?? "Normal"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground">{item.body}</p>

        {/* Nếu vẫn muốn nút/anchor riêng cho link (vừa để click vừa để copy target),
            giữ onClick trên toàn thẻ nhưng anchor vẫn có thể dừng propagation nếu cần */}
        

        {!isRead && onMarkRead && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(item.id);
            }}
          >
            Đánh dấu đã đọc
          </Button>
        )}
      </CardContent>
    </Card>
  );
};