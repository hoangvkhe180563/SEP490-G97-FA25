import React, { useEffect, useState } from "react";
import { useForumDashboardStore } from "../stores/useForumDashboardStore";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/common/components/ui/tabs";
import { Calendar } from "@/common/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/common/components/ui/popover";
import { Button } from "@/common/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
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
  const { startDate, endDate, setDateRange, fetchAllStats, isLoading, error } =
    useForumDashboardStore();

  const [localStartDate, setLocalStartDate] = useState<Date | undefined>(
    startDate ||
      (() => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date;
      })()
  );
  const [localEndDate, setLocalEndDate] = useState<Date | undefined>(
    endDate || new Date()
  );

  useEffect(() => {
    if (schoolId && localStartDate && localEndDate) {
      setDateRange(localStartDate, localEndDate);
      fetchAllStats(schoolId, localStartDate, localEndDate);
    }
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [schoolId, localStartDate, localEndDate]);

  return (
    <div className="p-4 max-h-screen overflow-y-auto bg-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">DashBoard</h1>
          <p className="text-gray-600 mt-1"></p>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localStartDate ? (
                  format(localStartDate, "dd/MM/yyyy", { locale: vi })
                ) : (
                  <span>Chọn ngày bắt đầu</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localStartDate}
                onSelect={(date) => setLocalStartDate(date)}
                initialFocus
                locale={vi}
              />
            </PopoverContent>
          </Popover>

          <span className="text-gray-500">-</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localEndDate ? (
                  format(localEndDate, "dd/MM/yyyy", { locale: vi })
                ) : (
                  <span>Chọn ngày kết thúc</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localEndDate}
                onSelect={(date) => setLocalEndDate(date)}
                initialFocus
                locale={vi}
              />
            </PopoverContent>
          </Popover>
        </div>
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
