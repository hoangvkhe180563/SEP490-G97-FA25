import React, { useEffect, useState } from "react";
import useQaStatsStore from "../stores/useQaStatsStore";
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

const QaTopStudents: React.FC = () => {
  const {
    topStudents,
    fetchTopStudents,
    startDate,
    endDate,
    setDateRange,
    isLoadingTopStudents,
  } = useQaStatsStore();

  const [localStart, setLocalStart] = useState<Date | undefined>(startDate);
  const [localEnd, setLocalEnd] = useState<Date | undefined>(endDate);

  useEffect(() => {
    setDateRange(localStart, localEnd);
    fetchTopStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStart, localEnd]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">Top học sinh</h2>
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
                onSelect={(d: any) => setLocalStart(d as Date)}
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
                onSelect={(d: any) => setLocalEnd(d as Date)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="overflow-x-auto">
        {isLoadingTopStudents ? (
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
                  Học sinh
                </th>
                <th className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                  Số câu hỏi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topStudents?.map((s) => (
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
  );
};

export default QaTopStudents;
