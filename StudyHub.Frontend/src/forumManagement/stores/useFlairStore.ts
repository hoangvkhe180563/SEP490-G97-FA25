// src/forumManagement/stores/useFlairStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";

interface Flair {
  id: number;
  school_id: number;
  name: string;
  description?: string;
  is_protected: boolean;
  status: boolean;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  post_count: number;
}

interface FlairState {
  flairs: Flair[];
  currentFlair: Flair | null;
  isLoading: boolean;
  success: boolean;
  message: string;

  getFlairs: (
    schoolId: number,
    isProtected?: boolean,
    status?: boolean,
    searchTerm?: string,
    pageNumber?: number,
    pageSize?: number
  ) => Promise<any>;

  getFlairById: (flairId: number) => Promise<any>;
  createFlair: (data: {
    schoolId: number;
    flairName: string;
    description?: string;
    isProtected?: boolean;
  }) => Promise<any>;

  updateFlair: (
    flairId: number,
    data: {
      flairName: string;
      description?: string;
      isProtected: boolean;
    }
  ) => Promise<any>;

  deleteFlair: (flairId: number) => Promise<any>;
  toggleFlairStatus: (flairId: number) => Promise<any>;
}

const mapFlair = (dto: any): Flair => ({
  id: dto.flairId || dto.id,
  school_id: dto.schoolId || dto.school_id,
  name: dto.flairName || dto.name || "",
  description: dto.description,
  is_protected: dto.isProtected ?? false,
  status: dto.status ?? true,
  created_at: dto.createdAt || dto.created_at,
  created_by: dto.createdBy || dto.created_by,
  updated_at: dto.updatedAt || dto.updated_at,
  updated_by: dto.updatedBy || dto.updated_by,
  post_count: dto.postCount || dto.post_count || 0,
});

export const useFlairStore = create<FlairState>()(
  devtools(
    (set) => ({
      flairs: [],
      currentFlair: null,
      isLoading: false,
      success: false,
      message: "",

      getFlairs: async (
        schoolId: number,
        isProtected?: boolean,
        status?: boolean,
        searchTerm?: string,
        pageNumber: number = 1,
        pageSize: number = 100
      ) => {
        set({ isLoading: true });
        try {
          const params = new URLSearchParams();
          params.append("schoolId", schoolId.toString());
          if (isProtected !== undefined)
            params.append("isProtected", isProtected.toString());
          if (status !== undefined) params.append("status", status.toString());
          if (searchTerm) params.append("searchTerm", searchTerm);
          params.append("pageNumber", pageNumber.toString());
          params.append("pageSize", pageSize.toString());

          const resp = await axiosInstance.get(
            `/Forum/flairs?${params.toString()}`
          );
          const body = resp.data;

          if (body?.success) {
            const mappedFlairs = (body.data?.items || []).map(mapFlair);
            set({
              flairs: mappedFlairs,
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

      getFlairById: async (flairId: number) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.get(`/Forum/flairs/${flairId}`);
          const body = resp.data;

          if (body?.success) {
            const mappedFlair = mapFlair(body.data);
            set({
              currentFlair: mappedFlair,
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

      createFlair: async (data) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.post(`/Forum/flairs/create`, data);
          const body = resp.data;

          if (body?.success) {
            set({
              success: true,
              message: body?.message || "Tạo flair thành công",
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

      updateFlair: async (flairId: number, data) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.put(`/Forum/flairs/${flairId}`, {
            flairId,
            ...data,
          });
          const body = resp.data;

          if (body?.success) {
            const mappedFlair = mapFlair(body.data);
            set((state) => ({
              flairs: state.flairs.map((f) =>
                f.id === flairId ? mappedFlair : f
              ),
              currentFlair:
                state.currentFlair?.id === flairId
                  ? mappedFlair
                  : state.currentFlair,
              success: true,
              message: body?.message || "Cập nhật flair thành công",
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

      toggleFlairStatus: async (flairId: number) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.post(
            `/Forum/flairs/${flairId}/toggle-status`
          );
          const body = resp.data;

          if (body?.success) {
            set({
              success: true,
              message: body?.message || "Đã cập nhật trạng thái flair",
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

      deleteFlair: async (flairId: number) => {
        set({ isLoading: true });
        try {
          const resp = await axiosInstance.delete(`/Forum/flairs/${flairId}`);
          const body = resp.data;

          if (body?.success) {
            set((state) => ({
              flairs: state.flairs.filter((f) => f.id !== flairId),
              currentFlair:
                state.currentFlair?.id === flairId ? null : state.currentFlair,
              success: true,
              message: body?.message || "Xóa flair thành công",
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
    }),
    { name: "flair-store" }
  )
);
