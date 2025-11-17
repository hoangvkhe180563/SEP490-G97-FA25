import React from "react";
import { useUserOnlineStore } from "@/common/stores/useUserOnlineStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/common/components/ui/card";

const RealtimeCard: React.FC = () => {
  const onlineCount = useUserOnlineStore((s) => s.onlineCount);
  const onlineUsers = useUserOnlineStore((s) => s.onlineUsers);
  const isPresenceConnected = useUserOnlineStore((s) => s.isPresenceConnected);
  const onlineOnly = (onlineUsers || []).filter((u) => u.isOnline);

  return (
    <Card>
      <CardHeader>
        <CardTitle>4. Thống kê thời gian thực</CardTitle>
        <CardDescription>
          Số người đang online và phân bố theo vai trò
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isPresenceConnected ? (
          <div className="h-40 bg-gray-100 flex items-center justify-center text-sm text-slate-500">
            Đang kết nối...
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <div className="text-sm text-slate-500">Số người đang online</div>
              <div className="text-2xl font-semibold">{onlineCount || "—"}</div>
            </div>

            <div>
              <div className="text-sm text-slate-500">
                Tỷ lệ online theo vai trò
              </div>
              <div className="mt-2 space-y-2">
                {onlineUsers && onlineUsers.length > 0 ? (
                  (() => {
                    // aggregate counts per role using only online users
                    const map = new Map<string, number>();
                    onlineOnly.forEach((u) => {
                      (u.roles || ["(Không rõ)"]).forEach((r) => {
                        const key = r || "(Không rõ)";
                        map.set(key, (map.get(key) || 0) + 1);
                      });
                    });
                    const total = onlineOnly.length || 1;
                    return Array.from(map.entries()).map(([role, count]) => {
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div
                          key={role}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-1/6 truncate">{role}</div>
                            <div className="w-5/6 bg-slate-100 h-5 rounded overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className="h-5 bg-indigo-500 rounded"
                              />
                            </div>
                          </div>
                          <div className="ml-3 font-medium">{pct}%</div>
                        </div>
                      );
                    });
                  })()
                ) : (
                  <div className="text-sm text-slate-500">Không có dữ liệu</div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealtimeCard;
