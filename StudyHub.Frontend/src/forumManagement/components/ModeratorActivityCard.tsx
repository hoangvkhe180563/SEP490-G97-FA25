// ModeratorActivityCard.tsx
import React from "react";
import { useForumDashboardStore } from "../stores/useForumDashboardStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { TrendingUp } from "lucide-react";

export const ModeratorActivityCard: React.FC = () => {
  const { moderatorActivity } = useForumDashboardStore();

  if (!moderatorActivity || moderatorActivity.length === 0) return null;

  return (
    <Card className="bg-white border-sky-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-sky-500" />
          Hoạt động Moderator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {moderatorActivity.map((mod, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sky-700">
                  {mod.moderatorName}
                </h4>
                <span className="text-xl font-bold text-sky-600">
                  {mod.actionsCount}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded bg-white border border-green-200">
                  <div className="text-xs text-green-600">Duyệt</div>
                  <div className="text-lg font-bold text-green-700">
                    {mod.approvedCount}
                  </div>
                </div>
                <div className="text-center p-2 rounded bg-white border border-red-200">
                  <div className="text-xs text-red-600">Từ chối</div>
                  <div className="text-lg font-bold text-red-700">
                    {mod.rejectedCount}
                  </div>
                </div>
                <div className="text-center p-2 rounded bg-white border border-gray-200">
                  <div className="text-xs text-gray-600">Ẩn</div>
                  <div className="text-lg font-bold text-gray-700">
                    {mod.hiddenCount}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
