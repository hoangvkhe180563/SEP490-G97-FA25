import React, { useEffect, useState } from "react";
import useQaStatsStore from "../stores/useQaStatsStore";
import { Skeleton } from "@/common/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/common/components/ui/popover";
import { Button } from "@/common/components/ui/button";
import { Calendar } from "@/common/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";

const QaTopTeachers: React.FC = () => {
  const {
    topTeachers,
    fetchTopTeachers,
    startDate,
    endDate,
    setDateRange,
    isLoadingTopTeachers,
  } = useQaStatsStore();
  const [localStart, setLocalStart] = useState<Date | undefined>(startDate);
  const [localEnd, setLocalEnd] = useState<Date | undefined>(endDate);
  const [sortBy, setSortBy] = useState<string>("response");

  useEffect(() => {
    setDateRange(localStart, localEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStart, localEnd]);

  useEffect(() => {
    fetchTopTeachers(sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStart, localEnd, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Top giáo viên</h2>
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
                  const dt = d as Date;
                  setLocalStart(dt);
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
                  const dt = d as Date;
                  setLocalEnd(dt);
                }}
              />
            </PopoverContent>
          </Popover>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="response">
                Sắp xếp theo thời gian phản hồi
              </SelectItem>
              <SelectItem value="conversations">
                Sắp xếp theo số cuộc hội thoại
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        {isLoadingTopTeachers ? (
          <div className="space-y-2 mt-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                  Giáo viên
                </th>
                <th className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                  Số cuộc hội thoại
                </th>
                <th className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                  Thời gian phản hồi TB (phút)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topTeachers?.map((t) => (
                <tr key={t.teacherId}>
                  <td className="px-3 py-2 text-sm">
                    {t.fullName ?? t.teacherId}
                  </td>
                  <td className="px-3 py-2 text-sm text-right">
                    {t.conversationCount}
                  </td>
                  <td className="px-3 py-2 text-sm text-right">
                    {t.averageFirstResponseMinutes.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default QaTopTeachers;
