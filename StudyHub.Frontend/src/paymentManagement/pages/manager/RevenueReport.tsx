import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import { Separator } from "@/common/components/ui/separator";
import { format, formatISO } from "date-fns";
import { transactionService } from "@/paymentManagement/services/transactionService";
import { useTransactionStore } from "@/paymentManagement/stores/useTransactionStore";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { useAppUserStore } from "@/user/stores/useAppUserStore";

type AggregationMode = "time" | "course";

const RevenueReport: React.FC = () => {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [courseId, setCourseId] = useState<string | "All">("All");
  const [teacherId, setTeacherId] = useState<string | "All">("All");
  const [mode, setMode] = useState<AggregationMode>("time");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);

  const courses = useCourseStore((s) => s.courses);
  const fetchCourses = useCourseStore((s) => s.fetchCourses);
  const filterAppUsers = useAppUserStore((s) => s.filterAppUsers);
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    // initialize default date range to current week (Monday - Sunday)
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) - 6 (Sat)
    const diffToMonday = (day + 6) % 7; // days since Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => formatISO(d).slice(0, 10);
    setFrom(fmt(monday));
    setTo(fmt(sunday));

    // load courses and teachers lists
    fetchCourses({ page: 1, pageSize: 200 }).catch(() => {});
    (async () => {
      try {
        const r = await filterAppUsers(
          "role=00000000-0000-0000-0000-000000000003&page=1&pageSize=200"
        );
        setTeachers(r?.data ?? []);
      } catch (err) {
        // ignore
      }
    })();
  }, [fetchCourses, filterAppUsers]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // attempt to fetch a large page of transactions for reporting
      // request a large page so we have enough records for client-side aggregation
      const resp: any = await transactionService.getPendingTransactions(
        1,
        10000
      );
      const items: any[] = Array.isArray(resp?.items)
        ? resp.items
        : Array.isArray(resp?.Items)
        ? resp.Items
        : resp ?? [];
      setTransactions(items ?? []);
    } catch (err) {
      console.error("Failed to fetch transactions for report", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial fetch
    fetchData();
  }, []);

  // validate date range whenever it changes
  useEffect(() => {
    if (from && to) {
      const s = new Date(from);
      const e = new Date(to);
      if (s > e)
        setDateError("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
      else setDateError(null);
    } else {
      setDateError(null);
    }
  }, [from, to]);

  // filter by date/course/teacher
  const filtered = useMemo(() => {
    const fFrom = from ? new Date(from) : null;
    const fTo = to ? new Date(to) : null;
    return (transactions || []).filter((t) => {
      if (!t.createdAt) return false;
      const d = new Date(t.createdAt);
      if (fFrom && d < fFrom) return false;
      if (fTo) {
        // include whole day
        const end = new Date(fTo);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      if (courseId !== "All" && String(t.courseId) !== String(courseId))
        return false;
      // teacher filter: best-effort - not all transactions have teacher info
      if (teacherId !== "All") {
        // skip if course doesn't match the teacher
        const c = (courses || []).find(
          (x: any) => String(x.id) === String(t.courseId)
        );
        if (c && String(c.createdBy) !== String(teacherId)) return false;
      }
      // only revenue-related types (Deposit/TopUp/Deposit)
      if (!t.amount || t.amount <= 0) return false;
      return true;
    });
  }, [transactions, from, to, courseId, teacherId, courses]);

  // aggregation
  const aggregation = useMemo(() => {
    if (mode === "time") {
      // group by date (yyyy-MM-dd)
      const map = new Map<string, number>();
      for (const t of filtered) {
        const key = format(new Date(t.createdAt), "yyyy-MM-dd");
        map.set(key, (map.get(key) ?? 0) + Number(t.amount ?? 0));
      }
      const entries = Array.from(map.entries()).sort((a, b) =>
        a[0].localeCompare(b[0])
      );
      return {
        labels: entries.map((e) => e[0]),
        values: entries.map((e) => e[1]),
      };
    }
    // by course
    const map = new Map<string, number>();
    for (const t of filtered) {
      const cid = t.courseId ? String(t.courseId) : "(none)";
      map.set(cid, (map.get(cid) ?? 0) + Number(t.amount ?? 0));
    }
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const labels = entries.map((e) => {
      const c = (courses || []).find((x: any) => String(x.id) === e[0]);
      return c ? c.name : e[0];
    });
    const values = entries.map((e) => e[1]);
    return { labels, values };
  }, [mode, filtered, courses]);

  // summary metrics
  const summary = useMemo(() => {
    const totalRevenue = (filtered || []).reduce(
      (s, t) => s + Number(t.amount ?? 0),
      0
    );
    const txCount = (filtered || []).length;
    const avg = txCount > 0 ? totalRevenue / txCount : 0;

    // top courses by revenue
    const courseMap = new Map<string, number>();
    for (const t of filtered) {
      const cid = t.courseId ? String(t.courseId) : "(none)";
      courseMap.set(cid, (courseMap.get(cid) ?? 0) + Number(t.amount ?? 0));
    }
    const courseEntries = Array.from(courseMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const topCourses = courseEntries.slice(0, 5).map(([cid, amt]) => {
      const c = (courses || []).find((x: any) => String(x.id) === cid);
      return { id: cid, name: c ? c.name : cid, amount: amt };
    });

    // top teachers by revenue (best-effort using course.createdBy)
    const teacherMap = new Map<string, number>();
    for (const t of filtered) {
      const c = (courses || []).find(
        (x: any) => String(x.id) === String(t.courseId)
      );
      const tid = c ? String(c.createdBy) : "(unknown)";
      teacherMap.set(tid, (teacherMap.get(tid) ?? 0) + Number(t.amount ?? 0));
    }
    const teacherEntries = Array.from(teacherMap.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    const topTeachers = teacherEntries.slice(0, 5).map(([tid, amt]) => {
      const t = teachers.find((x: any) => String(x.id) === tid);
      return { id: tid, name: t ? t.fullname || t.username : tid, amount: amt };
    });

    return { totalRevenue, txCount, avg, topCourses, topTeachers };
  }, [filtered, courses, teachers]);

  const exportRevenueCsv = async () => {
    const txStore = useTransactionStore.getState();
    const opts = {
      from: from || undefined,
      to: to || undefined,
      courseId: courseId === "All" ? undefined : String(courseId),
      teacherId: teacherId === "All" ? undefined : String(teacherId),
      mode: mode,
    } as any;
    try {
      const blob = await txStore.exportRevenueCsv(opts);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `revenue_report_${formatISO(new Date()).slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export revenue CSV failed", err);
    }
  };
  const exportRevenueDoc = async () => {
    // validate date range
    if (!from || !to) {
      setDateError("Ngày bắt đầu và kết thúc là bắt buộc");
      return;
    }
    const s = new Date(from);
    const e = new Date(to);
    if (s > e) {
      setDateError("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
      return;
    }
    setDateError(null);

    const txStore = useTransactionStore.getState();
    const opts = {
      from: from || undefined,
      to: to || undefined,
      courseId: courseId === "All" ? undefined : String(courseId),
      teacherId: teacherId === "All" ? undefined : String(teacherId),
      mode: mode,
    } as any;
    try {
      const blob = await txStore.exportRevenueDoc(opts);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `revenue_report_${formatISO(new Date()).slice(0, 10)}.doc`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export revenue DOC failed", err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto scrollbar-hide">
      <Card className="shadow-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            <span>Báo cáo doanh thu</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={exportRevenueCsv}
                className="bg-emerald-600 text-white"
                disabled={loading || !!dateError}
              >
                Xuất Excel
              </Button>
              <Button
                size="sm"
                onClick={exportRevenueDoc}
                className="bg-slate-700 text-white"
                disabled={loading || !!dateError}
              >
                Xuất Word
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent>
          {/* Top summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="p-4 rounded shadow-sm border-l-4 border-emerald-500 bg-gradient-to-r from-emerald-50 to-white flex flex-col">
              <div className="text-xs text-emerald-600">Tổng doanh thu</div>
              <div className="text-2xl font-extrabold mt-2 text-emerald-800">
                {summary.totalRevenue.toLocaleString()}₫
              </div>
              <div className="text-xs text-emerald-500 mt-1">
                Từ bộ lọc hiện tại
              </div>
            </div>
            <div className="p-4 rounded shadow-sm border-l-4 border-sky-500 bg-gradient-to-r from-sky-50 to-white flex flex-col">
              <div className="text-xs text-sky-600">Số giao dịch</div>
              <div className="text-2xl font-extrabold mt-2 text-sky-800">
                {summary.txCount}
              </div>
              <div className="text-xs text-sky-500 mt-1">Giao dịch phù hợp</div>
            </div>
            <div className="p-4 rounded shadow-sm border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-white flex flex-col">
              <div className="text-xs text-amber-600">
                Trung bình / giao dịch
              </div>
              <div className="text-2xl font-extrabold mt-2 text-amber-800">
                {summary.avg.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
                ₫
              </div>
              <div className="text-xs text-amber-500 mt-1">
                Giá trị trung bình
              </div>
            </div>
            <div className="p-4 rounded shadow-sm border-l-4 border-violet-500 bg-gradient-to-r from-violet-50 to-white flex flex-col">
              <div className="text-xs text-violet-600">Khóa học hàng đầu</div>
              <div className="text-lg font-semibold mt-2 text-violet-800">
                {summary.topCourses[0]?.name ?? "-"}
              </div>
              <div className="text-xs text-violet-500 mt-1">
                {summary.topCourses[0]?.amount?.toLocaleString() ?? "0"}₫
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-4 items-end">
            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-600">Từ</div>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-slate-600">Đến</div>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            {dateError ? (
              <div className="text-sm text-red-600 ml-2">{dateError}</div>
            ) : null}

            <Select
              value={courseId}
              onValueChange={(v) => setCourseId(v as any)}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Chọn khóa học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Tất cả khóa học</SelectItem>
                {(courses || []).map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={teacherId}
              onValueChange={(v) => setTeacherId(v as any)}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Chọn người bán / giảng viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Tất cả giáo viên</SelectItem>
                {(teachers || []).map((t: any) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.fullname || t.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={mode} onValueChange={(v) => setMode(v as any)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Chế độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">Theo thời gian</SelectItem>
                <SelectItem value="course">Theo khóa học</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto">
              <Button
                size="sm"
                onClick={fetchData}
                className="bg-primary text-white"
              >
                Tải lại dữ liệu
              </Button>
            </div>
          </div>

          {/* SVG bar chart for better visuals */}
          <div className="mb-6">
            <div className="text-sm text-slate-600 mb-2">Biểu đồ</div>
            <div className="w-full h-56 bg-white border rounded-md p-2">
              {/* debug: show loaded / filtered counts and samples to help diagnose empty chart */}
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500">
                  Đã tải: <strong>{transactions.length}</strong> giao dịch •
                  Lọc: <strong>{filtered.length}</strong>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const day = today.getDay();
                      const diffToMonday = (day + 6) % 7;
                      const monday = new Date(today);
                      monday.setDate(today.getDate() - diffToMonday);
                      const sunday = new Date(monday);
                      sunday.setDate(monday.getDate() + 6);
                      setFrom(formatISO(monday).slice(0, 10));
                      setTo(formatISO(sunday).slice(0, 10));
                    }}
                    className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Tuần này
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const startOfMonth = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        1
                      );
                      const endOfMonth = new Date(
                        now.getFullYear(),
                        now.getMonth() + 1,
                        0
                      );
                      setFrom(formatISO(startOfMonth).slice(0, 10));
                      setTo(formatISO(endOfMonth).slice(0, 10));
                    }}
                    className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    30 ngày
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const now = new Date();
                      const startOfYear = new Date(now.getFullYear(), 0, 1);
                      const endOfYear = new Date(now.getFullYear(), 11, 31);
                      setFrom(formatISO(startOfYear).slice(0, 10));
                      setTo(formatISO(endOfYear).slice(0, 10));
                    }}
                    className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    1 năm
                  </Button>
                </div>
              </div>

              {aggregation.labels.length === 0 ? (
                <div className="text-gray-400 p-4">Không có dữ liệu</div>
              ) : (
                <svg
                  viewBox={`0 0 ${Math.max(
                    aggregation.labels.length * 80,
                    300
                  )} 180`}
                  className="w-full h-56"
                >
                  <defs>
                    <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="60%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const max = Math.max(...aggregation.values, 1);
                    const gap = 20;
                    const barW = 40;
                    return aggregation.values.map((v: number, i: number) => {
                      const x = i * (barW + gap) + gap;
                      const h = Math.round((v / max) * 120);
                      const y = 140 - h;
                      return (
                        <g key={i}>
                          <rect
                            x={x}
                            y={y}
                            width={barW}
                            height={h}
                            rx={6}
                            fill="url(#revGrad)"
                          />
                          <text
                            x={x + barW / 2}
                            y={156}
                            fontSize={10}
                            textAnchor="middle"
                            fill="#334155"
                          >
                            {String(aggregation.labels[i]).slice(0, 12)}
                          </text>
                          <text
                            x={x + barW / 2}
                            y={y - 6}
                            fontSize={10}
                            textAnchor="middle"
                            fill="#0f172a"
                          >
                            {v.toLocaleString()}
                          </text>
                        </g>
                      );
                    });
                  })()}
                </svg>
              )}
              {/* when no labels show samples to help debugging */}
              {aggregation.labels.length === 0 && filtered.length > 0 ? (
                <div className="mt-3 text-xs">
                  <div className="text-slate-600 mb-1">
                    Ví dụ giao dịch sau lọc (3 mục đầu):
                  </div>
                  <ul className="text-xs list-disc ml-5 text-slate-700">
                    {filtered.slice(0, 3).map((t: any, i: number) => (
                      <li key={i}>
                        {t.createdAt} — {Number(t.amount).toLocaleString()}₫ —
                        khóa học: {t.courseId ?? "(none)"}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          {/* Top lists: courses and teachers */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded bg-gradient-to-br from-white via-slate-50 to-white border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-slate-600">
                  Top khóa học (theo doanh thu)
                </div>
                <div className="text-xs text-slate-400">Top 5</div>
              </div>
              <div className="space-y-2">
                {summary.topCourses.length === 0 ? (
                  <div className="text-sm text-slate-500">Không có dữ liệu</div>
                ) : (
                  summary.topCourses.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            i === 0
                              ? "bg-emerald-500"
                              : i === 1
                              ? "bg-sky-500"
                              : i === 2
                              ? "bg-amber-500"
                              : i === 3
                              ? "bg-violet-500"
                              : "bg-slate-300"
                          }`}
                        ></span>
                        <span className="truncate text-sm">{c.name}</span>
                      </div>
                      <div className="text-sm font-medium text-slate-800">
                        {c.amount.toLocaleString()}₫
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-4 rounded bg-gradient-to-br from-white via-slate-50 to-white border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-slate-600">
                  Top giảng viên (theo doanh thu)
                </div>
                <div className="text-xs text-slate-400">Top 5</div>
              </div>
              <div className="space-y-2">
                {summary.topTeachers.length === 0 ? (
                  <div className="text-sm text-slate-500">Không có dữ liệu</div>
                ) : (
                  summary.topTeachers.map((t: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            i === 0
                              ? "bg-emerald-500"
                              : i === 1
                              ? "bg-sky-500"
                              : i === 2
                              ? "bg-amber-500"
                              : i === 3
                              ? "bg-violet-500"
                              : "bg-slate-300"
                          }`}
                        ></span>
                        <span className="truncate text-sm">{t.name}</span>
                      </div>
                      <div className="text-sm font-medium text-slate-800">
                        {t.amount.toLocaleString()}₫
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* aggregated table */}
          <div>
            <div className="text-sm text-slate-600 mb-2">Bảng tổng hợp</div>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Label</th>
                    <th className="text-right px-3 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregation.labels.map((l: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{l}</td>
                      <td className="px-3 py-2 text-right">
                        {aggregation.values[i].toLocaleString()}₫
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueReport;
