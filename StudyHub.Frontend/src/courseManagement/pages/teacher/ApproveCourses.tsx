import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/common/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/common/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/common/components/ui/alert-dialog";
import { Button } from "@/common/components/ui/button";
import { Clock, XCircle, User, BookOpen } from "lucide-react";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { format, formatISO } from "date-fns";
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
  Legend,
} from "recharts";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import courseApi from "@/courseManagement/services/courseService";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";

const ApproveCourses: React.FC = () => {
  const navigate = useNavigate();
  const fetchCourses = useCourseStore((s) => s.fetchCourses);
  const courses = useCourseStore((s) => s.courses);
  const loading = useCourseStore((s) => s.loading);
  const fetchCourseById = useCourseStore((s) => s.fetchCourseById);
  const updateCourse = useCourseStore((s) => s.updateCourse);
  const authUser = useAuthStore((s) => s.user);

  const [query, setQuery] = useState("");
  // statsRange: determines how far back to include courses for statistics
  const [statsRange, setStatsRange] = useState<"week" | "month" | "year">(
    "week"
  );
  const [statsCourses, setStatsCourses] = useState<any[]>([]);
  const fetchEnrollmentCounts = useEnrollmentStore((s) => s.fetchCounts);
  const enrollmentCounts = useEnrollmentStore((s) => s.enrollmentCounts);
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});

  const fetchStats = async () => {
    try {
      // retrieve a reasonable number of recent courses for stats (use large pageSize)
      const res = await courseApi.getCourses({
        page: 1,
        pageSize: 200,
        schoolId: authUser?.schoolId,
      });
      let items = res.items || [];

      const now = new Date();
      now.setHours(23, 59, 59, 999);

      const cutoff = new Date();
      if (statsRange === "week") {
        cutoff.setDate(now.getDate() - 7);
      } else if (statsRange === "month") {
        cutoff.setMonth(now.getMonth() - 1);
      } else {
        cutoff.setFullYear(now.getFullYear() - 1);
      }

      cutoff.setHours(0, 0, 0, 0);

      items = items.filter((c: any) => {
        if (!c.createdAt) return false;
        try {
          const d = new Date(c.createdAt);
          return d >= cutoff;
        } catch (e) {
          return false;
        }
      });

      setStatsCourses(items);

      try {
        const fromLocal = new Date(
          cutoff.getTime() - cutoff.getTimezoneOffset() * 60000
        );
        const from = fromLocal.toISOString();

        const toLocal = new Date(
          now.getTime() - now.getTimezoneOffset() * 60000
        );
        const to = toLocal.toISOString();

        await fetchEnrollmentCounts({ from, to, schoolId: authUser?.schoolId });
      } catch (e) {
        // ignore errors; store will remain empty
      }
      const ids = Array.from(
        new Set(items.map((c: any) => String(c.createdBy)).filter(Boolean))
      );
      resolveCreatorNames(ids).catch(() => {});
    } catch (err) {
      console.error("Failed to fetch stats courses", err);
      setStatsCourses([]);
    }
  };

  const resolveCreatorNames = async (ids: string[]) => {
    const toFetch = ids.filter((id) => id && !creatorNames[id]);
    if (toFetch.length === 0) return;
    const next: Record<string, string> = {};
    for (const id of toFetch) {
      // Prefer the teacher name already present on the course object
      const courseWithName = (courses || []).find(
        (c: any) => String(c.createdBy) === String(id) && c.teacherCreatedName
      );
      if (courseWithName && courseWithName.teacherCreatedName) {
        next[id] = courseWithName.teacherCreatedName;
        continue;
      }

      // If no course-level name is available, fall back to the id (do not call API)
      next[id] = id;
    }
    setCreatorNames((prev) => ({ ...prev, ...next }));
  };

  useEffect(() => {
    fetchCourses({ page: 1, pageSize: 50, isApproved: false });
  }, [fetchCourses]);

  useEffect(() => {
    if (!authUser?.schoolId) return;
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsRange, authUser?.schoolId]);

  // keep creator names up-to-date when pending courses list changes
  useEffect(() => {
    const ids = Array.from(
      new Set(
        (courses || []).map((c: any) => String(c.createdBy)).filter(Boolean)
      )
    );
    if (ids.length > 0) resolveCreatorNames(ids).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses]);

  // Dashboard statistics derived from recent courses (statsCourses)
  const stats = useMemo(() => {
    const items = statsCourses || [];
    const pendingCount = items.filter(
      (c: any) => c.isApproved === false || c.isApproved == null
    ).length;
    const totalLoaded = items.length;

    // by subject
    const subjectMap = new Map<number, number>();
    for (const c of items) {
      const sid = c.subjectId ?? -1;
      subjectMap.set(sid, (subjectMap.get(sid) ?? 0) + 1);
    }
    const topSubjects = Array.from(subjectMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, cnt]) => {
        const sample = items.find((it: any) => (it.subjectId ?? -1) === id);
        const name = sample?.subject?.name ?? sample?.subjectName ?? String(id);
        return { id, count: cnt, name };
      });

    // by creator
    const creatorMap = new Map<string, number>();
    for (const c of items) {
      const key = c.createdBy ?? "(unknown)";
      creatorMap.set(key, (creatorMap.get(key) ?? 0) + 1);
    }
    const topCreators = Array.from(creatorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, cnt]) => ({ id, count: cnt }));

    // recent submissions (most recent first) — include all recent items
    const recent = items
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    // submissions per day (last 14 days)
    const perDay = new Map<string, number>();
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = format(d, "yyyy-MM-dd");
      perDay.set(key, 0);
    }
    for (const c of items) {
      if (!c.createdAt) continue;
      const k = format(new Date(c.createdAt), "yyyy-MM-dd");
      if (perDay.has(k)) perDay.set(k, (perDay.get(k) ?? 0) + 1);
    }

    return {
      pendingCount,
      totalLoaded,
      topSubjects,
      topCreators,
      recent,
      perDay,
    };
  }, [statsCourses]);

  // Additional stats for cards and charts
  const extraStats = useMemo(() => {
    const items = statsCourses || [];
    const now = new Date();

    // Average approval time in days: use courses that have createdAt and updatedAt
    const approvedItems = items.filter(
      (c: any) =>
        c.createdAt &&
        c.updatedAt &&
        (c.isApproved === true ||
          String(c.status).toLowerCase().includes("nháp") ||
          String(c.status).toLowerCase().includes("mở"))
    );
    const approvalDiffs: number[] = [];
    for (const c of approvedItems) {
      try {
        const created = new Date(c.createdAt).getTime();
        const updated = new Date(c.updatedAt).getTime();
        if (!isNaN(created) && !isNaN(updated) && updated >= created) {
          approvalDiffs.push((updated - created) / (1000 * 60 * 60 * 24));
        }
      } catch (e) {
        // ignore parse errors
      }
    }
    const avgApprovalDays = approvalDiffs.length
      ? approvalDiffs.reduce((s, n) => s + n, 0) / approvalDiffs.length
      : 0;

    // Rejection rate: count items that look rejected
    const rejected = items.filter((c: any) => {
      const st = String(c.status ?? "").toLowerCase();
      if (
        st.includes("từ chối") ||
        st.includes("tuchoi") ||
        st.includes("rejected") ||
        st.includes("reject")
      )
        return true;
      // closed + not approved => rejected in our mapping
      if (st.includes("đóng") || st.includes("dong") || st.includes("closed")) {
        return c.isApproved === false;
      }
      return false;
    }).length;

    const rejectionRate = items.length
      ? Math.round((rejected / items.length) * 100)
      : 0;

    // top creator full name
    const creatorCounts: Array<{ id: string; count: number }> = [];
    const cmap = new Map<string, number>();
    for (const c of items) {
      const k = String(c.createdBy ?? "(unknown)");
      cmap.set(k, (cmap.get(k) ?? 0) + 1);
    }
    for (const [id, cnt] of cmap.entries())
      creatorCounts.push({ id, count: cnt });
    creatorCounts.sort((a, b) => b.count - a.count);
    const topCreatorId = creatorCounts[0]?.id ?? null;
    const topCreatorName = topCreatorId
      ? creatorNames[String(topCreatorId)] ?? topCreatorId
      : "-";

    // top subject for this month: filter items created within current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthItems = items.filter((c: any) => {
      if (!c.createdAt) return false;
      const d = new Date(c.createdAt);
      return d >= monthStart && d < monthEnd;
    });
    const subjectMapThisMonth = new Map<number, number>();
    for (const c of monthItems) {
      const sid = c.subjectId ?? -1;
      subjectMapThisMonth.set(sid, (subjectMapThisMonth.get(sid) ?? 0) + 1);
    }
    const topSubjectMonth = Array.from(subjectMapThisMonth.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];
    const topSubjectMonthName = topSubjectMonth
      ? items.find((it: any) => (it.subjectId ?? -1) === topSubjectMonth[0])
          ?.subject?.name ??
        items.find((it: any) => (it.subjectId ?? -1) === topSubjectMonth[0])
          ?.subjectName ??
        String(topSubjectMonth[0])
      : "-";

    // bar chart: courses by creator (top 10)
    const barData = creatorCounts.slice(0, 10).map((x) => ({
      name: creatorNames[String(x.id)] ?? String(x.id),
      count: x.count,
    }));

    // pie chart: status distribution
    const statusMap = new Map<string, number>();
    for (const c of items) {
      const st = String(c.status ?? "Nháp");
      statusMap.set(st, (statusMap.get(st) ?? 0) + 1);
    }
    const pieData = Array.from(statusMap.entries()).map(([k, v]) => ({
      name: k,
      value: v,
    }));

    // top enrolled courses computed from enrollmentCounts map (fallback 0)
    const topEnrolled = (items || [])
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        count: Number(enrollmentCounts[Number(c.id)] ?? 0),
      }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    console.log("Extra stats computed:", topEnrolled);
    return {
      avgApprovalDays: avgApprovalDays,
      rejectionRate,
      topCreatorName,
      topSubjectMonthName,
      barData,
      pieData,
      topEnrolled,
    };
  }, [statsCourses, creatorNames, enrollmentCounts]);

  // chart data aggregated by selected statsRange
  const chartData = React.useMemo(() => {
    const items = statsCourses || [];
    const now = new Date();

    if (statsRange === "week") {
      // last 7 days (labels as dd/MM)
      const buckets: { label: string; count: number; date: string }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = format(d, "yyyy-MM-dd");
        buckets.push({ label: format(d, "dd/MM"), count: 0, date: key });
      }
      for (const c of items) {
        if (!c.createdAt) continue;
        const d = new Date(c.createdAt);
        const k = format(d, "yyyy-MM-dd");
        const b = buckets.find((x) => x.date === k);
        if (b) b.count++;
      }
      return buckets.map((b) => ({ label: b.label, count: b.count }));
    }

    if (statsRange === "month") {
      // last 30 days
      const days = 30;
      const buckets: { label: string; count: number; date: string }[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = format(d, "yyyy-MM-dd");
        buckets.push({ label: format(d, "dd/MM"), count: 0, date: key });
      }
      for (const c of items) {
        if (!c.createdAt) continue;
        const d = new Date(c.createdAt);
        const k = format(d, "yyyy-MM-dd");
        const b = buckets.find((x) => x.date === k);
        if (b) b.count++;
      }
      return buckets.map((b) => ({ label: b.label, count: b.count }));
    }

    // year: group by month for last 12 months
    const months: { label: string; count: number; yearMonth: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, "yyyy-MM");
      months.push({ label: format(d, "MM/yyyy"), count: 0, yearMonth: key });
    }
    for (const c of items) {
      if (!c.createdAt) continue;
      const d = new Date(c.createdAt);
      const k = format(d, "yyyy-MM");
      const m = months.find((x) => x.yearMonth === k);
      if (m) m.count++;
    }
    return months.map((m) => ({ label: m.label, count: m.count }));
  }, [statsCourses, statsRange]);

  // 🔍 Lọc động (không cần nút)
  const filteredCourses = useMemo(() => {
    const keyword = query.toLowerCase().trim();
    return courses.filter(
      (c: any) =>
        (c.isApproved === false ||
          c.isApproved === null ||
          c.isApproved === undefined) &&
        (!keyword || c.name.toLowerCase().includes(keyword))
    );
  }, [courses, query]);

  // ✅ Duyệt
  const handleApprove = async (id: number) => {
    try {
      await fetchCourseById(id);
      const selected = useCourseStore.getState().selectedCourse;
      if (!selected) return alert("Không tìm thấy khóa học!");
      const dto: any = {
        ...selected,
        updatedAt: formatISO(new Date()),
        updatedBy: authUser?.id ?? null,
      };

      // If the course is an edit-request, approving it should move it to Draft ('Nháp')
      // and mark it as approved so the owner can edit the draft.
      if (String(selected.status).trim() === "Chỉnh sửa") {
        dto.status = "Nháp";
        dto.isApproved = true;
      } else {
        dto.isApproved = true;
      }

      await updateCourse(id, dto);
      await fetchCourses({
        page: 1,
        pageSize: 50,
        isApproved: false,
      });
    } catch (err) {
      console.error("Approve failed", err);
      alert("❌ Duyệt thất bại!");
    }
  };

  // ❌ Từ chối
  const handleReject = async (id: number) => {
    try {
      await fetchCourseById(id);
      const selected = useCourseStore.getState().selectedCourse;
      if (!selected) return alert("Không tìm thấy khóa học!");
      const dto: any = {
        ...selected,
        updatedAt: formatISO(new Date()),
        updatedBy: authUser?.id ?? null,
      };

      // If the course was an edit-request, rejecting the request should reopen the
      // course (set status to 'Mở') and mark it as approved/open.
      if (String(selected.status).trim() === "Chỉnh sửa") {
        dto.status = "Mở";
        dto.isApproved = true;
      } else {
        dto.status = "Nháp";
        dto.isApproved = true;
      }

      await updateCourse(id, dto);
      await fetchCourses({
        page: 1,
        pageSize: 50,
        isApproved: false,
      });
    } catch (err) {
      console.error("Reject failed", err);
      alert("❌ Từ chối thất bại!");
    }
  };

  // 📦 Render
  return (
    <div className="p-8 w-full mx-auto h-full overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-800">
          Duyệt khóa học
        </h1>

        <Input
          placeholder="Tìm kiếm khóa học..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-80"
        />
        <div className="w-44">
          <Select
            value={statsRange}
            onValueChange={(v) => setStatsRange(v as "week" | "month" | "year")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Phạm vi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Tuần</SelectItem>
              <SelectItem value="month">Tháng</SelectItem>
              <SelectItem value="year">Năm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dashboard summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded bg-gradient-to-r from-emerald-50 to-white border-l-4 border-emerald-500 shadow-sm">
          <div className="text-xs text-emerald-600">Khóa chờ duyệt</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">
            {stats.pendingCount}
          </div>
          <div className="text-xs text-slate-400">Hiện trong bộ nhớ</div>
        </div>
        <div className="p-4 rounded bg-gradient-to-r from-sky-50 to-white border-l-4 border-sky-500 shadow-sm">
          <div className="text-xs text-sky-600">Khóa đã tải</div>
          <div className="text-2xl font-bold text-sky-800 mt-1">
            {stats.totalLoaded}
          </div>
          <div className="text-xs text-slate-400">Tổng mục lấy về</div>
        </div>
        <div className="p-4 rounded bg-gradient-to-r from-amber-50 to-white border-l-4 border-amber-500 shadow-sm">
          <div className="text-xs text-amber-600">
            {statsRange === "week"
              ? "Mục mới (7d)"
              : statsRange === "month"
              ? "Mục mới (30d)"
              : "Mục mới (12 tháng)"}
          </div>
          <div className="text-2xl font-bold text-amber-800 mt-1">
            {Array.from(stats.perDay.values()).reduce((s, n) => s + n, 0)}
          </div>
          <div className="text-xs text-slate-400">Tổng nộp trong 14 ngày</div>
        </div>
        <div className="p-4 rounded bg-gradient-to-r from-violet-50 to-white border-l-4 border-violet-500 shadow-sm">
          <div className="text-xs text-violet-600">Phổ biến theo môn</div>
          <div className="text-sm mt-1 text-violet-800">
            {stats.topSubjects[0]?.name ?? "-"}
          </div>
          <div className="text-xs text-slate-400">
            Số: {stats.topSubjects[0]?.count ?? 0}
          </div>
        </div>
      </div>

      {/* Additional statistic cards requested */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded bg-white border shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <div className="text-xs text-slate-600">
              Thời gian duyệt trung bình
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800 mt-1">
            {extraStats.avgApprovalDays
              ? `${extraStats.avgApprovalDays.toFixed(1)} ngày`
              : "-"}
          </div>
          <div className="text-xs text-slate-400">
            Trung bình từ nộp → duyệt
          </div>
        </div>

        <div className="p-4 rounded bg-white border shadow-sm">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <div className="text-xs text-slate-600">Tỉ lệ từ chối</div>
          </div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {extraStats.rejectionRate}%
          </div>
          <div className="text-xs text-slate-400">
            Tổng trong phạm vi đã chọn
          </div>
        </div>

        <div className="p-4 rounded bg-white border shadow-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-600" />
            <div className="text-xs text-slate-600">
              Giảng viên tạo nhiều nhất
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-800 mt-1">
            {extraStats.topCreatorName}
          </div>
          <div className="text-xs text-slate-400">Người có nhiều khóa</div>
        </div>

        <div className="p-4 rounded bg-white border shadow-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-600" />
            <div className="text-xs text-slate-600">
              Môn có nhiều khóa nhất tháng này
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-800 mt-1">
            {extraStats.topSubjectMonthName}
          </div>
          <div className="text-xs text-slate-400">Tháng hiện tại</div>
        </div>
      </div>

      {/* Sparkline & recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="col-span-3 p-4 border rounded bg-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-600">
              Lịch nộp bài (
              {statsRange === "week"
                ? "7 ngày"
                : statsRange === "month"
                ? "30 ngày"
                : "12 tháng"}
              )
            </div>
            <div className="text-xs text-slate-400">
              Tổng: {chartData.reduce((s, n) => s + (n.count ?? 0), 0)}
            </div>
          </div>
          <div className="w-full h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <ReTooltip />
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
        {/* New charts: Bar (courses by creator) and Pie (status distribution) + Top enrolled */}
        <div className="col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2 p-4 border rounded bg-white shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-600">Khóa theo giảng viên</div>
              <div className="text-xs text-slate-400">Top giảng viên</div>
            </div>
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={extraStats.barData}
                  margin={{ left: 8, right: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <ReTooltip />
                  <Bar dataKey="count" fill="#0EA5E9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-1 p-4 border rounded bg-white shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-slate-600">Tình trạng khóa học</div>
              <div className="text-xs text-slate-400">Phân bổ</div>
            </div>
            <div className="w-full h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={extraStats.pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    innerRadius={28}
                    label={{ fontSize: 11 }}
                  >
                    {extraStats.pieData.map((entry: any, idx: number) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={
                          [
                            "#6366F1",
                            "#0EA5E9",
                            "#F59E0B",
                            "#EF4444",
                            "#10B981",
                          ][idx % 5]
                        }
                      />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={20} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-span-3 lg:col-span-2 p-4 border rounded bg-white shadow-sm">
          <div className="text-sm text-slate-600 mb-2">Mục nộp gần đây</div>
          <div className="max-h-56 overflow-y-auto">
            <ul className="text-sm space-y-2">
              {stats.recent.length === 0 ? (
                <li className="text-slate-500">Không có</li>
              ) : (
                stats.recent.map((r: any) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <div className="font-medium text-slate-800">{r.name}</div>
                      <div className="text-xs text-slate-400">
                        {creatorNames[String(r.createdBy)] ??
                          r.createdBy ??
                          "—"}{" "}
                        •{" "}
                        {r.createdAt
                          ? format(new Date(r.createdAt), "yyyy-MM-dd")
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate(`/course/teacher/courses/${r.id}`)
                        }
                        className="text-slate-600"
                      >
                        Xem
                      </Button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="col-span-3 lg:col-span-1 p-4 border rounded bg-white shadow-sm">
          <div className="text-sm text-slate-600 mb-2">
            Top khóa được đăng ký
          </div>
          <div className="max-h-56 overflow-y-auto">
            <ul className="text-sm space-y-2">
              {extraStats.topEnrolled.length === 0 ? (
                <li className="text-slate-500">Không có dữ liệu</li>
              ) : (
                extraStats.topEnrolled.map((t: any) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <div className="font-medium text-slate-800">{t.name}</div>
                      <div className="text-xs text-slate-400">
                        Đã đăng ký: {t.count}
                      </div>
                    </div>
                    <div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          navigate(`/course/teacher/courses/${t.id}`)
                        }
                        className="text-slate-600"
                      >
                        Xem
                      </Button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && <div className="text-gray-500">Đang tải dữ liệu...</div>}

      {/* No results */}
      {!loading && filteredCourses.length === 0 && (
        <Card className="text-center border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Không có khóa học chờ duyệt</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600">
            Tất cả khóa học đã được duyệt hoặc không có khóa học mới.
          </CardContent>
        </Card>
      )}

      {/* Danh sách khóa học */}
      <div className="space-y-4">
        {filteredCourses.map((c: any) => (
          <Card
            key={c.id}
            className="border border-gray-200 hover:shadow-md transition-all duration-150"
          >
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Thông tin */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/course/teacher/courses/${c.id}`)}
                    className="flex items-start gap-4 p-0 text-left"
                  >
                    <img
                      src={c.imageUrl ?? "/placeholder.jpg"}
                      className="w-20 h-14 object-cover rounded-lg shadow-sm"
                      alt="thumb"
                    />
                    <div className="text-left">
                      <div className="font-semibold text-lg text-gray-800 transition-colors">
                        {c.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {c.subject?.name ?? "Chưa xác định"}
                      </div>
                      <div className="text-xs text-gray-400">
                        Tạo bởi:{" "}
                        {creatorNames[String(c.createdBy)] ??
                          c.createdBy ??
                          "—"}{" "}
                        •{" "}
                        {c.createdAt
                          ? format(new Date(c.createdAt), "yyyy-MM-dd")
                          : ""}
                      </div>
                    </div>
                  </Button>
                </div>

                {/* Nút hành động */}
                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        Duyệt
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Xác nhận duyệt khóa học
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn duyệt khóa học <b>{c.name}</b>{" "}
                          không?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(c.id)}
                        >
                          Xác nhận
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Từ chối
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Xác nhận từ chối khóa học
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn <b>từ chối</b> khóa học{" "}
                          <b>{c.name}</b> không?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handleReject(c.id)}
                        >
                          Xác nhận
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ApproveCourses;
