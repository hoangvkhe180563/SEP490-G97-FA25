import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export interface ViolationRecord {
  id: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  schoolId: number;
  postId?: number;
  postTitle?: string;
  commentId?: number;
  commentContent?: string;
  matchedRuleId?: number;
  ruleName?: string;
  pattern?: string;
  violationScore: number;
  sourceType: "auto" | "report" | "manual";
  reportedBy?: string;
  reporterName?: string;
  reportReason?: string;
  status?: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface ViolationFilters {
  schoolId: number;
  sourceType?: "auto" | "report" | "manual";
  from?: string;
  to?: string;
  pageNumber: number;
  pageSize: number;
}

interface ViolationState {
  violations: ViolationRecord[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  filters: ViolationFilters;

  fetchViolations: () => Promise<void>;
  setFilters: (filters: Partial<ViolationFilters>) => void;
  approveReport: (reportId: number) => Promise<boolean>;
  rejectReport: (reportId: number) => Promise<boolean>;
  reset: () => void;
}

const initialFilters: ViolationFilters = {
  schoolId: 0,
  pageNumber: 1,
  pageSize: 10,
};

export const useViolationStore = create<ViolationState>((set, get) => ({
  violations: [],
  totalCount: 0,
  isLoading: false,
  error: null,
  filters: initialFilters,

  fetchViolations: async () => {
    const { filters } = get();

    if (!filters.schoolId) {
      set({ error: "School ID is required" });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams({
        schoolId: filters.schoolId.toString(),
        pageNumber: filters.pageNumber.toString(),
        pageSize: filters.pageSize.toString(),
      });

      if (filters.sourceType) {
        params.append("sourceType", filters.sourceType);
      }
      if (filters.from) {
        params.append("from", filters.from);
      }
      if (filters.to) {
        params.append("to", filters.to);
      }

      const response = await axiosInstance.get(
        `/Forum/moderator/violations?${params.toString()}`
      );

      if (response.data?.success && response.data?.data) {
        const { items, total } = response.data.data;

        set({
          violations: items.map((item: any) => ({
            id: item.recordId || item.id || item.violationRecordId,
            userId: item.userId || item.user_id,
            userName:
              item.fullname ||
              item.userName ||
              item.user_name ||
              item.userFullname,
            userAvatar: item.userAvatar || item.user_avatar,
            schoolId: item.schoolId || item.school_id,
            postId: item.postId || item.post_id,
            postTitle: item.postTitle || item.post_title,
            commentId: item.commentId || item.comment_id,
            commentContent:
              item.commentContent || item.comment_content || item.content,
            matchedRuleId:
              item.matchedRuleId || item.matched_rule_id || item.ruleId,
            ruleName: item.ruleName || item.rule_name,
            pattern: item.patternText || item.pattern,
            violationScore: item.violationScore || item.violation_score || 0,
            sourceType: item.sourceType || item.source_type || "auto",
            reportedBy: item.reportedBy || item.reported_by,
            reporterName: item.reporterName || item.reporter_name,
            reportReason:
              item.reportReason || item.report_reason || item.reason,
            status: item.status,
            createdAt: item.createdAt || item.created_at,
            reviewedBy: item.reviewedBy || item.reviewed_by,
            reviewedAt: item.reviewedAt || item.reviewed_at,
          })),
          totalCount: total || items.length,
          isLoading: false,
        });
      } else {
        set({ violations: [], totalCount: 0, isLoading: false });
      }
    } catch (error: any) {
      console.error("Error fetching violations:", error);
      set({
        error: error.response?.data?.message || "Có lỗi xảy ra khi tải vi phạm",
        isLoading: false,
      });
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  approveReport: async (reportId: number) => {
    try {
      const response = await axiosInstance.post(
        `/Forum/report/${reportId}/approve`
      );

      if (response.data?.success) {
        await get().fetchViolations();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error approving report:", error);
      set({
        error:
          error.response?.data?.message || "Có lỗi xảy ra khi duyệt báo cáo",
      });
      return false;
    }
  },

  rejectReport: async (reportId: number) => {
    try {
      const response = await axiosInstance.post(
        `/Forum/report/${reportId}/reject`
      );

      if (response.data?.success) {
        await get().fetchViolations();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error rejecting report:", error);
      set({
        error:
          error.response?.data?.message || "Có lỗi xảy ra khi từ chối báo cáo",
      });
      return false;
    }
  },

  reset: () => {
    set({
      violations: [],
      totalCount: 0,
      isLoading: false,
      error: null,
      filters: initialFilters,
    });
  },
}));
