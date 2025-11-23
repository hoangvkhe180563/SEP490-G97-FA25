// src/documentManagement/components/DocumentLengthLevelChart.tsx
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
import type {
  DocumentLengthStatsDto,
  DocumentLevelStatsDto,
} from "@/documentManagement/interfaces/document-dashboard";

interface DocumentLengthLevelChartProps {
  lengthData: DocumentLengthStatsDto[];
  levelData: DocumentLevelStatsDto[];
  isLoading: boolean;
}

const COLORS = ["#0ea5e9", "#06b6d4", "#14b8a6"];

const LABEL_MAP: Record<string, string> = {
  Short: "Ngắn",
  Medium: "Trung bình",
  Long: "Dài",
  Easy: "Dễ",
  Hard: "Khó",
};

const DocumentLengthLevelChart: React.FC<DocumentLengthLevelChartProps> = ({
  lengthData,
  levelData,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Độ dài tài liệu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">Đang tải...</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Độ khó tài liệu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">Đang tải...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lengthChartData = lengthData.map((item) => ({
    name: LABEL_MAP[item.lengthType] || item.lengthType,
    value: item.count,
  }));

  const levelChartData = levelData.map((item) => ({
    name: LABEL_MAP[item.level] || item.level,
    value: item.count,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Độ dài tài liệu</CardTitle>
        </CardHeader>
        <CardContent>
          {lengthChartData.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Không có dữ liệu
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={lengthChartData}
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
                  {lengthChartData.map((_, index) => (
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Độ khó tài liệu</CardTitle>
        </CardHeader>
        <CardContent>
          {levelChartData.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Không có dữ liệu
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={levelChartData}
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
                  {levelChartData.map((_, index) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentLengthLevelChart;
