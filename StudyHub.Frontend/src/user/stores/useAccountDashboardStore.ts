import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import type {
  AccountsOverviewDto,
  AccountRecoveryStatsDto,
} from "@/user/interfaces/account-dashboard";

type State = {
  overview: AccountsOverviewDto | null;
  recovery: AccountRecoveryStatsDto | null;
  isLoading: boolean;
  error: string | null;
  fetchOverview: (period?: string, range?: number) => Promise<void>;
  fetchRecoveryStats: () => Promise<void>;
  fetchAll: (period?: string, range?: number) => Promise<void>;
};

export const useAccountDashboardStore = create<State>()(
  devtools((set) => ({
    overview: null,
    recovery: null,
    isLoading: false,
    error: null,

    fetchOverview: async (period = "day", range = 30) => {
      set({ isLoading: true, error: null });
      try {
        const resp = await axiosInstance.get<{
          success: boolean;
          data: AccountsOverviewDto;
        }>(`/Statistics/AccountsOverview?period=${period}&range=${range}`);
        const data = resp.data?.data ?? null;
        set({ overview: data ?? null });
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
        console.error("fetch overview error", err);
      } finally {
        set({ isLoading: false });
      }
    },

    fetchRecoveryStats: async () => {
      set({ isLoading: true, error: null });
      try {
        const resp = await axiosInstance.get<{
          success: boolean;
          data: AccountRecoveryStatsDto;
        }>(`/Statistics/AccountRecovery`);
        const data = resp.data?.data ?? null;
        set({ recovery: data ?? null });
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
        console.error("fetch recovery stats error", err);
      } finally {
        set({ isLoading: false });
      }
    },

    fetchAll: async (period = "day", range = 30) => {
      set({ isLoading: true, error: null });
      try {
        // run in parallel
        const [ov, rc] = await Promise.all([
          axiosInstance.get<{ success: boolean; data: AccountsOverviewDto }>(
            `/Statistics/AccountsOverview?period=${period}&range=${range}`
          ),
          axiosInstance.get<{
            success: boolean;
            data: AccountRecoveryStatsDto;
          }>(`/Statistics/AccountRecovery`),
        ]);
        set({
          overview: ov.data?.data ?? null,
          recovery: rc.data?.data ?? null,
        });
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
        console.error("fetchAll dashboard error", err);
      } finally {
        set({ isLoading: false });
      }
    },
  }))
);

export default useAccountDashboardStore;
