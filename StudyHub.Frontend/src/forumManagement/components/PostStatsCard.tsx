// PostStatsCard.tsx
import React, { useState } from "react";
import { useForumDashboardStore } from "../stores/useForumDashboardStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

export const PostStatsCard: React.FC = () => {
  const { postStats } = useForumDashboardStore();
  const [showFlairs, setShowFlairs] = useState(false);
  const [showSubjects, setShowSubjects] = useState(false);

  if (!postStats) return null;

  return (
    <Card className="bg-white border-sky-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-500" />
            Thống kê bài viết
          </CardTitle>
          <div className="text-2xl font-bold text-sky-600">
            {postStats.totalPosts}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="text-sm text-green-600 font-medium">Đã duyệt</div>
            <div className="text-2xl font-bold text-green-700">
              {postStats.approvedPosts}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="text-sm text-orange-600 font-medium">Chờ duyệt</div>
            <div className="text-2xl font-bold text-orange-700">
              {postStats.pendingPosts}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="text-sm text-red-600 font-medium">Từ chối</div>
            <div className="text-2xl font-bold text-red-700">
              {postStats.rejectedPosts}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-sm text-gray-600 font-medium">Ẩn</div>
            <div className="text-2xl font-bold text-gray-700">
              {postStats.hiddenPosts}
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={postStats.postsByPeriod}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0ea5e9"
                strokeWidth={2}
                name="Số bài viết"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {postStats.topFlairs && postStats.topFlairs.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowFlairs(!showFlairs)}
              className="w-full flex items-center justify-between p-2 rounded bg-sky-50 border border-sky-200 hover:bg-sky-100 transition-colors"
            >
              <h4 className="text-sm font-semibold text-sky-700">
                Top Flairs ({postStats.topFlairs.length})
              </h4>
              {showFlairs ? (
                <ChevronUp className="h-4 w-4 text-sky-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-sky-600" />
              )}
            </button>
            {showFlairs && (
              <div className="space-y-2 mt-2">
                {postStats.topFlairs.map((flair, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-sky-50 border border-sky-100"
                  >
                    <span className="text-sm font-medium">
                      {flair.flairName}
                    </span>
                    <span className="text-sm font-bold text-sky-600">
                      {flair.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {postStats.topSubjects && postStats.topSubjects.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowSubjects(!showSubjects)}
              className="w-full flex items-center justify-between p-2 rounded bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors"
            >
              <h4 className="text-sm font-semibold text-purple-700">
                Top Môn học ({postStats.topSubjects.length})
              </h4>
              {showSubjects ? (
                <ChevronUp className="h-4 w-4 text-purple-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-purple-600" />
              )}
            </button>
            {showSubjects && (
              <div className="space-y-2 mt-2">
                {postStats.topSubjects.map((subject, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-purple-50 border border-purple-100"
                  >
                    <span className="text-sm font-medium">
                      {subject.subjectName}
                    </span>
                    <span className="text-sm font-bold text-purple-600">
                      {subject.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
