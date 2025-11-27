// src/documentManagement/components/DocumentAccessTypeChart.tsx
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

interface DocumentAccessTypeChartProps {
  stats: DocumentStatsDto | null;
  isLoading: boolean;
}

const COLORS = ["#0ea5e9", "#06b6d4"];

const DocumentAccessTypeChart: React.FC<DocumentAccessTypeChartProps> = ({
  stats,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phân loại quyền truy cập</CardTitle>
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
          <CardTitle>Phân loại quyền truy cập</CardTitle>
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
    { name: "Nổi bật (Featured)", value: stats.featuredDocuments },
    { name: "Thường", value: stats.totalDocuments - stats.featuredDocuments },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tài liệu nổi bật</CardTitle>
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

export default DocumentAccessTypeChart;
