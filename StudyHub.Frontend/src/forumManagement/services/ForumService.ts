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
        return response.data.data.items.map((rule: any) => ({
          id: rule.id || rule.ruleId,
          content: rule.description || rule.ruleName || rule.content || "",
          ruleType: rule.ruleType,
        }));
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
    const endpoint =
      targetType === "post"
        ? `/Forum/posts/${targetId}/report`
        : `/Forum/comments/${targetId}/report`;

    const response = await axiosInstance.post(endpoint, {
      RuleId: ruleId,
      Reason: content,
    });

    return response.data;
  },
};
