import React, { useState } from "react";
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
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/common/components/ui/button";
import { BarChart3, Table as TableIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { DocumentUploaderStatsDto } from "@/documentManagement/interfaces/document-dashboard";

interface TopUploadersTableProps {
  data: DocumentUploaderStatsDto[];
  isLoading: boolean;
}

type SortField = "total" | "approved" | "pending";
type SortDirection = "asc" | "desc";
type ViewMode = "table" | "chart";

const TopUploadersTable: React.FC<TopUploadersTableProps> = ({
  data,
  isLoading,
}) => {
  const [sortField, setSortField] = useState<SortField>("total");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top người tải lên</CardTitle>
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
          <CardTitle>Top người tải lên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            Không có dữ liệu
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortField) {
      case "total":
        aValue = a.totalDocuments;
        bValue = b.totalDocuments;
        break;
      case "approved":
        aValue = a.approvedDocuments;
        bValue = b.approvedDocuments;
        break;
      case "pending":
        aValue = a.pendingDocuments;
        bValue = b.pendingDocuments;
        break;
    }

    if (sortDirection === "asc") {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 inline" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="w-4 h-4 ml-1 inline text-sky-600" />;
    }
    return <ArrowDown className="w-4 h-4 ml-1 inline text-sky-600" />;
  };

  const chartData = sortedData.map((item) => ({
    name:
      item.uploaderName.length > 15
        ? item.uploaderName.substring(0, 15) + "..."
        : item.uploaderName,
    "Đã duyệt": item.approvedDocuments,
    "Chờ duyệt": item.pendingDocuments,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Top người tải lên</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="w-4 h-4 mr-2" />
              Bảng
            </Button>
            <Button
              variant={viewMode === "chart" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("chart")}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Biểu đồ
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "table" ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>Tên người dùng</TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-slate-50"
                    onClick={() => handleSort("total")}
                  >
                    Tổng tài liệu
                    {getSortIcon("total")}
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-slate-50"
                    onClick={() => handleSort("approved")}
                  >
                    Đã duyệt
                    {getSortIcon("approved")}
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-slate-50"
                    onClick={() => handleSort("pending")}
                  >
                    Chờ duyệt
                    {getSortIcon("pending")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((item, index) => (
                  <TableRow key={item.uploaderId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {item.uploaderName}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {item.totalDocuments}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {item.approvedDocuments}
                    </TableCell>
                    <TableCell className="text-right text-orange-600 font-medium">
                      {item.pendingDocuments}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Đã duyệt" fill="#10b981" stackId="a" />
              <Bar dataKey="Chờ duyệt" fill="#f59e0b" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TopUploadersTable;
