import { axiosInstance } from "@/lib/axios";

export const enrollmentService = {
  // create enrollment
  enroll: async (payload: { appUserId: string; courseId: number }) => {
    const res = await axiosInstance.post(`/Enrollment`, payload);
    return res.data;
  },

  // get enrollments for a user
  getByUser: async (userId: string) => {
    const res = await axiosInstance.get(`/Enrollment/user/${userId}`);
    return res.data;
  },

  // get enrollment by id
  getById: async (id: number) => {
    const res = await axiosInstance.get(`/Enrollment/${id}`);
    return res.data;
  },

  // get progress list for an enrollment
  getProgresses: async (enrollmentId: number) => {
    const res = await axiosInstance.get(`/Enrollment/${enrollmentId}/progress`);
    return res.data;
  },

  // consume available wallet for a course (may create enrollment or return remaining)
  consumeWallet: async (payload: { appUserId: string; courseId: number }) => {
    // return full response so callers can inspect status and data
    const res = await axiosInstance.post(`/Enrollment/consume-wallet`, payload);
    return res;
  },

  // record/update progress for an enrollment
  recordProgress: async (
    enrollmentId: number,
    payload: { lessonId: number; completionDate?: string | null }
  ) => {
    const body = { ...payload };
    const res = await axiosInstance.post(
      `/Enrollment/${enrollmentId}/progress`,
      body
    );
    return res.data;
  },
};
