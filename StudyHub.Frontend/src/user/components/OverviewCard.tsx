import React, { useEffect, useState, useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import useAccountDashboardStore from "@/user/stores/useAccountDashboardStore";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/common/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/common/components/ui/popover";
import { Calendar as DatePicker } from "@/common/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  Users,
  UserCheck,
  UserMinus,
  Lock,
  Repeat,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/common/components/ui/card";

const formatDateLabel = (d: string) => {
  try {
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toLocaleDateString("en-GB");
  } catch {
    // ignore
  }
  return d;
};

const COLORS = ["#6366F1", "#06B6D4", "#F59E0B", "#EF4444", "#10B981"];

const ensureDateTimeString = (v?: string) => {
  if (!v) return undefined;
  if (v.length === 10) return `${v}T00:00`;
  if (v.length === 16) return `${v}:00`;
  return v;
};
const localNowDatetimeLocal = () => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const formatLocalYMD = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

const ymdToDate = (v?: string) => {
  if (!v) return undefined;
  const parts = v.split("-");
  if (parts.length < 3) return undefined;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return new Date(y, m - 1, d);
};

const OverviewCard: React.FC<{ schoolId?: number }> = ({ schoolId }) => {
  const overview = useAccountDashboardStore((s) => s.overview);
  const isLoading = useAccountDashboardStore((s) => s.isLoading);
  const fetchOverview = useAccountDashboardStore((s) => s.fetchOverview);

  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [range, setRange] = useState<number>(30);

  const [retentionStart, setRetentionStart] = useState<string | undefined>(
    undefined
  );
  const [retentionEnd, setRetentionEnd] = useState<string | undefined>(
    undefined
  );
  const [retentionReturnAfterDays, setRetentionReturnAfterDays] = useState<
    number | undefined
  >(undefined);
  const [avgLoginStart, setAvgLoginStart] = useState<string | undefined>(
    undefined
  );
  const [avgLoginEnd, setAvgLoginEnd] = useState<string | undefined>(undefined);

  // Capture initial calendar values in a ref so reset can restore them.
  const initialRef = useRef<{
    retentionStart?: string;
    retentionEnd?: string;
    retentionReturnAfterDays?: number;
    avgLoginStart?: string;
    avgLoginEnd?: string;
  }>({
    retentionStart: undefined,
    retentionEnd: undefined,
    retentionReturnAfterDays: undefined,
    avgLoginStart: undefined,
    avgLoginEnd: undefined,
  });

  useEffect(() => {
    // Set default end datetimes and fetch initial overview, but do not auto-fill
    // the "start" date inputs — users must pick start dates explicitly.
    fetchOverview(period, range, { schoolId }).catch(() => {});
    // store initial values after mount so reset can restore them
    initialRef.current = {
      retentionStart,
      retentionEnd,
      retentionReturnAfterDays,
      avgLoginStart,
      avgLoginEnd,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lineData = (overview?.newAccountsByPeriod ?? []).map((d) => ({
    date: formatDateLabel(d.period),
    count: d.count,
  }));

  // defensive mapping for roles distribution — support payload shapes like
  // overview.accounts.roleDistribution or overview.roleDistribution
  const rawRoles =
    (overview as any)?.accounts?.roleDistribution ??
    (overview as any)?.data?.accounts?.roleDistribution ??
    (overview as any)?.roleDistribution ??
    (overview as any)?.rolesDistribution ??
    (overview as any)?.roles ??
    [];

  const pieData = Array.isArray(rawRoles)
    ? rawRoles.map((r: any) => ({
        name:
          (r && (r.role || r.roleName || r.name || r.key)) ??
          String(r?.id ?? ""),
        value: Number(r?.count ?? r?.value ?? 0),
      }))
    : [];

  const tooltipFormatter = (value: any, name?: string) => {
    const map: Record<string, string> = {
      rate: "Tỷ lệ",
      avg: "Trung bình",
      count: "Số lượng",
    };
    const label = name ? (map as any)[name] ?? name : "";
    if (name === "rate") return [`${value}`, label];
    if (name === "avg") return [Number(value).toFixed(2), label];
    if (typeof value === "number") return [value, label];
    return [value, label];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Thống kê tổng quan tài khoản</CardTitle>
        <CardDescription>
          Tổng quan số lượng, vai trò, trạng thái và tăng trưởng
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-40 bg-gray-100" />
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-5">
                <div className="flex flex-col gap-4 w-80">
                  <Card className="rounded-lg shadow-md border-l-4 p-0 border-indigo-500">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="bg-indigo-50 text-indigo-600 rounded-md p-2">
                        <Users size={18} />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">
                          Tổng số tài khoản
                        </div>
                        <div className="text-3xl font-bold mt-2">
                          {overview?.totalUsers ?? "—"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-lg shadow-md border-l-4 p-0 border-teal-400">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="bg-teal-50 text-teal-600 rounded-md p-2">
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">
                          Tài khoản kích hoạt
                        </div>
                        <div className="text-3xl font-bold mt-2">
                          {overview?.activeCount ?? "—"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-lg shadow-md border-l-4 p-0 border-rose-400">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="bg-rose-50 text-rose-600 rounded-md p-2">
                        <UserMinus size={18} />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">
                          Tài khoản vô hiệu hóa
                        </div>
                        <div className="text-3xl font-bold mt-2">
                          {overview?.inactiveCount?.toFixed(2) ?? "—"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col gap-4 w-80">
                  <Card className="rounded-lg shadow-md border-l-4 p-0 border-amber-400">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="bg-amber-50 text-amber-600 rounded-md p-2">
                        <Lock size={18} />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">
                          Tỷ lệ tài khoản bị khóa
                        </div>
                        <div className="text-3xl font-bold mt-2">
                          {overview?.inactiveRate?.toFixed(2) ?? "—"}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-lg shadow-md border-l-4 p-0 border-violet-500">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="bg-violet-50 text-violet-600 rounded-md p-2">
                        <Repeat size={18} />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">
                          Tỷ lệ đăng nhập lại (Retention)
                        </div>
                        <div className="text-3xl font-bold mt-2">
                          {overview?.retentionRate?.toFixed(2) ?? "—"}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-lg shadow-md border-l-4 p-0 border-sky-400">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="bg-sky-50 text-sky-600 rounded-md p-2">
                        <Clock size={18} />
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">
                          Tần suất đăng nhập trung bình
                        </div>
                        <div className="text-3xl font-bold mt-2">
                          {typeof overview?.averageLoginFrequency === "number"
                            ? (
                                overview.averageLoginFrequency as number
                              ).toFixed(2)
                            : "—"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="flex justify-center md:justify-start">
                <div className="w-full max-w-md p-2">
                  <div className="text-sm text-slate-500 mb-2">
                    Phân bổ tài khoản theo vai trò
                  </div>
                  <div className="flex items-center">
                    <div
                      style={{ width: 140, height: 140 }}
                      className="flex-shrink-0"
                    >
                      <PieChart width={140} height={140}>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={36}
                          outerRadius={60}
                          paddingAngle={2}
                        >
                          {pieData.map((entry, idx) => (
                            <Cell
                              key={entry.name}
                              fill={COLORS[idx % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <ReTooltip
                          formatter={(v: any) => [`Số lượng : ${v}`]}
                        />
                      </PieChart>
                    </div>
                    <div className="ml-6 text-sm min-w-[180px]">
                      {pieData.length > 0 ? (
                        pieData.map((e, i) => {
                          const total =
                            pieData.reduce(
                              (s, it) => s + Number(it.value || 0),
                              0
                            ) || 1;
                          const pct = ((Number(e.value) / total) * 100).toFixed(
                            0
                          );
                          return (
                            <div
                              key={e.name}
                              className="flex items-center gap-3 mb-2"
                            >
                              <span
                                style={{
                                  width: 12,
                                  height: 12,
                                  backgroundColor: COLORS[i % COLORS.length],
                                }}
                                className="rounded-sm inline-block flex-shrink-0"
                              />
                              <span className="font-medium whitespace-nowrap">
                                {e.name}
                              </span>
                              <span className="ml-auto">
                                {e.value}{" "}
                                <span className="text-slate-400">({pct}%)</span>
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-muted">Chưa có dữ liệu</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-slate-500">
                  Số tài khoản mới (ngày)
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={period}
                    onValueChange={(v) => {
                      setPeriod(v as any);
                    }}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Ngày</SelectItem>
                      <SelectItem value="week">Tuần</SelectItem>
                      <SelectItem value="month">Tháng</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    className="w-20"
                    value={range}
                    onChange={(e) => {
                      const v = Number(e.target.value || 0);
                      setRange(v);
                    }}
                    min={1}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchOverview(period, range, { schoolId })}
                  >
                    Áp dụng
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setPeriod("day");
                      setRange(30);
                      fetchOverview("day", 30, { schoolId });
                    }}
                  >
                    Đặt lại
                  </Button>
                </div>
              </div>
              <div style={{ minHeight: 240 }} className="rounded-md bg-white/0">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={lineData}
                    margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <ReTooltip formatter={tooltipFormatter} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#6366F1"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border rounded">
                <div className="text-sm font-medium mb-2">Mức độ giữ chân</div>
                <div className="text-sm mb-1">
                  Kích thước nhóm:{" "}
                  <span className="font-medium">
                    {overview?.retention?.cohortCount ?? "—"}
                  </span>
                </div>
                <div className="text-sm mb-1">
                  Đã giữ chân:{" "}
                  <span className="font-medium">
                    {overview?.retention?.retainedCount ?? "—"}
                  </span>
                </div>
                <div className="text-sm mb-1">
                  Tỷ lệ đăng nhập lại:{" "}
                  <span className="font-medium">
                    {overview?.retention?.retentionRate ??
                      overview?.retentionRate ??
                      "—"}
                    %
                  </span>
                </div>
                <div className="text-sm mb-1">
                  Trở lại sau:{" "}
                  <span className="font-medium">
                    {overview?.retention?.returnAfterDays ?? "—"} ngày
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  Khoảng:{" "}
                  {overview?.retention?.cohortStart
                    ? formatDateLabel(overview.retention.cohortStart)
                    : "—"}{" "}
                  →{" "}
                  {overview?.retention?.cohortEnd
                    ? formatDateLabel(overview.retention.cohortEnd)
                    : "—"}
                </div>
                {(() => {
                  const r =
                    overview?.retention?.retentionRate ??
                    overview?.retentionRate;
                  const day = overview?.retention?.returnAfterDays ?? undefined;
                  const chartData =
                    r !== undefined ? [{ day: day ?? 0, rate: r }] : [];
                  return chartData.length > 0 ? (
                    <div style={{ height: 240 }} className="mt-2">
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          data={chartData}
                          margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                        >
                          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <ReTooltip formatter={tooltipFormatter} />
                          <Bar dataKey="rate" fill="#6366F1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null;
                })()}

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 justify-between"
                        >
                          <span className="text-left">
                            {retentionStart
                              ? formatDateLabel(retentionStart)
                              : "(Chọn ngày bắt đầu)"}
                          </span>
                          <CalendarIcon className="text-gray-400" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="bottom"
                        sideOffset={8}
                        align="center"
                        className="w-[330px] p-0 z-50"
                      >
                        <DatePicker
                          mode="single"
                          selected={
                            retentionStart
                              ? ymdToDate(retentionStart)
                              : undefined
                          }
                          onSelect={(date?: Date) => {
                            if (date) setRetentionStart(formatLocalYMD(date));
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="w-2" />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 justify-between"
                        >
                          <span className="text-left">
                            {retentionEnd
                              ? formatDateLabel(retentionEnd)
                              : "(Chọn ngày kết thúc)"}
                          </span>
                          <CalendarIcon className="text-gray-400" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="bottom"
                        sideOffset={8}
                        align="center"
                        className="w-[330px] p-0 z-50"
                      >
                        <DatePicker
                          mode="single"
                          selected={
                            retentionEnd ? ymdToDate(retentionEnd) : undefined
                          }
                          onSelect={(date?: Date) => {
                            if (date) setRetentionEnd(formatLocalYMD(date));
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="flex-1 min-w-0"
                      value={retentionReturnAfterDays ?? ""}
                      onChange={(e) =>
                        setRetentionReturnAfterDays(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      placeholder="Số ngày quay lại"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // user reset: clear values
                        setRetentionStart(undefined);
                        setRetentionEnd(undefined);
                        setRetentionReturnAfterDays(undefined);
                        fetchOverview(period, range);
                      }}
                    >
                      Đặt lại
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const nowLocal = localNowDatetimeLocal();
                        fetchOverview(period, range, {
                          retentionStart: ensureDateTimeString(retentionStart),
                          retentionEnd: ensureDateTimeString(
                            retentionEnd ?? nowLocal
                          ),
                          retentionReturnAfterDays,
                          schoolId,
                        });
                      }}
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-3 border rounded">
                <div className="text-sm font-medium mb-2">
                  Tần suất đăng nhập
                </div>
                <div className="text-sm mb-1">
                  Tổng lượt đăng nhập:{" "}
                  <span className="font-medium">
                    {overview?.averageLogin?.totalLogins ?? "—"}
                  </span>
                </div>
                <div className="text-sm mb-1">
                  Số người dùng (khác nhau):{" "}
                  <span className="font-medium">
                    {overview?.averageLogin?.distinctUsers ?? "—"}
                  </span>
                </div>
                <div className="text-sm mb-1">
                  Trung bình mỗi người:{" "}
                  <span className="font-medium">
                    {typeof overview?.averageLogin?.averagePerUser === "number"
                      ? overview.averageLogin.averagePerUser.toFixed(2)
                      : overview?.averageLoginFrequency
                      ? (overview.averageLoginFrequency as number).toFixed(2)
                      : "—"}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  Khoảng:{" "}
                  {overview?.averageLogin?.periodStart
                    ? formatDateLabel(overview.averageLogin.periodStart)
                    : "—"}{" "}
                  →{" "}
                  {overview?.averageLogin?.periodEnd
                    ? formatDateLabel(overview.averageLogin.periodEnd)
                    : "—"}
                </div>

                {(() => {
                  const avg =
                    overview?.averageLogin?.averagePerUser ??
                    overview?.averageLoginFrequency;
                  const label = overview?.averageLogin?.periodStart ?? "avg";
                  const chartData =
                    avg !== undefined
                      ? [{ period: formatDateLabel(label as string), avg }]
                      : [];
                  return chartData.length > 0 ? (
                    <div style={{ height: 240 }} className="mt-2">
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart
                          data={chartData}
                          margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                        >
                          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <ReTooltip formatter={tooltipFormatter} />
                          <Line
                            type="monotone"
                            dataKey="avg"
                            stroke="#06B6D4"
                            strokeWidth={2}
                            dot={{ r: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null;
                })()}

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 justify-between"
                        >
                          <span className="text-left">
                            {avgLoginStart
                              ? formatDateLabel(avgLoginStart)
                              : "(Chọn ngày bắt đầu)"}
                          </span>
                          <CalendarIcon className="text-gray-400" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="bottom"
                        sideOffset={8}
                        align="center"
                        className="w-[330px] p-0 z-50"
                      >
                        <DatePicker
                          mode="single"
                          selected={
                            avgLoginStart ? ymdToDate(avgLoginStart) : undefined
                          }
                          onSelect={(date?: Date) => {
                            if (date) setAvgLoginStart(formatLocalYMD(date));
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="w-2" />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 justify-between"
                        >
                          <span className="text-left">
                            {avgLoginEnd
                              ? formatDateLabel(avgLoginEnd)
                              : "(Chọn ngày kết thúc)"}
                          </span>
                          <CalendarIcon className="text-gray-400" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="bottom"
                        sideOffset={8}
                        align="center"
                        className="w-[330px] p-0 z-50"
                      >
                        <DatePicker
                          mode="single"
                          selected={
                            avgLoginEnd ? ymdToDate(avgLoginEnd) : undefined
                          }
                          onSelect={(date?: Date) => {
                            if (date) setAvgLoginEnd(formatLocalYMD(date));
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // user reset: clear values
                        setAvgLoginStart(undefined);
                        setAvgLoginEnd(undefined);
                        fetchOverview(period, range);
                      }}
                    >
                      Đặt lại
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const nowLocal = localNowDatetimeLocal();
                        fetchOverview(period, range, {
                          avgLoginStart: ensureDateTimeString(avgLoginStart),
                          avgLoginEnd: ensureDateTimeString(
                            avgLoginEnd ?? nowLocal
                          ),
                          schoolId,
                        });
                      }}
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OverviewCard;
