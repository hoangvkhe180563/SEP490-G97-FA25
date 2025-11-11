// src/forumManagement/services/ForumService.ts
import { axiosInstance } from "@/lib/axios";
import type { Flair } from "../interfaces/forum";

export const forumService = {
  getFlairs: async (schoolId?: number): Promise<Flair[]> => {
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append("schoolId", schoolId.toString());
      params.append("pageNumber", "1");
      params.append("pageSize", "100");
      params.append("status", "true");

      const response = await axiosInstance.get(
        `/Forum/flairs?${params.toString()}`
      );

      if (response.data?.success && response.data?.data?.items) {
        return response.data.data.items;
      }

      return [];
    } catch (error) {
      console.error("Error fetching flairs:", error);
      return [];
    }
  },

  getRules: async (schoolId?: number) => {
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append("schoolId", schoolId.toString());
      params.append("pageNumber", "1");
      params.append("pageSize", "100");

      const response = await axiosInstance.get(
        `/Forum/rules?${params.toString()}`
      );

      if (response.data?.success && response.data?.data?.items) {
        return response.data.data.items;
      }

      return [];
    } catch (error) {
      console.error("Error fetching rules:", error);
      return [];
    }
  },

  createReport: async (
    targetId: number,
    targetType: "post" | "comment",
    ruleId: number,
    content: string
  ) => {
    try {
      const formData = new FormData();
      formData.append("targetId", targetId.toString());
      formData.append("targetType", targetType);
      formData.append("ruleId", ruleId.toString());
      formData.append("content", content);

      const response = await axiosInstance.post(
        `/Forum/reports/create`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error creating report:", error);
      throw error;
    }
  },
};
