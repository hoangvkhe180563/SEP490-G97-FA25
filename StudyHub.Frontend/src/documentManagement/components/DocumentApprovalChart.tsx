// src/documentManagement/components/DocumentApprovalChart.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { DocumentStatsDto } from "@/documentManagement/interfaces/document-dashboard";

interface DocumentApprovalChartProps {
  stats: DocumentStatsDto | null;
  isLoading: boolean;
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

const DocumentApprovalChart: React.FC<DocumentApprovalChartProps> = ({
  stats,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trạng thái phê duyệt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Đang tải...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trạng thái phê duyệt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            Không có dữ liệu
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = [
    { name: "Đã duyệt", value: stats.approvedDocuments },
    { name: "Chờ duyệt", value: stats.pendingApproval },
    // { name: "Từ chối", value: stats.rejectedDocuments },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trạng thái phê duyệt</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DocumentApprovalChart;
