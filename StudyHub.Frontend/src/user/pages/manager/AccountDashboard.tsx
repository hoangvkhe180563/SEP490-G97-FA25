import React, { useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import useAccountDashboardStore from "@/user/stores/useAccountDashboardStore";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { Input } from "@/common/components/ui/input";
import { Skeleton } from "@/common/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/common/components/ui/card";
import { useState } from "react";
// Removed unused type import

const COLORS = ["#6366F1", "#06B6D4", "#F59E0B", "#EF4444", "#10B981"];

const StatCard: React.FC<{
  title: string;
  value: React.ReactNode;
  subtitle?: string;
}> = ({ title, value, subtitle }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {subtitle && <CardDescription>{subtitle}</CardDescription>}
    </CardHeader>
    <CardContent>
      <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
        {value}
      </div>
    </CardContent>
  </Card>
);

const formatDateLabel = (d: string) => {
  // try to show short date
  try {
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toLocaleDateString();
  } catch {
    /* noop */
  }
  return d;
};

const AccountDashboard: React.FC = () => {
  const { overview, recovery, isLoading, error, fetchAll } =
    useAccountDashboardStore();
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [range, setRange] = useState<number>(30);

  useEffect(() => {
    fetchAll("day", 30).catch(() => {});
  }, [fetchAll]);

  const handleApply = () => {
    fetchAll(period, range).catch(() => {});
  };

  // Human-friendly labels (VN) for the selected period. These are only for UI.
  const periodLabel =
    period === "day" ? "Ngày" : period === "week" ? "Tuần" : "Tháng";
  const periodLabelShort =
    period === "day" ? "ngày" : period === "week" ? "tuần" : "tháng";
  const countLabel = `Số tài khoản (${periodLabelShort})`;

  const roleData = (overview?.roleDistribution ?? []).map((r) => ({
    name: r.role,
    value: r.count,
  }));
  const lineData = (overview?.newAccountsByPeriod ?? []).map((d) => ({
    date: formatDateLabel(d.period),
    count: d.count,
  }));
  const recoveryPieData = [
    { name: "Approved", value: recovery?.approvedCount ?? 0 },
    { name: "Rejected", value: recovery?.rejectedCount ?? 0 },
  ];

  return (
    <div className="p-4 max-h-screen overflow-y-auto">
      <h2 className="text-2xl font-semibold mb-4">Dashboard tài khoản</h2>

      {error && (
        <div className="flex items-center gap-4 mb-3">
          <div className="text-sm text-red-600">{error}</div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchAll(period, range)}
          >
            Thử lại
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {isLoading ? (
          <>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </>
        ) : (
          <>
            <StatCard
              title="Tổng tài khoản"
              value={overview?.totalUsers ?? "—"}
              subtitle="Số lượng người dùng hiện có"
            />
            <StatCard
              title="Tài khoản kích hoạt"
              value={`${overview?.activeCount ?? "—"}`}
              subtitle={`Tỷ lệ: ${
                overview?.inactiveRate !== undefined && overview.totalUsers
                  ? `${Math.round(100 - overview.inactiveRate)}%`
                  : overview?.inactiveRate !== undefined
                  ? `${Math.round(100 - overview.inactiveRate)}%`
                  : "—"
              }`}
            />
            <StatCard
              title="Tài khoản chưa kích hoạt"
              value={`${overview?.inactiveCount ?? "—"}`}
              subtitle={`Tỷ lệ: ${
                overview?.inactiveRate !== undefined
                  ? overview.inactiveRate + "%"
                  : "—"
              }`}
            />
          </>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-500">Khoảng:</div>
          <Select onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue>{periodLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Ngày</SelectItem>
              <SelectItem value="week">Tuần</SelectItem>
              <SelectItem value="month">Tháng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-500">Trong khoảng:</div>
          <Input
            type="number"
            className="w-24"
            value={String(range)}
            onChange={(e) => setRange(Number(e.target.value || 0))}
          />
        </div>

        <Button size="sm" variant="default" onClick={handleApply}>
          Áp dụng
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Tài khoản mới theo thời gian</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64">
                <Skeleton className="h-full" />
              </div>
            ) : (
              <div className="min-w-0" style={{ minHeight: 260 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart
                    data={lineData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <ReTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name={countLabel}
                      stroke="#6366F1"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Phân bổ theo vai trò</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-52">
                  <Skeleton className="h-full" />
                </div>
              ) : (
                <div
                  style={{ width: "100%", height: 220 }}
                  className="min-w-0 min-h-[220px]"
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={roleData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {roleData.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ReTooltip />
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yêu cầu khôi phục</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-24" />
              ) : (
                <div className="flex items-center gap-4">
                  <div
                    style={{ width: 120, height: 120 }}
                    className="min-w-0 min-h-[120px]"
                  >
                    <ResponsiveContainer width="100%" height={120}>
                      <PieChart>
                        <Pie
                          data={recoveryPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={48}
                          label={false}
                        >
                          <Cell key="c-0" fill="#10B981" />
                          <Cell key="c-1" fill="#EF4444" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="text-2xl font-semibold">
                      {recovery?.totalRequests ?? "—"}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span
                        className="inline-block w-3 h-3 rounded-full bg-emerald-500"
                        aria-hidden
                      />
                      <span className="text-slate-700 dark:text-slate-300">
                        Phê duyệt
                      </span>
                      <span className="text-slate-500">
                        {recovery?.approvedCount ?? "—"}
                      </span>
                      <span className="text-slate-400">
                        ({recovery?.approvedRate ?? "—"}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <span
                        className="inline-block w-3 h-3 rounded-full bg-red-500"
                        aria-hidden
                      />
                      <span className="text-slate-700 dark:text-slate-300">
                        Từ chối
                      </span>
                      <span className="text-slate-500">
                        {recovery?.rejectedCount ?? "—"}
                      </span>
                      <span className="text-slate-400">
                        ({recovery?.rejectedRate ?? "—"}%)
                      </span>
                    </div>

                    <div className="text-sm text-slate-400">
                      Thời gian trung bình:{" "}
                      {recovery?.averageResolveMinutes
                        ? recovery.averageResolveMinutes.toFixed(1)
                        : "—"}{" "}
                      phút
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2 text-sm text-slate-500">
              Báo cáo tóm tắt tài khoản. Thay đổi khoảng thời gian xem để cập
              nhật dữ liệu.
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <div className="mt-4 text-sm text-slate-500">Đang tải dữ liệu...</div>
      )}
    </div>
  );
};

export default AccountDashboard;
