import { create } from "zustand";
import { axiosInstance, axiosMessageErrorHandler } from "../../lib/axios";
import type {
  RecommendationResponse,
  LLMRecommendationResponse,
  LLMProfile,
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
    topK?: number
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
};

export const useRecommendStore = create<RecommendState>((set: any) => ({
  loading: false,
  llmLoading: false,
  error: null,
  recommendation: null,
  llmRecommendation: null,

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
    topK = 30
  ) => {
    set({ llmLoading: true, error: null });
    try {
      const body: any = { topK };
      if (userMessage) body.userMessage = userMessage;
      if (profile) body.profile = profile;

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
}));

export default useRecommendStore;
