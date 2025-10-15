import { create } from "zustand";
import courseApi from "../services/courseService";
import type { ChapterDto, LessonDto } from "../types/api";

interface LectureState {
  chapters: ChapterDto[];
  lessons: LessonDto[];
  selectedLesson?: LessonDto;
  loading: boolean;
  fetchChapters: (courseId: number) => Promise<void>;
  fetchLessons: (chapterId: number) => Promise<void>;
  fetchLesson: (id: number) => Promise<void>;
}

export const useLectureStore = create<LectureState>((set: any) => ({
  chapters: [],
  lessons: [],
  selectedLesson: undefined,
  loading: false,
  fetchChapters: async (courseId: number) => {
    set({ loading: true });
    try {
      const chapters = await courseApi.getChapters(courseId);
      set({ chapters, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },
  fetchLessons: async (chapterId: number) => {
    set({ loading: true });
    try {
      const lessons = await courseApi.getLessons(chapterId);
      set({ lessons, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },
  fetchLesson: async (id: number) => {
    set({ loading: true });
    try {
      const lesson = await courseApi.getLesson(id);
      set({ selectedLesson: lesson, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },
}));
