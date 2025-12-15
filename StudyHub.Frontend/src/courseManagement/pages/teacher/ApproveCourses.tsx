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
import { Card, CardHeader } from "@/common/components/ui/card";
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
import { Clock, Eye } from "lucide-react";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { format, formatISO } from "date-fns";
import { formatDate } from "@/courseManagement/utils/formatDate";
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

// Helper lấy tên hiển thị
const getTeacherName = (course: any) =>
  course.teacherCreatedName || course.teacherUpdatedName || "Không xác định";

const ApproveCourses: React.FC = () => {
  const navigate = useNavigate();
  const { fetchCourses, courses, loading, fetchCourseById, updateCourse } =
    useCourseStore();
  const authUser = useAuthStore((s) => s.user);
  const { fetchCounts: fetchEnrollmentCounts, enrollmentCounts } =
    useEnrollmentStore();

  const [query, setQuery] = useState("");
  const [statsRange, setStatsRange] = useState<"week" | "month" | "year">(
    "week"
  );
  const [statsCourses, setStatsCourses] = useState<any[]>([]);

  // 1. Fetch dữ liệu thống kê & Enrollment
  useEffect(() => {
    if (!authUser?.schoolId) return;

    const loadStats = async () => {
      try {
        const res = await courseApi.getCourses({
          page: 1,
          pageSize: 200,
          schoolId: authUser.schoolId,
        });
        let items = res.items || [];

        // Lọc theo thời gian
        const now = new Date();
        const cutoff = new Date();
        if (statsRange === "week") cutoff.setDate(now.getDate() - 7);
        else if (statsRange === "month") cutoff.setMonth(now.getMonth() - 1);
        else cutoff.setFullYear(now.getFullYear() - 1);
        cutoff.setHours(0, 0, 0, 0);

        items = items.filter(
          (c: any) => c.createdAt && new Date(c.createdAt) >= cutoff
        );
        setStatsCourses(items);

        // Fetch enrollment counts
        await fetchEnrollmentCounts({
          from: cutoff.toISOString(),
          to: now.toISOString(),
          schoolId: authUser.schoolId,
        }).catch(() => {});
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    loadStats();
  }, [statsRange, authUser?.schoolId, fetchEnrollmentCounts]);

  // 2. Fetch danh sách chờ duyệt (Main list)
  useEffect(() => {
    fetchCourses({ page: 1, pageSize: 50, isApproved: false });
  }, [fetchCourses]);

  // 3. Tính toán thống kê (All-in-one Logic)
  const dashboardStats = useMemo(() => {
    const items = statsCourses || [];

    // --- Các biến đếm ---
    const pendingCount = items.filter(
      (c: any) => c.isApproved === false || c.isApproved == null
    ).length;
    const subjectMap = new Map<string, number>();
    const creatorMap = new Map<string, { count: number; name: string }>();
    const statusMap = new Map<string, number>();

    // Chart Data init
    const chartData: any[] = [];
    const loopCount =
      statsRange === "week" ? 7 : statsRange === "month" ? 30 : 12;
    for (let i = loopCount - 1; i >= 0; i--) {
      const d = new Date();
      if (statsRange === "year") {
        d.setMonth(d.getMonth() - i);
        const key = format(d, "yyyy-MM");
        chartData.push({ label: format(d, "MM/yyyy"), count: 0, key });
      } else {
        d.setDate(d.getDate() - i);
        const key = format(d, "yyyy-MM-dd");
        chartData.push({ label: format(d, "dd/MM"), count: 0, key });
      }
    }

    // --- Loop chính ---
    let approvedCount = 0;
    let totalTime = 0;
    let rejectedCount = 0;

    items.forEach((c: any) => {
      // Subject
      const subName = c.subject?.name || c.subjectName || "Khác";
      subjectMap.set(subName, (subjectMap.get(subName) || 0) + 1);

      // Creator
      const tName = getTeacherName(c);
      const tKey = c.createdBy || "unknown";
      if (!creatorMap.has(tKey))
        creatorMap.set(tKey, { count: 0, name: tName });
      creatorMap.get(tKey)!.count++;

      // Status
      const st = c.status || "Nháp";
      statusMap.set(st, (statusMap.get(st) || 0) + 1);

      // Date Chart
      if (c.createdAt) {
        const d = new Date(c.createdAt);
        const key =
          statsRange === "year"
            ? format(d, "yyyy-MM")
            : format(d, "yyyy-MM-dd");
        const bucket = chartData.find((x) => x.key === key);
        if (bucket) bucket.count++;
      }

      // Rejection & Approval Time
      if (
        c.status?.toLowerCase().includes("từ chối") ||
        c.status?.toLowerCase().includes("rejected")
      )
        rejectedCount++;
      if (c.isApproved && c.createdAt && c.updatedAt) {
        const diff =
          new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime();
        if (diff > 0) {
          totalTime += diff;
          approvedCount++;
        }
      }
    });

    // --- Sorting & Arrays ---
    const topCreators = Array.from(creatorMap.values()).sort(
      (a, b) => b.count - a.count
    );
    const topSubject = Array.from(subjectMap.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];

    // *** LOGIC BẠN CẦN GIỮ LẠI ***
    const recent = [...items]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 8); // Lấy 8 cái mới nhất

    const topEnrolled = items
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        teacher: getTeacherName(c), // Dùng helper lấy tên
        count: enrollmentCounts[c.id] || 0,
      }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5); // Lấy top 5

    return {
      pendingCount,
      totalLoaded: items.length,
      newItemsCount: chartData.reduce((acc, curr) => acc + curr.count, 0),
      topSubject: { name: topSubject?.[0], count: topSubject?.[1] },
      topCreator: topCreators[0],
      chartData,
      barData: topCreators.slice(0, 10),
      pieData: Array.from(statusMap.entries()).map(([name, value]) => ({
        name,
        value,
      })),
      avgApprovalDays: approvedCount ? totalTime / approvedCount / 86400000 : 0,
      rejectionRate: items.length
        ? Math.round((rejectedCount / items.length) * 100)
        : 0,
      recent, // Trả về recent
      topEnrolled, // Trả về topEnrolled
    };
  }, [statsCourses, statsRange, enrollmentCounts]);

  // 4. Lọc danh sách hiển thị chính
  const filteredCourses = useMemo(() => {
    const keyword = query.toLowerCase().trim();
    return courses.filter(
      (c: any) =>
        (c.isApproved === false || c.isApproved == null) &&
        (!keyword || c.name.toLowerCase().includes(keyword))
    );
  }, [courses, query]);

  // 5. Actions
  const handleAction = async (id: number, type: "approve" | "reject") => {
    try {
      await fetchCourseById(id);
      const selected = useCourseStore.getState().selectedCourse;
      if (!selected) return;

      const isEditReq = String(selected.status).trim() === "Chỉnh sửa";
      const dto: any = {
        ...selected,
        updatedAt: formatISO(new Date()),
        updatedBy: authUser?.id,
        isApproved: true,
        status:
          type === "approve"
            ? isEditReq
              ? "Nháp"
              : selected.status
            : isEditReq
            ? "Mở"
            : "Nháp",
      };

      await updateCourse(id, dto);
      await fetchCourses({ page: 1, pageSize: 50, isApproved: false });
    } catch (e) {
      console.error(e);
      alert("Thao tác thất bại");
    }
  };

  return (
    <div className="p-8 w-full mx-auto h-full overflow-y-auto scrollbar-hide bg-gray-50/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between mb-8 gap-4">
        <h1 className="text-3xl font-semibold text-gray-800">Duyệt khóa học</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Tìm khóa học..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-80 bg-white"
          />
          <Select
            value={statsRange}
            onValueChange={(v: any) => setStatsRange(v)}
          >
            <SelectTrigger className="w-32 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Tuần</SelectItem>
              <SelectItem value="month">Tháng</SelectItem>
              <SelectItem value="year">Năm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Khóa chờ duyệt"
          value={dashboardStats.pendingCount}
          sub="Hiện tại"
          color="emerald"
        />
        <SummaryCard
          title="Tổng đã tải"
          value={dashboardStats.totalLoaded}
          sub="Dữ liệu thống kê"
          color="sky"
        />
        <SummaryCard
          title="Mục mới"
          value={dashboardStats.newItemsCount}
          sub={`Trong ${
            statsRange === "week"
              ? "7 ngày"
              : statsRange === "month"
              ? "30 ngày"
              : "12 tháng"
          }`}
          color="amber"
        />
        <SummaryCard
          title="Môn phổ biến"
          value={dashboardStats.topSubject?.count || 0}
          sub={dashboardStats.topSubject?.name || "-"}
          color="violet"
        />
      </div>
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Line Chart */}
        <div className="col-span-3 lg:col-span-1 p-4 border rounded bg-white shadow-sm h-64">
          <div className="text-sm font-semibold mb-2 text-gray-700">
            Xu hướng tạo mới
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={dashboardStats.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" fontSize={10} />{" "}
              <YAxis allowDecimals={false} fontSize={10} /> <ReTooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366F1"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Bar Chart */}
        <div className="col-span-3 lg:col-span-1 p-4 border rounded bg-white shadow-sm h-64">
          <div className="text-sm font-semibold mb-2 text-gray-700">
            Top Giảng Viên
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={dashboardStats.barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                fontSize={10}
                interval={0}
                tickFormatter={(val) => val.slice(0, 5) + "..."}
              />
              <YAxis allowDecimals={false} fontSize={10} /> <ReTooltip />
              <Bar dataKey="count" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Pie Chart */}
        <div className="col-span-3 lg:col-span-1 p-4 border rounded bg-white shadow-sm h-64 flex flex-col items-center">
          <div className="text-sm font-semibold mb-2 text-gray-700 w-full text-left">
            Trạng thái
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={dashboardStats.pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                innerRadius={30}
                paddingAngle={2}
              >
                {dashboardStats.pieData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      ["#6366F1", "#0EA5E9", "#F59E0B", "#EF4444"][i % 4] ||
                      "#888"
                    }
                  />
                ))}
              </Pie>
              <Legend iconSize={8} fontSize={10} />
              <ReTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- PHẦN BẠN YÊU CẦU: LIST GẦN ĐÂY & TOP ĐĂNG KÝ --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Cột 1 & 2: Khóa học gần đây */}
        <div className="col-span-3 lg:col-span-2 p-4 border rounded bg-white shadow-sm">
          <div className="text-sm font-semibold text-slate-700 mb-3 flex justify-between items-center">
            <span>Mục nộp gần đây</span>
            <span className="text-xs font-normal text-slate-400">
              Mới nhất lên trên
            </span>
          </div>
          <div className="max-h-60 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {dashboardStats.recent.length === 0 ? (
              <p className="text-xs text-gray-400">Không có dữ liệu</p>
            ) : (
              dashboardStats.recent.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between pb-2 border-b border-dashed last:border-0"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-800 line-clamp-1">
                      {item.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {getTeacherName(item)} •{" "}
                      {item.createdAt ? formatDate(item.createdAt) : "-"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(`/course/teacher/courses/${item.id}`)
                    }
                  >
                    <Eye className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cột 3: Top đăng ký */}
        <div className="col-span-3 lg:col-span-1 p-4 border rounded bg-white shadow-sm">
          <div className="text-sm font-semibold text-slate-700 mb-3">
            Top đăng ký nhiều nhất
          </div>
          <div className="max-h-60 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {dashboardStats.topEnrolled.length === 0 ? (
              <p className="text-xs text-gray-400">Chưa có lượt đăng ký nào</p>
            ) : (
              dashboardStats.topEnrolled.map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between pb-2 border-b border-dashed last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold 
                                ${
                                  idx === 0
                                    ? "bg-yellow-100 text-yellow-700"
                                    : idx === 1
                                    ? "bg-gray-100 text-gray-700"
                                    : idx === 2
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-slate-50 text-slate-500"
                                }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-800 line-clamp-1 w-32">
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {item.count} học viên
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(`/course/teacher/courses/${item.id}`)
                    }
                  >
                    <Eye className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* --- HẾT PHẦN LIST --- */}

      {/* Main List Title */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Danh sách chờ duyệt
      </h2>

      {/* Course List */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center text-gray-500 py-8">
            Đang tải danh sách...
          </div>
        )}
        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">
              Không có khóa học nào đang chờ duyệt.
            </p>
          </div>
        )}

        {filteredCourses.map((c: any) => (
          <Card key={c.id} className="hover:shadow-md transition bg-white">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
              <div
                className="flex items-center gap-4 cursor-pointer group w-full sm:w-auto"
                onClick={() => navigate(`/course/teacher/courses/${c.id}`)}
              >
                <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={c.imageUrl || "/placeholder.jpg"}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                    alt=""
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition">
                    {c.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {c.subject?.name || "Môn học"} • {getTeacherName(c)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(c.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <ConfirmDialog
                  title="Duyệt"
                  color="bg-green-600"
                  onConfirm={() => handleAction(c.id, "approve")}
                />
                <ConfirmDialog
                  title="Từ chối"
                  color="bg-red-600"
                  onConfirm={() => handleAction(c.id, "reject")}
                />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

// --- Sub Components ---
const SummaryCard = ({ title, value, sub, color }: any) => (
  <div
    className={`p-4 rounded border-l-4 border-${color}-500 bg-white shadow-sm`}
  >
    <div
      className={`text-xs font-medium text-${color}-600 uppercase tracking-wider`}
    >
      {title}
    </div>
    <div className={`text-2xl font-bold text-${color}-800 mt-1`}>{value}</div>
    <div className="text-xs text-slate-400 mt-1">{sub}</div>
  </div>
);

const ConfirmDialog = ({ title, color, onConfirm }: any) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button className={`${color} text-white hover:opacity-90 min-w-[80px]`}>
        {title}
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Xác nhận {title}?</AlertDialogTitle>
        <AlertDialogDescription>
          Hành động này sẽ cập nhật trạng thái khóa học.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Hủy</AlertDialogCancel>
        <AlertDialogAction className={color} onClick={onConfirm}>
          Đồng ý
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ApproveCourses;
