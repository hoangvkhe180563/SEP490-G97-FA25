import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import type {
  QaOverviewDto,
  TeacherStatsDto,
  SubjectCountDto,
} from "../interfaces/qa-dtos";

type QaStatsState = {
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  top: number;
  isLoadingOverview: boolean;
  isLoadingTopTeachers: boolean;
  isLoadingTopStudents: boolean;
  isLoadingTopSubjects: boolean;
  error?: string | null;
  overview?: QaOverviewDto | null;
  topTeachers?: TeacherStatsDto[] | null;
  topStudents?: any[] | null;
  topSubjects?: SubjectCountDto[] | null;
  setDateRange: (start?: Date, end?: Date) => void;
  fetchOverview: () => Promise<void>;
  fetchTopTeachers: (sortBy?: string) => Promise<void>;
  fetchTopStudents: () => Promise<void>;
  fetchTopSubjects: () => Promise<void>;
};

export const useQaStatsStore = create<QaStatsState>()(
  devtools((set, get) => ({
    startDate: undefined,
    endDate: undefined,
    top: 10,
    isLoadingOverview: false,
    isLoadingTopTeachers: false,
    isLoadingTopStudents: false,
    isLoadingTopSubjects: false,
    error: null,
    overview: null,
    topTeachers: null,
    topStudents: null,
    topSubjects: null,
    setDateRange: (start?: Date, end?: Date) =>
      set({ startDate: start, endDate: end }),

    fetchOverview: async () => {
      set({ isLoadingOverview: true, error: null });
      try {
        const { startDate, endDate, top } = get();
        const qs = [] as string[];
        if (startDate)
          qs.push(`start=${startDate.toISOString().split("T")[0]}`);
        if (endDate) qs.push(`end=${endDate.toISOString().split("T")[0]}`);
        qs.push(`top=${top}`);
        const url = `/Statistics/QA/Overview?${qs.join("&")}`;
        const resp = await axiosInstance.get(url);
        const body = resp.data;
        set({ overview: body?.data ?? null });
      } catch (err: any) {
        set({ error: axiosMessageErrorHandler(err) });
      } finally {
        set({ isLoadingOverview: false });
      }
    },

    fetchTopTeachers: async (sortBy = "response") => {
      set({ isLoadingTopTeachers: true, error: null });
      try {
        const { startDate, endDate, top } = get();
        const qs = [] as string[];
        if (startDate)
          qs.push(`start=${startDate.toISOString().split("T")[0]}`);
        if (endDate) qs.push(`end=${endDate.toISOString().split("T")[0]}`);
        qs.push(`top=${top}`);
        qs.push(`sortBy=${sortBy}`);
        const url = `/Statistics/QA/TopTeachers?${qs.join("&")}`;
        const resp = await axiosInstance.get(url);
        const body = resp.data;
        set({ topTeachers: body?.data ?? [] });
      } catch (err: any) {
        set({ error: axiosMessageErrorHandler(err) });
      } finally {
        set({ isLoadingTopTeachers: false });
      }
    },

    fetchTopStudents: async () => {
      set({ isLoadingTopStudents: true, error: null });
      try {
        const { startDate, endDate, top } = get();
        const qs = [] as string[];
        if (startDate)
          qs.push(`start=${startDate.toISOString().split("T")[0]}`);
        if (endDate) qs.push(`end=${endDate.toISOString().split("T")[0]}`);
        qs.push(`top=${top}`);
        const url = `/Statistics/QA/TopStudents?${qs.join("&")}`;
        const resp = await axiosInstance.get(url);
        const body = resp.data;
        set({ topStudents: body?.data ?? [] });
      } catch (err: any) {
        set({ error: axiosMessageErrorHandler(err) });
      } finally {
        set({ isLoadingTopStudents: false });
      }
    },

    fetchTopSubjects: async () => {
      set({ isLoadingTopSubjects: true, error: null });
      try {
        const { startDate, endDate, top } = get();
        const qs = [] as string[];
        if (startDate)
          qs.push(`start=${startDate.toISOString().split("T")[0]}`);
        if (endDate) qs.push(`end=${endDate.toISOString().split("T")[0]}`);
        qs.push(`top=${top}`);
        const url = `/Statistics/QA/TopSubjects?${qs.join("&")}`;
        const resp = await axiosInstance.get(url);
        const body = resp.data;
        set({ topSubjects: body?.data ?? [] });
      } catch (err: any) {
        set({ error: axiosMessageErrorHandler(err) });
      } finally {
        set({ isLoadingTopSubjects: false });
      }
    },
  }))
);

export default useQaStatsStore;
