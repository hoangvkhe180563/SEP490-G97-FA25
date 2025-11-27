//CommentStatsCard.tsx
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
import { MessageSquare } from "lucide-react";

export const CommentStatsCard: React.FC = () => {
  const { commentStats } = useForumDashboardStore();

  if (!commentStats) return null;

  return (
    <Card className="bg-white border-sky-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-sky-500" />
            Thống kê bình luận
          </CardTitle>
          <div className="text-2xl font-bold text-sky-600">
            {commentStats.totalComments}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="text-sm text-green-600 font-medium">Đã duyệt</div>
            <div className="text-2xl font-bold text-green-700">
              {commentStats.approvedComments}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="text-sm text-orange-600 font-medium">Chờ duyệt</div>
            <div className="text-2xl font-bold text-orange-700">
              {commentStats.pendingComments}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-sm text-gray-600 font-medium">Ẩn</div>
            <div className="text-2xl font-bold text-gray-700">
              {commentStats.hiddenComments}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-sky-50 border border-sky-200">
            <div className="text-sm text-sky-600 font-medium">TB/bài viết</div>
            <div className="text-2xl font-bold text-sky-700">
              {commentStats.averageCommentsPerPost}
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={commentStats.commentsByPeriod}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#0ea5e9" name="Số bình luận" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
