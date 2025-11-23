// src/documentManagement/pages/DocumentDashboard.tsx (updated)
import React, { useEffect, useState } from "react";
import { useDocumentDashboardStore } from "@/documentManagement/stores/useDocumentDashboardStore";
import DocumentDashboardFilter from "@/documentManagement/components/DocumentDashboardFilter";
import DocumentStatsCard from "@/documentManagement/components/DocumentStatsCard";
import DocumentQuickStats from "@/documentManagement/components/DocumentQuickStats";
import DocumentCategoryChart from "@/documentManagement/components/DocumentCategoryChart";
import DocumentGradeChart from "@/documentManagement/components/DocumentGradeChart";
import DocumentSubjectChart from "@/documentManagement/components/DocumentSubjectChart";
import DocumentAccessTypeChart from "@/documentManagement/components/DocumentAccessTypeChart";
import DocumentApprovalChart from "@/documentManagement/components/DocumentApprovalChart";
import TopUploadersTable from "@/documentManagement/components/TopUploadersTable";
import DocumentLengthLevelChart from "@/documentManagement/components/DocumentLengthLevelChart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { RefreshCw } from "lucide-react";

const DocumentDashboard: React.FC = () => {
  const [currentSchoolId, setCurrentSchoolId] = useState<number | undefined>(
    undefined
  );

  const {
    stats,
    categoryStats,
    gradeStats,
    subjectStats,
    uploaderStats,
    lengthStats,
    levelStats,
    isLoading,
    calculateStats,
  } = useDocumentDashboardStore();

  useEffect(() => {
    calculateStats(currentSchoolId);
  }, [calculateStats, currentSchoolId]);

  const handleFilter = (schoolId?: number) => {
    setCurrentSchoolId(schoolId);
  };

  const handleRefresh = () => {
    calculateStats(currentSchoolId);
  };

  return (
    <div className="p-4 max-h-screen overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Dashboard tài liệu</h2>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      <div className="space-y-4 mb-6">
        <DocumentDashboardFilter
          onFilter={handleFilter}
          isLoading={isLoading}
        />
      </div>

      <div className="space-y-4 mb-6">
        <DocumentStatsCard stats={stats} isLoading={isLoading} />
      </div>

      <div className="space-y-4 mb-6">
        <DocumentQuickStats stats={stats} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DocumentAccessTypeChart stats={stats} isLoading={isLoading} />
        <DocumentApprovalChart stats={stats} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DocumentCategoryChart data={categoryStats} isLoading={isLoading} />
        <DocumentGradeChart data={gradeStats} isLoading={isLoading} />
      </div>

      <div className="space-y-4 mb-6">
        <DocumentSubjectChart data={subjectStats} isLoading={isLoading} />
      </div>

      <div className="mb-6">
        <DocumentLengthLevelChart
          lengthData={lengthStats}
          levelData={levelStats}
          isLoading={isLoading}
        />
      </div>

      <div className="space-y-4 mb-6">
        <TopUploadersTable data={uploaderStats} isLoading={isLoading} />
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-slate-500">
              <p>
                • Báo cáo tổng quan về tài liệu trong hệ thống. Dữ liệu được
                tính toán dựa trên toàn bộ tài liệu hiện có.
              </p>
              <p>
                • Tỷ lệ phê duyệt cao (≥70%) cho thấy chất lượng tài liệu tốt.
              </p>
              <p>
                • Tỷ lệ chờ duyệt thấp (≤20%) cho thấy quy trình phê duyệt hiệu
                quả.
              </p>
              <p>
                • Sử dụng bộ lọc để xem thống kê theo từng trường hoặc tất cả
                trường.
              </p>
              <p>• Nhấn nút "Làm mới" để cập nhật dữ liệu mới nhất.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentDashboard;
