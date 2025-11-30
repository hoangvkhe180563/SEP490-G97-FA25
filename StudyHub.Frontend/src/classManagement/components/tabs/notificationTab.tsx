import React from "react";
import PostComposer from "@/classManagement/components/ui/postcomposer";
import PostCard from "@/classManagement/components/ui/postcard";
import type { ClassNotification } from "@/classManagement/interfaces/class";
import { useAuthStore } from "@/auth/stores/useAuthStore";

type Props = {
  classId: number | string;
  notifications: ClassNotification[];
  onPost: (content: string, files?: File[], links?: any[], titleFromComposer?: string) => Promise<void>;
  isTeacher?: boolean;
};

const NotificationsTab: React.FC<Props> = ({ classId, notifications, onPost, isTeacher = false }) => {
  const { user } = useAuthStore();

  // Try common avatar field names used across the app/backend
  const resolveAvatarUrl = (u?: any): string | undefined => {
    if (!u) return undefined;
    return (
      u.avatarUrl ??
      u.avatar ??
      u.avatar_url ??
      u.photoUrl ??
      u.photo_url ??
      u.imageUrl ??
      u.image_url ??
      u.userImage ??
      u.profilePicture ??
      undefined
    );
  };

  const avatarUrl = resolveAvatarUrl(user) ?? undefined; // fallback to undefined so PostComposer can use its own default

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