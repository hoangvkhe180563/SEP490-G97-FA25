//src/documentManagement/stores/useDocumentStore.ts
import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import type { DocumentDetailDto } from "@/documentManagement/interfaces/documentApi";

interface DocumentState {
  document: DocumentDetailDto | null;
  isLoading: boolean;
  success: boolean;
  message: string;
  getDocumentById: (id: number) => Promise<DocumentDetailDto | null>;
  downloadDocument: (id: number) => Promise<Blob | null>;
  previewDocument: (id: number) => Promise<Blob | null>;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  document: null,
  isLoading: false,
  success: false,
  message: "",

  getDocumentById: async (id: number) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get(`/Document/getbyid/${id}`);
      const { data } = response;
      set({
        document: data.data,
        success: data.success,
        message: data.message || "Document fetched successfully",
      });
      return data.data;
    } catch (error) {
      set({
        success: false,
        message: "Failed to fetch document",
      });
      console.error(error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  downloadDocument: async (id: number) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get(`/Document/download/${id}`, {
        responseType: 'blob',
      });
      set({ success: true, message: "Document downloaded successfully" });
      return response.data;
    } catch (error) {
      set({
        success: false,
        message: "Failed to download document",
      });
      console.error(error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  previewDocument: async (id: number) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get(`/Document/preview/${id}`, {
        responseType: 'blob',
      });
      set({ success: true, message: "Document preview loaded" });
      return response.data;
    } catch (error) {
      set({
        success: false,
        message: "Failed to load document preview",
      });
      console.error(error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
}));