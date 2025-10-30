import { axiosInstance } from "@/lib/axios";

export const lessonCommentService = {
  getByLesson: async (lessonId: number) => {
    const res = await axiosInstance.get(`/LessonComment/lesson/${lessonId}`);
    return res.data;
  },

  create: async (payload: { lessonId: number; content: string }) => {
    const res = await axiosInstance.post(`/LessonComment/create`, payload);
    return res.data;
  },

  update: async (id: number, payload: { content: string }) => {
    const res = await axiosInstance.put(`/LessonComment/${id}`, payload);
    return res.data;
  },

  delete: async (id: number) => {
    const res = await axiosInstance.delete(`/LessonComment/${id}`);
    return res.data;
  },
};
