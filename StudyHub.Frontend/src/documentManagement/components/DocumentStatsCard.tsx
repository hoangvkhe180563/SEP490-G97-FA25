// src/documentManagement/components/DocumentStatsCard.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { FileText, CheckCircle, Clock, AlertCircle, Star } from "lucide-react";
import type { DocumentStatsDto } from "@/documentManagement/interfaces/document-dashboard";

interface DocumentStatsCardProps {
  stats: DocumentStatsDto | null;
  isLoading: boolean;
}

const DocumentStatsCard: React.FC<DocumentStatsCardProps> = ({
  stats,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tổng quan tài liệu</CardTitle>
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
          <CardTitle>Tổng quan tài liệu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-slate-500">
            Không có dữ liệu
          </div>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      label: "Tổng số tài liệu",
      value: stats.totalDocuments,
      icon: FileText,
      color: "text-sky-600",
      bgColor: "bg-sky-50",
    },
    {
      label: "Đã phê duyệt",
      value: stats.approvedDocuments,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Chờ phê duyệt",
      value: stats.pendingApproval,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: "Yêu cầu chỉnh sửa",
      value: stats.editRequests,
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Tài liệu nổi bật",
      value: stats.featuredDocuments,
      icon: Star,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tổng quan tài liệu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-lg border"
              >
                <div className={`p-3 rounded-lg ${item.bgColor}`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="text-2xl font-semibold">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentStatsCard;
