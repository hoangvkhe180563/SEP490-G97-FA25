import { create } from "zustand";
import courseApi from "../services/courseService";
import type { CourseListDto, CourseDetailDto } from "../interfaces/types";

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
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  total: 0,
  page: 1,
  pageSize: 5,
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
        subjectId: query.category,
        grade: query.grade,
        status: query.status,
        isFeatured: query.isFeatured,
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
                // keep previous category if subjectId is not provided in updated
                category:
                  (updated as any).subjectId ?? (c as any).category ?? null,
              } as CourseListDto)
            : c
        ),
        loading: false,
      }));
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
}));
