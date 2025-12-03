import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance } from "@/lib/axios";
import type {
  OverviewDto,
  GradeCountDto,
  StudentsPerClassDto,
  RoleCountDto,
  KeyValueDto,
  TopActiveClassDto,
  ScoreDistributionDto,
  AssignmentInteractionDto,
} from "@/classManagement/interfaces/dashboard";

type DashboardState = {
  // data
  overview: OverviewDto | null;
  classesByGrade: GradeCountDto[];
  studentsPerClass: StudentsPerClassDto[];
  roleCounts: RoleCountDto[];
  genderRatio: KeyValueDto[];
  emailVerified: KeyValueDto[];
  announcementsByType: KeyValueDto[];
  readRates: KeyValueDto[];
  topActiveClasses: TopActiveClassDto[];
  submissionRate: number | null;
  scoreDistribution: ScoreDistributionDto[];
  mostInteractiveAssignments: AssignmentInteractionDto[];

  // meta
  isLoading: boolean;
  error: string | null;

  // actions
  reset: () => void;
  fetchOverview: () => Promise<OverviewDto | null>;
  fetchClassesByGrade: () => Promise<GradeCountDto[] | null>;
  fetchStudentsPerClass: (limit?: number) => Promise<StudentsPerClassDto[] | null>;
  fetchRoleCounts: () => Promise<RoleCountDto[] | null>;
  fetchGenderRatio: () => Promise<KeyValueDto[] | null>;
  fetchEmailVerified: () => Promise<KeyValueDto[] | null>;
  fetchAnnouncementsByType: () => Promise<KeyValueDto[] | null>;
  fetchReadRates: () => Promise<KeyValueDto[] | null>;
  fetchTopActiveClasses: (top?: number) => Promise<TopActiveClassDto[] | null>;
  fetchSubmissionRate: () => Promise<number | null>;
  fetchScoreDistribution: () => Promise<ScoreDistributionDto[] | null>;
  fetchMostInteractiveAssignments: (top?: number) => Promise<AssignmentInteractionDto[] | null>;
};

export const useDashboardStore = create<DashboardState>()(
  devtools((set, get) => {
    const base = "/ClassManagement";

    const handleError = (err: any) => {
      let msg = "Unknown error";
      if (err && err.response && err.response.data && err.response.data.message) {
        msg = String(err.response.data.message);
      } else if (err && err.message) {
        msg = String(err.message);
      }
      set({ error: msg, isLoading: false });
    };

    return {
      overview: null,
      classesByGrade: [],
      studentsPerClass: [],
      roleCounts: [],
      genderRatio: [],
      emailVerified: [],
      announcementsByType: [],
      readRates: [],
      topActiveClasses: [],
      submissionRate: null,
      scoreDistribution: [],
      mostInteractiveAssignments: [],

      isLoading: false,
      error: null,

      reset: () => {
        set({
          overview: null,
          classesByGrade: [],
          studentsPerClass: [],
          roleCounts: [],
          genderRatio: [],
          emailVerified: [],
          announcementsByType: [],
          readRates: [],
          topActiveClasses: [],
          submissionRate: null,
          scoreDistribution: [],
          mostInteractiveAssignments: [],
          isLoading: false,
          error: null,
        });
      },

      fetchOverview: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosInstance.get<OverviewDto>(`${base}/overview`);
          const data = res && res.data ? res.data : null;
          if (data !== null) {
            const mapped: OverviewDto = {
              totalUsers: typeof (data as any).totalUsers === "number" ? (data as any).totalUsers : Number((data as any).TotalUsers ?? 0),
              totalClasses: typeof (data as any).totalClasses === "number" ? (data as any).totalClasses : Number((data as any).TotalClasses ?? 0),
              totalAssignments: typeof (data as any).totalAssignments === "number" ? (data as any).totalAssignments : Number((data as any).TotalAssignments ?? 0),
              totalAnnouncements: typeof (data as any).totalAnnouncements === "number" ? (data as any).totalAnnouncements : Number((data as any).TotalAnnouncements ?? 0),
            };
            set({ overview: mapped, isLoading: false });
            return mapped;
          } else {
            set({ isLoading: false });
            return null;
          }
        } catch (err) {
          handleError(err);
          return null;
        }
      },

      fetchClassesByGrade: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosInstance.get<GradeCountDto[]>(`${base}/classes-by-grade`);
          const raw = res && res.data ? res.data : [];
          const arr = Array.isArray(raw) ? raw : [];
          const mapped = arr.map((r: any) => ({
            grade: typeof r.grade === "number" ? r.grade : Number(r.Grade ?? 0),
            count: typeof r.count === "number" ? r.count : Number(r.Count ?? 0),
          })) as GradeCountDto[];
          set({ classesByGrade: mapped, isLoading: false });
          return mapped;
        } catch (err) {
          handleError(err);
          return null;
        }
      },

      fetchStudentsPerClass: async (limit?: number) => {
        set({ isLoading: true, error: null });
        try {
          const qs = limit && limit > 0 ? `?limit=${encodeURIComponent(String(limit))}` : "";
          const res = await axiosInstance.get<StudentsPerClassDto[]>(`${base}/students-per-class${qs}`);
          const raw = res && res.data ? res.data : [];
          const arr = Array.isArray(raw) ? raw : [];
          const mapped = arr.map((r: any) => ({
            classId: typeof r.classId === "number" ? r.classId : Number(r.ClassId ?? r.id ?? 0),
            className: typeof r.className === "string" ? r.className : String(r.ClassName ?? r.name ?? ""),
            students: typeof r.students === "number" ? r.students : Number(r.Students ?? r.count ?? 0),
          })) as StudentsPerClassDto[];
          set({ studentsPerClass: mapped, isLoading: false });
          return mapped;
        } catch (err) {
          handleError(err);
          return null;
        }
      },

      fetchRoleCounts: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosInstance.get<RoleCountDto[]>(`${base}/role-counts`);
          const raw = res && res.data ? res.data : [];
          const arr = Array.isArray(raw) ? raw : [];
          const mapped = arr.map((r: any) => ({
            roleName: typeof r.roleName === "string" ? r.roleName : String(r.RoleName ?? r.role ?? ""),
            count: typeof r.count === "number" ? r.count : Number(r.Count ?? 0),
          })) as RoleCountDto[];
          set({ roleCounts: mapped, isLoading: false });
          return mapped;
        } catch (err) {
          handleError(err);
          return null;
        }
      },

      fetchGenderRatio: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosInstance.get<KeyValueDto[]>(`${base}/gender-ratio`);
          const raw = res && res.data ? res.data : [];
          const arr = Array.isArray(raw) ? raw : [];
          const mapped = arr.map((r: any) => ({
            key: String(r.key ?? r.Key ?? r.label ?? r.Label ?? ""),
            value: typeof r.value === "number" ? r.value : Number(r.Value ?? r.v ?? 0),
          })) as KeyValueDto[];
          set({ genderRatio: mapped, isLoading: false });
          return mapped;
        } catch (err) {
          handleError(err);
          return null;
        }
      },

      fetchEmailVerified: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosInstance.get<KeyValueDto[]>(`${base}/email-verified`);
          const raw = res && res.data ? res.data : [];
          const arr = Array.isArray(raw) ? raw : [];
          const mapped = arr.map((r: any) => ({
            key: String(r.key ?? r.Key ?? r.label ?? r.Label ?? ""),
            value: typeof r.value === "number" ? r.value : Number(r.Value ?? r.v ?? 0),
          })) as KeyValueDto[];
          set({ emailVerified: mapped, isLoading: false });
          return mapped;
        } catch (err) {
          handleError(err);
          return null;
        }
      },

      fetchAnnouncementsByType: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosInstance.get<KeyValueDto[]>(`${base}/announcements-by-type`);
          const raw = res && res.data ? res.data : [];
          const arr = Array.isArray(raw) ? raw : [];
          const mapped = arr.map((r: any) => ({
            key: String(r.key ?? r.Key ?? r.type ?? r.Type ?? ""),
            value: typeof r.value === "number" ? r.value : Number(r.Value ?? r.count ?? r.Count ?? 0),
          })) as KeyValueDto[];
          set({ announcementsByType: mapped, isLoading: false });
          return mapped;
        } catch (err) {
          handleError(err);
          return null;
        }
      },

      fetchReadRates: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosInstance.get<KeyValueDto[]>(`${base}/read-rates`);
          const raw = res && res.data ? res.data : [];
          const arr = Array.isArray(raw) ? raw : [];
          const mapped = arr.map((r: any) => ({
            key: String(r.key ?? r.Key ?? r.label ?? r.Label ?? ""),
            value: typeof r.value === "number" ? r.value : Number(r.Value ?? 0),
          })) as KeyValueDto[];
          set({ readRates: mapped, isLoading: false });
          return mapped;
        } catch (err) {
          handleError(err);
          return null;
        }
      },

      fetchTopActiveClasses: async (top?: number) => {
        set({ isLoading: true, error: null });
        try {
          const qs = top && top > 0 ? `?top=${encodeURIComponent(String(top))}` : "";
          const res = await axiosInstance.get<TopActiveClassDto[]>(`${base}/top-active-classes${qs}`);
          const raw = res && res.data ? res.data : [];
          const arr = Array.isArray(raw) ? raw : [];
          const mapped = arr.map((r: any) => ({
            classId: typeof r.classId === "number" ? r.classId : Number(r.ClassId ?? r.classId ?? 0),
            className: String(r.className ?? r.ClassName ?? r.name ?? ""),
            activityScore: typeof r.activityScore === "number" ? r.activityScore : Number(r.ActivityScore ?? 0),
            notificationsCount: typeof r.notificationsCount === "number" ? r.notificationsCount : Number(r.NotificationsCount ?? 0),
            submissionsCount: typeof r.submissionsCount === "number" ? r.submissionsCount : Number(r.SubmissionsCount ?? 0),
            commentsCount: typeof r.commentsCount === "number" ? r.commentsCount : Number(r.CommentsCount ?? 0),
          })) as TopActiveClassDto[];
          set({ topActiveClasses: mapped, isLoading: false });
          return mapped;
        } catch (err) {
          handleError(err);
          return null;
        }
      },

      fetchSubmissionRate: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosInstance.get<{ rate: number }>(`${base}/submission-rate`);
          const raw = res && res.data ? res.data : null;
          let rate: number | null = null;
          if (raw !== null) {
            if (typeof (raw as any).rate === "number") rate = (raw as any).rate;
            else if (typeof (raw as any).Rate === "number") rate = (raw as any).Rate;
            else if (typeof raw === "number") rate = raw as any as number;
          }
          set({ submissionRate: rate, isLoading: false });
          return rate;
        } catch (err) {
          handleError(err);
          return null;
        }
      },

      fetchScoreDistribution: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await axiosInstance.get<ScoreDistributionDto[]>(`${base}/score-distribution`);
          const raw = res && res.data ? res.data : [];
          const arr = Array.isArray(raw) ? raw : [];
          const mapped = arr.map((r: any) => ({
            range: String(r.range ?? r.Range ?? ""),
            count: typeof r.count === "number" ? r.count : Number(r.Count ?? 0),
            pct: typeof r.pct === "number" ? r.pct : Number(r.Pct ?? 0),
          })) as ScoreDistributionDto[];
          set({ scoreDistribution: mapped, isLoading: false });
          return mapped;
        } catch (err) {
          handleError(err);
          return null;
        }
      },

      fetchMostInteractiveAssignments: async (top?: number) => {
        set({ isLoading: true, error: null });
        try {
          const qs = top && top > 0 ? `?top=${encodeURIComponent(String(top))}` : "";
          const res = await axiosInstance.get<AssignmentInteractionDto[]>(`${base}/most-interactive-assignments${qs}`);
          const raw = res && res.data ? res.data : [];
          const arr = Array.isArray(raw) ? raw : [];
          const mapped = arr.map((r: any) => ({
            notificationId: typeof r.notificationId === "number" ? r.notificationId : Number(r.NotificationId ?? r.id ?? 0),
            title: String(r.title ?? r.Title ?? r.name ?? ""),
            submissionsCount: typeof r.submissionsCount === "number" ? r.submissionsCount : Number(r.SubmissionsCount ?? r.interactions ?? 0),
          })) as AssignmentInteractionDto[];
          set({ mostInteractiveAssignments: mapped, isLoading: false });
          return mapped;
        } catch (err) {
          handleError(err);
          return null;
        }
      },
    };
  }, { name: "dashboard-store" })
);

export default useDashboardStore;