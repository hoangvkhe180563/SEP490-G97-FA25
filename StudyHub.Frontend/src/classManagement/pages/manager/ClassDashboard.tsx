import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { ScrollArea } from "@/common/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import useDashboardStore from "@/classManagement/stores/useClassManagementStore";
import type {
  OverviewDto,
  GradeCountDto,
  StudentsPerClassDto,
  KeyValueDto,
  TopActiveClassDto,
  ScoreDistributionDto,
  AssignmentInteractionDto,
  MonthlyCountDto,
  ClassStatsDto,
  NotificationStatDto,
} from "@/classManagement/interfaces/dashboard";
import { User, BookOpen, Users, FileText } from "lucide-react";

type MetricCardProps = {
  title: string;
  value: string | number;
  accent?: string;
  icon?: React.ReactNode;
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  accent,
  icon,
}) => {
  const accentClass = accent ? accent : "from-indigo-500 to-sky-400";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-700">{title}</div>
            <div className="text-2xl font-extrabold mt-2 text-slate-900">
              {value}
            </div>
          </div>
          <div
            className={
              "w-12 h-12 rounded-lg bg-gradient-to-br " +
              accentClass +
              " shadow flex items-center justify-center"
            }
          >
            <div className="w-6 h-6 flex items-center justify-center text-white">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

type ColorBarChartProps = {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  rotateLabels?: boolean;
  minBarWidth?: number;
  monthOnlyLabels?: boolean; // if true and label in YYYY-MM, display "Tháng MM"
};

const ColorBarChart: React.FC<ColorBarChartProps> = ({
  data,
  height,
  rotateLabels = false,
  minBarWidth = 44,
  monthOnlyLabels = false,
}) => {
  const margin = { top: 28, right: 12, bottom: 64, left: 12 };
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    const v = typeof data[i].value === "number" ? data[i].value : 0;
    if (v > max) max = v;
  }
  if (max === 0) max = 1;

  const svgH = height || 220;
  const barW = Math.max(
    minBarWidth,
    Math.floor(900 / Math.max(1, data.length)) - 12
  );
  const svgWidth = Math.max(
    420,
    data.length * (barW + 12) + margin.left + margin.right
  );
  const innerHeight = svgH - margin.top - margin.bottom;

  const formatLabel = (lbl: string) => {
    if (!monthOnlyLabels) return lbl;
    const m = /^(\d{4})-(\d{2})$/.exec(lbl);
    if (m) return `Tháng ${m[2]}`;
    return lbl;
  };

  return (
    <div className="w-full overflow-auto">
      <svg
        width={svgWidth}
        height={svgH}
        role="img"
        aria-label="colored-bar-chart"
        style={{ overflow: "visible" }}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = innerHeight - Math.round(innerHeight * t);
            return (
              <line
                key={i}
                x1={0}
                x2={svgWidth}
                y1={y}
                y2={y}
                stroke="#eef2ff"
                strokeWidth={1}
              />
            );
          })}

          {data.map((d, i) => {
            const val = typeof d.value === "number" ? d.value : 0;
            const barH = Math.round((val / max) * innerHeight);
            const x = i * (barW + 12);
            const y = innerHeight - barH;
            const fill = d.color ? d.color : "#2563eb";
            const labelX = x + barW / 2;
            const labelY = innerHeight + 22;

            const insideThreshold = 26;
            const isInside = barH >= insideThreshold;
            const valueY = isInside ? y + 14 : y - 8;
            const valueFill = isInside ? "#ffffff" : "#0f172a";
            const valueFontSize = isInside ? 12 : 14;
            const valueFontWeight = isInside ? 700 : 700;

            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  fill={fill}
                  rx={6}
                />
                <text
                  x={labelX}
                  y={Math.max(12, valueY)}
                  fontSize={valueFontSize}
                  textAnchor="middle"
                  fill={valueFill}
                  fontWeight={valueFontWeight}
                >
                  {val}
                </text>

                <text
                  x={labelX}
                  y={labelY}
                  fontSize={12}
                  textAnchor="middle"
                  fill="#1f2937"
                  fontWeight={700}
                  transform={
                    rotateLabels ? `rotate(-45 ${labelX} ${labelY})` : undefined
                  }
                >
                  {formatLabel(d.label)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

const Donut: React.FC<{
  data: { label: string; value: number; color: string }[];
  size?: number;
}> = ({ data, size }) => {
  const len = Array.isArray(data) ? data.length : 0;
  if (len === 0) {
    const radius0 = (size || 140) / 2;
    return (
      <svg
        width={radius0 * 2}
        height={radius0 * 2}
        viewBox={`0 0 ${radius0 * 2} ${radius0 * 2}`}
        role="img"
        aria-label="donut-chart-empty"
      >
        <circle cx={radius0} cy={radius0} r={radius0 - 14 / 2} fill="#f1f5f9" />
        <text
          x={radius0}
          y={radius0}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-semibold text-sm text-slate-700"
        >
          0%
        </text>
      </svg>
    );
  }

  let total = 0;
  for (let i = 0; i < len; i++) {
    const v = typeof data[i].value === "number" ? data[i].value : 0;
    total += v;
  }
  if (total === 0) total = 1;

  const radius = (size || 140) / 2;
  const stroke = 14;
  let acc = 0;

  return (
    <svg
      width={radius * 2}
      height={radius * 2}
      viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      role="img"
      aria-label="donut-chart"
    >
      {data.map((d, i) => {
        const v = typeof d.value === "number" ? d.value : 0;
        const portion = v / total;
        const circumference = 2 * Math.PI * (radius - stroke / 2);
        const dash = portion * circumference;
        const offset = acc;
        acc += dash;
        return (
          <g key={i} transform={`rotate(-90 ${radius} ${radius})`}>
            <circle
              cx={radius}
              cy={radius}
              r={radius - stroke / 2}
              fill="transparent"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          </g>
        );
      })}
      <text
        x={radius}
        y={radius}
        textAnchor="middle"
        dominantBaseline="central"
        className="font-semibold text-sm text-slate-700"
      >
        {Math.round(
          ((typeof data[0].value === "number" ? data[0].value : 0) / total) *
            100
        )}
        %
      </text>
    </svg>
  );
};

const ProgressBar: React.FC<{ value: number; color?: string }> = ({
  value,
  color,
}) => {
  const pct = Math.max(
    0,
    Math.min(100, Math.round((typeof value === "number" ? value : 0) * 100))
  );
  const bg = color ? color : "bg-emerald-500";
  return (
    <div className="w-full bg-slate-100 rounded h-4 overflow-hidden">
      <div className={"h-4 " + bg} style={{ width: pct + "%" }} />
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const [tab, setTab] = useState<number>(1);
  const [monthsToShow, setMonthsToShow] = useState<number>(12);

  const overview = useDashboardStore((s) => s.overview) as OverviewDto | null;
  const classesByGrade = useDashboardStore(
    (s) => s.classesByGrade
  ) as GradeCountDto[];
  const genderRatio = useDashboardStore(
    (s) => (s as any).genderRatio
  ) as KeyValueDto[];
  const emailVerified = useDashboardStore(
    (s) => (s as any).emailVerified
  ) as KeyValueDto[];
  const announcementsByType = useDashboardStore(
    (s) => (s as any).announcementsByType
  ) as KeyValueDto[];
  const readRates = useDashboardStore(
    (s) => (s as any).readRates
  ) as KeyValueDto[];
  const topActiveClasses = useDashboardStore(
    (s) => s.topActiveClasses
  ) as TopActiveClassDto[];
  const studentsPerClass = useDashboardStore(
    (s) => s.studentsPerClass
  ) as StudentsPerClassDto[];
  const submissionRate = useDashboardStore((s) => s.submissionRate) as
    | number
    | null;
  const scoreDistribution = useDashboardStore(
    (s) => s.scoreDistribution
  ) as ScoreDistributionDto[];
  const mostInteractiveAssignments = useDashboardStore(
    (s) => s.mostInteractiveAssignments
  ) as AssignmentInteractionDto[];
  const isLoading = useDashboardStore((s) => s.isLoading);

  const monthlyClassworks = useDashboardStore(
    (s) => (s as any).monthlyClassworks
  ) as MonthlyCountDto[];
  const monthlyNotifications = useDashboardStore(
    (s) => (s as any).monthlyNotifications
  ) as MonthlyCountDto[];
  const monthlySubmissions = useDashboardStore(
    (s) => (s as any).monthlySubmissions
  ) as MonthlyCountDto[];
  const monthlyNewClasses = useDashboardStore(
    (s) => (s as any).monthlyNewClasses
  ) as MonthlyCountDto[];
  const topReadNotifications = useDashboardStore(
    (s) => (s as any).topReadNotifications
  ) as NotificationStatDto[];
  const classWithMostNotifications = useDashboardStore(
    (s) => (s as any).classWithMostNotifications
  ) as TopActiveClassDto | null;

  // class averages from the store
  const classAverages = useDashboardStore((s) => s.classAverages);
  const fetchClassAverages = useDashboardStore((s) => s.fetchClassAverages);

  const schoolName = useDashboardStore((s) => (s as any).schoolName) as
    | string
    | null;

  const fetchOverview = useDashboardStore((s) => s.fetchOverview);
  const fetchClassesByGrade = useDashboardStore((s) => s.fetchClassesByGrade);
  const fetchStudentsPerClass = useDashboardStore(
    (s) => s.fetchStudentsPerClass
  );
  const fetchSubmissionRate = useDashboardStore((s) => s.fetchSubmissionRate);
  const fetchTopActiveClasses = useDashboardStore(
    (s) => s.fetchTopActiveClasses
  );
  const fetchScoreDistribution = useDashboardStore(
    (s) => s.fetchScoreDistribution
  );
  const fetchMostInteractiveAssignments = useDashboardStore(
    (s) => s.fetchMostInteractiveAssignments
  );

  const fetchMySchool = useDashboardStore(
    (s) => (s as any).fetchMySchool
  ) as () => Promise<string | null>;

  const fetchGenderRatio = useDashboardStore(
    (s) => (s as any).fetchGenderRatio
  ) as () => Promise<KeyValueDto[] | null>;
  const fetchEmailVerified = useDashboardStore(
    (s) => (s as any).fetchEmailVerified
  ) as () => Promise<KeyValueDto[] | null>;
  const fetchAnnouncementsByType = useDashboardStore(
    (s) => (s as any).fetchAnnouncementsByType
  ) as () => Promise<KeyValueDto[] | null>;
  const fetchReadRates = useDashboardStore(
    (s) => (s as any).fetchReadRates
  ) as () => Promise<KeyValueDto[] | null>;
  const fetchTopReadNotifications = useDashboardStore(
    (s) => (s as any).fetchTopReadNotifications
  ) as (top?: number) => Promise<NotificationStatDto[] | null>;
  const fetchMostIgnoredNotifications = useDashboardStore(
    (s) => (s as any).fetchMostIgnoredNotifications
  ) as (top?: number) => Promise<NotificationStatDto[] | null>;
  const fetchMonthlyClassworks = useDashboardStore(
    (s) => (s as any).fetchMonthlyClassworks
  ) as (months?: number) => Promise<MonthlyCountDto[] | null>;
  const fetchMonthlyNotifications = useDashboardStore(
    (s) => (s as any).fetchMonthlyNotifications
  ) as (months?: number) => Promise<MonthlyCountDto[] | null>;
  const fetchMonthlySubmissions = useDashboardStore(
    (s) => (s as any).fetchMonthlySubmissions
  ) as (months?: number) => Promise<MonthlyCountDto[] | null>;
  const fetchMonthlyNewClasses = useDashboardStore(
    (s) => (s as any).fetchMonthlyNewClasses
  ) as (months?: number) => Promise<MonthlyCountDto[] | null>;
  const fetchClassStats = useDashboardStore(
    (s) => (s as any).fetchClassStats
  ) as () => Promise<ClassStatsDto[] | null>;
  const fetchClassWithMostNotifications = useDashboardStore(
    (s) => (s as any).fetchClassWithMostNotifications
  ) as () => Promise<TopActiveClassDto | null>;

  useEffect(() => {
    void fetchOverview();
    void fetchClassesByGrade();
    void fetchStudentsPerClass();
    void fetchSubmissionRate();
    void fetchMonthlyClassworks(monthsToShow);
    void fetchMonthlyNotifications(monthsToShow);
    void fetchMonthlySubmissions(monthsToShow);
    void fetchMonthlyNewClasses(monthsToShow);
    void fetchClassStats();
    void fetchTopReadNotifications(5);
    void fetchMostIgnoredNotifications(5);
    void fetchClassWithMostNotifications();
    void fetchGenderRatio();
    void fetchEmailVerified();
    void fetchAnnouncementsByType();
    void fetchReadRates();
    void fetchMySchool();

    // fetch class averages
    void fetchClassAverages();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthsToShow]);

  function handleTabClick(tabIndex: number) {
    setTab(tabIndex);

    if (tabIndex === 1) {
      void fetchOverview();
      void fetchClassesByGrade();
      void fetchStudentsPerClass();
      void fetchMonthlyClassworks(monthsToShow);
      void fetchMonthlyNotifications(monthsToShow);
      void fetchMonthlySubmissions(monthsToShow);
      void fetchMonthlyNewClasses(monthsToShow);
      void fetchClassStats();
      void fetchTopReadNotifications(5);
      void fetchMostIgnoredNotifications(5);
      void fetchClassWithMostNotifications();
      void fetchClassAverages();
    } else if (tabIndex === 2) {
      void fetchGenderRatio();
      void fetchEmailVerified();
      void fetchStudentsPerClass();
    } else if (tabIndex === 3) {
      void fetchAnnouncementsByType();
      void fetchReadRates();
      void fetchTopActiveClasses(5);
      void fetchTopReadNotifications(5);
      void fetchMostIgnoredNotifications(5);
    } else if (tabIndex === 4) {
      void fetchSubmissionRate();
      void fetchScoreDistribution();
      void fetchMostInteractiveAssignments(5);
    }
  }

  const safeArr = <T,>(a: T[] | undefined | null, def: T[]) =>
    a && Array.isArray(a) ? a : def;

  const totalUsers = overview?.totalUsers ?? 0;
  const totalClasses = overview?.totalClasses ?? 0;
  const totalAssignments = overview?.totalAssignments ?? 0;
  const totalAnnouncements = overview?.totalAnnouncements ?? 0;
  const submissionRateValue = submissionRate ?? 0;

  const extractCommonYear = (items: MonthlyCountDto[]) => {
    if (!items || items.length === 0) return null;
    const yrs = new Set(
      items
        .map((m) => {
          const r = /^(\d{4})-(\d{2})$/.exec(m.month);
          return r ? r[1] : null;
        })
        .filter(Boolean)
    );
    return yrs.size === 1 ? Number(Array.from(yrs)[0]) : null;
  };
  const newClassesYear = extractCommonYear(safeArr(monthlyNewClasses, []));

  const topActiveTop5 = safeArr(topActiveClasses, []).slice(0, 5);
  const topReadTop5 = safeArr(topReadNotifications, []).slice(0, 5);
  const mostInteractiveTop5 = safeArr(mostInteractiveAssignments, []).slice(
    0,
    5
  );

  const headerButtonBase = "text-sm px-3 py-2 rounded-md";

  return (
    <div className="p-5 space-y-5 w-full h-full overflow-y-auto text-sm">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Lớp học</h1>
          <p className="text-sm text-slate-600 mt-1">Tổng quan & phân tích</p>
          <div className="mt-2">
            <div
              className="text-lg font-semibold text-slate-800"
              aria-label="school-name"
            >
              {schoolName ?? "—"}
            </div>
            <div className="text-xs text-slate-500 mt-1">Trường</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleTabClick(1)}
            className={`${headerButtonBase} ${
              tab === 1
                ? "bg-indigo-600 text-white"
                : "bg-slate-800 text-white/90"
            }`}
          >
            Tổng quan
          </Button>
          <Button
            onClick={() => handleTabClick(2)}
            className={`${headerButtonBase} ${
              tab === 2
                ? "bg-rose-500 text-white"
                : "bg-slate-800 text-white/90"
            }`}
          >
            Học sinh & Giáo viên
          </Button>
          <Button
            onClick={() => handleTabClick(3)}
            className={`${headerButtonBase} ${
              tab === 3
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-white/90"
            }`}
          >
            Hoạt động lớp
          </Button>
          <Button
            onClick={() => handleTabClick(4)}
            className={`${headerButtonBase} ${
              tab === 4 ? "bg-sky-600 text-white" : "bg-slate-800 text-white/90"
            }`}
          >
            Bài tập
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <MetricCard
          title="Tổng người / lớp"
          value={`${totalUsers} / ${totalClasses}`}
          accent="from-rose-400 to-pink-400"
          icon={<User className="text-white" size={14} strokeWidth={1.5} />}
        />
        <MetricCard
          title="Tổng bài tập / thông báo"
          value={`${totalAssignments} / ${totalAnnouncements}`}
          accent="from-sky-500 to-indigo-500"
          icon={<BookOpen className="text-white" size={14} strokeWidth={1.5} />}
        />
        <MetricCard
          title="Trung bình học sinh / lớp"
          value={String(
            (safeArr(studentsPerClass, []).length > 0
              ? safeArr(studentsPerClass, []).reduce(
                  (a, c) => a + (c.students ?? 0),
                  0
                ) / safeArr(studentsPerClass, []).length
              : 0
            ).toFixed(1)
          )}
          accent="from-emerald-400 to-emerald-600"
          icon={<Users className="text-white" size={14} strokeWidth={1.5} />}
        />
        <MetricCard
          title="Tỷ lệ nộp bài"
          value={`${Math.round(submissionRateValue * 100)}%`}
          accent="from-amber-400 to-amber-600"
          icon={<FileText className="text-white" size={14} strokeWidth={1.5} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <main className="lg:col-span-2 space-y-5">
          {tab === 1 && (
            <>
              <Card>
                <CardHeader className="p-4 flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Số lớp theo khối
                    </CardTitle>
                    <div className="text-xs text-slate-500">
                      Phân bố lớp theo khối
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    {isLoading ? "Đang tải..." : "Dữ liệu"}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ColorBarChart
                    data={safeArr(classesByGrade, []).map((g) => ({
                      label: String((g as any).grade ?? ""),
                      value:
                        typeof (g as any).count === "number"
                          ? (g as any).count
                          : Number((g as any).Count ?? 0),
                      color: `hsl(${
                        Number((g as any).grade ?? 0) * 36
                      },70%,45%)`,
                    }))}
                    height={180}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Trung bình điểm theo lớp
                    </CardTitle>
                    <div className="text-xs text-slate-500">
                      Trung bình điểm (Avg) từ các submission đã chấm
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    {classAverages.length} lớp
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {classAverages.length === 0 ? (
                    <div className="text-sm text-slate-500">
                      Không có dữ liệu.
                    </div>
                  ) : (
                    <ColorBarChart
                      data={safeArr(classAverages, []).map((c, i) => ({
                        label: c.className || `Lớp ${c.classId}`,
                        value: Number(
                          Math.round((c.avgScore ?? 0) * 100) / 100
                        ),
                        color: [
                          "#60a5fa",
                          "#34d399",
                          "#f59e0b",
                          "#f472b6",
                          "#a78bfa",
                        ][i % 5],
                      }))}
                      height={220}
                      minBarWidth={60}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Thống kê theo tháng
                    </CardTitle>
                    <div className="text-xs text-slate-500">
                      Số liệu theo tháng
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-600">
                      {monthsToShow} tháng{" "}
                      {newClassesYear ? `— Năm ${newClassesYear}` : ""}
                    </div>

                    <Select
                      value={String(monthsToShow)}
                      onValueChange={(v: any) => setMonthsToShow(Number(v))}
                    >
                      <SelectTrigger className="w-[110px] h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 tháng</SelectItem>
                        <SelectItem value="12">12 tháng</SelectItem>
                        <SelectItem value="24">24 tháng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-2">
                      Bài tập
                    </div>
                    <ColorBarChart
                      data={safeArr(monthlyClassworks, []).map((m) => ({
                        label: m.month,
                        value: m.count,
                      }))}
                      height={200}
                      monthOnlyLabels
                      minBarWidth={40}
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-2">
                      Thông báo
                    </div>
                    <ColorBarChart
                      data={safeArr(monthlyNotifications, []).map((m) => ({
                        label: m.month,
                        value: m.count,
                      }))}
                      height={200}
                      monthOnlyLabels
                      minBarWidth={40}
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-2">
                      Lượt nộp
                    </div>
                    <ColorBarChart
                      data={safeArr(monthlySubmissions, []).map((m) => ({
                        label: m.month,
                        value: m.count,
                      }))}
                      height={200}
                      monthOnlyLabels
                      minBarWidth={40}
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-2">
                      Lớp mới
                    </div>
                    <ColorBarChart
                      data={safeArr(monthlyNewClasses, []).map((m) => ({
                        label: m.month,
                        value: m.count,
                      }))}
                      height={200}
                      monthOnlyLabels
                      minBarWidth={40}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-semibold">
                    Top lớp theo số học sinh (Top 5)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ColorBarChart
                    data={safeArr(studentsPerClass, [])
                      .slice(0, 5)
                      .map((c, i) => ({
                        label: c.className || `Lớp ${c.classId}`,
                        value: c.students,
                        color: [
                          "#60a5fa",
                          "#f472b6",
                          "#34d399",
                          "#f59e0b",
                          "#a78bfa",
                        ][i % 5],
                      }))}
                    height={160}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {tab === 2 && (
            <>
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-semibold">
                    Tỷ lệ giới tính
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex gap-4 items-start">
                  <Donut
                    data={safeArr(genderRatio, []).map((g) => ({
                      label: g.key,
                      value: g.value,
                      color: g.key === "Male" ? "#2563eb" : "#ec4899",
                    }))}
                    size={140}
                  />
                  <div>
                    {safeArr(genderRatio, []).map((g, idx) => {
                      const total = safeArr(genderRatio, []).reduce(
                        (acc, item) =>
                          acc +
                          (typeof item.value === "number" ? item.value : 0),
                        0
                      );
                      const value = typeof g.value === "number" ? g.value : 0;
                      const pct = Math.round(
                        (value / Math.max(1, total)) * 100
                      );
                      return (
                        <div
                          key={idx}
                          className="mb-2 flex items-center gap-3 text-sm"
                        >
                          <div
                            style={{
                              background:
                                g.key === "Male" ? "#2563eb" : "#ec4899",
                            }}
                            className="w-3 h-3 rounded"
                          />
                          <div>
                            {g.key}:{" "}
                            <span className="font-semibold">{value}</span> (
                            {pct}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-semibold">
                    Tỷ lệ xác minh email
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex gap-4 items-start">
                  <Donut
                    data={safeArr(emailVerified, []).map((e) => ({
                      label: e.key,
                      value: e.value,
                      color: e.key === "Verified" ? "#10b981" : "#f97316",
                    }))}
                    size={140}
                  />
                  <div>
                    {safeArr(emailVerified, []).map((e, idx) => {
                      const total = safeArr(emailVerified, []).reduce(
                        (acc, item) =>
                          acc +
                          (typeof item.value === "number" ? item.value : 0),
                        0
                      );
                      const value = typeof e.value === "number" ? e.value : 0;
                      const pct = Math.round(
                        (value / Math.max(1, total)) * 100
                      );
                      return (
                        <div
                          key={idx}
                          className="mb-2 flex items-center gap-3 text-sm"
                        >
                          <div
                            style={{
                              background:
                                e.key === "Verified" ? "#10b981" : "#f97316",
                            }}
                            className="w-3 h-3 rounded"
                          />
                          <div>
                            {e.key}:{" "}
                            <span className="font-semibold">{value}</span> (
                            {pct}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {tab === 3 && (
            <>
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-semibold">
                    Số thông báo theo loại
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ColorBarChart
                    data={safeArr(announcementsByType, []).map((a) => ({
                      label: a.key,
                      value: a.value,
                      color: "#7c3aed",
                    }))}
                    height={160}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-semibold">
                    Tỷ lệ đọc thông báo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {safeArr(readRates, []).map((r, idx) => {
                    const val = typeof r.value === "number" ? r.value : 0;
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-sm">
                          <div>{r.key}</div>
                          <div className="font-semibold">
                            {String(Math.round(val)) + "%"}
                          </div>
                        </div>
                        <div className="mt-1">
                          <ProgressBar value={val / 100} color={""} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-semibold">
                    Top lớp hoạt động (Top 5)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ScrollArea className="h-36">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Lớp</TableHead>
                          <TableHead className="text-xs">Activity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topActiveTop5.map((c, i) => (
                          <TableRow key={c.classId}>
                            <TableCell className="text-sm">
                              {c.className}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-3">
                                <div
                                  className={
                                    "w-6 h-2 rounded " +
                                    (i === 0
                                      ? "bg-indigo-600"
                                      : i === 1
                                      ? "bg-emerald-500"
                                      : "bg-amber-500")
                                  }
                                />
                                <div className="font-medium">
                                  {c.activityScore}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-semibold">
                    Thông báo có nhiều tương tác nhất (Top 5)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {topReadTop5.map((n) => (
                    <div
                      key={n.notificationId}
                      className="flex justify-between border rounded p-3 text-sm"
                    >
                      <div>
                        <div className="font-medium">{n.title}</div>
                        {n.createdBy ? (
                          <div className="text-xs text-slate-500 mt-1">
                            Bởi {n.createdBy}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-sm text-slate-600">
                        {n.readsCount} bình luận
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {tab === 4 && (
            <>
              <Card>
                <CardHeader className="p-4 flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Tỷ lệ nộp bài
                    </CardTitle>
                    <div className="text-xs text-slate-500">
                      Tổng quan nộp bài
                    </div>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600">
                    {String(Math.round(submissionRateValue * 100)) + "%"}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <ProgressBar
                    value={submissionRateValue}
                    color="bg-emerald-500"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-semibold">
                    Phân bố điểm
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {safeArr(scoreDistribution, []).map((s, idx) => {
                      const pct = typeof s.pct === "number" ? s.pct : 0;
                      const range = s.range ?? "";
                      const bg =
                        idx === 0
                          ? "bg-emerald-400"
                          : idx === 1
                          ? "bg-sky-400"
                          : idx === 2
                          ? "bg-violet-300"
                          : "bg-rose-300";
                      return (
                        <div
                          key={idx}
                          className={"p-2 rounded border text-center " + bg}
                        >
                          <div className="text-sm font-medium text-white">
                            {range}
                          </div>
                          <div className="mt-1 text-xl font-semibold text-white">
                            {String(Math.round(pct * 100)) + "%"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-semibold">
                    Bài tập nhiều tương tác nhất (Top 5)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {mostInteractiveTop5.map((a, idx) => {
                    const title = a.title ?? "";
                    const submissionsCount =
                      typeof a.submissionsCount === "number"
                        ? a.submissionsCount
                        : 0;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded border text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={
                              "w-3 h-3 rounded " +
                              (idx === 0 ? "bg-sky-500" : "bg-slate-400")
                            }
                          />
                          <div className="font-medium">{title}</div>
                          <div className="text-xs text-slate-500 ml-2">
                            {a.createdBy}
                          </div>
                        </div>
                        <div className="text-sm text-slate-600">
                          {String(submissionsCount)}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          )}
        </main>

        <aside className="space-y-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-sm text-slate-500">
                Tổng quan hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-slate-700 space-y-1">
              <div>
                Tổng người dùng:{" "}
                <span className="font-semibold">{String(totalUsers)}</span>
              </div>
              <div>
                Tổng lớp:{" "}
                <span className="font-semibold">{String(totalClasses)}</span>
              </div>
              <div>
                Tổng bài tập:{" "}
                <span className="font-semibold">
                  {String(totalAssignments)}
                </span>
              </div>
            </CardContent>
          </Card>

          {classAverages && classAverages.length > 0 && (
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm text-slate-500">
                  Top lớp theo điểm trung bình
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm text-slate-700">
                <div className="space-y-2">
                  {safeArr(classAverages, [])
                    .slice(0, 5)
                    .sort((a, b) => b.avgScore - a.avgScore)
                    .map((c) => (
                      <div
                        key={c.classId}
                        className="flex items-center justify-between"
                      >
                        <div className="truncate pr-2">{c.className}</div>
                        <div className="font-semibold">{c.avgScore}</div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {classWithMostNotifications && (
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-sm text-slate-500">
                  Lớp có nhiều thông báo nhất
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm text-slate-700">
                <div className="font-medium text-sm">
                  {classWithMostNotifications.className}
                </div>
                <div className="text-sm">
                  Số thông báo:{" "}
                  <span className="font-semibold">
                    {classWithMostNotifications.notificationsCount}
                  </span>
                </div>
                <div className="text-sm">
                  Số lượt nộp:{" "}
                  <span className="font-semibold">
                    {classWithMostNotifications.submissionsCount}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
};

export default DashboardPage;
