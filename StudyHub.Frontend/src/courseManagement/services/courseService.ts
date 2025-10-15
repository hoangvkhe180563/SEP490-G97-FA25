import { axiosInstance } from "@/lib/axios";
import type {
  CourseListItemDto,
  CourseDetailDto,
  ChapterDto,
  LessonDto,
} from "@/courseManagement/types/api";

export type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export const courseApi = {
  async getCourses(
    query: Record<string, string | number | boolean | undefined>
  ) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const res = await axiosInstance.get<PagedResponse<CourseListItemDto>>(
      `/course?${qs.toString()}`
    );
    return res.data;
  },

  async getCourseById(id: number) {
    const res = await axiosInstance.get<CourseDetailDto>(`/course/${id}`);
    return res.data;
  },

  async getChapters(courseId: number) {
    const res = await axiosInstance.get<ChapterDto[]>(
      `/lecture/course/${courseId}/chapters`
    );
    return res.data;
  },

  async getLessons(chapterId: number) {
    const res = await axiosInstance.get<LessonDto[]>(
      `/lecture/chapter/${chapterId}/lessons`
    );
    return res.data;
  },

  async getLesson(id: number) {
    const res = await axiosInstance.get<LessonDto>(`/lecture/lesson/${id}`);
    return res.data;
  },
};

export default courseApi;
