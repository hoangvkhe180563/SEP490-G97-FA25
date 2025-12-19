import { create } from "zustand";
import { lessonCommentService } from "@/courseManagement/services/lessonCommentService";
import type { CommentDto } from "../types/api";

type LessonCommentState = {
  commentsByLesson: Record<number, CommentDto[]>;
  loading: boolean;
  fetchComments: (lessonId: number) => Promise<CommentDto[] | null>;
  createComment: (payload: {
    lessonId: number;
    content: string;
  }) => Promise<any>;
  updateComment: (id: number, payload: { content: string }) => Promise<any>;
  deleteComment: (id: number) => Promise<any>;
};

export const useLessonCommentStore = create<LessonCommentState>((set) => ({
  commentsByLesson: {},
  loading: false,
  fetchComments: async (lessonId: number) => {
    set({ loading: true });
    try {
      const res = await lessonCommentService.getByLesson(lessonId);
      const items = Array.isArray(res) ? res : [];
      set((s) => ({
        commentsByLesson: { ...(s.commentsByLesson || {}), [lessonId]: items },
        loading: false,
      }));
      return items;
    } catch (err) {
      set({ loading: false });
      return null;
    }
  },
  createComment: async (payload) => {
    set({ loading: true });
    try {
      const created = await lessonCommentService.create(payload as any);
      // optimistic append
      const lessonId = Number(payload.lessonId);
      set((s: any) => ({
        commentsByLesson: {
          ...(s.commentsByLesson || {}),
          [lessonId]: [...(s.commentsByLesson?.[lessonId] || []), created],
        },
        loading: false,
      }));
      return created;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
  updateComment: async (id: number, payload: { content: string }) => {
    set({ loading: true });
    try {
      const updated = await lessonCommentService.update(id, payload);
      // update local copy
      set((s: any) => {
        const map = { ...(s.commentsByLesson || {}) };
        Object.keys(map).forEach((key) => {
          map[key] = map[key].map((c: any) => (c.id === id ? updated : c));
        });
        return { commentsByLesson: map, loading: false };
      });
      return updated;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
  deleteComment: async (id: number) => {
    set({ loading: true });
    try {
      const res = await lessonCommentService.delete(id);
      // remove from local
      set((s: any) => {
        const map = { ...(s.commentsByLesson || {}) };
        Object.keys(map).forEach((key) => {
          map[key] = map[key].filter((c: any) => c.id !== id);
        });
        return { commentsByLesson: map, loading: false };
      });
      return res;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
}));
