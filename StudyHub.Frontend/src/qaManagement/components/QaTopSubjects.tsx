import React, { useEffect, useMemo, useState } from "react";
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

const QaTopSubjects: React.FC = () => {
  const {
    topSubjects,
    fetchTopSubjects,
    startDate,
    endDate,
    setDateRange,
    isLoadingTopSubjects,
  } = useQaStatsStore();

  const [localStart, setLocalStart] = useState<Date | undefined>(startDate);
  const [localEnd, setLocalEnd] = useState<Date | undefined>(endDate);

  useEffect(() => {
    setDateRange(localStart, localEnd);
    fetchTopSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStart, localEnd]);

  const data = useMemo(() => topSubjects ?? [], [topSubjects]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Top môn học (QA)</h2>
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

      <Card className="p-4">
        <div style={{ width: "100%", height: 300 }}>
          {isLoadingTopSubjects ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => [value, "Số cuộc hội thoại"]}
                />
                <Legend />
                <Bar dataKey="count" name="Số cuộc hội thoại" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
};

export default QaTopSubjects;
