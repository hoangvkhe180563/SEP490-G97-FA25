// src/documentManagement/components/DocumentQuickStats.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { DocumentStatsDto } from "@/documentManagement/interfaces/document-dashboard";

interface DocumentQuickStatsProps {
  stats: DocumentStatsDto | null;
  isLoading: boolean;
}

const DocumentQuickStats: React.FC<DocumentQuickStatsProps> = ({
  stats,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thống kê nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Đang tải...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thống kê nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-slate-500">
            Không có dữ liệu
          </div>
        </CardContent>
      </Card>
    );
  }

  const approvalRate =
    stats.totalDocuments > 0
      ? ((stats.approvedDocuments / stats.totalDocuments) * 100).toFixed(1)
      : 0;

  const pendingRate =
    stats.totalDocuments > 0
      ? ((stats.pendingApproval / stats.totalDocuments) * 100).toFixed(1)
      : 0;

  // const rejectionRate =
  //   stats.totalDocuments > 0
  //     ? ((stats.rejectedDocuments / stats.totalDocuments) * 100).toFixed(1)
  //     : 0;

  const quickStats = [
    {
      label: "Tỷ lệ phê duyệt",
      value: `${approvalRate}%`,
      trend: Number(approvalRate) >= 70 ? "up" : "down",
      trendColor:
        Number(approvalRate) >= 70 ? "text-green-600" : "text-red-600",
    },
    {
      label: "Tỷ lệ chờ duyệt",
      value: `${pendingRate}%`,
      trend: Number(pendingRate) <= 20 ? "up" : "down",
      trendColor:
        Number(pendingRate) <= 20 ? "text-green-600" : "text-orange-600",
    },
    // {
    //   label: "Tỷ lệ từ chối",
    //   value: `${rejectionRate}%`,
    //   trend: Number(rejectionRate) <= 10 ? "up" : "down",
    //   trendColor:
    //     Number(rejectionRate) <= 10 ? "text-green-600" : "text-red-600",
    // },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thống kê nhanh</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickStats.map((stat, index) => (
            <div key={index} className="p-4 rounded-lg border bg-slate-50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-600">{stat.label}</p>
                {stat.trend === "up" ? (
                  <TrendingUp className={`w-4 h-4 ${stat.trendColor}`} />
                ) : (
                  <TrendingDown className={`w-4 h-4 ${stat.trendColor}`} />
                )}
              </div>
              <p className="text-2xl font-bold text-sky-700">{stat.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentQuickStats;
