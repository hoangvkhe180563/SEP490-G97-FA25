import React, { useEffect, useMemo, useState } from "react";
import useQaStatsStore from "../stores/useQaStatsStore";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Card } from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/common/components/ui/popover";
import { Button } from "@/common/components/ui/button";
import { Calendar } from "@/common/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

const QaOverview: React.FC = () => {
  const {
    overview,
    fetchOverview,
    isLoadingOverview,
    startDate,
    endDate,
    setDateRange,
  } = useQaStatsStore();

  const [localStart, setLocalStart] = useState<Date | undefined>(startDate);
  const [localEnd, setLocalEnd] = useState<Date | undefined>(endDate);

  useEffect(() => {
    fetchOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const applyRange = (s?: Date, e?: Date) => {
    setDateRange(s, e);
    fetchOverview();
  };

  const subjectData = useMemo(
    () => overview?.conversationsBySubject ?? [],
    [overview]
  );
  const topicData = useMemo(
    () => overview?.conversationsByTopic ?? [],
    [overview]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tổng quan QA</h2>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localStart
                  ? format(localStart, "dd/MM/yyyy", { locale: vi })
                  : "Bắt đầu"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localStart}
                onSelect={(d: any) => {
                  const date = d as Date;
                  setLocalStart(date);
                  applyRange(date, localEnd);
                }}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localEnd
                  ? format(localEnd, "dd/MM/yyyy", { locale: vi })
                  : "Kết thúc"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localEnd}
                onSelect={(d: any) => {
                  const date = d as Date;
                  setLocalEnd(date);
                  applyRange(localStart, date);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          {isLoadingOverview ? (
            <>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-1/2 mt-2" />
            </>
          ) : (
            <>
              <div className="text-sm text-gray-500">
                Tổng số cuộc hội thoại
              </div>
              <div className="text-2xl font-bold">
                {overview?.totalConversations ?? 0}
              </div>
            </>
          )}
        </Card>
        <Card className="p-4">
          {isLoadingOverview ? (
            <>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-1/2 mt-2" />
            </>
          ) : (
            <>
              <div className="text-sm text-gray-500">Tổng số tin nhắn</div>
              <div className="text-2xl font-bold">
                {overview?.totalMessages ?? 0}
              </div>
            </>
          )}
        </Card>
        <Card className="p-4">
          {isLoadingOverview ? (
            <>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-3/4 mt-2" />
            </>
          ) : (
            <>
              <div className="text-sm text-gray-500">
                Trung bình cuộc hội thoại trả phí được tạo (Ngày/Tuần/Tháng)
              </div>
              <div className="text-lg font-medium">
                {overview
                  ? `${overview.averagePaidConversations.day.toFixed(
                      2
                    )} / ${overview.averagePaidConversations.week.toFixed(
                      2
                    )} / ${overview.averagePaidConversations.month.toFixed(2)}`
                  : "-"}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-medium mb-2">Số cuộc hội thoại theo môn</h3>
          <div style={{ width: "100%", height: 240 }}>
            {isLoadingOverview ? (
              <Skeleton className="h-60 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                >
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [value, "Số cuộc hội thoại"]}
                  />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="Số cuộc hội thoại"
                    fill="#4f46e5"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-medium mb-2">Số cuộc hội thoại theo chủ đề</h3>
          <div style={{ width: "100%", height: 240 }}>
            {isLoadingOverview ? (
              <Skeleton className="h-60 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topicData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                >
                  <XAxis dataKey="topic" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any) => [value, "Số cuộc hội thoại"]}
                  />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="Số cuộc hội thoại"
                    fill="#06b6d4"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div>
        <h3 className="font-medium">Top học sinh</h3>
        <div className="overflow-x-auto">
          {isLoadingOverview ? (
            <div className="space-y-2 mt-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 mt-2">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                    Học sinh
                  </th>
                  <th className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                    Số câu hỏi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overview?.topStudents?.map((s) => (
                  <tr key={s.userId}>
                    <td className="px-3 py-2 text-sm">
                      {s.fullName ?? s.userId}
                    </td>
                    <td className="px-3 py-2 text-sm text-right">
                      {s.totalQuestions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default QaOverview;
