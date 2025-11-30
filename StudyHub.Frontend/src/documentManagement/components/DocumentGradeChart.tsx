// src/documentManagement/components/DocumentGradeChart.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DocumentGradeStatsDto } from "@/documentManagement/interfaces/document-dashboard";

interface DocumentGradeChartProps {
  data: DocumentGradeStatsDto[];
  isLoading: boolean;
}

const DocumentGradeChart: React.FC<DocumentGradeChartProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phân bố theo khối lớp</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Đang tải...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phân bố theo khối lớp</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            Không có dữ liệu
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    grade: `Khối ${item.grade}`,
    count: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân bố theo khối lớp</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="grade" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#0ea5e9" name="Số lượng" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DocumentGradeChart;
