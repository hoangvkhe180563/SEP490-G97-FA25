// src/documentManagement/stores/useDocumentStore.ts
import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import type { DocumentDetailDto } from "@/documentManagement/interfaces/documentApi";
import type { Document, PagedDocumentResponse, ApiResponse } from "@/documentManagement/interfaces/document";

interface DocumentState {
  document: DocumentDetailDto | null;
  documents: Document[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  success: boolean;
  message: string;
  error: string | null;
  
  getDocumentById: (id: number) => Promise<DocumentDetailDto | null>;
  downloadDocument: (id: number) => Promise<Blob | null>;
  previewDocument: (id: number) => Promise<Blob | null>;
  
  fetchManagerPublicDocuments: (
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    isApproved?: boolean,
    status?: boolean,
    pageNumber?: number,
    pageSize?: number
  ) => Promise<void>;
  
  fetchManagerSchoolDocuments: (
    schoolId: number,
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    isApproved?: boolean,
    status?: boolean,
    pageNumber?: number,
    pageSize?: number
  ) => Promise<void>;
  
  approveDocument: (documentId: number, approvedBy: string) => Promise<boolean>;
  rejectDocument: (documentId: number, approvedBy: string) => Promise<boolean>;
  revokeApproval: (documentId: number, approvedBy: string) => Promise<boolean>;
  softDeleteDocument: (documentId: number, deletedBy: string) => Promise<boolean>;
  createDocument: (formData: FormData) => Promise<DocumentDetailDto | null>;
  setCurrentPage: (page: number) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  document: null,
  documents: [],
  totalCount: 0,
  totalPages: 0,
  currentPage: 1,
  isLoading: false,
  success: false,
  message: "",
  error: null,
  
  getDocumentById: async (id: number) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.get(`/Document/${id}`);
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

  fetchManagerPublicDocuments: async (
    query,
    categoryId,
    gradeId,
    subject,
    classId,
    isApproved,
    status,
    pageNumber = 1,
    pageSize = 10
  ) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (categoryId) params.append('categoryId', categoryId.toString());
      if (gradeId) params.append('grade', gradeId.toString());
      if (subject) params.append('subject', subject);
      if (classId) params.append('classId', classId.toString());
      if (isApproved !== undefined) params.append('isApproved', isApproved.toString());
      if (status !== undefined) params.append('status', status.toString());
      params.append('pageNumber', pageNumber.toString());
      params.append('pageSize', pageSize.toString());

      const response = await axiosInstance.get<ApiResponse<PagedDocumentResponse>>(
        `/Document/manager/public?${params.toString()}`
      );
      
      set({
        documents: response.data.data.items,
        totalCount: response.data.data.total,
        totalPages: response.data.data.totalPages,
        currentPage: response.data.data.page,
        isLoading: false,
        success: true
      });
    } catch (error) {
      set({ 
        error: "Không thể tải danh sách tài liệu", 
        isLoading: false,
        success: false
      });
      console.error(error);
    }
  },

  fetchManagerSchoolDocuments: async (
    schoolId,
    query,
    categoryId,
    gradeId,
    subject,
    classId,
    isApproved,
    status,
    pageNumber = 1,
    pageSize = 10
  ) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (categoryId) params.append('categoryId', categoryId.toString());
      if (gradeId) params.append('grade', gradeId.toString());
      if (subject) params.append('subject', subject);
      if (classId) params.append('classId', classId.toString());
      if (isApproved !== undefined) {
        if (isApproved === true) {
          params.append('isApproved', 'true');
        } else if (isApproved === false) {
          params.append('isApproved', 'false');
        }
      }
      if (status !== undefined) params.append('status', status.toString());
      params.append('pageNumber', pageNumber.toString());
      params.append('pageSize', pageSize.toString());

      const response = await axiosInstance.get<ApiResponse<PagedDocumentResponse>>(
        `/Document/manager/school/${schoolId}?${params.toString()}`
      );
      
      set({
        documents: response.data.data.items,
        totalCount: response.data.data.total,
        totalPages: response.data.data.totalPages,
        currentPage: response.data.data.page,
        isLoading: false,
        success: true
      });
    } catch (error) {
      set({ 
        error: "Không thể tải danh sách tài liệu", 
        isLoading: false,
        success: false
      });
      console.error(error);
    }
  },

  approveDocument: async (documentId: number, approvedBy: string) => {
    try {
      await axiosInstance.post('/Document/approve', {
        documentId,
        approvedBy
      });
      set({ success: true, message: "Phê duyệt tài liệu thành công" });
      return true;
    } catch (error) {
      set({ success: false, message: "Không thể phê duyệt tài liệu" });
      console.error(error);
      return false;
    }
  },

  rejectDocument: async (documentId: number, approvedBy: string) => {
    try {
      await axiosInstance.post('/Document/reject', {
        documentId,
        approvedBy
      });
      set({ success: true, message: "Từ chối tài liệu thành công" });
      return true;
    } catch (error) {
      set({ success: false, message: "Không thể từ chối tài liệu" });
      console.error(error);
      return false;
    }
  },

  revokeApproval: async (documentId: number, approvedBy: string) => {
    try {
      await axiosInstance.post('/Document/revoke', {
        documentId,
        approvedBy
      });
      set({ success: true, message: "Thu hồi phê duyệt thành công" });
      return true;
    } catch (error) {
      set({ success: false, message: "Không thể thu hồi phê duyệt" });
      console.error(error);
      return false;
    }
  },

  softDeleteDocument: async (documentId: number, deletedBy: string) => {
    try {
      await axiosInstance.patch(`/Document/soft-delete/${documentId}`, 
        JSON.stringify(deletedBy),
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      set({ success: true, message: "Ẩn tài liệu thành công" });
      return true;
    } catch (error) {
      set({ success: false, message: "Không thể ẩn tài liệu" });
      console.error(error);
      return false;
    }
  },

  createDocument: async (formData: FormData) => {
    set({ isLoading: true });
    try {
      const response = await axiosInstance.post<ApiResponse<DocumentDetailDto>>(
        '/Document/create',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      set({
        success: true,
        message: "Tạo tài liệu thành công",
        isLoading: false
      });
      return response.data.data;
    } catch (error) {
      set({
        success: false,
        message: "Không thể tạo tài liệu",
        isLoading: false
      });
      console.error(error);
      return null;
    }
  },

  setCurrentPage: (page: number) => set({ currentPage: page })
}));