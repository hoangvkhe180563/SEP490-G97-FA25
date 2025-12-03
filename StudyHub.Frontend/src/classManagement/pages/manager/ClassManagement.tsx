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
} from "@/classManagement/interfaces/dashboard";

const MetricCard: React.FC<{ title: string; value: string | number; accent?: string }> = ({ title, value, accent }) => {
  const accentClass = accent ? accent : "from-indigo-500 to-sky-400";
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-600">{title}</div>
          <div className="text-2xl font-bold mt-2">{value}</div>
        </div>
        <div className={"w-12 h-12 rounded-lg bg-gradient-to-br " + accentClass + " shadow-md flex items-center justify-center"}>
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
            <path d="M12 4v8l6 4" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </Card>
  );
};

const ColorBarChart: React.FC<{ data: { label: string; value: number; color?: string }[]; height?: number }> = ({ data, height }) => {
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    const v = typeof data[i].value === "number" ? data[i].value : 0;
    if (v > max) max = v;
  }
  if (max === 0) max = 1;
  const svgH = height || 160;
  const barW = Math.max(20, Math.floor(600 / Math.max(1, data.length)) - 8);
  return (
    <div className="w-full overflow-auto">
      <svg width={Math.max(300, data.length * (barW + 8))} height={svgH} role="img" aria-label="colored-bar-chart">
        {data.map((d, i) => {
          const val = typeof d.value === "number" ? d.value : 0;
          const barH = Math.round((val / max) * (svgH - 48));
          const x = i * (barW + 8) + 12;
          const y = svgH - 28 - barH;
          const fill = d.color ? d.color : "#2563eb";
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill={fill} rx={6} />
              <text x={x + barW / 2} y={svgH - 6} fontSize={12} textAnchor="middle" fill="#2d3748">
                {d.label}
              </text>
              <text x={x + barW / 2} y={y - 6} fontSize={11} textAnchor="middle" fill="#374151">
                {val}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const Donut: React.FC<{ data: { label: string; value: number; color: string }[]; size?: number }> = ({ data, size }) => {
  const len = Array.isArray(data) ? data.length : 0;
  if (len === 0) {
    const radius0 = (size || 120) / 2;
    return (
      <svg width={radius0 * 2} height={radius0 * 2} viewBox={`0 0 ${radius0 * 2} ${radius0 * 2}`} role="img" aria-label="donut-chart-empty">
        <circle cx={radius0} cy={radius0} r={radius0 - 18 / 2} fill="#f1f5f9" />
        <text x={radius0} y={radius0} textAnchor="middle" dominantBaseline="central" className="font-semibold text-sm text-slate-700">
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

  const radius = (size || 120) / 2;
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
      <text x={radius} y={radius} textAnchor="middle" dominantBaseline="central" className="font-semibold text-sm text-slate-700">
        {Math.round(((typeof data[0].value === "number" ? data[0].value : 0) / total) * 100)}%
      </text>
    </svg>
  );
};

const ProgressBar: React.FC<{ value: number; color?: string }> = ({ value, color }) => {
  const pct = Math.max(0, Math.min(100, Math.round((typeof value === "number" ? value : 0) * 100)));
  const bg = color ? color : "bg-emerald-500";
  return (
    <div className="w-full bg-slate-100 rounded h-3 overflow-hidden">
      <div className={"h-3 " + bg} style={{ width: pct + "%" }} />
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const [tab, setTab] = useState<number>(1);

  // store selectors
  const overview = useDashboardStore((s) => s.overview) as OverviewDto | null;
  const classesByGrade = useDashboardStore((s) => s.classesByGrade) as GradeCountDto[];
  const genderRatio = useDashboardStore((s) => s.genderRatio) as KeyValueDto[];
  const emailVerified = useDashboardStore((s) => s.emailVerified) as KeyValueDto[];
  const announcementsByType = useDashboardStore((s) => s.announcementsByType) as KeyValueDto[];
  const readRates = useDashboardStore((s) => s.readRates) as KeyValueDto[];
  const topActiveClasses = useDashboardStore((s) => s.topActiveClasses) as TopActiveClassDto[];
  const studentsPerClass = useDashboardStore((s) => s.studentsPerClass) as StudentsPerClassDto[];
  const submissionRate = useDashboardStore((s) => s.submissionRate) as number | null;
  const scoreDistribution = useDashboardStore((s) => s.scoreDistribution) as ScoreDistributionDto[];
  const mostInteractiveAssignments = useDashboardStore((s) => s.mostInteractiveAssignments) as AssignmentInteractionDto[];
  const isLoading = useDashboardStore((s) => s.isLoading);

  // actions
  const fetchOverview = useDashboardStore((s) => s.fetchOverview);
  const fetchClassesByGrade = useDashboardStore((s) => s.fetchClassesByGrade);
  const fetchGenderRatio = useDashboardStore((s) => s.fetchGenderRatio);
  const fetchEmailVerified = useDashboardStore((s) => s.fetchEmailVerified);
  const fetchAnnouncementsByType = useDashboardStore((s) => s.fetchAnnouncementsByType);
  const fetchReadRates = useDashboardStore((s) => s.fetchReadRates);
  const fetchTopActiveClasses = useDashboardStore((s) => s.fetchTopActiveClasses);
  const fetchStudentsPerClass = useDashboardStore((s) => s.fetchStudentsPerClass);
  const fetchSubmissionRate = useDashboardStore((s) => s.fetchSubmissionRate);
  const fetchScoreDistribution = useDashboardStore((s) => s.fetchScoreDistribution);
  const fetchMostInteractiveAssignments = useDashboardStore((s) => s.fetchMostInteractiveAssignments);

  useEffect(() => {
    // initial load includes submission rate and students-per-class so avg can be computed
    void fetchOverview();
    void fetchClassesByGrade();
    void fetchStudentsPerClass();
    void fetchSubmissionRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTabClick(tabIndex: number) {
    setTab(tabIndex);
    if (tabIndex === 1) {
      void fetchOverview();
      void fetchClassesByGrade();
      void fetchStudentsPerClass();
    } else if (tabIndex === 2) {
      void fetchGenderRatio();
      void fetchEmailVerified();
      void fetchStudentsPerClass();
    } else if (tabIndex === 3) {
      void fetchAnnouncementsByType();
      void fetchReadRates();
      void fetchTopActiveClasses(10);
    } else if (tabIndex === 4) {
      void fetchSubmissionRate();
      void fetchScoreDistribution();
      void fetchMostInteractiveAssignments(10);
    }
  }

  function overviewMetric(key: "totalUsers" | "totalClasses" | "totalAssignments" | "totalAnnouncements"): number {
    if (overview !== null) {
      if (key === "totalUsers") return typeof overview.totalUsers === "number" ? overview.totalUsers : 0;
      if (key === "totalClasses") return typeof overview.totalClasses === "number" ? overview.totalClasses : 0;
      if (key === "totalAssignments") return typeof overview.totalAssignments === "number" ? overview.totalAssignments : 0;
      return typeof overview.totalAnnouncements === "number" ? overview.totalAnnouncements : 0;
    }
    return 0;
  }

  function useOrDefault<T>(arr: T[] | undefined | null, def: T[]): T[] {
    if (arr && Array.isArray(arr) && arr.length > 0) return arr;
    return def;
  }

  const classesByGradeData = useOrDefault(classesByGrade, []);
  const genderRatioData = useOrDefault(genderRatio, []);
  const emailVerifiedData = useOrDefault(emailVerified, []);
  const announcementsByTypeData = useOrDefault(announcementsByType, []);
  const readRatesData = useOrDefault(readRates, []);
  const topActiveData = useOrDefault(topActiveClasses, []);
  const studentsPerClassData = useOrDefault(studentsPerClass, []);
  const submissionRateValue = (submissionRate !== null && typeof submissionRate === "number") ? submissionRate : 0;
  const scoreDistData = useOrDefault(scoreDistribution, []);
  const mostInteractiveData = useOrDefault(mostInteractiveAssignments, []);

  const totalUsers = overviewMetric("totalUsers");
  const totalClasses = overviewMetric("totalClasses");
  const totalAssignments = overviewMetric("totalAssignments");
  const totalAnnouncements = overviewMetric("totalAnnouncements");

  // compute average students per class as double (sum / number of classes) using studentsPerClassData
  const avgStudentsPerClassDouble = (() => {
    const arr = studentsPerClassData;
    if (Array.isArray(arr) && arr.length > 0) {
      const sum = arr.reduce((acc, c) => {
        const v = typeof (c as any).students === "number" ? (c as any).students : Number((c as any).Students ?? 0);
        return acc + (Number.isFinite(v) ? v : 0);
      }, 0);
      return sum / arr.length;
    }
    // fallback to overview numbers if studentsPerClass not available (as double)
    return totalClasses > 0 ? totalUsers / totalClasses : 0;
  })();

  // Top classes: show only top 5
  const topClassesToShow = topActiveData.slice(0, 5).map((c, i) => {
    const activityScore = typeof (c as any).activityScore === "number" ? (c as any).activityScore : Number((c as any).ActivityScore ?? 0);
    return {
      className: (c as any).className ?? (c as any).ClassName ?? "",
      activityScore,
      idx: i,
    };
  });

  return (
    <div className="p-6 space-y-6 w-full h-full overflow-y-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Class Management</h1>
          <p className="text-sm text-slate-500">Dashboard overview and analytics</p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => handleTabClick(1)} className={tab === 1 ? "bg-indigo-600 text-white" : ""}>Overview</Button>
          <Button onClick={() => handleTabClick(2)} className={tab === 2 ? "bg-rose-500 text-white" : ""}>Students & Teachers</Button>
          <Button onClick={() => handleTabClick(3)} className={tab === 3 ? "bg-emerald-600 text-white" : ""}>Class Activity</Button>
          <Button onClick={() => handleTabClick(4)} className={tab === 4 ? "bg-sky-600 text-white" : ""}>Assignments</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <MetricCard title="Tổng người dùng / lớp" value={String(totalUsers) + " / " + String(totalClasses)} accent="from-rose-400 to-pink-400" />
        <MetricCard title="Tổng bài tập / thông báo" value={String(totalAssignments) + " / " + String(totalAnnouncements)} accent="from-sky-500 to-indigo-500" />
        <MetricCard title="Avg students / class" value={String(avgStudentsPerClassDouble.toFixed(2))} accent="from-emerald-400 to-emerald-600" />
        <MetricCard title="Submission rate" value={String(Math.round(submissionRateValue * 100)) + "%"} accent="from-amber-400 to-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2 space-y-6">
          {tab === 1 && (
            <>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">Số lớp theo khối</div>
                    <div className="text-sm text-slate-500">Số lớp phân bố theo khối</div>
                  </div>
                  <div className="text-sm text-slate-600">{isLoading ? "Loading..." : "Realtime sample"}</div>
                </div>

                <div className="mt-4">
                  <ColorBarChart data={classesByGradeData.map((g) => ({ label: String((g as any).grade ?? ""), value: typeof (g as any).count === "number" ? (g as any).count : Number((g as any).Count ?? 0), color: `hsl(${Number((g as any).grade ?? 0) * 40},70%,50%)` }))} height={160} />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">Top students per sample</div>
                    <div className="text-sm text-slate-500">Top 5 classes by student count</div>
                  </div>
                </div>

                <div className="mt-4">
                  <ColorBarChart data={studentsPerClassData.slice(0, 5).map((c, i) => ({ label: (c as any).className ?? "", value: typeof (c as any).students === "number" ? (c as any).students : Number((c as any).Students ?? 0), color: ["#60a5fa", "#f472b6", "#34d399", "#f59e0b", "#a78bfa"][i % 5] }))} height={160} />
                </div>
              </Card>
            </>
          )}

          {tab === 2 && (
            <>
              <Card className="p-4">
                <div className="text-lg font-semibold">Tỉ lệ giới tính</div>
                <div className="mt-4 flex items-center gap-4">
                  <Donut data={genderRatioData.map((g) => ({ label: (g as any).key ?? "", value: typeof (g as any).value === "number" ? (g as any).value : Number((g as any).Value ?? 0), color: (g as any).key === "Male" ? "#2563eb" : "#ec4899" }))} size={120} />
                  <div>
                    {genderRatioData.map((g, idx) => {
                      const total = genderRatioData.reduce((acc, item) => acc + (typeof (item as any).value === "number" ? (item as any).value : Number((item as any).Value ?? 0)), 0);
                      const value = typeof (g as any).value === "number" ? (g as any).value : Number((g as any).Value ?? 0);
                      const pct = Math.round((value / Math.max(1, total)) * 100);
                      return (
                        <div key={idx} className="mb-2 flex items-center gap-3">
                          <div style={{ background: (g as any).key === "Male" ? "#2563eb" : "#ec4899" }} className="w-3 h-3 rounded" />
                          <div className="text-sm">{(g as any).key + ": "}<span className="font-semibold">{value}</span>{" (" + pct + "%)"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-lg font-semibold">Tỉ lệ xác minh email</div>
                <div className="mt-4 flex items-center gap-4">
                  <Donut data={emailVerifiedData.map((e) => ({ label: (e as any).key ?? "", value: typeof (e as any).value === "number" ? (e as any).value : Number((e as any).Value ?? 0), color: (e as any).key === "Verified" ? "#10b981" : "#f97316" }))} size={120} />
                  <div>
                    {emailVerifiedData.map((e, idx) => {
                      const total = emailVerifiedData.reduce((acc, item) => acc + (typeof (item as any).value === "number" ? (item as any).value : Number((item as any).Value ?? 0)), 0);
                      const value = typeof (e as any).value === "number" ? (e as any).value : Number((e as any).Value ?? 0);
                      const pct = Math.round((value / Math.max(1, total)) * 100);
                      return (
                        <div key={idx} className="mb-2 flex items-center gap-3">
                          <div style={{ background: (e as any).key === "Verified" ? "#10b981" : "#f97316" }} className="w-3 h-3 rounded" />
                          <div className="text-sm">{(e as any).key + ": "}<span className="font-semibold">{value}</span>{" (" + pct + "%)"}</div>
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
              <Card className="p-4">
                <div className="text-lg font-semibold">Số thông báo theo loại</div>
                <div className="mt-4">
                  <ColorBarChart data={announcementsByTypeData.map((a) => ({ label: (a as any).key ?? "", value: typeof (a as any).value === "number" ? (a as any).value : Number((a as any).Value ?? 0), color: "#7c3aed" }))} height={140} />
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-lg font-semibold">Tỉ lệ đọc thông báo</div>
                <div className="mt-4 space-y-3">
                  {readRatesData.map((r, idx) => {
                    const val = typeof (r as any).value === "number" ? (r as any).value : Number((r as any).Value ?? 0);
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-sm">
                          <div>{(r as any).key}</div>
                          <div className="font-semibold">{String(Math.round(val)) + "%"}</div>
                        </div>
                        <div className="mt-1"><ProgressBar value={val / 100} color={""} /></div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-lg font-semibold">Top lớp hoạt động (top 5)</div>
                <div className="mt-4">
                  <ScrollArea className="h-40">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-sm text-slate-500">
                          <th className="pb-2">Lớp</th>
                          <th className="pb-2">Activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topClassesToShow.map((c) => (
                          <tr key={c.className} className="border-t">
                            <td className="py-2">{c.className}</td>
                            <td className="py-2">
                              <div className="flex items-center gap-3">
                                <div className={"w-8 h-3 rounded " + (c.idx === 0 ? "bg-indigo-600" : c.idx === 1 ? "bg-emerald-500" : "bg-amber-500")} />
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
            </>
          )}

          {tab === 4 && (
            <>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold">Tỉ lệ nộp bài</div>
                    <div className="text-sm text-slate-500">Tổng quan nộp bài</div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">{String(Math.round(submissionRateValue * 100)) + "%"}</div>
                </div>

                <div className="mt-3">
                  <ProgressBar value={submissionRateValue} color="bg-emerald-500" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-lg font-semibold">Phân bố điểm</div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {scoreDistData.map((s, idx) => {
                    const pct = typeof (s as any).pct === "number" ? (s as any).pct : Number((s as any).Pct ?? 0);
                    const range = (s as any).range ?? (s as any).Range ?? "";
                    const bg = idx === 0 ? "bg-emerald-400" : idx === 1 ? "bg-sky-400" : idx === 2 ? "bg-violet-300" : "bg-rose-300";
                    return (
                      <div key={idx} className={"p-3 rounded border text-center " + bg}>
                        <div className="text-sm text-white">{range}</div>
                        <div className="mt-2 text-xl font-semibold text-white">{String(Math.round(pct * 100)) + "%"}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-lg font-semibold">Bài tập nhiều tương tác nhất</div>
                <div className="mt-3 grid gap-2">
                  {mostInteractiveData.map((a, idx) => {
                    const title = (a as any).title ?? (a as any).Title ?? "";
                    const submissionsCount = typeof (a as any).submissionsCount === "number" ? (a as any).submissionsCount : Number((a as any).SubmissionsCount ?? (a as any).interactions ?? 0);
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded border">
                        <div className="flex items-center gap-3">
                          <div className={"bg-sky-500 w-3 h-3 rounded"} />
                          <div className="font-medium">{title}</div>
                        </div>
                        <div className="text-sm text-slate-600">{String(submissionsCount)}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </main>

        <aside className="space-y-6">
          <Card className="p-4">
            <div className="text-sm text-slate-500">Quick Filters</div>
            <div className="mt-3 flex flex-col gap-2">
              <Button onClick={() => handleTabClick(1)} className="w-full">Overview</Button>
              <Button onClick={() => handleTabClick(2)} className="w-full">Students & Teachers</Button>
              <Button onClick={() => handleTabClick(3)} className="w-full">Class Activity</Button>
              <Button onClick={() => handleTabClick(4)} className="w-full">Assignments</Button>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-slate-500">Top classes (by activity, top 5)</div>
            <div className="mt-3 space-y-2">
              {topClassesToShow.map((c) => (
                <div key={c.className} className="flex justify-between">
                  <div className="text-sm">{c.className}</div>
                  <div className="text-sm font-medium">{String(c.activityScore)}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-slate-500">System summary</div>
            <div className="mt-3 text-sm text-slate-700 space-y-1">
              <div>Total users: {String(totalUsers)}</div>
              <div>Total classes: {String(totalClasses)}</div>
              <div>Total assignments: {String(totalAssignments)}</div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default DashboardPage;