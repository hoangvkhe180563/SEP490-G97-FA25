import { create } from "zustand";
import courseApi from "../services/courseService";
import type {
  CourseListDto,
  CourseDetailDto,
  LessonResource,
} from "../interfaces/types";

interface CourseState {
  courses: CourseListDto[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  selectedCourse?: CourseListDto;
  selectedCourseId?: number;
  fetchCourses: (query?: Record<string, any>) => Promise<void>;
  fetchCourseById: (id: number) => Promise<void>;
  createCourse: (dto: CourseDetailDto) => Promise<CourseListDto | undefined>;
  updateCourse: (
    id: number,
    dto: CourseDetailDto
  ) => Promise<CourseListDto | undefined>;
  deleteCourse: (id: number) => Promise<boolean>;
  selectCourse?: (id?: number) => void;
  uploadThumbnail: (file: File) => Promise<string>;
  getLessonResource?: (id: number) => Promise<LessonResource | null>;
  createLessonResource?: (dto: { url: string }) => Promise<LessonResource>;
  updateLessonResource?: (
    id: number,
    dto: { url: string }
  ) => Promise<LessonResource>;
  deleteLessonResource?: (id: number) => Promise<boolean>;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  total: 0,
  page: 1,
  pageSize: 6,
  loading: false,
  selectedCourse: undefined,
  selectedCourseId: undefined,

  // --- ACTIONS ---

  fetchCourses: async (query: Record<string, any> = {}) => {
    set({ loading: true });
    try {
      const res = await courseApi.getCourses({
        page: query.page ?? get().page,
        pageSize: query.pageSize ?? get().pageSize,
        q: query.q,
        sort: query.sort,
        subjectId: query.subjectId,
        schoolId: query.schoolId,
        grade: query.grade,
        minDuration: query.minDuration,
        maxDuration: query.maxDuration,
        instructor: query.instructor,
        status: query.status,
        isFeatured: query.isFeatured,
        isApproved: query.isApproved,
      });

      set({
        courses: res.items,
        total: res.total,
        page: res.page,
        pageSize: res.pageSize,
        loading: false,
      });
    } catch (e) {
      console.error("Failed to fetch courses:", e);
      set({ loading: false });
    }
  },

  selectCourse: (id?: number) => set({ selectedCourseId: id }),

  fetchCourseById: async (id: number) => {
    set({ loading: true });
    try {
      const course = await courseApi.getCourseById(id);
      set({ selectedCourse: course, loading: false });
    } catch (e) {
      console.error("Failed to fetch course by ID:", e);
      set({ loading: false });
    }
  },

  createCourse: async (dto: CourseDetailDto) => {
    set({ loading: true });
    try {
      const created = await courseApi.createCourse(dto);
      set({ loading: false });
      return created;
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  updateCourse: async (id: number, dto: CourseDetailDto) => {
    set({ loading: true });
    try {
      const updated = await courseApi.updateCourse(id, dto);
      set((state) => ({
        selectedCourse: updated,
        courses: state.courses.map((c: CourseListDto) =>
          c.id === id
            ? ({
                ...c,
                name: updated.name,
                information: updated.information,
                imageUrl: updated.imageUrl,
                status: updated.status ?? c.status,
                category:
                  (updated as any).subjectId ?? (c as any).category ?? null,
                grade: updated.grade ?? c.grade,
                isApproved:
                  (updated as any).isApproved ?? (c as any).isApproved, // Update isApproved when a course is updated
              } as CourseListDto)
            : c
        ),
        loading: false,
      }));
      console.log(updated);
      return updated;
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  deleteCourse: async (id: number) => {
    set({ loading: true });
    try {
      await courseApi.deleteCourse(id);
      set((state) => ({
        courses: state.courses.filter((c: CourseListDto) => c.id !== id),
        selectedCourse: undefined,
        loading: false,
      }));
      return true;
    } catch (e) {
      console.error("Failed to delete course:", e);
      set({ loading: false });
      return false;
    }
  },
  uploadThumbnail: async (file: File) => {
    try {
      const res = await courseApi.uploadThumbnail(file);
      return res.url as string;
    } catch (err) {
      console.error("uploadThumbnail failed", err);
      throw err;
    }
  },
  getLessonResource: async (id: number) => {
    set({ loading: true });
    try {
      const resource = await courseApi.getLessonResource(id);
      set({ loading: false });
      return resource;
    } catch (e) {
      console.error("getLessonResource failed", e);
      set({ loading: false });
      return null;
    }
  },

  createLessonResource: async (dto: { url: string }) => {
    set({ loading: true });
    try {
      const created = await courseApi.createLessonResource(dto);
      set({ loading: false });
      return created;
    } catch (e) {
      console.error("createLessonResource failed", e);
      set({ loading: false });
      throw e;
    }
  },

  updateLessonResource: async (id: number, dto: { url: string }) => {
    set({ loading: true });
    try {
      const updated = await courseApi.updateLessonResource(id, dto);
      set({ loading: false });
      return updated;
    } catch (e) {
      console.error("updateLessonResource failed", e);
      set({ loading: false });
      throw e;
    }
  },

  deleteLessonResource: async (id: number) => {
    set({ loading: true });
    try {
      const ok = await courseApi.deleteLessonResource(id);
      set({ loading: false });
      return ok;
    } catch (e) {
      console.error("deleteLessonResource failed", e);
      set({ loading: false });
      return false;
    }
  },
}));
