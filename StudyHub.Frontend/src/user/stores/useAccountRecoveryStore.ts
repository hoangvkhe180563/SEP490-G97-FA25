import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import type { CreateAccountRecoveryRequest } from "@/user/interfaces/account-recovery";
import type { AccountRecoveryState } from "../interfaces/stores";

export const useAccountRecoveryStore = create<AccountRecoveryState>()(
  devtools((set, get) => ({
    items: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    isLoading: false,
    error: null,

    fetch: async (
      search = null,
      status = null,
      page = 1,
      limit = 10,
      schoolId?: number
    ) => {
      set({ isLoading: true, error: null });
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (status) params.append("status", status);
        params.append("page", String(page));
        params.append("limit", String(limit));
        if (schoolId !== undefined && schoolId !== null)
          params.append("schoolId", String(schoolId));

        const resp = await axiosInstance.get<{ success: boolean; data: any }>(
          `/AccountRecovery?${params.toString()}`
        );
        const data = resp.data?.data ?? null;
        if (data) {
          set({
            items: data.items ?? [],
            total: data.total ?? 0,
            page: data.page ?? page,
            limit: data.limit ?? limit,
            totalPages: data.totalPages ?? 0,
            isLoading: false,
          });
        } else {
          set({
            items: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
            isLoading: false,
          });
        }
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err), isLoading: false });
        console.log("fetch account recovery error", err);
      }
    },

    updateStatus: async (id: string, status: string, schoolId?: number) => {
      set({ isLoading: true, error: null });
      try {
        await axiosInstance.patch(`/AccountRecovery/${id}/status`, { status });
        // refresh current page
        const s = get();
        await s.fetch(null, null, s.page, s.limit, schoolId);
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
        console.log("update status error", err);
      } finally {
        set({ isLoading: false });
      }
    },

    createRequest: async (payload: CreateAccountRecoveryRequest) => {
      set({ isLoading: true, error: null });
      try {
        await axiosInstance.post(`/AccountRecovery`, payload);
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
        console.log("create recovery request error", err);
        throw err;
      } finally {
        set({ isLoading: false });
      }
    },
  }))
);

export default useAccountRecoveryStore;
