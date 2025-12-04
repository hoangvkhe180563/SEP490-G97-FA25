import React, { useEffect, useState } from "react";
import { Card } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { ScrollArea } from "@/common/components/ui/scroll-area";
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

/**
 * Inline SVG icons (white foreground)
 */
const IconPerson: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" fill="white" />
    <path d="M4 20a8 8 0 0116 0v1H4v-1z" fill="white" />
  </svg>
);

const IconBook: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 6.5A2.5 2.5 0 015.5 4H18" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 19.5a2.5 2.5 0 00-2.5-2.5H6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 4v16" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconUsers: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M16 11a3 3 0 100-6 3 3 0 000 6zM8 11a3 3 0 100-6 3 3 0 000 6z" fill="white" />
    <path d="M2 20a6 6 0 0112 0v0M12 20a6 6 0 0112 0v0" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconNote: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M7 7h10M7 11h10M7 15h6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 3h10l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type MetricCardProps = {
  title: string;
  value: string | number;
  accent?: string;
  icon?: React.ReactNode;
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, accent, icon }) => {
  const accentClass = accent ? accent : "from-indigo-500 to-sky-400";
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xl md:text-2xl font-semibold text-slate-800">{title}</div>
          <div className="text-4xl md:text-6xl font-extrabold mt-3">{value}</div>
        </div>
        <div className={"w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gradient-to-br " + accentClass + " shadow-md flex items-center justify-center"}>
          <div className="w-8 h-8 md:w-9 md:h-9">
            {icon}
          </div>
        </div>
      </div>
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

const ColorBarChart: React.FC<ColorBarChartProps> = ({ data, height, rotateLabels = false, minBarWidth = 44, monthOnlyLabels = false }) => {
  // margins and sizing
  const margin = { top: 36, right: 24, bottom: 84, left: 12 };
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    const v = typeof data[i].value === "number" ? data[i].value : 0;
    if (v > max) max = v;
  }
  if (max === 0) max = 1;

  const svgH = height || 280;
  const barW = Math.max(minBarWidth, Math.floor(1000 / Math.max(1, data.length)) - 12);
  const svgWidth = Math.max(420, data.length * (barW + 12) + margin.left + margin.right);
  const innerHeight = svgH - margin.top - margin.bottom;

  const formatLabel = (lbl: string) => {
    if (!monthOnlyLabels) return lbl;
    const m = /^(\d{4})-(\d{2})$/.exec(lbl);
    if (m) return `Tháng ${m[2]}`;
    return lbl;
  };

  return (
    <div className="w-full overflow-auto">
      <svg width={svgWidth} height={svgH} role="img" aria-label="colored-bar-chart" style={{ overflow: "visible" }}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = innerHeight - Math.round(innerHeight * t);
            return <line key={i} x1={0} x2={svgWidth} y1={y} y2={y} stroke="#eef2ff" strokeWidth={1} />;
          })}

          {data.map((d, i) => {
            const val = typeof d.value === "number" ? d.value : 0;
            const barH = Math.round((val / max) * innerHeight);
            const x = i * (barW + 12);
            const y = innerHeight - barH;
            const fill = d.color ? d.color : "#2563eb";
            const labelX = x + barW / 2;
            const labelY = innerHeight + 26;

            // logic to place value inside bar if tall enough, otherwise above
            const insideThreshold = 28;
            const isInside = barH >= insideThreshold;
            const valueY = isInside ? y + 16 : y - 8;
            const valueFill = isInside ? "#ffffff" : "#0f172a";
            const valueFontSize = isInside ? 14 : 16;
            const valueFontWeight = isInside ? 700 : 800;

            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={barH} fill={fill} rx={6} />
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

                {/* month label (no rotation by default) */}
                <text x={labelX} y={labelY} fontSize={14} textAnchor="middle" fill="#1f2937" fontWeight={700}>
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

const Donut: React.FC<{ data: { label: string; value: number; color: string }[]; size?: number }> = ({ data, size }) => {
  const len = Array.isArray(data) ? data.length : 0;
  if (len === 0) {
    const radius0 = (size || 160) / 2;
    return (
      <svg width={radius0 * 2} height={radius0 * 2} viewBox={`0 0 ${radius0 * 2} ${radius0 * 2}`} role="img" aria-label="donut-chart-empty">
        <circle cx={radius0} cy={radius0} r={radius0 - 18 / 2} fill="#f1f5f9" />
        <text x={radius0} y={radius0} textAnchor="middle" dominantBaseline="central" className="font-semibold text-base text-slate-700">
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

  const radius = (size || 160) / 2;
  const stroke = 18;
  let acc = 0;

  return (
    <svg width={radius * 2} height={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`} role="img" aria-label="donut-chart">
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
      <text x={radius} y={radius} textAnchor="middle" dominantBaseline="central" className="font-semibold text-base text-slate-700">
        {Math.round(((typeof data[0].value === "number" ? data[0].value : 0) / total) * 100)}%
      </text>
    </svg>
  );
};

const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color }) => {
  const pct = Math.max(0, Math.min(100, Math.round((typeof value === "number" ? value : 0) * 100)));
  const bg = color ? color : "bg-emerald-500";
  return (
    <div className="w-full bg-slate-100 rounded h-5 overflow-hidden">
      <div className={"h-5 " + bg} style={{ width: pct + "%" }} />
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const [tab, setTab] = useState<number>(1);
  const [monthsToShow, setMonthsToShow] = useState<number>(12);

  // --- selectors (including those used by other tabs)
  const overview = useDashboardStore((s) => s.overview) as OverviewDto | null;
  const classesByGrade = useDashboardStore((s) => s.classesByGrade) as GradeCountDto[];
  const genderRatio = useDashboardStore((s) => (s as any).genderRatio) as KeyValueDto[]; // may be undefined in store
  const emailVerified = useDashboardStore((s) => (s as any).emailVerified) as KeyValueDto[]; 
  const announcementsByType = useDashboardStore((s) => (s as any).announcementsByType) as KeyValueDto[];
  const readRates = useDashboardStore((s) => (s as any).readRates) as KeyValueDto[];
  const topActiveClasses = useDashboardStore((s) => s.topActiveClasses) as TopActiveClassDto[];
  const studentsPerClass = useDashboardStore((s) => s.studentsPerClass) as StudentsPerClassDto[];
  const submissionRate = useDashboardStore((s) => s.submissionRate) as number | null;
  const scoreDistribution = useDashboardStore((s) => s.scoreDistribution) as ScoreDistributionDto[];
  const mostInteractiveAssignments = useDashboardStore((s) => s.mostInteractiveAssignments) as AssignmentInteractionDto[];
  const isLoading = useDashboardStore((s) => s.isLoading);

  const monthlyClassworks = useDashboardStore((s) => (s as any).monthlyClassworks) as MonthlyCountDto[];
  const monthlyNotifications = useDashboardStore((s) => (s as any).monthlyNotifications) as MonthlyCountDto[];
  const monthlySubmissions = useDashboardStore((s) => (s as any).monthlySubmissions) as MonthlyCountDto[];
  const monthlyNewClasses = useDashboardStore((s) => (s as any).monthlyNewClasses) as MonthlyCountDto[];
  const classStats = useDashboardStore((s) => (s as any).classStats) as ClassStatsDto[];
  const topReadNotifications = useDashboardStore((s) => (s as any).topReadNotifications) as NotificationStatDto[];
  const mostIgnoredNotifications = useDashboardStore((s) => (s as any).mostIgnoredNotifications) as NotificationStatDto[];
  const classWithMostNotifications = useDashboardStore((s) => (s as any).classWithMostNotifications) as TopActiveClassDto | null;

  // --- actions
  const fetchOverview = useDashboardStore((s) => s.fetchOverview);
  const fetchClassesByGrade = useDashboardStore((s) => s.fetchClassesByGrade);
  const fetchStudentsPerClass = useDashboardStore((s) => s.fetchStudentsPerClass);
  const fetchSubmissionRate = useDashboardStore((s) => s.fetchSubmissionRate);
  const fetchTopActiveClasses = useDashboardStore((s) => s.fetchTopActiveClasses);
  const fetchScoreDistribution = useDashboardStore((s) => s.fetchScoreDistribution);
  const fetchMostInteractiveAssignments = useDashboardStore((s) => s.fetchMostInteractiveAssignments);

  // new actions for other tabs
  const fetchGenderRatio = useDashboardStore((s) => (s as any).fetchGenderRatio) as () => Promise<KeyValueDto[] | null>;
  const fetchEmailVerified = useDashboardStore((s) => (s as any).fetchEmailVerified) as () => Promise<KeyValueDto[] | null>;
  const fetchAnnouncementsByType = useDashboardStore((s) => (s as any).fetchAnnouncementsByType) as () => Promise<KeyValueDto[] | null>;
  const fetchReadRates = useDashboardStore((s) => (s as any).fetchReadRates) as () => Promise<KeyValueDto[] | null>;
  const fetchTopReadNotifications = useDashboardStore((s) => (s as any).fetchTopReadNotifications) as (top?: number) => Promise<NotificationStatDto[] | null>;
  const fetchMostIgnoredNotifications = useDashboardStore((s) => (s as any).fetchMostIgnoredNotifications) as (top?: number) => Promise<NotificationStatDto[] | null>;
  const fetchMonthlyClassworks = useDashboardStore((s) => (s as any).fetchMonthlyClassworks) as (months?: number) => Promise<MonthlyCountDto[] | null>;
  const fetchMonthlyNotifications = useDashboardStore((s) => (s as any).fetchMonthlyNotifications) as (months?: number) => Promise<MonthlyCountDto[] | null>;
  const fetchMonthlySubmissions = useDashboardStore((s) => (s as any).fetchMonthlySubmissions) as (months?: number) => Promise<MonthlyCountDto[] | null>;
  const fetchMonthlyNewClasses = useDashboardStore((s) => (s as any).fetchMonthlyNewClasses) as (months?: number) => Promise<MonthlyCountDto[] | null>;
  const fetchClassStats = useDashboardStore((s) => (s as any).fetchClassStats) as () => Promise<ClassStatsDto[] | null>;
  const fetchClassWithMostNotifications = useDashboardStore((s) => (s as any).fetchClassWithMostNotifications) as () => Promise<TopActiveClassDto | null>;

  // load initial data
  useEffect(() => {
    // initial overview load
    void fetchOverview();
    void fetchClassesByGrade();
    void fetchStudentsPerClass();
    void fetchSubmissionRate();
    // monthly series
    void fetchMonthlyClassworks(monthsToShow);
    void fetchMonthlyNotifications(monthsToShow);
    void fetchMonthlySubmissions(monthsToShow);
    void fetchMonthlyNewClasses(monthsToShow);
    // other stats
    void fetchClassStats();
    void fetchTopReadNotifications(5);
    void fetchMostIgnoredNotifications(5);
    void fetchClassWithMostNotifications();
    // Also preload tab-specific small datasets (safe to call)
    void fetchGenderRatio();
    void fetchEmailVerified();
    void fetchAnnouncementsByType();
    void fetchReadRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthsToShow]);

  // handle tab change and fetch necessary data for each tab
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

  const safeArr = <T,>(a: T[] | undefined | null, def: T[]) => (a && Array.isArray(a) ? a : def);

  const totalUsers = overview?.totalUsers ?? 0;
  const totalClasses = overview?.totalClasses ?? 0;
  const totalAssignments = overview?.totalAssignments ?? 0;
  const totalAnnouncements = overview?.totalAnnouncements ?? 0;
  const submissionRateValue = (submissionRate ?? 0);

  // helper: if all monthlyNewClasses months share same year, return that year to show in title
  const extractCommonYear = (items: MonthlyCountDto[]) => {
    if (!items || items.length === 0) return null;
    const yrs = new Set(items.map((m) => {
      const r = /^(\d{4})-(\d{2})$/.exec(m.month);
      return r ? r[1] : null;
    }).filter(Boolean));
    return yrs.size === 1 ? Number(Array.from(yrs)[0]) : null;
  };
  const newClassesYear = extractCommonYear(safeArr(monthlyNewClasses, []));

  // top lists limited to 5
  const topActiveTop5 = safeArr(topActiveClasses, []).slice(0, 5);
  const topReadTop5 = safeArr(topReadNotifications, []).slice(0, 5);
  const mostIgnoredTop5 = safeArr(mostIgnoredNotifications, []).slice(0, 5);
  const mostInteractiveTop5 = safeArr(mostInteractiveAssignments, []).slice(0, 5);

  // big button base class for header
  const headerButtonBase = "text-lg md:text-xl px-4 md:px-5 py-2 md:py-3 rounded-md";

  return (
    <div className="p-6 space-y-6 w-full h-full overflow-y-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold">Quản lý Lớp học</h1>
          <p className="text-lg md:text-xl text-slate-600">Tổng quan & phân tích</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => handleTabClick(1)} className={`${headerButtonBase} ${tab === 1 ? "bg-indigo-600 text-white" : "bg-slate-900 text-white/90"}`}>Tổng quan</Button>
          <Button onClick={() => handleTabClick(2)} className={`${headerButtonBase} ${tab === 2 ? "bg-rose-500 text-white" : "bg-slate-900 text-white/90"}`}>Học sinh & Giáo viên</Button>
          <Button onClick={() => handleTabClick(3)} className={`${headerButtonBase} ${tab === 3 ? "bg-emerald-600 text-white" : "bg-slate-900 text-white/90"}`}>Hoạt động lớp</Button>
          <Button onClick={() => handleTabClick(4)} className={`${headerButtonBase} ${tab === 4 ? "bg-sky-600 text-white" : "bg-slate-900 text-white/90"}`}>Bài tập</Button>
        </div>
      </header>

      <div className="flex items-center gap-4">
        <div className="text-lg md:text-xl text-slate-600">Hiển thị</div>
        <div>
          <select
            className="border rounded px-4 py-2 text-lg md:text-xl"
            value={monthsToShow}
            onChange={(e) => setMonthsToShow(Number(e.target.value))}
            aria-label="Số tháng hiển thị"
          >
            <option value={6}>6 tháng</option>
            <option value={12}>12 tháng</option>
            <option value={24}>24 tháng</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard title="Tổng người / lớp" value={`${totalUsers} / ${totalClasses}`} accent="from-rose-400 to-pink-400" icon={<IconPerson className="w-full h-full" />} />
        <MetricCard title="Tổng bài tập / thông báo" value={`${totalAssignments} / ${totalAnnouncements}`} accent="from-sky-500 to-indigo-500" icon={<IconBook className="w-full h-full" />} />
        <MetricCard title="Trung bình học sinh / lớp" value={String((safeArr(studentsPerClass, []).length > 0 ? (safeArr(studentsPerClass, []).reduce((a, c) => a + (c.students ?? 0), 0) / safeArr(studentsPerClass, []).length) : 0).toFixed(2))} accent="from-emerald-400 to-emerald-600" icon={<IconUsers className="w-full h-full" />} />
        <MetricCard title="Tỷ lệ nộp bài" value={`${Math.round(submissionRateValue * 100)}%`} accent="from-amber-400 to-amber-600" icon={<IconNote className="w-full h-full" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2 space-y-6">
          {tab === 1 && (
            <>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl md:text-4xl font-semibold">Số lớp theo khối</div>
                    <div className="text-base md:text-lg text-slate-500">Phân bố lớp theo khối</div>
                  </div>
                  <div className="text-base md:text-lg text-slate-600">{isLoading ? "Đang tải..." : "Dữ liệu mẫu"}</div>
                </div>

                <div className="mt-4">
                  <ColorBarChart
                    data={safeArr(classesByGrade, []).map((g) => ({ label: String((g as any).grade ?? ""), value: typeof (g as any).count === "number" ? (g as any).count : Number((g as any).Count ?? 0), color: `hsl(${Number((g as any).grade ?? 0) * 40},70%,50%)` }))}
                    height={200}
                  />
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl md:text-4xl font-semibold">Thống kê theo tháng</div>
                    <div className="text-base md:text-lg text-slate-500">Số liệu theo tháng</div>
                  </div>
                  <div className="text-base md:text-lg text-slate-600">{monthsToShow} tháng gần nhất{newClassesYear ? ` — Năm ${newClassesYear}` : ""}</div>
                </div>

                <div className="mt-4 space-y-6">
                  <div>
                    <div className="text-xl md:text-2xl font-medium text-slate-700 mb-2">Bài tập</div>
                    <ColorBarChart data={safeArr(monthlyClassworks, []).map((m) => ({ label: m.month, value: m.count }))} height={260} rotateLabels={false} monthOnlyLabels minBarWidth={50} />
                  </div>

                  <div>
                    <div className="text-xl md:text-2xl font-medium text-slate-700 mb-2">Thông báo</div>
                    <ColorBarChart data={safeArr(monthlyNotifications, []).map((m) => ({ label: m.month, value: m.count }))} height={260} rotateLabels={false} monthOnlyLabels minBarWidth={50} />
                  </div>

                  <div>
                    <div className="text-xl md:text-2xl font-medium text-slate-700 mb-2">Lượt nộp</div>
                    <ColorBarChart data={safeArr(monthlySubmissions, []).map((m) => ({ label: m.month, value: m.count }))} height={260} rotateLabels={false} monthOnlyLabels minBarWidth={50} />
                  </div>

                  <div>
                    <div className="text-xl md:text-2xl font-medium text-slate-700 mb-2">{newClassesYear ? `Lớp mới (${newClassesYear})` : "Lớp mới"}</div>
                    <ColorBarChart data={safeArr(monthlyNewClasses, []).map((m) => ({ label: m.month, value: m.count }))} height={260} rotateLabels={false} monthOnlyLabels minBarWidth={50} />
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-3xl md:text-4xl font-semibold">Top lớp theo số học sinh (Top 5)</div>
                <div className="mt-4">
                  <ColorBarChart
                    data={safeArr(studentsPerClass, []).slice(0, 5).map((c, i) => ({ label: c.className || `Lớp ${c.classId}`, value: c.students, color: ["#60a5fa", "#f472b6", "#34d399", "#f59e0b", "#a78bfa"][i % 5] }))}
                    height={200}
                  />
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-3xl md:text-4xl font-semibold">Tổng quan lớp</div>
                <div className="mt-3">
                  <ScrollArea className="h-56">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-base md:text-lg text-slate-500">
                          <th className="pb-2">Lớp</th>
                          <th className="pb-2">Học sinh</th>
                          <th className="pb-2">Tỷ lệ nộp</th>
                          <th className="pb-2">Tỷ lệ đọc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {safeArr(classStats, []).slice(0, 10).map((cs) => (
                          <tr key={cs.classId} className="border-t">
                            <td className="py-3 text-base md:text-lg">{cs.className}</td>
                            <td className="py-3 text-base md:text-lg">{cs.studentsCount}</td>
                            <td className="py-3 text-base md:text-lg">{String(Math.round(cs.submissionRate * 100)) + "%"}</td>
                            <td className="py-3 text-base md:text-lg">{String(Math.round(cs.readRate * 100)) + "%"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              </Card>
            </>
          )}

          {tab === 2 && (
            <>
              <Card className="p-5">
                <div className="text-3xl md:text-4xl font-semibold">Tỷ lệ giới tính</div>
                <div className="mt-4 flex items-center gap-6">
                  <Donut data={safeArr(genderRatio, []).map((g) => ({ label: g.key, value: g.value, color: g.key === "Male" ? "#2563eb" : "#ec4899" }))} size={160} />
                  <div>
                    {safeArr(genderRatio, []).map((g, idx) => {
                      const total = safeArr(genderRatio, []).reduce((acc, item) => acc + (typeof item.value === "number" ? item.value : 0), 0);
                      const value = typeof g.value === "number" ? g.value : 0;
                      const pct = Math.round((value / Math.max(1, total)) * 100);
                      return (
                        <div key={idx} className="mb-2 flex items-center gap-3">
                          <div style={{ background: g.key === "Male" ? "#2563eb" : "#ec4899" }} className="w-4 h-4 rounded" />
                          <div className="text-base md:text-lg">{g.key + ": "}<span className="font-semibold">{value}</span>{" (" + pct + "%)"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-3xl md:text-4xl font-semibold">Tỷ lệ xác minh email</div>
                <div className="mt-4 flex items-center gap-6">
                  <Donut data={safeArr(emailVerified, []).map((e) => ({ label: e.key, value: e.value, color: e.key === "Verified" ? "#10b981" : "#f97316" }))} size={160} />
                  <div>
                    {safeArr(emailVerified, []).map((e, idx) => {
                      const total = safeArr(emailVerified, []).reduce((acc, item) => acc + (typeof item.value === "number" ? item.value : 0), 0);
                      const value = typeof e.value === "number" ? e.value : 0;
                      const pct = Math.round((value / Math.max(1, total)) * 100);
                      return (
                        <div key={idx} className="mb-2 flex items-center gap-3">
                          <div style={{ background: e.key === "Verified" ? "#10b981" : "#f97316" }} className="w-4 h-4 rounded" />
                          <div className="text-base md:text-lg">{e.key + ": "}<span className="font-semibold">{value}</span>{" (" + pct + "%)"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </>
          )}

          {tab === 3 && (
            <>
              <Card className="p-5">
                <div className="text-3xl md:text-4xl font-semibold">Số thông báo theo loại</div>
                <div className="mt-4">
                  <ColorBarChart data={safeArr(announcementsByType, []).map((a) => ({ label: a.key, value: a.value, color: "#7c3aed" }))} height={200} />
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-3xl md:text-4xl font-semibold">Tỷ lệ đọc thông báo</div>
                <div className="mt-4 space-y-3">
                  {safeArr(readRates, []).map((r, idx) => {
                    const val = typeof r.value === "number" ? r.value : 0;
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-base md:text-lg">
                          <div>{r.key}</div>
                          <div className="font-semibold">{String(Math.round(val)) + "%"}</div>
                        </div>
                        <div className="mt-1"><ProgressBar value={val / 100} color={""} /></div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-3xl md:text-4xl font-semibold">Top lớp hoạt động (Top 5)</div>
                <div className="mt-4">
                  <ScrollArea className="h-40">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-base md:text-lg text-slate-500">
                          <th className="pb-2">Lớp</th>
                          <th className="pb-2">Activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topActiveTop5.map((c, i) => (
                          <tr key={c.classId} className="border-t">
                            <td className="py-3 text-base md:text-lg">{c.className}</td>
                            <td className="py-3 text-base md:text-lg">
                              <div className="flex items-center gap-3">
                                <div className={"w-8 h-3 rounded " + (i === 0 ? "bg-indigo-600" : i === 1 ? "bg-emerald-500" : "bg-amber-500")} />
                                <div className="font-medium">{c.activityScore}</div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-3xl md:text-4xl font-semibold">Thông báo được đọc nhiều nhất (Top 5)</div>
                <div className="mt-3 space-y-2">
                  {topReadTop5.map((n) => (
                    <div key={n.notificationId} className="flex justify-between border rounded p-3">
                      <div className="text-base md:text-lg">{n.title}</div>
                      <div className="text-base md:text-lg text-slate-600">{n.readsCount} lượt đọc</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-3xl md:text-4xl font-semibold">Thông báo bị bỏ qua nhiều nhất (Top 5)</div>
                <div className="mt-3 space-y-2">
                  {mostIgnoredTop5.map((n) => (
                    <div key={n.notificationId} className="flex justify-between border rounded p-3">
                      <div className="text-base md:text-lg">{n.title}</div>
                      <div className="text-base md:text-lg text-slate-600">{n.ignoredCount} lượt bỏ qua</div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {tab === 4 && (
            <>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl md:text-4xl font-semibold">Tỷ lệ nộp bài</div>
                    <div className="text-base md:text-lg text-slate-500">Tổng quan nộp bài</div>
                  </div>
                  <div className="text-4xl md:text-6xl font-extrabold text-emerald-600">{String(Math.round(submissionRateValue * 100)) + "%"}</div>
                </div>

                <div className="mt-3">
                  <ProgressBar value={submissionRateValue} color="bg-emerald-500" />
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-3xl md:text-4xl font-semibold">Phân bố điểm</div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {safeArr(scoreDistribution, []).map((s, idx) => {
                    const pct = typeof s.pct === "number" ? s.pct : 0;
                    const range = s.range ?? "";
                    const bg = idx === 0 ? "bg-emerald-400" : idx === 1 ? "bg-sky-400" : idx === 2 ? "bg-violet-300" : "bg-rose-300";
                    return (
                      <div key={idx} className={"p-3 rounded border text-center " + bg}>
                        <div className="text-base md:text-lg text-white">{range}</div>
                        <div className="mt-2 text-2xl md:text-3xl font-semibold text-white">{String(Math.round(pct * 100)) + "%"}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-3xl md:text-4xl font-semibold">Bài tập nhiều tương tác nhất (Top 5)</div>
                <div className="mt-3 grid gap-2">
                  {mostInteractiveTop5.map((a, idx) => {
                    const title = a.title ?? "";
                    const submissionsCount = typeof a.submissionsCount === "number" ? a.submissionsCount : 0;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded border">
                        <div className="flex items-center gap-3">
                          <div className={"bg-sky-500 w-3 h-3 rounded"} />
                          <div className="font-medium text-base md:text-lg">{title}</div>
                        </div>
                        <div className="text-base md:text-lg text-slate-600">{String(submissionsCount)}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </main>

        <aside className="space-y-6">
          <Card className="p-5">
            <div className="text-base md:text-lg text-slate-500">Tổng quan hệ thống</div>
            <div className="mt-3 text-base md:text-lg text-slate-700 space-y-2">
              <div className="text-base">Tổng người dùng: <span className="font-semibold">{String(totalUsers)}</span></div>
              <div className="text-base">Tổng lớp: <span className="font-semibold">{String(totalClasses)}</span></div>
              <div className="text-base">Tổng bài tập: <span className="font-semibold">{String(totalAssignments)}</span></div>
            </div>
          </Card>

          {classWithMostNotifications && (
            <Card className="p-5">
              <div className="text-base md:text-lg text-slate-500">Lớp có nhiều thông báo nhất</div>
              <div className="mt-3 text-base md:text-lg text-slate-700">
                <div className="font-medium text-lg">{classWithMostNotifications.className}</div>
                <div className="text-base">Số thông báo: <span className="font-semibold">{classWithMostNotifications.notificationsCount}</span></div>
                <div className="text-base">Số lượt nộp: <span className="font-semibold">{classWithMostNotifications.submissionsCount}</span></div>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
};

export default DashboardPage;