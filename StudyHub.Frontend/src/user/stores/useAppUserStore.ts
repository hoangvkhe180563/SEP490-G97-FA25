import { create } from "zustand";
import type { AppUserState } from "../interfaces/stores";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import { devtools } from "zustand/middleware";
import type { AppUser } from "../interfaces/app-user";
import type {
  CreateAccountDto,
  EditAccountDto,
  UpdateProfileDto,
} from "@/user/interfaces/dtos";

export const useAppUserStore = create<AppUserState>()(
  devtools(
    (set) => ({
      appUsers: [],
      appUser: undefined,
      currentUser: undefined,
      success: false,
      message: "",
      isLoading: false,
      filterAppUsers: async (query: string) => {
        set({ isLoading: true });
        try {
          const response = await axiosInstance.get(`/AppUser?${query}`);
          const { data } = response;

          // API returns { Message, Data, Meta }
          set({
            appUsers: data?.data ?? [],
            meta: data?.meta ?? null,
            success: data?.success ?? false,
            message: data?.message ?? "",
          });
          return data;
        } catch (error) {
          set({
            success: false,
            message: "Failed to fetch users",
          });
          console.log(error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },
      setAppUsers: (users: AppUser[] | ((prev: AppUser[]) => AppUser[])) => {
        // support functional updater or direct array set
        if (typeof users === "function") {
          set((state: any) => {
            const prevList: AppUser[] = Array.isArray(state.appUsers)
              ? state.appUsers
              : [];
            const next = (users as (prev: AppUser[]) => AppUser[])(prevList);
            return { appUsers: next };
          });
        } else {
          set({ appUsers: users });
        }
      },
      // Fetch roles to populate role selectors in forms
      fetchRoles: async () => {
        try {
          const res = await axiosInstance.get("/AppRole");
          const body = res.data;
          const list = body?.data ?? body?.Data ?? [];
          if (!Array.isArray(list)) return [];
          return list.map((r: any) => ({ id: r.id, name: r.name }));
        } catch (err) {
          console.log(err);
          return [];
        }
      },
      getAppUserById: async (id: string) => {
        set({ isLoading: true });
        try {
          const response = await axiosInstance.get(`/AppUser/${id}`);
          const { data } = response;
          // API returns { Success, Data }
          set({
            // appUser: data?.data ?? undefined,
            success: data?.success ?? false,
            message: data?.message ?? "",
          });
          return data;
        } catch (error) {
          set({
            success: false,
            message: axiosMessageErrorHandler(error),
          });
          console.log(error);
          return undefined;
        } finally {
          set({ isLoading: false });
        }
      },
      // Create account - dto may include avatarFile as File
      createAccount: async (
        dto: CreateAccountDto,
        successCallback?: () => void,
        errorCallback?: () => void
      ) => {
        set({ isLoading: true });
        try {
          const formData = new FormData();
          formData.append("Email", dto.email);
          formData.append("Password", dto.password);
          formData.append("Username", dto.username);
          if (dto.fullname) formData.append("Fullname", dto.fullname);
          if (dto.communeId)
            formData.append("CommuneId", String(dto.communeId));
          if (dto.gender) formData.append("Gender", String(dto.gender));
          if (dto.roleIds && dto.roleIds.length > 0) {
            dto.roleIds.forEach((r, i) =>
              formData.append(`RoleIds[${i}]`, String(r))
            );
          }
          if ((dto as any).avatarFile)
            formData.append("AvatarFile", (dto as any).avatarFile as File);

          const res = await axiosInstance.post("/AppUser/create", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const body = res.data;
          const success = body?.success ?? body?.Success ?? false;
          if (success) {
            if (successCallback) successCallback();
            set({ success: true, message: body?.message ?? "" });
            return body;
          }
          errorCallback?.();
          set({
            success: false,
            message: body?.message ?? "Tạo tài khoản không thành công",
          });
          return body;
        } catch (error) {
          set({ success: false, message: axiosMessageErrorHandler(error) });
          errorCallback?.();
          console.log(error);
          return { success: false, message: axiosMessageErrorHandler(error) };
        } finally {
          set({ isLoading: false });
        }
      },
      getProfile: async () => {
        set({ isLoading: true });
        try {
          const response = await axiosInstance.get(`/AppUser/me`);
          const { data } = response;
          // API returns { Success, Data }
          set({
            currentUser: data?.data ?? undefined,
            success: data?.success ?? false,
            message: data?.message ?? "",
          });
          return data;
        } catch (error) {
          set({
            success: false,
            message: axiosMessageErrorHandler(error),
          });
          console.log(error);
          return undefined;
        } finally {
          set({ isLoading: false });
        }
      },
      // Update existing account by id. dto can include avatarFile and optional fields.
      updateAccount: async (
        id: string,
        dto: EditAccountDto,
        successCallback?: (message?: string) => void,
        errorCallback?: (message?: string) => void
      ) => {
        set({ isLoading: true });
        try {
          const formData = new FormData();
          if (dto.email) formData.append("Email", dto.email);
          if (dto.username) formData.append("Username", dto.username);
          if (dto.fullname) formData.append("Fullname", dto.fullname);
          if (dto.address) formData.append("Address", dto.address);
          if (dto.phoneNumber) formData.append("PhoneNumber", dto.phoneNumber);
          if (typeof dto.communeId !== "undefined")
            formData.append("CommuneId", String(dto.communeId));
          if (typeof dto.schoolId !== "undefined")
            formData.append("SchoolId", String(dto.schoolId));
          if (typeof dto.status !== "undefined" && dto.status !== null)
            formData.append("Status", String(dto.status));
          if (typeof dto.gender !== "undefined")
            formData.append("Gender", String(dto.gender));
          if (dto.roleIds && dto.roleIds.length > 0) {
            dto.roleIds.forEach((r, i) =>
              formData.append(`RoleIds[${i}]`, String(r))
            );
          }
          if ((dto as any).avatarFile)
            formData.append("AvatarFile", (dto as any).avatarFile as File);

          const res = await axiosInstance.put(`/AppUser/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          const body = res.data;
          console.log(body);
          const success = body?.success ?? body?.Success ?? false;
          if (success) {
            // update local appUser and appUsers list if present
            set((state: any) => {
              const prevList: AppUser[] = Array.isArray(state.appUsers)
                ? state.appUsers
                : [];
              const updated = prevList.map((u: AppUser) =>
                u.id === id ? { ...u, ...(body?.data ?? {}) } : u
              );
              return {
                appUsers: updated,
                appUser: body?.data ?? state.appUser,
                success: true,
                message: body?.message ?? "",
              };
            });
            successCallback?.(body?.message ?? "Cập nhật tài khoản thành công");
            return body;
          }
          set({
            success: false,
            message: body?.message ?? "Cập nhật thất bại",
          });
          errorCallback?.(body?.message ?? "Cập nhật thất bại");
          return body;
        } catch (error) {
          set({ success: false, message: axiosMessageErrorHandler(error) });
          errorCallback?.(axiosMessageErrorHandler(error));
          console.log(error);
          return { success: false, message: axiosMessageErrorHandler(error) };
        } finally {
          set({ isLoading: false });
        }
      },
      updateProfile: async (
        dto: UpdateProfileDto,
        successCallback?: (message?: string) => void,
        errorCallback?: (message?: string) => void
      ) => {
        set({ isLoading: true });
        try {
          const formData = new FormData();
          if (dto.email) formData.append("Email", dto.email);
          if (dto.username) formData.append("Username", dto.username);
          if (dto.fullname) formData.append("Fullname", dto.fullname);
          if (typeof dto.communeId !== "undefined")
            formData.append("CommuneId", String(dto.communeId));
          if (typeof dto.schoolId !== "undefined")
            formData.append("SchoolId", String(dto.schoolId));
          if (dto.gender) formData.append("Gender", String(dto.gender));
          if (dto.oldPassword) formData.append("OldPassword", dto.oldPassword);
          if (dto.newPassword) formData.append("NewPassword", dto.newPassword);
          if ((dto as any).avatarFile)
            formData.append("AvatarFile", (dto as any).avatarFile as File);
          const res = await axiosInstance.put(`/AppUser/me`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const body = res.data;
          const success = body?.success ?? body?.Success ?? false;
          if (success) {
            set({
              appUser: body?.data ?? undefined,
              success: true,
              message: body?.message ?? "",
            });
            successCallback?.(body?.message ?? "Cập nhật hồ sơ thành công");
            return body;
          }
          set({
            success: false,
            message: body?.message ?? "Cập nhật thất bại",
          });
          errorCallback?.(body?.message ?? "Cập nhật thất bại");
          return body;
        } catch (error) {
          set({ success: false, message: axiosMessageErrorHandler(error) });
          errorCallback?.(axiosMessageErrorHandler(error));
          console.log(error);
          return { success: false, message: axiosMessageErrorHandler(error) };
        } finally {
          set({ isLoading: false });
        }
      },
      updateUserStatus: async (
        id: string,
        status: AppUser["status"],
        successCallback?: (message?: string) => void,
        errorCallback?: (message?: string) => void
      ) => {
        set({ isLoading: true });
        try {
          const response = await axiosInstance.patch(`/AppUser/${id}/status`, {
            status,
          });
          const { data } = response;

          if (data?.success) {
            // update local list if present; guard if appUsers is not an array
            set((state: any) => {
              const prevList: AppUser[] = Array.isArray(state.appUsers)
                ? state.appUsers
                : [];
              return {
                appUsers: prevList.map((u: AppUser) =>
                  u.id === id ? { ...u, status } : u
                ),
                success: true,
                message: data?.message ?? "",
              };
            });
            successCallback?.(
              data?.message ?? "Câp nhật trạng thái thành công"
            );
            return true;
          }

          set({
            success: false,
            message: data?.message ?? "Câp nhật trạng thái thất bại",
          });
          errorCallback?.(data?.message ?? "Câp nhật trạng thái thất bại");
          return false;
        } catch (error) {
          set({ success: false, message: axiosMessageErrorHandler(error) });
          errorCallback?.(axiosMessageErrorHandler(error));
          console.log(error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "app-user-store",
    }
  )
);
