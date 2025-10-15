import { create } from "zustand";
import courseApi from "../services/courseService";
import type { CourseListItemDto, CourseDetailDto } from "../types/api";

interface CourseState {
  courses: CourseListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  selectedCourse?: CourseDetailDto;
  fetchCourses: (query?: Record<string, any>) => Promise<void>;
  fetchCourseById: (id: number) => Promise<void>;
}

export const useCourseStore = create<CourseState>((set: any) => ({
  courses: [],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  selectedCourse: undefined,
  fetchCourses: async (query: Record<string, any> = {}) => {
    set({ loading: true });
    try {
      const res = await courseApi.getCourses(query);
      set({
        courses: res.items,
        total: res.total,
        page: res.page,
        pageSize: res.pageSize,
        loading: false,
      });
    } catch (e) {
      set({ loading: false });
    }
  },
  fetchCourseById: async (id: number) => {
    set({ loading: true });
    try {
      const course = await courseApi.getCourseById(id);
      set({ selectedCourse: course, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },
}));
