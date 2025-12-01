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

export interface UserForumStatus {
  userId: string;
  userName: string;
  userAvatar?: string;
  schoolId: number;
  totalViolationScore: number;
  isMute: boolean;
  muteUntil?: string;
  createdAt: string;
}

interface UserStatusFilters {
  schoolId: number;
  query?: string;
  isMuted?: boolean;
  minViolationScore?: number;
  maxViolationScore?: number;
  sortBy?: string;
  pageNumber: number;
  pageSize: number;
}

interface ViolationState {
  violations: ViolationRecord[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  filters: ViolationFilters;
  userStatuses: UserForumStatus[];
  totalUserCount: number;
  userFilters: UserStatusFilters;

  fetchViolations: () => Promise<void>;
  setFilters: (filters: Partial<ViolationFilters>) => void;
  approveReport: (reportId: number) => Promise<boolean>;
  rejectReport: (reportId: number) => Promise<boolean>;
  fetchUserStatuses: () => Promise<void>;
  setUserFilters: (filters: Partial<UserStatusFilters>) => void;
  muteUser: (userId: string, schoolId: number) => Promise<boolean>;
  unmuteUser: (userId: string, schoolId: number) => Promise<boolean>;
  reset: () => void;
}

const initialFilters: ViolationFilters = {
  schoolId: 0,
  pageNumber: 1,
  pageSize: 10,
};

const initialUserFilters: UserStatusFilters = {
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
  userStatuses: [],
  totalUserCount: 0,
  userFilters: initialUserFilters,

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
        `/Forum/reports/${reportId}/approve`
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

  muteUser: async (userId: string, schoolId: number) => {
    try {
      const response = await axiosInstance.post(
        `/Forum/moderator/mute-user/${userId}/mute?schoolId=${schoolId}`
      );

      if (response.data?.success) {
        await get().fetchUserStatuses();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error muting user:", error);
      set({
        error:
          error.response?.data?.message || "Có lỗi xảy ra khi cấm người dùng",
      });
      return false;
    }
  },

  unmuteUser: async (userId: string, schoolId: number) => {
    try {
      const response = await axiosInstance.post(
        `/Forum/moderator/mute-user/${userId}/unmute?schoolId=${schoolId}`
      );

      if (response.data?.success) {
        await get().fetchUserStatuses();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("Error unmuting user:", error);
      set({
        error:
          error.response?.data?.message ||
          "Có lỗi xảy ra khi bỏ cấm người dùng",
      });
      return false;
    }
  },

  fetchUserStatuses: async () => {
    const { userFilters } = get();

    if (!userFilters.schoolId) {
      set({ error: "School ID is required" });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const params = new URLSearchParams({
        SchoolId: userFilters.schoolId.toString(),
        PageNumber: userFilters.pageNumber.toString(),
        PageSize: userFilters.pageSize.toString(),
      });

      if (userFilters.query) params.append("SearchTerm", userFilters.query);
      if (userFilters.isMuted !== undefined)
        params.append("IsMuted", userFilters.isMuted.toString());
      if (userFilters.minViolationScore !== undefined)
        params.append(
          "MinViolationScore",
          userFilters.minViolationScore.toString()
        );
      if (userFilters.maxViolationScore !== undefined)
        params.append(
          "MaxViolationScore",
          userFilters.maxViolationScore.toString()
        );
      if (userFilters.sortBy) params.append("SortBy", userFilters.sortBy);

      const url = `/Forum/moderator/user-status?${params.toString()}`;

      const response = await axiosInstance.get(url);

      if (response.data?.success && response.data?.data) {
        const { items, total } = response.data.data;

        set({
          userStatuses: items.map((item: any) => ({
            userId: item.userId || item.user_id,
            userName:
              item.fullname || item.userName || item.user_name || "Unknown",
            userAvatar: item.avatar || item.userAvatar || item.user_avatar,
            schoolId: item.schoolId || item.school_id,
            totalViolationScore:
              item.totalViolationScore || item.total_violation_score || 0,
            isMute: item.isMute ?? item.is_mute ?? false,
            muteUntil: item.muteUntil || item.mute_until,
            createdAt: item.createdAt || item.created_at,
          })),
          totalUserCount: total || items.length,
          isLoading: false,
        });
      } else {
        console.log("No data in response");
        set({ userStatuses: [], totalUserCount: 0, isLoading: false });
      }
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message || "Có lỗi xảy ra khi tải danh sách",
        isLoading: false,
      });
    }
  },

  setUserFilters: (newFilters) => {
    set((state) => ({
      userFilters: { ...state.userFilters, ...newFilters },
    }));
  },

  reset: () => {
    set({
      violations: [],
      totalCount: 0,
      userStatuses: [],
      totalUserCount: 0,
      isLoading: false,
      error: null,
      filters: initialFilters,
      userFilters: initialUserFilters,
    });
  },
}));
