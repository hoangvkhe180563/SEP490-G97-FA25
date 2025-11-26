import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Users } from "lucide-react";
import { useUserOnlineStore } from "@/common/stores/useUserOnlineStore";

export const OnlineUsersCard: React.FC = () => {
  const { onlineCount } = useUserOnlineStore();

  return (
    <Card className="bg-white border-sky-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-sky-500" />
          Người dùng trực tuyến
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center p-6">
          <div className="relative inline-block">
            <div className="text-6xl font-bold text-sky-600">{onlineCount}</div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div className="text-sm text-gray-600 mt-3">
            Đang hoạt động trên diễn đàn
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
