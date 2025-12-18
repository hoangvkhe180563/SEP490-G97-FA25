import { create } from "zustand";
import { axiosInstance, axiosMessageErrorHandler } from "../../lib/axios";
import type {
  RecommendationResponse,
  LLMRecommendationResponse,
  LLMProfile,
  StudentQuestionStatsDto,
  DateCountDto,
  HourCountDto,
  SubjectCountDto,
  TokenSummaryDto,
  DateTokenDto,
  UserTokenDto,
} from "../interfaces/recommend";

type RecommendState = {
  loading: boolean;
  llmLoading: boolean;
  error?: string | null;
  recommendation?: RecommendationResponse | null;
  llmRecommendation?: LLMRecommendationResponse | null;
  fetchRecommend: (topK?: number) => Promise<void>;
  fetchRecommendLLM: (
    userMessage?: string,
    profile?: LLMProfile,
    topK?: number,
    isGenerateExplanation?: boolean
  ) => Promise<LLMRecommendationResponse | null>;
  createLlmHistory: (inputText?: string) => Promise<any>;
  updateLlmHistoryResponse: (
    id: number,
    responseText: string,
    totalPromptTokens?: number,
    totalResponseTokens?: number
  ) => Promise<void>;
  getLlmHistoryById: (id: number) => Promise<any | null>;
  listLlmHistories: () => Promise<any[]>;
  deleteLlmHistory: (id: number) => Promise<void>;
  toggleStarLlmHistory: (id: number, starred: boolean) => Promise<any>;
  // statistics
  statsLoading: boolean;
  // per-chart loading flags for finer-grained UI
  llmTokenSummaryLoading: boolean;
  llmTokenByPeriodLoading: boolean;
  llmTopTokenUsersLoading: boolean;
  llmTopSubjectsLoading: boolean;
  llmTopRecommendedCoursesLoading: boolean;
  llmTopRecommendedDocumentsLoading: boolean;
  llmQuestionsByStudent: StudentQuestionStatsDto[];
  llmQuestionsTimeSeries: DateCountDto[];
  llmPeakHours: HourCountDto[];
  llmTopSubjects: SubjectCountDto[];
  llmTopRecommendedCourses: any[];
  llmTopRecommendedDocuments: any[];
  llmTokenSummary?: TokenSummaryDto | null;
  llmTokenByPeriod: DateTokenDto[];
  llmTopTokenUsers: UserTokenDto[];
  fetchLlmQuestionsByStudent: (
    start?: string,
    end?: string,
    top?: number
  ) => Promise<void>;
  fetchLlmQuestionsTimeSeries: (
    period?: string,
    start?: string,
    end?: string
  ) => Promise<void>;
  fetchLlmPeakHours: (
    start?: string,
    end?: string,
    top?: number
  ) => Promise<void>;
  fetchLlmTopSubjects: (
    start?: string,
    end?: string,
    top?: number
  ) => Promise<void>;
  fetchLlmTopRecommendedCourses: (
    start?: string,
    end?: string,
    top?: number
  ) => Promise<void>;
  fetchLlmTopRecommendedDocuments: (
    start?: string,
    end?: string,
    top?: number
  ) => Promise<void>;
  fetchLlmTokenSummary: (start?: string, end?: string) => Promise<void>;
  fetchLlmTokenByPeriod: (
    period?: string,
    start?: string,
    end?: string
  ) => Promise<void>;
  fetchLlmTopTokenUsers: (
    start?: string,
    end?: string,
    top?: number
  ) => Promise<void>;
};

export const useRecommendStore = create<RecommendState>((set: any) => ({
  loading: false,
  llmLoading: false,
  error: null,
  recommendation: null,
  llmRecommendation: null,
  // statistics
  statsLoading: false,
  llmTokenSummaryLoading: false,
  llmTokenByPeriodLoading: false,
  llmTopTokenUsersLoading: false,
  llmTopSubjectsLoading: false,
  llmTopRecommendedCoursesLoading: false,
  llmTopRecommendedDocumentsLoading: false,
  llmQuestionsByStudent: [],
  llmQuestionsTimeSeries: [],
  llmPeakHours: [],
  llmTopSubjects: [],
  llmTopRecommendedCourses: [],
  llmTopRecommendedDocuments: [],
  llmTokenSummary: null,
  llmTokenByPeriod: [],
  llmTopTokenUsers: [],

  fetchRecommend: async (topK = 30) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.post<RecommendationResponse>(
        "/Recommendation/recommend",
        { topK }
      );
      set({ recommendation: data });
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
    } finally {
      set({ loading: false });
    }
  },

  fetchRecommendLLM: async (
    userMessage?: string,
    profile?: LLMProfile,
    topK = 30,
    isGenerateExplanation = false
  ) => {
    set({ llmLoading: true, error: null });
    try {
      const body: any = { topK };
      if (userMessage) body.userMessage = userMessage;
      if (profile) body.profile = profile;
      if (isGenerateExplanation)
        body.isGenerateExplanation = isGenerateExplanation;

      const { data } = await axiosInstance.post<LLMRecommendationResponse>(
        "/Recommendation/recommend-llm",
        body
      );
      set({ llmRecommendation: data });
      return data ?? null;
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
      return null;
    } finally {
      set({ llmLoading: false });
    }
  },
  // create a history entry on backend
  createLlmHistory: async (inputText?: string) => {
    try {
      const { data } = await axiosInstance.post("/llmhistory", {
        InputText: inputText,
      });
      // created response wraps Data in the API layer, try to return data.Data or data
      return data?.Data ?? data;
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
      throw err;
    }
  },
  // list all histories for current user
  listLlmHistories: async () => {
    try {
      const { data } = await axiosInstance.get(`/llmhistory/mine`);
      return data?.data ?? data;
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
      return [];
    }
  },
  deleteLlmHistory: async (id: number) => {
    try {
      await axiosInstance.delete(`/llmhistory/${id}`);
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
      throw err;
    }
  },
  // toggle pin (ghim) and return authoritative status so UI can update single item
  toggleStarLlmHistory: async (id: number, starred: boolean) => {
    try {
      // Persist pin/unpin to backend using status endpoint
      const status = starred ? "Đã ghim" : "Đang mở";
      await axiosInstance.put(`/llmhistory/${id}/status`, { Status: status });
      // Return authoritative minimal info so caller can update item locally without reloading the whole list
      return { id, status };
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
      throw err;
    }
  },
  updateLlmHistoryResponse: async (
    id: number,
    responseText: string,
    totalPromptTokens?: number,
    totalResponseTokens?: number
  ) => {
    try {
      await axiosInstance.put(`/llmhistory/${id}/response`, {
        Response: responseText,
        TotalPromptTokens: totalPromptTokens,
        TotalResponseTokens: totalResponseTokens,
      });
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
      throw err;
    }
  },
  getLlmHistoryById: async (id: number) => {
    try {
      const { data } = await axiosInstance.get(`/llmhistory/${id}`);
      // backend returns { Success, Message, Data }
      return data?.data ?? data;
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
      return null;
    }
  },
  // --- statistics implementations ---
  fetchLlmQuestionsByStudent: async (
    start?: string,
    end?: string,
    top = 100
  ) => {
    set({ statsLoading: true, error: null });
    try {
      const params: any = { top };
      if (start) params.start = start;
      if (end) params.end = end;
      const { data } = await axiosInstance.get(
        "/Statistics/Llm/QuestionsByStudent",
        { params }
      );
      set({ llmQuestionsByStudent: data?.data ?? data ?? [] });
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
    } finally {
      set({ statsLoading: false });
    }
  },

  fetchLlmQuestionsTimeSeries: async (
    period = "day",
    start?: string,
    end?: string
  ) => {
    set({ statsLoading: true, error: null });
    try {
      const s =
        start ?? new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
      const e = end ?? new Date().toISOString();
      const { data } = await axiosInstance.get(
        "/Statistics/Llm/QuestionsTimeSeries",
        { params: { period, start: s, end: e } }
      );
      set({ llmQuestionsTimeSeries: data?.data ?? data ?? [] });
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
    } finally {
      set({ statsLoading: false });
    }
  },

  fetchLlmPeakHours: async (start?: string, end?: string, top = 5) => {
    set({ statsLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/Statistics/Llm/PeakHours", {
        params: { start, end, top },
      });
      set({ llmPeakHours: data?.data ?? data ?? [] });
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
    } finally {
      set({ statsLoading: false });
    }
  },

  fetchLlmTopSubjects: async (start?: string, end?: string, top = 10) => {
    set({ statsLoading: true, llmTopSubjectsLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/Statistics/Llm/TopSubjects", {
        params: { start, end, top },
      });
      set({ llmTopSubjects: data?.data ?? data ?? [] });
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
    } finally {
      set({ statsLoading: false, llmTopSubjectsLoading: false });
    }
  },

  fetchLlmTopRecommendedCourses: async (
    start?: string,
    end?: string,
    top = 10
  ) => {
    set({
      statsLoading: true,
      llmTopRecommendedCoursesLoading: true,
      error: null,
    });
    try {
      const { data } = await axiosInstance.get(
        "/Statistics/Llm/TopRecommendedCourses",
        { params: { start, end, top } }
      );
      set({ llmTopRecommendedCourses: data?.data ?? data ?? [] });
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
    } finally {
      set({ statsLoading: false, llmTopRecommendedCoursesLoading: false });
    }
  },

  fetchLlmTopRecommendedDocuments: async (
    start?: string,
    end?: string,
    top = 10
  ) => {
    set({
      statsLoading: true,
      llmTopRecommendedDocumentsLoading: true,
      error: null,
    });
    try {
      const { data } = await axiosInstance.get(
        "/Statistics/Llm/TopRecommendedDocuments",
        { params: { start, end, top } }
      );
      set({ llmTopRecommendedDocuments: data?.data ?? data ?? [] });
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
    } finally {
      set({ statsLoading: false, llmTopRecommendedDocumentsLoading: false });
    }
  },

  fetchLlmTokenSummary: async (start?: string, end?: string) => {
    set({ statsLoading: true, llmTokenSummaryLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/Statistics/Llm/TokenSummary", {
        params: { start, end },
      });
      set({ llmTokenSummary: data?.data ?? data ?? null });
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
    } finally {
      set({ statsLoading: false, llmTokenSummaryLoading: false });
    }
  },

  fetchLlmTokenByPeriod: async (
    period = "month",
    start?: string,
    end?: string
  ) => {
    set({ statsLoading: true, llmTokenByPeriodLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get(
        "/Statistics/Llm/TokenByPeriod",
        { params: { period, start, end } }
      );
      set({ llmTokenByPeriod: data?.data ?? data ?? [] });
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
    } finally {
      set({ statsLoading: false, llmTokenByPeriodLoading: false });
    }
  },

  fetchLlmTopTokenUsers: async (start?: string, end?: string, top = 10) => {
    set({ statsLoading: true, llmTopTokenUsersLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get(
        "/Statistics/Llm/TopTokenUsers",
        { params: { start, end, top } }
      );
      set({ llmTopTokenUsers: data?.data ?? data ?? [] });
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
    } finally {
      set({ statsLoading: false, llmTopTokenUsersLoading: false });
    }
  },
}));

export default useRecommendStore;
