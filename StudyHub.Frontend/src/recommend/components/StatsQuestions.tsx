import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/common/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import useRecommendStore from "../stores/useRecommendStore";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/common/components/ui/popover";
import { Calendar as DatePicker } from "@/common/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { Skeleton } from "@/common/components/ui/skeleton";

type Props = {
  start?: string | null;
  end?: string | null;
  top?: number;
};

const StatsQuestions: React.FC<Partial<Props>> = () => {
  const {
    statsLoading,
    llmQuestionsByStudent,
    llmQuestionsTimeSeries,
    fetchLlmQuestionsByStudent,
    fetchLlmQuestionsTimeSeries,
  } = useRecommendStore((s: any) => s);
  const [period, setPeriod] = useState<string>("day");

  // per-component draft and applied filters (dates displayed as dd/mm/yyyy)
  const [draftStart, setDraftStart] = useState<string | null>(null);
  const [draftEnd, setDraftEnd] = useState<string | null>(null);
  const [draftTop, setDraftTop] = useState<number>(10);

  const [appliedStart, setAppliedStart] = useState<string | null>(null);
  const [appliedEnd, setAppliedEnd] = useState<string | null>(null);
  const [appliedTop, setAppliedTop] = useState<number>(10);

  // helpers: parse dd/mm/yyyy to ISO yyyy-mm-dd (or null)
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
    void fetchLlmQuestionsByStudent(
      parseDdMmYyyyToIso(appliedStart) ?? undefined,
      parseDdMmYyyyToIso(appliedEnd) ?? undefined,
      appliedTop ?? 10
    );
  }, [fetchLlmQuestionsByStudent, appliedStart, appliedEnd, appliedTop]);

  useEffect(() => {
    void fetchLlmQuestionsTimeSeries(
      period,
      parseDdMmYyyyToIso(appliedStart) ?? undefined,
      parseDdMmYyyyToIso(appliedEnd) ?? undefined
    );
  }, [period, fetchLlmQuestionsTimeSeries, appliedStart, appliedEnd]);

  const totalCount = llmQuestionsTimeSeries.reduce(
    (s: number, x: any) => s + (x.count ?? 0),
    0
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-sm mb-2">Thống kê số câu hỏi</CardTitle>
          <div className="flex items-center gap-2 mb-3">
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
              <label className="text-sm text-slate-600">Top:</label>
              <div className="w-auto">
                <Input
                  type="number"
                  min={1}
                  value={String(draftTop)}
                  onChange={(e) =>
                    setDraftTop(Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </div>
            </div>

            <label className="text-sm text-slate-600">Gộp theo:</label>
            <Select value={period} onValueChange={(v) => setPeriod(v)}>
              <SelectTrigger className="w-28 ml-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Ngày</SelectItem>
                <SelectItem value="week">Tuần</SelectItem>
                <SelectItem value="month">Tháng</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-2">
              <Button
                size="sm"
                onClick={() => {
                  setAppliedStart(draftStart);
                  setAppliedEnd(draftEnd);
                  setAppliedTop(draftTop);
                  void fetchLlmQuestionsByStudent(
                    parseDdMmYyyyToIso(draftStart) ?? undefined,
                    parseDdMmYyyyToIso(draftEnd) ?? undefined,
                    draftTop ?? 10
                  );
                  void fetchLlmQuestionsTimeSeries(
                    period,
                    parseDdMmYyyyToIso(draftStart) ?? undefined,
                    parseDdMmYyyyToIso(draftEnd) ?? undefined
                  );
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
                  setDraftTop(appliedTop);
                }}
              >
                Đặt lại
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {statsLoading && llmQuestionsTimeSeries.length === 0 ? (
          <LoadingSpinner label="Đang tải thống kê..." />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end mb-2">
              {statsLoading && llmQuestionsTimeSeries.length === 0 ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <div className="text-sm text-slate-600">
                  Tổng: {totalCount} lần
                </div>
              )}
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={llmQuestionsTimeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis
                    label={{
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                    }}
                  />
                  <Tooltip formatter={(value: any) => [value, "Số lượng"]} />
                  <Legend verticalAlign="bottom" align="center" />
                  <Line
                    name="Số lượng câu hỏi"
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">
                Học sinh hoạt động nhất
              </h3>
              <ul className="space-y-2 max-h-44 overflow-auto">
                {llmQuestionsByStudent.slice(0, 8).map((s: any) => (
                  <li
                    key={s.userId}
                    className="flex items-center justify-between"
                  >
                    <div className="text-sm">{s.fullName ?? s.userId}</div>
                    <div className="text-sm font-semibold">
                      {s.totalQuestions}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsQuestions;
