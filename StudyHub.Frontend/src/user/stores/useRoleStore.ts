import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AppRoleState } from "../interfaces/stores";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";

export const useAppRoleStore = create<AppRoleState>()(
  devtools(
    (set) => ({
      appRoles: [],
      isLoading: false,
      success: false,
      message: "",
      getAppRoles: async () => {
        set({ isLoading: true });
        try {
          const response = await axiosInstance.get(`/AppRole`);
          const { data } = response;
          // API returns { Success, Data }
          set({
            appRoles: data?.data ?? [],
            success: data?.success ?? false,
            message: data?.message ?? "",
          });
        } catch (error) {
          set({
            success: false,
            message: axiosMessageErrorHandler(error),
          });
          console.log(error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    { name: "app-role-store" }
  )
);
