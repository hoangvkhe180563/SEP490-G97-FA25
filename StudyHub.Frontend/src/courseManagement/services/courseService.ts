import { axiosInstance } from "@/lib/axios";
import type {
  CourseListDto,
  CourseDetailDto,
  ChapterListDto,
  ChapterDto,
  LessonListDto,
  LessonDto,
} from "@/courseManagement/interfaces/types";

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
    const res = await axiosInstance.get<any>(`/course?${qs.toString()}`);
    // backend returns { items, total, page, limit, totalPages }
    const data = res.data;
    const mapped: PagedResponse<CourseListDto> = {
      items: data.items,
      total: data.total,
      page: data.page,
      // prefer backend-provided pageSize, fallback to 6 to match UI default
      pageSize: data.pageSize ?? 6,
    };
    return mapped;
  },

  async getCourseById(id: number) {
    const res = await axiosInstance.get<CourseListDto>(`/course/${id}`);
    const course = res.data;
    // normalize chapter lessons content
    if (course && Array.isArray(course.chapters)) {
      course.chapters = course.chapters.map((ch: any) => ({
        ...ch,
        lessons: (ch.lessons || []).map((l: any) => ({
          ...l,
          content: l.readingContent ?? null,
        })),
      }));
    }
    return course;
  },

  async createCourse(dto: CourseDetailDto) {
    const res = await axiosInstance.post<CourseListDto>(`/course`, dto);
    return res.data;
  },

  async updateCourse(id: number, dto: CourseDetailDto) {
    const res = await axiosInstance.put<CourseListDto>(`/course/${id}`, dto);
    return res.data;
  },

  async deleteCourse(id: number) {
    await axiosInstance.delete(`/course/${id}`);
    return true;
  },

  async getChapters(courseId: number) {
    const res = await axiosInstance.get<ChapterListDto[]>(
      `/lecture/course/${courseId}/chapters`
    );
    // normalize lessons: copy readingContent -> content for frontend convenience
    return (res.data || []).map((ch) => ({
      ...ch,
      lessons: (ch.lessons || []).map((l: any) => ({
        ...l,
        content: l.readingContent ?? null,
      })),
    }));
  },
  async getChapter(id: number) {
    const res = await axiosInstance.get<ChapterListDto>(
      `/lecture/chapter/${id}`
    );
    const ch = res.data;
    if (!ch) return ch;
    return {
      ...ch,
      lessons: (ch.lessons || []).map((l: any) => ({
        ...l,
        content: l.readingContent ?? null,
      })),
    };
  },
  async getLessons(chapterId: number) {
    const res = await axiosInstance.get<LessonListDto[]>(
      `/lecture/chapter/${chapterId}/lessons`
    );
    return (res.data || []).map((l: any) => ({
      ...l,
      content: l.readingContent ?? null,
    }));
  },

  async getLesson(id: number) {
    const res = await axiosInstance.get<LessonListDto>(`/lecture/lesson/${id}`);
    const l = res.data;
    if (!l) return l;
    return { ...l, content: l.readingContent ?? null } as LessonListDto;
  },

  async createChapter(dto: Partial<ChapterDto>) {
    const res = await axiosInstance.post<ChapterListDto>(
      `/lecture/chapter`,
      dto
    );
    return res.data as ChapterListDto;
  },

  async updateChapter(id: number, dto: ChapterDto) {
    const res = await axiosInstance.put<ChapterListDto>(
      `/lecture/chapter/${id}`,
      dto
    );
    return res.data as ChapterListDto;
  },

  async deleteChapter(id: number) {
    await axiosInstance.delete(`/lecture/chapter/${id}`);
    return true;
  },

  async createLesson(dto: Partial<LessonDto>) {
    // map frontend `content` to backend readingContent when creating document lessons
    const payload: any = { ...dto };
    if (payload.content !== undefined) payload.readingContent = payload.content;
    const res = await axiosInstance.post<LessonListDto>(
      `/lecture/lesson`,
      payload
    );
    const l = res.data;
    return { ...l, content: l.readingContent ?? null } as LessonListDto;
  },

  async updateLesson(id: number, dto: LessonDto) {
    const payload: any = { ...dto };
    if (payload.content !== undefined) payload.readingContent = payload.content;
    const res = await axiosInstance.put<LessonListDto>(
      `/lecture/lesson/${id}`,
      payload
    );
    const l = res.data;
    return { ...l, content: l.readingContent ?? null } as LessonListDto;
  },

  async deleteLesson(id: number) {
    await axiosInstance.delete(`/lecture/lesson/${id}`);
    return true;
  },

  async uploadThumbnail(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await axiosInstance.post(`/course/upload-thumbnail`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data as { url: string };
  },

  async uploadResource(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await axiosInstance.post(`/lecture/upload-resource`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data as { url: string };
  },

  // Lesson resource endpoints
  async getLessonResource(id: number) {
    const res = await axiosInstance.get(`/lessonresource/${id}`);
    return res.data?.data as { id: number; url: string } | null;
  },

  async createLessonResource(dto: { url: string }) {
    const res = await axiosInstance.post(`/lessonresource/create`, dto);
    return res.data?.data as { id: number; url: string };
  },

  async updateLessonResource(id: number, dto: { url: string }) {
    const payload = { id, url: dto.url };
    const res = await axiosInstance.put(
      `/lessonresource/update/${id}`,
      payload
    );
    return res.data?.data as { id: number; url: string };
  },

  async deleteLessonResource(id: number) {
    await axiosInstance.delete(`/lessonresource/${id}`);
    return true;
  },
};

export default courseApi;
