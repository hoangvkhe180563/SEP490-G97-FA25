// src/auth/stores/useAuthStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AuthState } from "../interfaces/stores";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";

const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      googleRedirectURL: "",
      isAuthenticated: false,
      isLoading: false,
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
      login: async (
        username: string,
        email: string,
        password: string,
        handlerSuccess: () => void
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
            username,
            email,
            password,
          });
          const { data } = res;
          set({
            isAuthenticated: data.success,
            user: data.user,
            loginMessage: data.message,
          });
          if (data.success) {
            handlerSuccess();
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
          console.log(error);
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
        set({ isLoading: true, loginError: null, loginMessage: "" });
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
          set({ isLoading: false });
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
            user: data.user,
          });
          if (data.success) {
            handlerSuccess();
          }
        } catch (error: unknown) {
          set({
            handlerGoogleCallbackError: axiosMessageErrorHandler(error),
            isAuthenticated: false,
            user: null,
          });
          handlerError();
          console.log(error);
        } finally {
          set({ isLoading: false });
        }
      },
      refreshToken: async () => {
        set({ isLoading: true });
        try {
          await axiosInstance.post("/Auth/refresh-token");
        } catch (error) {
          console.log(error);
        } finally {
          set({ isLoading: false });
        }
      },
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
        try {
          axiosInstance.post("/Auth/logout");
        } catch (error) {
          console.log(error);
        }
      },
    }),
    { name: "auth-storage" }
  )
);

let refreshPromise: Promise<void> | null = null;

// Axios response interceptor to handle 401 errors and refresh token
axiosInstance.interceptors.response.use(
  //If no error, just return response
  (response) => response,

  // If error, check for 401 and try to refresh token
  async (error) => {
    // Original request that caused the error
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Retry the request only once
      originalRequest._retry = true;
      try {
        // If no refresh request is in progress, start one
        if (!refreshPromise) {
          refreshPromise = useAuthStore
            .getState()
            .refreshToken()
            .finally(() => {
              refreshPromise = null;
            });
        }

        // Wait for the refresh to complete
        await refreshPromise;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }
  }
);

export { useAuthStore };
