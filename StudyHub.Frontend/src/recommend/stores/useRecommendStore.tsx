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
  ) => Promise<void>;
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
    } catch (err: any) {
      set({ error: axiosMessageErrorHandler(err) });
    } finally {
      set({ llmLoading: false });
    }
  },
}));

export default useRecommendStore;
