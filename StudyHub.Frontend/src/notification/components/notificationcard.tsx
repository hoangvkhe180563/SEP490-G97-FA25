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

  return (
    <Card className={isRead ? "bg-muted/40" : ""}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {createdAt ? createdAt.toLocaleString() : "—"}
          </CardDescription>
        </div>
        <Badge variant={variant} className="capitalize">
          {item.priority}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground">{item.body}</p>
        {item.linkUrl && (
          <a
            href={item.linkUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Xem chi tiết
          </a>
        )}
        {!isRead && onMarkRead && (
          <Button variant="outline" size="sm" onClick={() => onMarkRead(item.id)}>
            Đánh dấu đã đọc
          </Button>
        )}
      </CardContent>
    </Card>
  );
};