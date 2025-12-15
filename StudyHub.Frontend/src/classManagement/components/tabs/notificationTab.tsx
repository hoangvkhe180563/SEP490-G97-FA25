import React from "react";
import PostComposer from "@/classManagement/components/ui/postcomposer";
import PostCard, { type Post } from "@/classManagement/components/ui/postcard";
import type { ClassNotification } from "@/classManagement/interfaces/class";
import { useAuthStore } from "@/auth/stores/useAuthStore";

type Props = {
  classId: number | string;
  notifications: ClassNotification[];
  onPost: (content: string, files?: File[], links?: any[], titleFromComposer?: string) => Promise<void>;
  isTeacher?: boolean;
  // allow parent to update notifications list when a PostCard is edited
  onNotificationsChange?: (next: ClassNotification[]) => void;
};

const NotificationsTab: React.FC<Props> = ({ classId, notifications, onPost, isTeacher = false, onNotificationsChange }) => {
  const { user } = useAuthStore();

  // Try common avatar field names used across the app/backend
  const resolveAvatarUrl = (u?: any): string | undefined => {
    if (!u) return undefined;
    return u.avatarUrl ?? undefined;
  };

  const avatarUrl = resolveAvatarUrl(user) ?? undefined; // fallback to undefined so PostComposer can use its own default

  const handlePostUpdate = (updated: Post) => {
    // Map updated Post back into ClassNotification shape used by this tab
    const mapped: ClassNotification = {
      id: updated.id as any,
      classId: updated.classId ?? classId,
      title: updated.title ?? "",
      description: updated.description ?? "",
      createdAt: updated.createdAt ?? undefined,
      avatarImage: updated.avatarImage,
      authorName: updated.authorName,
      createdBy: updated.createdBy,
      files: updated.files ?? [],
      comments: updated.comments ?? [],
    };

    // Update local notifications array and notify parent if provided
    const next = (notifications ?? []).map((n) => (String(n.id) === String(mapped.id) ? mapped : n));
    if (!next.some((n) => String(n.id) === String(mapped.id))) {
      // If not found, prepend (defensive)
      next.unshift(mapped);
    }
    if (typeof onNotificationsChange === "function") {
      onNotificationsChange(next);
    }
    // If this component maintains its own state elsewhere (e.g. parent), it's recommended the parent passes onNotificationsChange.
  };

  return (
    <div>
      <div className="mb-4">
        <PostComposer onPost={onPost} avatarUrl={avatarUrl} />
      </div>

      <div className="mt-4 space-y-5">
        {notifications && notifications.length > 0 ? (
          notifications.map((n) => (
            <PostCard
              key={n.id}
              post={{
                id: n.id,
                title: n.title,
                description: n.description,
                createdAt: n.createdAt,
                avatarImage: n.avatarImage,
                authorName: n.authorName,
                classId: n.classId,
                createdBy: n.createdBy,
                files: n.files ?? [],
                comments: n.comments ?? [],
              }}
              onUpdate={(updated) => {
                // update this tab's notifications immediately
                try {
                  const mapped: ClassNotification = {
                    id: updated.id as any,
                    classId: updated.classId ?? classId,
                    title: updated.title ?? "",
                    description: updated.description ?? "",
                    createdAt: updated.createdAt ?? undefined,
                    avatarImage: updated.avatarImage,
                    authorName: updated.authorName,
                    createdBy: updated.createdBy,
                    files: updated.files ?? [],
                    comments: updated.comments ?? [],
                  };
                  const next = (notifications ?? []).map((item) =>
                    String(item.id) === String(mapped.id) ? mapped : item
                  );
                  if (!next.some((item) => String(item.id) === String(mapped.id))) {
                    next.unshift(mapped);
                  }
                  // If parent passed a change handler, call it so parent/store can sync
                  if (typeof onNotificationsChange === "function") {
                    onNotificationsChange(next);
                  }
                } catch (e) {
                  console.error("onUpdate mapping failed", e);
                }
              }}
            />
          ))
        ) : (
          <div className="text-slate-500 text-base">Chưa có thông báo nào.</div>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;