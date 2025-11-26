// ModeratorDashboard.tsx
import React, { useEffect, useState } from "react";
import { useForumDashboardStore } from "../stores/useForumDashboardStore";
import { Button } from "@/common/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/common/components/ui/tabs";
import { PostStatsCard } from "../components/PostStatsCard";
import { CommentStatsCard } from "../components/CommentStatsCard";
import { ViolationStatsCard } from "../components/ViolationStatsCard";
import { AppealStatsCard } from "../components/AppealStatsCard";
import { UserActivityStatsCard } from "../components/UserActivityStatsCard";
import { ModeratorActivityCard } from "../components/ModeratorActivityCard";
import { TopEngagedPostsCard } from "../components/TopEngagedPostsCard";
import { OnlineUsersCard } from "../components/OnlineUsersCard";

const ModeratorDashboard: React.FC = () => {
  const [schoolId] = useState<number>(1);
  const { dateRange, setDateRange, fetchAllStats, isLoading, error } =
    useForumDashboardStore();

  useEffect(() => {
    if (schoolId) {
      fetchAllStats(schoolId, dateRange);
    }
  }, [schoolId, dateRange, fetchAllStats]);

  const handleDateRangeChange = (days: number) => {
    setDateRange(days);
  };

  return (
    <div className="p-4 max-h-screen overflow-y-auto bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DashBoard</h1>
          <p className="text-gray-600 mt-1"></p>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <Button
          variant={dateRange === 3 ? "default" : "outline"}
          onClick={() => handleDateRangeChange(3)}
        >
          3 ngày
        </Button>
        <Button
          variant={dateRange === 7 ? "default" : "outline"}
          onClick={() => handleDateRangeChange(7)}
        >
          7 ngày
        </Button>
        <Button
          variant={dateRange === 14 ? "default" : "outline"}
          onClick={() => handleDateRangeChange(14)}
        >
          14 ngày
        </Button>
        <Button
          variant={dateRange === 30 ? "default" : "outline"}
          onClick={() => handleDateRangeChange(30)}
        >
          30 ngày
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-sky-600 text-lg">Đang tải dữ liệu...</div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white border border-sky-200">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-sky-500 data-[state=active]:text-white"
            >
              Tổng quan
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="data-[state=active]:bg-sky-500 data-[state=active]:text-white"
            >
              Nội dung
            </TabsTrigger>
            <TabsTrigger
              value="moderation"
              className="data-[state=active]:bg-sky-500 data-[state=active]:text-white"
            >
              Kiểm duyệt
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-sky-500 data-[state=active]:text-white"
            >
              Người dùng
            </TabsTrigger>
            <TabsTrigger
              value="engagement"
              className="data-[state=active]:bg-sky-500 data-[state=active]:text-white"
            >
              Tương tác
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PostStatsCard />
                <CommentStatsCard />
                <ViolationStatsCard />
                <AppealStatsCard />
              </div>
              <div className="space-y-4">
                <OnlineUsersCard />
                <TopEngagedPostsCard />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="content" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PostStatsCard />
              <CommentStatsCard />
            </div>
          </TabsContent>
          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3">
                <UserActivityStatsCard />
              </div>
              <OnlineUsersCard />
            </div>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ViolationStatsCard />
              <AppealStatsCard />
            </div>
            <ModeratorActivityCard />
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4">
            <TopEngagedPostsCard />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ModeratorDashboard;
