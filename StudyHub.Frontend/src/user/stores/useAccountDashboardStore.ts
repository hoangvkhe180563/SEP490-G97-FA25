import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import type {
  AccountsOverviewDto,
  AccountRecoveryStatsDto,
} from "@/user/interfaces/account-dashboard";
import type {
  DateCountDto,
  HourCountDto,
  PagedResultDto,
  RealtimePresenceDto,
} from "@/user/interfaces/account-dashboard";

type State = {
  overview: AccountsOverviewDto | null;
  recovery: AccountRecoveryStatsDto | null;
  peakHours: HourCountDto[] | null;
  dau: PagedResultDto<DateCountDto> | null;
  mau: PagedResultDto<DateCountDto> | null;
  realtime: RealtimePresenceDto | null;
  isLoading: boolean;
  error: string | null;
  fetchOverview: (
    period?: string,
    range?: number,
    opts?: {
      retentionStart?: string;
      retentionEnd?: string;
      retentionReturnAfterDays?: number;
      avgLoginStart?: string;
      avgLoginEnd?: string;
    }
  ) => Promise<void>;
  fetchRecoveryStats: () => Promise<void>;
  fetchAccessBehavior: (opts?: {
    start?: string | undefined;
    end?: string | undefined;
    top?: number;
    page?: number; // frontend page (1 = newest when newestFirst=true)
    pageSize?: number;
    newestFirst?: boolean;
  }) => Promise<void>;
  fetchDauPage: (opts?: {
    start?: string | undefined;
    end?: string | undefined;
    top?: number;
    page?: number;
    pageSize?: number;
    newestFirst?: boolean;
  }) => Promise<void>;
  fetchMauPage: (opts?: {
    start?: string | undefined;
    end?: string | undefined;
    top?: number;
    page?: number;
    pageSize?: number;
    newestFirst?: boolean;
  }) => Promise<void>;
  fetchPeakHours: (opts?: {
    start?: string;
    end?: string;
    top?: number;
  }) => Promise<void>;
  fetchAll: (period?: string, range?: number) => Promise<void>;
  fetchRealtime: () => Promise<void>;
};

export const useAccountDashboardStore = create<State>()(
  devtools((set) => ({
    overview: null,
    recovery: null,
    peakHours: null,
    dau: null,
    mau: null,
    realtime: null,
    isLoading: false,
    error: null,

    fetchOverview: async (
      period = "day",
      range = 30,
      opts?: {
        retentionStart?: string;
        retentionEnd?: string;
        retentionReturnAfterDays?: number;
        avgLoginStart?: string;
        avgLoginEnd?: string;
      }
    ) => {
      set({ isLoading: true, error: null });
      try {
        const qs = new URLSearchParams();
        qs.append("period", period);
        qs.append("range", String(range));
        if (opts?.retentionStart)
          qs.append("retentionStart", opts.retentionStart);
        if (opts?.retentionEnd) qs.append("retentionEnd", opts.retentionEnd);
        if (opts?.retentionReturnAfterDays !== undefined)
          qs.append(
            "retentionReturnAfterDays",
            String(opts.retentionReturnAfterDays)
          );
        if (opts?.avgLoginStart) qs.append("avgLoginStart", opts.avgLoginStart);
        if (opts?.avgLoginEnd) qs.append("avgLoginEnd", opts.avgLoginEnd);

        const resp = await axiosInstance.get(
          `/Statistics/AccountsOverview?${qs.toString()}`
        );
        const payload = resp.data?.data ?? null;
        // Backend returns { Accounts = accountsDto, Retention = ..., AverageLogin = ... }
        let accounts: AccountsOverviewDto | null = null;
        if (payload) {
          if (payload.Accounts || payload.accounts)
            accounts = (payload.Accounts ??
              payload.accounts) as AccountsOverviewDto;
          else if (
            payload.totalUsers !== undefined ||
            payload.roleDistribution !== undefined
          )
            accounts = payload as AccountsOverviewDto;

          // Try to map retention and average login objects if present
          const retentionObj = payload.Retention ?? payload.retention ?? null;
          const avgObj = payload.AverageLogin ?? payload.averageLogin ?? null;
          if (accounts) {
            if (typeof retentionObj === "number") {
              accounts.retentionRate = retentionObj;
            } else if (retentionObj && typeof retentionObj === "object") {
              accounts.retention = {
                cohortStart:
                  retentionObj.cohortStart ?? retentionObj.CohortStart ?? null,
                cohortEnd:
                  retentionObj.cohortEnd ?? retentionObj.CohortEnd ?? null,
                cohortCount:
                  retentionObj.cohortCount ?? retentionObj.CohortCount ?? null,
                retainedCount:
                  retentionObj.retainedCount ??
                  retentionObj.RetainedCount ??
                  null,
                retentionRate:
                  retentionObj.retentionRate ??
                  retentionObj.RetentionRate ??
                  null,
                returnAfterDays:
                  retentionObj.returnAfterDays ??
                  retentionObj.ReturnAfterDays ??
                  null,
              } as any;
              // also set flat rate for compatibility
              accounts.retentionRate =
                accounts.retention!.retentionRate ??
                accounts.retentionRate ??
                undefined;
            }

            if (typeof avgObj === "number") {
              accounts.averageLoginFrequency = avgObj;
            } else if (avgObj && typeof avgObj === "object") {
              accounts.averageLogin = {
                totalLogins: avgObj.totalLogins ?? avgObj.TotalLogins ?? null,
                distinctUsers:
                  avgObj.distinctUsers ?? avgObj.DistinctUsers ?? null,
                averagePerUser:
                  avgObj.averagePerUser ??
                  avgObj.AveragePerUser ??
                  avgObj.averagePerUser ??
                  null,
                periodStart: avgObj.periodStart ?? avgObj.PeriodStart ?? null,
                periodEnd: avgObj.periodEnd ?? avgObj.PeriodEnd ?? null,
              } as any;
              accounts.averageLoginFrequency =
                accounts.averageLogin!.averagePerUser ??
                accounts.averageLoginFrequency ??
                undefined;
            }
          }
        }
        set({ overview: accounts ?? null });
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

    fetchAccessBehavior: async ({
      start,
      end,
      top = 5,
      page = 1,
      pageSize = 10,
      newestFirst = true,
    } = {}) => {
      set({ isLoading: true, error: null });
      try {
        const qsBuild = (p: number) => {
          const qs = new URLSearchParams();
          if (start) qs.append("start", start);
          if (end) qs.append("end", end);
          qs.append("top", String(top));
          qs.append("page", String(p));
          qs.append("pageSize", String(pageSize));
          return qs.toString();
        };

        // If newestFirst==true, we need to find backend page that contains newest items.
        // The backend returns pages ordered ascending (oldest -> newest). We'll first fetch page=1 to learn totalPages,
        // then request backendPage = totalPages - (page - 1) to get the requested newest-first page.
        if (newestFirst) {
          const firstResp = await axiosInstance.get<any>(
            `/Statistics/AccessBehavior?${qsBuild(1)}`
          );

          const meta = firstResp.data?.data ?? null;
          const dauMeta = meta?.DAU ?? meta?.dau;
          const totalPages = dauMeta?.totalPages ?? 1;
          let backendPage = totalPages - (page - 1);
          if (backendPage < 1) backendPage = 1;

          const resp = await axiosInstance.get<any>(
            `/Statistics/AccessBehavior?${qsBuild(backendPage)}`
          );

          const data = resp.data?.data ?? null;
          console.log("AccessBehavior newestFirst data", data);
          set({
            peakHours: data?.PeakHours ?? data?.peakHours ?? null,
            dau: data?.DAU ?? data?.dau ?? null,
            mau: data?.MAU ?? data?.mau ?? null,
          });
        } else {
          const resp = await axiosInstance.get(
            `/Statistics/AccessBehavior?${qsBuild(page)}`
          );

          const data = resp.data?.data ?? null;
          set({
            peakHours: data?.PeakHours ?? data?.peakHours ?? null,
            dau: data?.DAU ?? data?.dau ?? null,
            mau: data?.MAU ?? data?.mau ?? null,
          });
        }
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
        console.error("fetch access behavior error", err);
      } finally {
        set({ isLoading: false });
      }
    },

    fetchDauPage: async ({
      start,
      end,
      top = 5,
      page = 1,
      pageSize = 10,
      newestFirst = true,
    } = {}) => {
      set({ isLoading: true, error: null });
      try {
        const qsBuild = (p: number) => {
          const qs = new URLSearchParams();
          if (start) qs.append("start", start);
          if (end) qs.append("end", end);
          qs.append("top", String(top));
          qs.append("page", String(p));
          qs.append("pageSize", String(pageSize));
          return qs.toString();
        };

        if (newestFirst) {
          const firstResp = await axiosInstance.get<any>(
            `/Statistics/AccessBehavior?${qsBuild(1)}`
          );
          const meta = firstResp.data?.data ?? null;
          const dauMeta = meta?.DAU ?? meta?.dau;
          const totalPages = dauMeta?.totalPages ?? 1;
          let backendPage = totalPages - (page - 1);
          if (backendPage < 1) backendPage = 1;

          const resp = await axiosInstance.get<any>(
            `/Statistics/AccessBehavior?${qsBuild(backendPage)}`
          );
          const data = resp.data?.data ?? null;
          set({ dau: data?.DAU ?? data?.dau ?? null });
          // set peak hours if present
          if (data?.PeakHours ?? data?.peakHours)
            set({ peakHours: data?.PeakHours ?? data?.peakHours ?? null });
        } else {
          const resp = await axiosInstance.get<any>(
            `/Statistics/AccessBehavior?${qsBuild(page)}`
          );
          const data = resp.data?.data ?? null;
          set({ dau: data?.DAU ?? data?.dau ?? null });
          if (data?.PeakHours ?? data?.peakHours)
            set({ peakHours: data?.PeakHours ?? data?.peakHours ?? null });
        }
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
        console.error("fetch dau page error", err);
      } finally {
        set({ isLoading: false });
      }
    },

    fetchMauPage: async ({
      start,
      end,
      top = 5,
      page = 1,
      pageSize = 10,
      newestFirst = true,
    } = {}) => {
      set({ isLoading: true, error: null });
      try {
        const qsBuild = (p: number) => {
          const qs = new URLSearchParams();
          if (start) qs.append("start", start);
          if (end) qs.append("end", end);
          qs.append("top", String(top));
          qs.append("page", String(p));
          qs.append("pageSize", String(pageSize));
          return qs.toString();
        };

        if (newestFirst) {
          const firstResp = await axiosInstance.get<any>(
            `/Statistics/AccessBehavior?${qsBuild(1)}`
          );
          const meta = firstResp.data?.data ?? null;
          const mauMeta = meta?.MAU ?? meta?.mau;
          const totalPages = mauMeta?.totalPages ?? 1;
          let backendPage = totalPages - (page - 1);
          if (backendPage < 1) backendPage = 1;

          const resp = await axiosInstance.get<any>(
            `/Statistics/AccessBehavior?${qsBuild(backendPage)}`
          );
          const data = resp.data?.data ?? null;
          set({ mau: data?.MAU ?? data?.mau ?? null });
          if (data?.PeakHours ?? data?.peakHours)
            set({ peakHours: data?.PeakHours ?? data?.peakHours ?? null });
        } else {
          const resp = await axiosInstance.get<any>(
            `/Statistics/AccessBehavior?${qsBuild(page)}`
          );
          const data = resp.data?.data ?? null;
          set({ mau: data?.MAU ?? data?.mau ?? null });
          if (data?.PeakHours ?? data?.peakHours)
            set({ peakHours: data?.PeakHours ?? data?.peakHours ?? null });
        }
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
        console.error("fetch mau page error", err);
      } finally {
        set({ isLoading: false });
      }
    },

    fetchPeakHours: async ({ start, end, top = 5 } = {}) => {
      set({ isLoading: true, error: null });
      try {
        const qs = new URLSearchParams();
        if (start) qs.append("start", start);
        if (end) qs.append("end", end);
        qs.append("top", String(top));
        const resp = await axiosInstance.get<any>(
          `/Statistics/AccessBehavior?${qs.toString()}`
        );
        const data = resp.data?.data ?? null;
        set({ peakHours: data?.PeakHours ?? data?.peakHours ?? null });
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
        console.error("fetch peak hours error", err);
      } finally {
        set({ isLoading: false });
      }
    },

    fetchAll: async (period = "day", range = 30) => {
      set({ isLoading: true, error: null });
      try {
        // run in parallel
        const [ovResp, rcResp, rtResp] = await Promise.all([
          axiosInstance.get(
            `/Statistics/AccountsOverview?period=${period}&range=${range}`
          ),
          axiosInstance.get(`/Statistics/AccountRecovery`),
          axiosInstance.get(`/Statistics/Realtime`),
        ]);

        // map accounts overview (backend wraps Accounts/Retention/AverageLogin)
        const ovPayload = ovResp.data?.data ?? null;
        let accounts: AccountsOverviewDto | null = null;
        if (ovPayload) {
          if (ovPayload.Accounts || ovPayload.accounts)
            accounts = (ovPayload.Accounts ??
              ovPayload.accounts) as AccountsOverviewDto;
          else if (
            ovPayload.totalUsers !== undefined ||
            ovPayload.roleDistribution !== undefined
          )
            accounts = ovPayload as AccountsOverviewDto;
          const retention =
            ovPayload.Retention ??
            ovPayload.RetentionRate ??
            ovPayload.retention ??
            ovPayload.retentionRate ??
            null;
          const avg =
            ovPayload.AverageLogin ??
            ovPayload.AverageLoginFrequency ??
            ovPayload.avgLogin ??
            ovPayload.averageLogin ??
            ovPayload.averagePerUser ??
            null;
          if (accounts) {
            if (typeof retention === "number")
              accounts.retentionRate = retention;
            else if (retention && typeof retention === "object")
              accounts.retentionRate =
                retention.RetentionRate ?? retention.rate ?? null;
            if (typeof avg === "number") accounts.averageLoginFrequency = avg;
            else if (avg && typeof avg === "object")
              accounts.averageLoginFrequency = avg.Value ?? avg.Average ?? null;
          }
        }

        // map realtime payload: backend returns { OnlineCount, RoleBreakdown }
        const rtPayload = rtResp.data?.data ?? null;
        let realtimeMapped: RealtimePresenceDto | null = null;
        if (rtPayload) {
          const onlineCount =
            rtPayload.OnlineCount ?? rtPayload.onlineCount ?? 0;
          const breakdown =
            rtPayload.RoleBreakdown ??
            rtPayload.roleBreakdown ??
            rtPayload.RoleBreakdownList ??
            [];
          const onlineByRole = (breakdown ?? []).map((r: any) => ({
            role: r.Role ?? r.role ?? r.RoleName ?? "",
            count:
              r.Count ??
              r.count ??
              (r.Percentage
                ? Math.round((r.Percentage / 100) * onlineCount)
                : 0),
          }));
          realtimeMapped = { onlineCount: onlineCount, onlineByRole };
        }

        set({
          overview: accounts ?? null,
          recovery: rcResp.data?.data ?? null,
          realtime: realtimeMapped,
        });
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
        console.error("fetchAll dashboard error", err);
      } finally {
        set({ isLoading: false });
      }
    },

    fetchRealtime: async () => {
      set({ isLoading: true, error: null });
      try {
        const resp = await axiosInstance.get(`/Statistics/Realtime`);
        const payload = resp.data?.data ?? null;
        if (payload) {
          const onlineCount = payload.OnlineCount ?? payload.onlineCount ?? 0;
          const breakdown =
            payload.RoleBreakdown ??
            payload.roleBreakdown ??
            payload.RoleBreakdownList ??
            [];
          const onlineByRole = (breakdown ?? []).map((r: any) => ({
            role: r.Role ?? r.role ?? r.RoleName ?? "",
            count:
              r.Count ??
              r.count ??
              (r.Percentage
                ? Math.round((r.Percentage / 100) * onlineCount)
                : 0),
          }));
          set({ realtime: { onlineCount, onlineByRole } });
        } else {
          set({ realtime: null });
        }
      } catch (err) {
        set({ error: axiosMessageErrorHandler(err) });
        console.error("fetch realtime error", err);
      } finally {
        set({ isLoading: false });
      }
    },
  }))
);

export default useAccountDashboardStore;
