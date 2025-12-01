import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/common/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import useRecommendStore from "../stores/useRecommendStore";
import { Button } from "@/common/components/ui/button";
import LoadingSpinner from "./LoadingSpinner";
import { Skeleton } from "@/common/components/ui/skeleton";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/common/components/ui/popover";
import { Calendar as DatePicker } from "@/common/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

type Props = {
  start?: string | null;
  end?: string | null;
  top?: number;
};

const StatsUsage: React.FC<Props> = () => {
  const { statsLoading, llmPeakHours, fetchLlmPeakHours } = useRecommendStore(
    (s: any) => s
  );

  // per-component filter state (dates shown as dd/mm/yyyy)
  const [draftStart, setDraftStart] = useState<string | null>(null);
  const [draftEnd, setDraftEnd] = useState<string | null>(null);

  const [appliedStart, setAppliedStart] = useState<string | null>(null);
  const [appliedEnd, setAppliedEnd] = useState<string | null>(null);

  const [localTop, setLocalTop] = useState<number>(24);

  function parseDdMmYyyyToIso(v: string | null): string | null {
    if (!v) return null;
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const [_, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDateToDdMmYyyy(d: Date): string {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  useEffect(() => {
    void fetchLlmPeakHours(
      parseDdMmYyyyToIso(appliedStart) ?? undefined,
      parseDdMmYyyyToIso(appliedEnd) ?? undefined,
      localTop
    );
  }, [localTop, fetchLlmPeakHours, appliedStart, appliedEnd]);

  return (
    <Card className="w-full">
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-sm">
            Mức độ sử dụng AI / Giờ cao điểm
          </CardTitle>
          <div className="text-xs text-slate-500 mt-1">
            Biểu đồ hiển thị số lượng yêu cầu theo giờ trong ngày.
          </div>
        </div>
        <div className="flex-none flex gap-2">
          <Button
            variant={localTop === 6 ? "default" : "ghost"}
            size="sm"
            onClick={() => setLocalTop(6)}
          >
            Top 6
          </Button>
          <Button
            variant={localTop === 12 ? "default" : "ghost"}
            size="sm"
            onClick={() => setLocalTop(12)}
          >
            Top 12
          </Button>
          <Button
            variant={localTop === 24 ? "default" : "ghost"}
            size="sm"
            onClick={() => setLocalTop(24)}
          >
            Tất cả
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1 mb-1">
            <label className="text-sm text-slate-600">Từ:</label>
            <div className="w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="justify-between px-2"
                  >
                    <span className="text-left">
                      {draftStart ?? "Từ (dd/mm/yyyy)"}
                    </span>
                    <CalendarIcon className="text-gray-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <DatePicker
                    mode="single"
                    selected={
                      draftStart
                        ? new Date(parseDdMmYyyyToIso(draftStart) as string)
                        : undefined
                    }
                    onSelect={(date?: Date) =>
                      date && setDraftStart(formatDateToDdMmYyyy(date))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex items-center gap-1 mb-1">
            <label className="text-sm text-slate-600">Đến:</label>
            <div className="w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="justify-between px-2"
                  >
                    <span className="text-left">
                      {draftEnd ?? "Đến (dd/mm/yyyy)"}
                    </span>
                    <CalendarIcon className="text-gray-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <DatePicker
                    mode="single"
                    selected={
                      draftEnd
                        ? new Date(parseDdMmYyyyToIso(draftEnd) as string)
                        : undefined
                    }
                    onSelect={(date?: Date) =>
                      date && setDraftEnd(formatDateToDdMmYyyy(date))
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex items-center gap-1 mb-1">
            <div className="flex items-center gap-2 ml-2">
              <Button
                size="sm"
                onClick={() => {
                  setAppliedStart(draftStart);
                  setAppliedEnd(draftEnd);
                }}
              >
                Áp dụng
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraftStart(appliedStart);
                  setDraftEnd(appliedEnd);
                }}
              >
                Đặt lại
              </Button>
            </div>
          </div>
        </div>
        {statsLoading && llmPeakHours.length === 0 ? (
          <LoadingSpinner label="Đang tải thống kê..." />
        ) : (
          <>
            <div className="flex justify-end mb-2">
              {localTop === undefined && llmPeakHours.length === 0 ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <div className="text-sm text-slate-600">
                  Tổng:{" "}
                  {llmPeakHours.reduce(
                    (s: number, x: any) => s + (x.count ?? 0),
                    0
                  )}{" "}
                  lần
                </div>
              )}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={llmPeakHours}
                  margin={{ top: 5, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis
                    label={{ angle: -90, position: "insideLeft", offset: 10 }}
                  />
                  <Tooltip formatter={(value: any) => [value, "Số lượng"]} />
                  <Legend verticalAlign="bottom" align="center" />
                  <Bar name="Số lượng yêu cầu" dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsUsage;
