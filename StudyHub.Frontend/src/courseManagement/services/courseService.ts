import { axiosInstance } from "@/lib/axios";
import type {
  CourseListDto,
  CourseDetailDto,
  ChapterListDto,
  ChapterDto,
  LessonListDto,
  LessonDto,
  Exam,
} from "@/courseManagement/interfaces/types";
import { formatISO } from "date-fns";

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

  async getInteractiveQuestions(lessonId: number) {
    const res = await axiosInstance.get<any[]>(
      `/lecture/lesson/${lessonId}/interactive-questions`
    );
    const arr = res.data || [];
    // normalize options to arrays and keep fields consistent with frontend expectations
    return arr.map((q: any) => ({
      id: q.id,
      timeSec: q.timeSec,
      question: q.question,
      type: q.type,
      options: Array.isArray(q.options)
        ? q.options
        : q.options
          ? JSON.parse(q.options)
          : undefined,
      correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : null,
      correctAnswer: q.correctAnswer ?? null,
    }));
  },

  async submitInteractiveResponse(lessonId: number, payload: any) {
    const res = await axiosInstance.post(
      `/lecture/lesson/${lessonId}/interactive-response`,
      payload
    );
    return res.data;
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

  async getExamByLessonId(lessonId: number): Promise<Exam | null> {
    try {
      const res = await axiosInstance.get(`/exam/lesson/${lessonId}`);
      if (res.status === 200) {
        const data = res.data;
        return {
          id: data.id,
          title: data.title,
          description: data.description,
          openTime: new Date(data.openTime),
          lessonId: data.lessonId === 0 ? undefined : data.lessonId,
          duration: data.duration,
          createdBy: data.createdBy,
          showAnswers: data.showAnswers,
          showCorrectAnswers: data.showCorrectAnswers,
          questions: data.questions
        };
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getExamByLessonId: ", error);
    }
    return null;
  },

  async getResultIdByLessonId(lessonId: number, studentId: string): Promise<string> {
    try {
      if (!studentId) {
        throw new Error("Student is null");
      }

      const res = await axiosInstance.get(`/examResult/lesson-result-id/${studentId}/${lessonId}`);
      if (res.status === 200) {
        return res.data;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getResultIdByLessonId: ", error);
    }
    return '';
  },

  async createExam(examData: Exam): Promise<boolean> {
    const payload = {
      ...examData,
      isMultipleAttempts: false,
      openTime: formatISO(examData.openTime),
      closeTime: examData.closeTime && formatISO(examData.closeTime)
    }
    try {
      const res = await axiosInstance.post("/exam", payload, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (res.status === 200) {
        return true;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error getStudentClassExams: ", error);
    }
    return false;
  },

  async updateExam(examData: Exam): Promise<boolean> {
    try {
      const updateQuestionRes = await axiosInstance.put(`/exam/${examData.id}/update-questions`, examData.questions, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (updateQuestionRes.status !== 200) {
        throw new Error(`Update questions failed. Status: ${updateQuestionRes.status}`);
      }

      const payload = {
        ...examData,
        questionObjectIds: updateQuestionRes.data,
        openTime: formatISO(examData.openTime),
        closeTime: examData.closeTime && formatISO(examData.closeTime)
      }
      const res = await axiosInstance.put("/exam", payload, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (res.status === 200) {
        return true;
      } else {
        throw new Error(`Status: ${res.status}`);
      }
    } catch (error) {
      console.error("Error updateExam: ", error);
    }
    return false;
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
