import { useNotificationStore } from "@/classManagement/stores/useNotificationStore";
import { useEffect } from "react";

export function ClassNotifications({ classId }: { classId: string }) {
  const { connect, joinClass, markAllAsRead, unreadCount } =
    useNotificationStore();

  useEffect(() => {
    (async () => {
      await connect();
      await joinClass(classId);
    })();

    return () => {
      useNotificationStore.getState().leaveClass(classId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  return (
    <div>
      <button onClick={() => markAllAsRead(classId)}>
        🔔 Thông báo ({unreadCount[classId] || 0})
      </button>
    </div>
  );
}
