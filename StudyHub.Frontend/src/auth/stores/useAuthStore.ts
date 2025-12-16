// src/auth/stores/useAuthStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AuthState } from "../interfaces/stores";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import type { AppUser } from "../interfaces/app-user";

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      googleRedirectURL: "",
      isAuthenticated: false,
      isLoading: false,
      isCheckingAuth: true,
      error: null,
      message: "",
      loginMessage: "",
      registerMessage: "",
      verifyEmailMessage: "",
      forgotPasswordMessage: "",
      resetPasswordMessage: "",
      handlerGoogleCallbackMessage: "",
      loginError: null,
      registerError: null,
      verifyEmailError: null,
      forgotPasswordError: null,
      resetPasswordError: null,
      handlerGoogleCallbackError: "",
      // Account inactive modal state
      accountInactiveOpen: false,
      setAccountInactiveOpen: (open: boolean) =>
        set({ accountInactiveOpen: open }),
      // Activate-request modal state (open a form to request account re-activation)
      activateFormOpen: false,
      setActivateFormOpen: (open: boolean) => set({ activateFormOpen: open }),
      login: async (
        username: string,
        email: string,
        password: string,
        handlerSuccess: (data: AppUser) => void
      ) => {
        set({
          isLoading: true,
          loginError: null,
          loginMessage: "",
          isAuthenticated: false,
          user: null,
        });
        try {
          const res = await axiosInstance.post("/Auth/login", {
            email,
            username,
            password,
          });
          const { data } = res;
          set({
            isAuthenticated: data.success,
            user: data.data,
            loginMessage: data.message,
          });
          if (data.success) {
            handlerSuccess(data.data);
          }
        } catch (error: unknown) {
          set({
            isAuthenticated: false,
            user: null,
            loginError: axiosMessageErrorHandler(error),
          });
          console.log(error);
        } finally {
          set({ isLoading: false });
        }
      },
      register: async (
        username: string,
        email: string,
        password: string,
        fullName: string,
        phoneNumber: string,
        communeId: number,
        schoolId?: number
      ) => {
        set({
          isLoading: true,
          registerError: null,
          registerMessage: "",
          isAuthenticated: false,
        });
        try {
          const res = await axiosInstance.post("/Auth/signup", {
            username,
            email,
            password,
            fullName,
            phoneNumber,
            communeId,
            schoolId,
          });
          const { data } = res;
          set({
            isAuthenticated: data.success,
            registerMessage: data.message,
          });
        } catch (error: unknown) {
          set({
            isAuthenticated: false,
            registerError: axiosMessageErrorHandler(error),
          });
          console.log(error);
        } finally {
          set({ isLoading: false });
        }
      },
      sendEmailVerification: async (email: string) => {
        set({
          isLoading: true,
          error: null,
          message: "",
        });
        try {
          const res = await axiosInstance.post("/Auth/send-verification", {
            email,
          });
          const { data } = res;
          set({
            message: data.message,
          });
        } catch (error: unknown) {
          set({
            error: axiosMessageErrorHandler(error),
          });
          console.log(error);
        } finally {
          set({ isLoading: false });
        }
      },
      verifyEmail: async (token: string) => {
        set({
          isLoading: true,
          verifyEmailError: null,
          verifyEmailMessage: "",
        });
        try {
          const res = await axiosInstance.get(
            `/Auth/verify-email?token=${token}`
          );
          const { data } = res;
          set({
            verifyEmailMessage: data.message,
          });
        } catch (error: unknown) {
          set({
            verifyEmailError: axiosMessageErrorHandler(error),
          });
        } finally {
          set({ isLoading: false });
        }
      },
      forgetPassword: async (email: string) => {
        set({
          isLoading: true,
          forgotPasswordError: null,
          forgotPasswordMessage: "",
        });
        try {
          const res = await axiosInstance.post("/Auth/forgot-password", {
            email,
          });
          const { data } = res;
          set({
            forgotPasswordMessage: data.message,
          });
        } catch (error: unknown) {
          set({
            forgotPasswordError: axiosMessageErrorHandler(error),
          });
          console.log(error);
        } finally {
          set({ isLoading: false });
        }
      },
      resetPassword: async (token: string, newPassword: string) => {
        set({
          isLoading: true,
          resetPasswordError: null,
          resetPasswordMessage: "",
        });
        try {
          const res = await axiosInstance.post("/Auth/reset-password", {
            resetToken: token,
            newPassword,
          });
          const { data } = res;
          set({
            resetPasswordMessage: data.message,
          });
        } catch (error: unknown) {
          set({
            resetPasswordError: axiosMessageErrorHandler(error),
          });
          console.log(error);
        } finally {
          set({ isLoading: false });
        }
      },
      checkAuth: async () => {
        set({ isCheckingAuth: true });
        try {
          const res = await axiosInstance.get("/Auth/check-auth");
          const { data } = res;
          if (data.success) {
            set({ isAuthenticated: true, user: data.data });
          } else {
            set({ isAuthenticated: false, user: null });
          }
        } catch {
          set({ isAuthenticated: false, user: null });
        } finally {
          set({ isCheckingAuth: false });
        }
      },
      getGoogleRedirectURL: async () => {
        set({
          isLoading: true,
          handlerGoogleCallbackError: "",
          handlerGoogleCallbackMessage: "",
        });
        try {
          const res = await axiosInstance.get("/Auth/google/redirect");
          const { data } = res;
          set({
            handlerGoogleCallbackMessage: data.message,
            googleRedirectURL: data.url,
          });
        } catch (error: unknown) {
          set({
            handlerGoogleCallbackError: axiosMessageErrorHandler(error),
            googleRedirectURL: "",
          });
          console.log(error);
        } finally {
          set({ isLoading: false });
        }
      },
      handleGoogleCallback: async (
        code: string,
        state: string,
        error: string,
        handlerSuccess: () => void,
        handlerError: () => void
      ) => {
        set({
          isLoading: true,
          handlerGoogleCallbackError: "",
          handlerGoogleCallbackMessage: "",
          isAuthenticated: false,
          user: null,
        });
        try {
          const res = await axiosInstance.get(
            `/Auth/google/callback?code=${code}&state=${state}&error=${error}`
          );
          const { data } = res;
          set({
            handlerGoogleCallbackMessage: data.message,
            isAuthenticated: data.success,
            user: data.data,
          });
          if (data.success) {
            handlerSuccess();
          }
        } catch (error: unknown) {
          // If the Google callback failed because the account is inactive,
          // surface that as `loginError` so the LoginPage can show the inline
          // activation prompt. Otherwise, keep the handlerGoogleCallbackError.
          const resp = (error as any)?.response;
          const msg = axiosMessageErrorHandler(error);
          if (
            resp &&
            resp.status === 403 &&
            resp.data &&
            resp.data.error === "AccountInactive"
          ) {
            set({
              loginError: resp.data.message || msg,
              handlerGoogleCallbackError: msg,
              isAuthenticated: false,
              user: null,
            });
          } else {
            set({
              handlerGoogleCallbackError: msg,
              isAuthenticated: false,
              user: null,
            });
          }
          handlerError();
          console.log(error);
        } finally {
          set({ isLoading: false });
        }
      },
      // Try to refresh the auth token. If it fails, propagate the error so callers
      // (e.g. the interceptor) can decide what to do (logout, reject, etc.).
      refreshToken: async (): Promise<void> => {
        try {
          await axiosInstance.post("/Auth/refresh-token");
        } catch (error) {
          console.log("refreshToken error:", error);
          // Rethrow so the interceptor's `await refreshPromise` will reject and
          // the failure path (logout) executes exactly once.
          throw error;
        }
      },

      // Logout the user. If `remote` is false, only clear local state and do not
      // call the server. When we call the server, pass a flag to the request
      // config so the response interceptor can skip trying to refresh/ retry
      // on the logout request and avoid recursive behavior.
      logout: async () => {
        // Clear local state synchronously so UI reacts immediately.
        set({
          user: null,
          isAuthenticated: false,
        });

        try {
          // Add a custom flag to the request config so the interceptor can
          // detect and skip refresh attempts for this request.
          await axiosInstance.post("/Auth/logout");
        } catch (error) {
          console.log("logout error:", error);
        }
      },
    }),
    { name: "auth-storage" }
  )
);

let refreshTokenPromise: Promise<any> | null = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any;

    // If server indicates account inactive, open modal (unless on login page)
    try {
      const resp = error.response;
      if (resp && resp.status === 403) {
        const data = resp.data as any;
        if (data && data.error === "AccountInactive") {
          const path = (window.location?.pathname ?? "").toLowerCase();
          const isLogin =
            path.startsWith("/auth/login") ||
            path.startsWith("/auth/register") ||
            path.startsWith("/auth");
          if (!isLogin) {
            // show modal to inform user and allow logout
            useAuthStore.getState().setAccountInactiveOpen(true);
          }
          return Promise.reject(error);
        }
      }
    } catch (e) {
      // ignore
    }

    // Early returns
    if (!error.response) return Promise.reject(error);
    // if (error.response.status !== 401) return Promise.reject(error);
    if (originalRequest._retry) return Promise.reject(error);

    const urlLower = originalRequest?.url?.toString().toLowerCase() ?? "";

    // Skip các path không cần refresh
    const skipPaths = [
      `/auth/login`,
      "/auth/logout",
      "/auth/signup",
      "/auth/forgot-password",
      "/auth/verify-email",
      "/auth/reset-password",
      "/auth/send-verification",
      "/auth/google",
      "/auth/google/callback",
      "/auth/refresh-token",
    ];

    if (skipPaths.some((p) => urlLower.includes(p))) {
      if (urlLower.includes("/auth/refresh-token")) {
        useAuthStore.getState().logout(false);
      }
      return Promise.reject(error);
    }

    console.log("Attempting token refresh due to 401 response...");

    // Đánh dấu đã retry
    originalRequest._retry = true;

    try {
      // Nếu chưa có promise refresh, tạo mới
      // Nếu đã có, tất cả requests sẽ chờ cùng 1 promise này
      if (!refreshTokenPromise) {
        refreshTokenPromise = useAuthStore
          .getState()
          .refreshToken()
          .finally(() => {
            // Sau khi xong (thành công hay thất bại), reset promise
            refreshTokenPromise = null;
          });
      }

      // Chờ refresh token xong (nhiều requests 401 sẽ chờ chung)
      await refreshTokenPromise;

      // Refresh thành công -> retry request với token mới
      console.log("Retrying original request after token refresh");
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      // Refresh thất bại -> logout
      useAuthStore.getState().logout(false);
      return Promise.reject(refreshError);
    }
  }
);
