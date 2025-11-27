// UserActivityStatsCard.tsx
import React from "react";
import { useForumDashboardStore } from "../stores/useForumDashboardStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Users } from "lucide-react";

export const UserActivityStatsCard: React.FC = () => {
  const { userActivityStats } = useForumDashboardStore();

  if (!userActivityStats) return null;

  return (
    <Card className="bg-white border-sky-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-500" />
            Hoạt động người dùng
          </CardTitle>
          <div className="text-2xl font-bold text-sky-600">
            {userActivityStats.totalActiveUsers}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
            <div className="text-sm text-sky-600 font-medium">Hoạt động</div>
            <div className="text-2xl font-bold text-sky-700">
              {userActivityStats.totalActiveUsers}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="text-sm text-red-600 font-medium">Bị cấm</div>
            <div className="text-2xl font-bold text-red-700">
              {userActivityStats.mutedUsers}
            </div>
          </div>
        </div>

        {userActivityStats.usersByViolationScore.length > 0 && (
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userActivityStats.usersByViolationScore}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="scoreRange" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0ea5e9" name="Số người dùng" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {userActivityStats.topContributors.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2 text-sky-700">
              Top đóng góp
            </h4>
            <div className="space-y-2">
              {userActivityStats.topContributors
                .slice(0, 5)
                .map((contributor, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-sky-50 border border-sky-100"
                  >
                    <span className="text-sm font-medium">
                      {contributor.fullname || contributor.username}
                    </span>
                    <div className="flex gap-2">
                      <span className="text-xs bg-sky-200 px-2 py-1 rounded font-semibold">
                        {contributor.postCount} bài
                      </span>
                      <span className="text-xs bg-green-200 px-2 py-1 rounded font-semibold">
                        {contributor.commentCount} bl
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
