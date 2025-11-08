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
};
