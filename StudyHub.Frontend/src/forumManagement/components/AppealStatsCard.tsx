// AppealStatsCard.tsx
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
import { Shield } from "lucide-react";

export const AppealStatsCard: React.FC = () => {
  const { appealStats } = useForumDashboardStore();

  if (!appealStats) return null;

  return (
    <Card className="bg-white border-sky-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-sky-500" />
            Thống kê khiếu nại
          </CardTitle>
          <div className="text-2xl font-bold text-sky-600">
            {appealStats.totalAppeals}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="text-sm text-orange-600 font-medium">Chờ xử lý</div>
            <div className="text-2xl font-bold text-orange-700">
              {appealStats.pendingAppeals}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="text-sm text-green-600 font-medium">Chấp nhận</div>
            <div className="text-2xl font-bold text-green-700">
              {appealStats.approvedAppeals}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="text-sm text-red-600 font-medium">Từ chối</div>
            <div className="text-2xl font-bold text-red-700">
              {appealStats.rejectedAppeals}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
            <div className="text-sm text-sky-600 font-medium">
              TB giải quyết (giờ)
            </div>
            <div className="text-2xl font-bold text-sky-700">
              {appealStats.averageResolveHours}
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={appealStats.appealsByPeriod}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8b5cf6" name="Khiếu nại" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
