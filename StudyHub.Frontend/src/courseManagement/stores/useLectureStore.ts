import { create } from "zustand";
import courseApi from "../services/courseService";
import type {
  ChapterListDto,
  LessonListDto,
  ChapterDto,
  LessonDto,
} from "../interfaces/types";

interface LectureState {
  chapters: ChapterListDto[];
  lessons: LessonListDto[];
  selectedLesson?: LessonListDto;
  selectedChapter?: ChapterListDto;
  loading: boolean;
  fetchChapters: (courseId: number) => Promise<ChapterListDto[]>;
  fetchChapter: (id: number) => Promise<ChapterListDto | undefined>;
  fetchLessons: (chapterId: number) => Promise<LessonListDto[]>;
  fetchLesson: (id: number) => Promise<LessonListDto | undefined>;
  createLesson?: (dto: LessonDto) => Promise<LessonListDto | undefined>;
  updateLesson?: (
    id: number,
    dto: LessonDto
  ) => Promise<LessonListDto | undefined>;
  deleteLesson?: (id: number) => Promise<boolean>;
  createChapter?: (
    dto: Partial<ChapterDto>
  ) => Promise<ChapterListDto | undefined>;
  updateChapter?: (
    id: number,
    dto: ChapterDto
  ) => Promise<ChapterListDto | undefined>;
  deleteChapter?: (id: number) => Promise<boolean>;
}

export const useLectureStore = create<LectureState>((set: any) => ({
  chapters: [],
  lessons: [],
  selectedLesson: undefined,
  selectedChapter: undefined,
  loading: false,
  fetchChapters: async (courseId: number) => {
    set({ loading: true });
    try {
      const chapters = await courseApi.getChapters(courseId);
      set({ chapters, loading: false });
      return chapters;
    } catch (e) {
      set({ loading: false });
      return [];
    }
  },
  fetchChapter: async (id: number) => {
    set({ loading: true });
    try {
      const chapter = await courseApi.getChapter(id);
      set({ selectedChapter: chapter, loading: false });
      return chapter;
    } catch (e) {
      set({ loading: false });
      return undefined;
    }
  },
  fetchLessons: async (chapterId: number) => {
    set({ loading: true });
    try {
      const lessons = await courseApi.getLessons(chapterId);
      set({ lessons, loading: false });
      return lessons;
    } catch (e) {
      set({ loading: false });
      return [];
    }
  },
  fetchLesson: async (id: number) => {
    set({ loading: true });
    try {
      const lesson = await courseApi.getLesson(id);
      set({ selectedLesson: lesson, loading: false });
      return lesson;
    } catch (e) {
      set({ loading: false });
      return undefined;
    }
  },
  createLesson: async (dto: any) => {
    set({ loading: true });
    try {
      const created = await courseApi.createLesson(dto);
      // if chapters are in store, append to matching chapter
      set((state: any) => ({
        lessons: state.lessons.concat(created),
        chapters: state.chapters.map((ch: ChapterListDto) =>
          ch.id === created.chapterId
            ? { ...ch, lessons: [...(ch.lessons ?? []), created] }
            : ch
        ),
        loading: false,
      }));
      return created;
    } catch (e) {
      set({ loading: false });
      return undefined;
    }
  },
  updateLesson: async (id: number, dto: any) => {
    set({ loading: true });
    try {
      const updated = await courseApi.updateLesson(id, dto);
      set((state: any) => ({
        lessons: state.lessons.map((l: LessonListDto) =>
          l.id === updated.id ? updated : l
        ),
        selectedLesson:
          state.selectedLesson?.id === updated.id
            ? updated
            : state.selectedLesson,
        chapters: state.chapters.map((ch: ChapterListDto) => ({
          ...ch,
          lessons: (ch.lessons ?? []).map((ls) =>
            ls.id === updated.id ? updated : ls
          ),
        })),
        loading: false,
      }));
      return updated;
    } catch (e) {
      set({ loading: false });
      return undefined;
    }
  },
  deleteLesson: async (id: number) => {
    set({ loading: true });
    try {
      await courseApi.deleteLesson(id);
      set((state: any) => ({
        lessons: state.lessons.filter((l: LessonListDto) => l.id !== id),
        chapters: state.chapters.map((ch: ChapterListDto) => ({
          ...ch,
          lessons: (ch.lessons ?? []).filter((ls) => ls.id !== id),
        })),
        selectedLesson:
          state.selectedLesson?.id === id ? undefined : state.selectedLesson,
        loading: false,
      }));
      return true;
    } catch (e) {
      set({ loading: false });
      return false;
    }
  },
  createChapter: async (dto: Partial<ChapterDto>) => {
    set({ loading: true });
    try {
      const created = await courseApi.createChapter(dto);
      set((state: any) => ({
        chapters: [...state.chapters, created],
        loading: false,
      }));
      return created;
    } catch (e) {
      set({ loading: false });
      return undefined;
    }
  },
  updateChapter: async (id: number, dto: any) => {
    set({ loading: true });
    try {
      const updated = await courseApi.updateChapter(id, dto);
      set((state: any) => ({
        chapters: state.chapters.map((c: ChapterListDto) =>
          c.id === updated.id ? updated : c
        ),
        selectedChapter:
          state.selectedChapter?.id === updated.id
            ? updated
            : state.selectedChapter,
        loading: false,
      }));
      return updated;
    } catch (e) {
      set({ loading: false });
      return undefined;
    }
  },
  deleteChapter: async (id: number) => {
    set({ loading: true });
    try {
      await courseApi.deleteChapter(id);
      set((state: any) => ({
        chapters: state.chapters.filter((c: ChapterListDto) => c.id !== id),
        loading: false,
      }));
      return true;
    } catch (e) {
      set({ loading: false });
      return false;
    }
  },
}));
