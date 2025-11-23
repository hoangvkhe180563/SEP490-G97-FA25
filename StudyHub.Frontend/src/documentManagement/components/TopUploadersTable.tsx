// src/documentManagement/components/TopUploadersTable.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import type { DocumentUploaderStatsDto } from "@/documentManagement/interfaces/document-dashboard";

interface TopUploadersTableProps {
  data: DocumentUploaderStatsDto[];
  isLoading: boolean;
}

const TopUploadersTable: React.FC<TopUploadersTableProps> = ({
  data,
  isLoading,
}) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 người tải lên</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>STT</TableHead>
              <TableHead>Tên người dùng</TableHead>
              <TableHead className="text-right">Tổng tài liệu</TableHead>
              <TableHead className="text-right">Đã duyệt</TableHead>
              <TableHead className="text-right">Chờ duyệt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={item.uploaderId}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">
                  {item.uploaderName}
                </TableCell>
                <TableCell className="text-right">
                  {item.totalDocuments}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {item.approvedDocuments}
                </TableCell>
                <TableCell className="text-right text-orange-600">
                  {item.pendingDocuments}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TopUploadersTable;
