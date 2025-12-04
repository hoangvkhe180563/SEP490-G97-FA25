// src/documentManagement/components/DocumentSubjectChart.tsx
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
import type { DocumentSubjectStatsDto } from "@/documentManagement/interfaces/document-dashboard";

interface DocumentSubjectChartProps {
  data: DocumentSubjectStatsDto[];
  isLoading: boolean;
}

const DocumentSubjectChart: React.FC<DocumentSubjectChartProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phân bố theo môn học</CardTitle>
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
          <CardTitle>Phân bố theo môn học</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            Không có dữ liệu
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item) => ({
      subject: item.subjectName,
      count: item.count,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Thống kê 10 môn học có số lượng tài liệu nhiều nhất
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="subject" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="count" fill="#0ea5e9" name="Số lượng" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DocumentSubjectChart;
