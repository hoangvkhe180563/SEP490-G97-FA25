// src/forumManagement/components/ForumLayout.tsx
import React, { useEffect } from "react";
import { useForumSignalRStore } from "../stores/useForumSignalRStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";

interface ForumLayoutProps {
  children: React.ReactNode;
}

export const ForumLayout: React.FC<ForumLayoutProps> = ({ children }) => {
  const { user } = useAuthStore();
  const { startForum, isForumConnected } = useForumSignalRStore();

  useEffect(() => {
    if (!user?.schoolId) return;

    startForum();
  }, [user?.schoolId, startForum]);

  if (!isForumConnected) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mb-4"></div>
          <p className="text-gray-600">Đang kết nối forum...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
