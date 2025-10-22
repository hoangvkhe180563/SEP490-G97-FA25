import { create } from "zustand";
import { enrollmentService } from "@/courseManagement/services/enrollmentService";

type EnrollmentState = {
  enrollments: any[];
  loading: boolean;
  progresses: Record<number, string | null>;
  fetchByUser: (userId: string) => Promise<any[] | null>;
  enroll: (payload: { appUserId: string; courseId: number }) => Promise<any>;
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
      const created = await enrollmentService.enroll(payload);
      // append to local list
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
