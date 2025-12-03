import { create } from "zustand";
import { enrollmentService } from "@/courseManagement/services/enrollmentService";

type EnrollmentState = {
  enrollments: any[];
  loading: boolean;
  progresses: Record<number, string | null>;
  enrollmentCounts: Record<number, number>;
  fetchByUser: (userId: string) => Promise<any[] | null>;
  enroll: (payload: { appUserId: string; courseId: number }) => Promise<any>;
  consumeWallet: (payload: {
    appUserId: string;
    courseId: number;
  }) => Promise<any>;
  fetchCounts: (query?: {
    from?: string;
    to?: string;
    schoolId?: number;
  }) => Promise<Record<number, number> | null>;
  getEnrollmentForCourse: (courseId: number) => any | null;
  recordProgress: (
    enrollmentId: number,
    payload: { lessonId: number; completionDate?: string | null }
  ) => Promise<any>;
  fetchProgresses: (enrollmentId: number) => Promise<any[] | null>;
  getLessonCompleted: (lessonId: number) => boolean;
  getProgresses: (enrollmentId: number) => Promise<any[] | null>;
};

export const useEnrollmentStore = create<EnrollmentState>((set, get) => ({
  enrollments: [],
  loading: false,
  progresses: {},
  enrollmentCounts: {},
  fetchByUser: async (userId: string) => {
    set({ loading: true });
    try {
      const res = await enrollmentService.getByUser(userId);
      // backend returns array; normalize
      const items = Array.isArray(res) ? res : res?.items ?? [];
      set({ enrollments: items, loading: false });
      return items;
    } catch (err) {
      set({ loading: false });
      return null;
    }
  },
  enroll: async (payload) => {
    set({ loading: true });
    try {
      const res = await enrollmentService.enroll(payload);
      // normalize API response: backend may return { success, data } or { Data }
      const created = res?.data ?? res?.Data ?? res;
      // append the actual enrollment object (not wrapper) to local list
      set((s: any) => ({
        enrollments: [...(s.enrollments || []), created],
        loading: false,
      }));
      return created;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
  consumeWallet: async (payload: { appUserId: string; courseId: number }) => {
    set({ loading: true });
    try {
      const res = await enrollmentService.consumeWallet(payload);
      // if backend created enrollment, status is 201 and data contains created enrollment
      if (res.status === 201) {
        const created =
          res.data?.data ?? res.data ?? res.data?.Data ?? res.data;
        set((s: any) => ({
          enrollments: [...(s.enrollments || []), created],
          loading: false,
        }));
        return { created };
      }

      // otherwise, expect object with deducted/remaining
      const info = res.data ?? {};
      set({ loading: false });
      return { info };
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
  getEnrollmentForCourse: (courseId: number) => {
    const list = get().enrollments || [];
    return (
      list.find((e: any) => Number(e.courseId) === Number(courseId)) ?? null
    );
  },
  recordProgress: async (enrollmentId: number, payload) => {
    const res = await enrollmentService.recordProgress(
      enrollmentId,
      payload as any
    );
    return res;
  },
  fetchProgresses: async (enrollmentId: number) => {
    const res = await enrollmentService.getProgresses(enrollmentId);
    const items = Array.isArray(res) ? res : res?.items ?? [];
    const map: Record<number, string | null> = {};
    (items || []).forEach((p: any) => {
      if (p && p.lessonId) map[Number(p.lessonId)] = p.completionDate ?? null;
    });
    set({ progresses: map });
    return items;
  },
  fetchCounts: async (query) => {
    set({ loading: true });
    try {
      const res = await enrollmentService.getCounts(query as any);
      // expect array like [{ courseId, count }, ...]
      const items = Array.isArray(res) ? res : res?.items ?? [];
      const map: Record<number, number> = {};
      (items || []).forEach((r: any) => {
        if (r && r.courseId !== undefined)
          map[Number(r.courseId)] = Number(r.count || 0);
      });
      set({ enrollmentCounts: map, loading: false });
      return map;
    } catch (err) {
      set({ loading: false });
      return null;
    }
  },
  getLessonCompleted: (lessonId: number) => {
    const map = get().progresses || {};
    return Boolean(map[Number(lessonId)]);
  },
  getProgresses: async (enrollmentId: number) => {
    try {
      const res = await enrollmentService.getProgresses(enrollmentId);
      const items = Array.isArray(res) ? res : res?.items ?? [];
      return items;
    } catch (err) {
      return null;
    }
  },
}));
