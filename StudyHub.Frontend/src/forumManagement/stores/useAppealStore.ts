// src/forumManagement/moderator/stores/useAppealStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import type { UserAppeal } from "../interfaces/moderator";

interface AppealState {
  appeals: UserAppeal[];
  isLoading: boolean;
  success: boolean;
  message: string;

  getAppeals: (
    schoolId: number,
    status?: boolean | null,
    pageNumber?: number,
    pageSize?: number,
    createdFrom?: string,
    createdTo?: string,
    query?: string,
    sortBy?: string
  ) => Promise<any>;
  createAppeal: (schoolId: number, reason: string) => Promise<any>;
  approveAppeal: (appealId: number) => Promise<any>;
  rejectAppeal: (appealId: number) => Promise<any>;
}

const mapAppeal = (dto: any): UserAppeal => ({
  id: dto.appealId,
  user_id: dto.userId,
  user_name: dto.fullname || dto.username,
  school_id: dto.schoolId,
  reason: dto.reason,
  status: dto.status,
  created_at: dto.createdAt,
  updated_at: dto.updatedAt,
  updated_by: dto.updatedBy,
});

export const useAppealStore = create<AppealState>()(
  devtools(
    (set) => ({
      appeals: [],
      isLoading: false,
      success: false,
      message: "",

      getAppeals: async (
        schoolId: number,
        status?: boolean | null,
        pageNumber?: number,
        pageSize?: number,
        createdFrom?: string,
        createdTo?: string,
        query?: string,
        sortBy?: string
      ) => {
        set({ isLoading: true });
        try {
          const params = new URLSearchParams();
          params.append("schoolId", schoolId.toString());
          if (status !== undefined && status !== null)
            params.append("status", status.toString());
          if (createdFrom) params.append("createdFrom", createdFrom);
          if (createdTo) params.append("createdTo", createdTo);
          if (query) params.append("query", query);
          if (sortBy) params.append("sortBy", sortBy);
          params.append("pageNumber", (pageNumber || 1).toString());
          params.append("pageSize", (pageSize || 10).toString());

          const resp = await axiosInstance.get(
            `/Forum/moderator/appeals?${params.toString()}`
          );
          const body = resp.data;

          if (body?.success) {
            const mappedAppeals = (body.data?.items || []).map(mapAppeal);
            set({
              appeals: mappedAppeals,
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

      approveAppeal: async (appealId: number) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.post(
            `/Forum/appeals/${appealId}/approve`
          );
          const body = resp.data;

          if (body?.success) {
            set({
              success: true,
              message: body?.message || "Đã chấp nhận kháng cáo",
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
      createAppeal: async (schoolId: number, reason: string) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.post(`/Forum/appeals/create`, {
            schoolId,
            reason,
          });
          const body = resp.data;

          if (body?.success) {
            set({
              success: true,
              message: body?.message || "Đã tạo kháng cáo thành công",
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
      rejectAppeal: async (appealId: number) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.post(
            `/Forum/appeals/${appealId}/reject`
          );
          const body = resp.data;

          if (body?.success) {
            set({
              success: true,
              message: body?.message || "Đã từ chối kháng cáo",
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
    { name: "appeal-store" }
  )
);
