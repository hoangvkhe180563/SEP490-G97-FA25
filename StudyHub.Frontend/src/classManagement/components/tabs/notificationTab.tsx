import React from "react";
import PostComposer from "@/classManagement/components/ui/postcomposer";
import PostCard from "@/classManagement/components/ui/postcard";
import type { ClassNotification } from "@/classManagement/interfaces/class";

type Props = {
  classId: number | string;
  notifications: ClassNotification[];
  onPost: (content: string, files?: File[], links?: any[], titleFromComposer?: string) => Promise<void>;
  isTeacher?: boolean;
};

const NotificationsTab: React.FC<Props> = ({ classId, notifications, onPost, isTeacher = false }) => {
  return (
    <div>
      <div className="mb-4">
        <PostComposer onPost={onPost} avatarUrl={"/vite.svg"} />
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