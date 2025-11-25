import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";

interface RulePattern {
  pattern_id: number;
  rule_id: number;
  pattern: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
}

interface Rule {
  id: number;
  school_id: number;
  rule_name: string;
  rule_type: string;
  severity: string;
  violation_score: number;
  is_active: boolean;
  description?: string;
  pattern_count: number;
  patterns: RulePattern[];
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
}

interface RuleState {
  rules: Rule[];
  currentRule: Rule | null;
  isLoading: boolean;
  success: boolean;
  message: string;

  getRules: (
    schoolId: number,
    ruleType?: string,
    severity?: string,
    isActive?: boolean,
    pageNumber?: number,
    pageSize?: number
  ) => Promise<any>;

  getRuleById: (ruleId: number) => Promise<any>;

  createRule: (data: {
    schoolId: number;
    ruleName: string;
    ruleType: string;
    severity: string;
    violationScore: number;
    description?: string;
    patterns?: string[];
  }) => Promise<any>;

  updateRule: (
    ruleId: number,
    data: {
      ruleName: string;
      ruleType: string;
      severity: string;
      violationScore: number;
      description?: string;
    }
  ) => Promise<any>;

  deleteRule: (ruleId: number) => Promise<any>;
  toggleRuleStatus: (ruleId: number) => Promise<any>;

  createPattern: (data: { ruleId: number; pattern: string }) => Promise<any>;
  deletePattern: (patternId: number) => Promise<any>;
  togglePatternStatus: (patternId: number) => Promise<any>;
}

const mapPattern = (dto: any): RulePattern => ({
  pattern_id: dto.patternId || dto.pattern_id,
  rule_id: dto.ruleId || dto.rule_id,
  pattern: dto.pattern || "",
  is_active: dto.isActive !== undefined ? dto.isActive : dto.is_active ?? true, // FIX NÀY
  created_at: dto.createdAt || dto.created_at,
  created_by: dto.createdBy || dto.created_by,
  updated_at: dto.updatedAt || dto.updated_at,
  updated_by: dto.updatedBy || dto.updated_by,
});

const mapRule = (dto: any): Rule => ({
  id: dto.ruleId || dto.id,
  school_id: dto.schoolId || dto.school_id,
  rule_name: dto.ruleName || dto.rule_name || "",
  rule_type: dto.ruleType || dto.rule_type || "",
  severity: dto.severity || "Medium",
  violation_score: dto.violationScore || dto.violation_score || 5,
  is_active: dto.isActive ?? dto.is_active ?? true,
  description: dto.description,
  pattern_count: dto.patternCount || dto.pattern_count || 0,
  patterns: (dto.patterns || []).map(mapPattern),
  created_at: dto.createdAt || dto.created_at,
  created_by: dto.createdBy || dto.created_by,
  updated_at: dto.updatedAt || dto.updated_at,
  updated_by: dto.updatedBy || dto.updated_by,
});

export const useRuleStore = create<RuleState>()(
  devtools(
    (set) => ({
      rules: [],
      currentRule: null,
      isLoading: false,
      success: false,
      message: "",

      getRules: async (
        schoolId: number,
        ruleType?: string,
        severity?: string,
        isActive?: boolean,
        pageNumber: number = 1,
        pageSize: number = 100
      ) => {
        set({ isLoading: true });
        try {
          const params = new URLSearchParams();
          params.append("schoolId", schoolId.toString());
          if (ruleType) params.append("ruleType", ruleType);
          if (severity) params.append("severity", severity);
          if (isActive !== undefined)
            params.append("isActive", isActive.toString());
          params.append("pageNumber", pageNumber.toString());
          params.append("pageSize", pageSize.toString());

          const resp = await axiosInstance.get(
            `/Forum/rules?${params.toString()}`
          );
          const body = resp.data;

          if (body?.success) {
            const mappedRules = (body.data?.items || []).map(mapRule);
            set({
              rules: mappedRules,
              success: true,
              message: body?.message || "",
            });
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      getRuleById: async (ruleId: number) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.get(`/Forum/rules/${ruleId}`);
          const body = resp.data;

          if (body?.success) {
            const mappedRule = mapRule(body.data);
            set({
              currentRule: mappedRule,
              success: true,
              message: body?.message || "",
            });
            return { success: true, data: mappedRule };
          } else {
            set({ success: false, message: body?.message || "" });
            return body;
          }
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      createRule: async (data) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.post(`/Forum/rules/create`, {
            schoolId: data.schoolId,
            ruleName: data.ruleName,
            ruleType: data.ruleType,
            severity: data.severity,
            violationScore: data.violationScore,
            description: data.description,
            patterns: data.patterns || [],
          });
          const body = resp.data;

          if (body?.success) {
            set({
              success: true,
              message: body?.message || "Tạo rule thành công",
            });
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      updateRule: async (ruleId: number, data) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.put(`/Forum/rules/${ruleId}`, {
            ruleId,
            ruleName: data.ruleName,
            ruleType: data.ruleType,
            severity: data.severity,
            violationScore: data.violationScore,
            description: data.description,
          });
          const body = resp.data;

          if (body?.success) {
            const mappedRule = mapRule(body.data);
            set((state) => ({
              rules: state.rules.map((r) => (r.id === ruleId ? mappedRule : r)),
              currentRule:
                state.currentRule?.id === ruleId
                  ? mappedRule
                  : state.currentRule,
              success: true,
              message: body?.message || "Cập nhật rule thành công",
            }));
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteRule: async (ruleId: number) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.delete(`/Forum/rules/${ruleId}`);
          const body = resp.data;

          if (body?.success) {
            set((state) => ({
              rules: state.rules.filter((r) => r.id !== ruleId),
              currentRule:
                state.currentRule?.id === ruleId ? null : state.currentRule,
              success: true,
              message: body?.message || "Xóa rule thành công",
            }));
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      toggleRuleStatus: async (ruleId: number) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.post(
            `/Forum/rules/${ruleId}/toggle-status`
          );
          const body = resp.data;

          if (body?.success) {
            set({
              success: true,
              message: body?.message || "Đã cập nhật trạng thái rule",
            });
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      createPattern: async (data) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.post(`/Forum/patterns/create`, {
            ruleId: data.ruleId,
            pattern: data.pattern,
          });
          const body = resp.data;

          if (body?.success) {
            set({
              success: true,
              message: body?.message || "Thêm pattern thành công",
            });
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      deletePattern: async (patternId: number) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.delete(
            `/Forum/patterns/${patternId}`
          );
          const body = resp.data;

          if (body?.success) {
            set({
              success: true,
              message: body?.message || "Xóa pattern thành công",
            });
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      togglePatternStatus: async (patternId: number) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.post(
            `/Forum/patterns/${patternId}/toggle-status`
          );
          const body = resp.data;

          if (body?.success) {
            set({
              success: true,
              message: body?.message || "Đã cập nhật trạng thái pattern",
            });
          } else {
            set({ success: false, message: body?.message || "" });
          }
          return body;
        } catch (err: any) {
          set({ success: false, message: axiosMessageErrorHandler(err) });
          return null;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    { name: "rule-store" }
  )
);
