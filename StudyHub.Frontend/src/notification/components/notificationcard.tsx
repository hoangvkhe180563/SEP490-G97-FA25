import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import type { NotificationItem } from "../interfaces/notification";

interface Props {
  item: NotificationItem;
  onMarkRead?: (id: string) => void | Promise<void>;
  className?: string;
  onClick?: (e: React.MouseEvent) => void | Promise<void>;
  role?: string;
  style?: React.CSSProperties;
}

const priorityColor: Record<string, "destructive" | "default" | "secondary" | "outline"> = {
  high: "destructive",
  normal: "default",
  low: "secondary",
};

export const NotificationCard: React.FC<Props> = ({ item, onMarkRead, className, onClick, role, style }) => {
  const isRead = item.read?.isRead === true;
  const variant = priorityColor[item.priority?.toLowerCase?.() ?? ""] ?? "outline";
  const createdAt = item.createdAt ? new Date(item.createdAt) : null;

  const link = item.linkUrl ?? (item.metadata && (item.metadata.linkUrl ?? item.metadata.LinkUrl)) ?? null;

  // Internal handler: mark read (if needed) then navigate/open link
  const handleOpenLink = async (e?: React.MouseEvent) => {
    // mark read if unread
    try {
      if (!isRead && onMarkRead) {
        // await in case onMarkRead returns a Promise
        await Promise.resolve(onMarkRead(item.id));
      }
    } catch {
      // ignore marking errors
    }

    if (!link) return;

    // internal navigation behavior
    const str = String(link);
    if (str.startsWith("/")) {
      // internal path: same tab
      window.location.assign(str);
    } else {
      // external: open new tab
      try {
        window.open(str, "_blank", "noopener,noreferrer");
      } catch {
        window.location.assign(str);
      }
    }

    e?.preventDefault();
  };

  const handleKey = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (onClick) {
        await Promise.resolve(onClick((e as unknown) as React.MouseEvent));
      } else {
        await handleOpenLink();
      }
    }
  };

  // Stronger visual distinction between unread and read:
  // - Unread: colored left accent, subtle background tint, stronger shadow, bold title, "MỚI" badge
  // - Read: muted/low-contrast background and text
  const unreadClasses =
    "bg-indigo-50 border-l-4 border-indigo-600 shadow-sm scale-100 transform-gpu hover:scale-[1.002] transition-all duration-150";
  const readClasses = "bg-white border border-gray-200 text-muted-foreground";

  // Combine incoming className with internal styles
  const combinedClassName = `${className ?? ""} group ${isRead ? readClasses : unreadClasses} cursor-pointer p-3 rounded-md`.trim();

  // Card click: if parent passed onClick, call it; otherwise do internal open logic
  const handleCardClick = async (e: React.MouseEvent) => {
    // If event target is interactive element, let it handle (buttons/anchors/inputs)
    const target = e.target as HTMLElement;
    const interactiveTags = ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"];
    if (interactiveTags.includes(target.tagName)) return;

    if (onClick) {
      try {
        await Promise.resolve(onClick(e));
      } catch (err) {
        // swallow to avoid breaking UI
        console.error("NotificationCard onClick handler failed:", err);
      }
    } else {
      await handleOpenLink(e);
    }
  };

  return (
    <Card
      className={combinedClassName}
      role={role ?? (link ? "button" : undefined)}
      tabIndex={link || onClick ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={handleKey}
      style={style}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-2">
        <div className="space-y-1">
          <CardTitle className={`text-base ${isRead ? "font-medium text-foreground" : "font-semibold text-slate-900"}`}>
            {item.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {createdAt ? createdAt.toLocaleString() : "—"}
          </CardDescription>
        </div>

        <div className="flex items-start gap-2">
          
          {!isRead && (
            <span className="ml-1 inline-flex items-center rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">
              MỚI
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className={`text-sm ${isRead ? "text-muted-foreground" : "text-foreground"}`}>{item.body}</p>

        {!isRead && onMarkRead && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              // prevent parent click (navigation)
              e.stopPropagation();
              try {
                const res = onMarkRead(item.id);
                // If returns promise, ignore but avoid unhandled rejection
                if (res && typeof (res as any).then === "function") {
                  (res as Promise<void>).catch(() => {});
                }
              } catch {
                // ignore
              }
            }}
          >
            Đánh dấu đã đọc
          </Button>
        )}
      </CardContent>
    </Card>
  );
};