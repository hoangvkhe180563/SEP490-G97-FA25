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

const StatsTokens: React.FC<Props> = () => {
  const {
    // token-specific data
    llmTokenSummary,
    llmTokenByPeriod,
    llmTopTokenUsers,
    // per-chart loading flags
    llmTokenSummaryLoading,
    llmTokenByPeriodLoading,
    llmTopTokenUsersLoading,
    // fetchers
    fetchLlmTokenSummary,
    fetchLlmTokenByPeriod,
    fetchLlmTopTokenUsers,
  } = useRecommendStore((s: any) => s);
  const [period, setPeriod] = useState<string>("month");

  const [draftStart, setDraftStart] = useState<string | null>(null);
  const [draftEnd, setDraftEnd] = useState<string | null>(null);
  const [draftTop, setDraftTop] = useState<number>(10);

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

  const [appliedStart, setAppliedStart] = useState<string | null>(null);
  const [appliedEnd, setAppliedEnd] = useState<string | null>(null);
  const [appliedTop, setAppliedTop] = useState<number>(10);

  useEffect(() => {
    function parseDdMmYyyyToIso(v: string | null): string | null {
      if (!v) return null;
      const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!m) return null;
      const [_, dd, mm, yyyy] = m;
      return `${yyyy}-${mm}-${dd}`;
    }

    void fetchLlmTokenSummary(
      parseDdMmYyyyToIso(appliedStart) ?? undefined,
      parseDdMmYyyyToIso(appliedEnd) ?? undefined
    );
    void fetchLlmTopTokenUsers(
      parseDdMmYyyyToIso(appliedStart) ?? undefined,
      parseDdMmYyyyToIso(appliedEnd) ?? undefined,
      appliedTop ?? 10
    );
  }, [
    fetchLlmTokenSummary,
    fetchLlmTopTokenUsers,
    appliedStart,
    appliedEnd,
    appliedTop,
  ]);

  useEffect(() => {
    function parseDdMmYyyyToIso(v: string | null): string | null {
      if (!v) return null;
      const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (!m) return null;
      const [_, dd, mm, yyyy] = m;
      return `${yyyy}-${mm}-${dd}`;
    }

    void fetchLlmTokenByPeriod(
      period,
      parseDdMmYyyyToIso(appliedStart) ?? undefined,
      parseDdMmYyyyToIso(appliedEnd) ?? undefined
    );
  }, [period, fetchLlmTokenByPeriod, appliedStart, appliedEnd]);

  return (
    <Card className="w-full">
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-sm">Thống kê chi phí token</CardTitle>
          <div className="text-xs text-slate-500 mt-1">
            Biểu đồ hiển thị tổng token theo khoảng thời gian đã chọn.
          </div>
        </div>

        <div className="flex-none flex gap-2">
          <Button
            variant={period === "day" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriod("day")}
          >
            Ngày
          </Button>
          <Button
            variant={period === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriod("week")}
          >
            Tuần
          </Button>
          <Button
            variant={period === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriod("month")}
          >
            Tháng
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4">
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
              <input
                type="number"
                min={1}
                className="w-full border rounded px-2 py-1"
                value={draftTop}
                onChange={(e) =>
                  setDraftTop(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </div>

            <div className="flex items-center gap-2 ml-2">
              <Button
                size="sm"
                onClick={() => {
                  setAppliedStart(draftStart);
                  setAppliedEnd(draftEnd);
                  setAppliedTop(draftTop);
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Tổng token</div>
              {llmTokenSummaryLoading ? (
                <Skeleton className="h-6 w-24 mt-1" />
              ) : (
                <div className="text-lg font-semibold">
                  {llmTokenSummary ? llmTokenSummary.totalTokens : 0}
                </div>
              )}
            </div>

            <div>
              <div className="text-sm text-slate-500">Trung bình / câu hỏi</div>
              {llmTokenSummaryLoading ? (
                <Skeleton className="h-6 w-20 mt-1" />
              ) : (
                <div className="text-lg font-semibold">
                  {(
                    (llmTokenSummary?.averageTokensPerQuestion ?? 0) as number
                  ).toFixed(1)}
                </div>
              )}
            </div>
          </div>

          <div className="h-44">
            {llmTokenByPeriodLoading ? (
              <Skeleton className="h-44 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={llmTokenByPeriod}
                  margin={{ top: 5, right: 10, left: 0, bottom: 20 }}
                >
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
                  <Bar name="Số token" dataKey="tokens" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">
              Người dùng tốn nhiều token
            </h3>
            {llmTopTokenUsersLoading ? (
              <div className="space-y-2 max-h-36 overflow-auto">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2 max-h-36 overflow-auto">
                {llmTopTokenUsers.map((u: any) => (
                  <li
                    key={u.userId}
                    className="flex items-center justify-between"
                  >
                    <div className="text-sm">{u.fullName ?? u.userId}</div>
                    <div className="text-sm font-semibold">{u.totalTokens}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsTokens;
