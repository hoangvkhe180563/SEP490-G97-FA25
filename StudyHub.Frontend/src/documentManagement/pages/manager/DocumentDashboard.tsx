// src/documentManagement/pages/DocumentDashboard.tsx
import React, { useEffect, useState } from "react";
import { useDocumentDashboardStore } from "@/documentManagement/stores/useDocumentDashboardStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import DocumentStatsCard from "@/documentManagement/components/DocumentStatsCard";
import DocumentQuickStats from "@/documentManagement/components/DocumentQuickStats";
import DocumentCategoryChart from "@/documentManagement/components/DocumentCategoryChart";
import DocumentGradeChart from "@/documentManagement/components/DocumentGradeChart";
import DocumentSubjectChart from "@/documentManagement/components/DocumentSubjectChart";
import DocumentAccessTypeChart from "@/documentManagement/components/DocumentAccessTypeChart";
import DocumentApprovalChart from "@/documentManagement/components/DocumentApprovalChart";
import TopUploadersTable from "@/documentManagement/components/TopUploadersTable";
import DocumentLengthLevelChart from "@/documentManagement/components/DocumentLengthLevelChart";
import { Card, CardContent } from "@/common/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/common/components/ui/tabs";
import { Button } from "@/common/components/ui/button";
import { RefreshCw } from "lucide-react";

const DocumentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");

  const {
    stats,
    categoryStats,
    gradeStats,
    subjectStats,
    uploaderStats,
    lengthStats,
    levelStats,
    isLoading,
    error,
    calculateStats,
  } = useDocumentDashboardStore();

  useEffect(() => {
    if (user) {
      calculateStats(user.schoolId || undefined);
    }
  }, [calculateStats, user]);

  const handleRefresh = () => {
    if (user) {
      calculateStats(user.schoolId || undefined);
    }
  };

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-slate-500">
              Vui lòng đăng nhập để xem dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-h-screen overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Dashboard tài liệu</h2>
        </div>
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

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">Lỗi: {error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="category">Danh mục & Lớp</TabsTrigger>
          <TabsTrigger value="subject">Môn học</TabsTrigger>
          <TabsTrigger value="properties">Thuộc tính</TabsTrigger>
          <TabsTrigger value="uploaders">Người tải lên</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DocumentStatsCard stats={stats} isLoading={isLoading} />
          <DocumentQuickStats stats={stats} isLoading={isLoading} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DocumentAccessTypeChart stats={stats} isLoading={isLoading} />
            <DocumentApprovalChart stats={stats} isLoading={isLoading} />
          </div>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DocumentCategoryChart data={categoryStats} isLoading={isLoading} />
            <DocumentGradeChart data={gradeStats} isLoading={isLoading} />
          </div>
        </TabsContent>

        <TabsContent value="subject" className="space-y-4">
          <DocumentSubjectChart data={subjectStats} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <DocumentLengthLevelChart
            lengthData={lengthStats}
            levelData={levelStats}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="uploaders" className="space-y-4">
          <TopUploadersTable data={uploaderStats} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentDashboard;
