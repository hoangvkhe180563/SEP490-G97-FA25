// src/documentManagement/stores/useDocumentStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import type {
  DocumentDetailDto,
  Document,
  PagedDocumentResponse,
  ApiResponse,
  DocumentCategoryDto,
  SubjectDto,
} from "@/documentManagement/interfaces/document";
import type { ClassListDto } from "@/classManagement/interfaces/class";

interface DocumentState {
  document: DocumentDetailDto | null;
  documents: Document[];
  categories: DocumentCategoryDto[];
  subjects: SubjectDto[];
  userClasses: ClassListDto[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  success: boolean;
  message: string;
  error: string | null;
  getDocumentByIdMessage: string;
  getDocumentByIdError: string | null;
  downloadDocumentMessage: string;
  downloadDocumentError: string | null;
  previewDocumentMessage: string;
  previewDocumentError: string | null;
  fetchPublicDocumentsMessage: string;
  fetchPublicDocumentsError: string | null;
  fetchSchoolDocumentsMessage: string;
  fetchSchoolDocumentsError: string | null;
  fetchOwnedDocumentsMessage: string;
  fetchOwnedDocumentsError: string | null;
  fetchManagerPublicDocumentsMessage: string;
  fetchManagerPublicDocumentsError: string | null;
  fetchManagerSchoolDocumentsMessage: string;
  fetchManagerSchoolDocumentsError: string | null;
  approveDocumentMessage: string;
  approveDocumentError: string | null;
  rejectDocumentMessage: string;
  rejectDocumentError: string | null;
  revokeApprovalMessage: string;
  revokeApprovalError: string | null;
  softDeleteDocumentMessage: string;
  softDeleteDocumentError: string | null;
  createDocumentMessage: string;
  createDocumentError: string | null;
  getCategoriesMessage: string;
  getCategoriesError: string | null;
  getSubjectsMessage: string;
  getSubjectsError: string | null;
  getUserClassesMessage: string;
  getUserClassesError: string | null;

  getDocumentById: (
    id: number,
    handlerSuccess?: () => void
  ) => Promise<DocumentDetailDto | null>;
  downloadDocument: (
    id: number,
    handlerSuccess?: () => void
  ) => Promise<Blob | null>;
  previewDocument: (
    id: number,
    handlerSuccess?: () => void
  ) => Promise<Blob | null>;
  fetchPublicDocuments: (
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    pageNumber?: number,
    pageSize?: number,
    handlerSuccess?: () => void
  ) => Promise<void>;
  fetchSchoolDocuments: (
    schoolId: string,
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    pageNumber?: number,
    pageSize?: number,
    handlerSuccess?: () => void
  ) => Promise<void>;
  fetchOwnedDocuments: (
    creatorId: string,
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    pageNumber?: number,
    pageSize?: number,
    handlerSuccess?: () => void
  ) => Promise<void>;
  fetchManagerPublicDocuments: (
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    isApproved?: boolean,
    status?: boolean,
    pageNumber?: number,
    pageSize?: number,
    handlerSuccess?: () => void
  ) => Promise<void>;
  fetchManagerSchoolDocuments: (
    schoolId: string,
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    isApproved?: boolean,
    status?: boolean,
    pageNumber?: number,
    pageSize?: number,
    handlerSuccess?: () => void
  ) => Promise<void>;
  approveDocument: (
    documentId: number,
    handlerSuccess?: () => void
  ) => Promise<boolean>;
  rejectDocument: (
    documentId: number,
    handlerSuccess?: () => void
  ) => Promise<boolean>;
  revokeApproval: (
    documentId: number,
    handlerSuccess?: () => void
  ) => Promise<boolean>;
  softDeleteDocument: (
    documentId: number,
    handlerSuccess?: () => void
  ) => Promise<boolean>;
  createDocument: (
    formData: FormData,
    handlerSuccess?: () => void
  ) => Promise<DocumentDetailDto | null>;
  getCategories: (handlerSuccess?: () => void) => Promise<void>;
  getSubjects: (handlerSuccess?: () => void) => Promise<void>;
  getUserClasses: (
    userId: string,
    handlerSuccess?: () => void
  ) => Promise<void>;
  setCurrentPage: (page: number) => void;
}

export const useDocumentStore = create<DocumentState>()(
  devtools(
    (set) => ({
      document: null,
      documents: [],
      categories: [],
      subjects: [],
      userClasses: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      isLoading: false,
      success: false,
      message: "",
      error: null,
      getDocumentByIdMessage: "",
      getDocumentByIdError: null,
      downloadDocumentMessage: "",
      downloadDocumentError: null,
      previewDocumentMessage: "",
      previewDocumentError: null,
      fetchPublicDocumentsMessage: "",
      fetchPublicDocumentsError: null,
      fetchSchoolDocumentsMessage: "",
      fetchSchoolDocumentsError: null,
      fetchOwnedDocumentsMessage: "",
      fetchOwnedDocumentsError: null,
      fetchManagerPublicDocumentsMessage: "",
      fetchManagerPublicDocumentsError: null,
      fetchManagerSchoolDocumentsMessage: "",
      fetchManagerSchoolDocumentsError: null,
      approveDocumentMessage: "",
      approveDocumentError: null,
      rejectDocumentMessage: "",
      rejectDocumentError: null,
      revokeApprovalMessage: "",
      revokeApprovalError: null,
      softDeleteDocumentMessage: "",
      softDeleteDocumentError: null,
      createDocumentMessage: "",
      createDocumentError: null,
      getCategoriesMessage: "",
      getCategoriesError: null,
      getSubjectsMessage: "",
      getSubjectsError: null,
      getUserClassesMessage: "",
      getUserClassesError: null,

      getDocumentById: async (id, handlerSuccess) => {
        set({
          isLoading: true,
          getDocumentByIdError: null,
          getDocumentByIdMessage: "",
          document: null,
        });
        try {
          const response = await axiosInstance.get(`/Document/${id}`);
          const { data } = response;
          set({
            document: data.data,
            success: data.success,
            getDocumentByIdMessage:
              data.message || "Document fetched successfully",
          });
          if (data.success && handlerSuccess) {
            handlerSuccess();
          }
          return data.data;
        } catch (error: unknown) {
          set({
            success: false,
            document: null,
            getDocumentByIdError: axiosMessageErrorHandler(error),
          });
          console.error(error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      downloadDocument: async (id, handlerSuccess) => {
        set({
          isLoading: true,
          downloadDocumentError: null,
          downloadDocumentMessage: "",
        });
        try {
          const response = await axiosInstance.get(`/Document/download/${id}`, {
            responseType: "blob",
          });
          set({
            success: true,
            downloadDocumentMessage: "Document downloaded successfully",
          });
          if (handlerSuccess) {
            handlerSuccess();
          }
          return response.data;
        } catch (error: unknown) {
          set({
            success: false,
            downloadDocumentError: axiosMessageErrorHandler(error),
          });
          console.error(error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      previewDocument: async (id, handlerSuccess) => {
        set({
          isLoading: true,
          previewDocumentError: null,
          previewDocumentMessage: "",
        });
        try {
          const response = await axiosInstance.get(`/Document/preview/${id}`, {
            responseType: "blob",
          });
          set({
            success: true,
            previewDocumentMessage: "Document preview loaded",
          });
          if (handlerSuccess) {
            handlerSuccess();
          }
          return response.data;
        } catch (error: unknown) {
          set({
            success: false,
            previewDocumentError: axiosMessageErrorHandler(error),
          });
          console.error(error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      fetchPublicDocuments: async (
        query,
        categoryId,
        gradeId,
        subject,
        classId,
        pageNumber = 1,
        pageSize = 9,
        handlerSuccess
      ) => {
        set({
          isLoading: true,
          fetchPublicDocumentsError: null,
          fetchPublicDocumentsMessage: "",
        });
        try {
          const params = new URLSearchParams();
          if (query) params.append("query", query);
          if (categoryId) params.append("categoryId", categoryId.toString());
          if (gradeId) params.append("grade", gradeId.toString());
          if (subject) params.append("subject", subject);
          if (classId) params.append("classId", classId.toString());
          params.append("pageNumber", pageNumber.toString());
          params.append("pageSize", pageSize.toString());

          const response = await axiosInstance.get<
            ApiResponse<PagedDocumentResponse>
          >(`/Document/public?${params.toString()}`);

          set({
            documents: response.data.data.items,
            totalCount: response.data.data.total,
            totalPages: response.data.data.totalPages,
            currentPage: response.data.data.page,
            success: true,
            fetchPublicDocumentsMessage: "Documents fetched successfully",
          });
          if (handlerSuccess) {
            handlerSuccess();
          }
        } catch (error: unknown) {
          set({
            fetchPublicDocumentsError: axiosMessageErrorHandler(error),
            success: false,
          });
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchSchoolDocuments: async (
        schoolId,
        query,
        categoryId,
        gradeId,
        subject,
        classId,
        pageNumber = 1,
        pageSize = 9,
        handlerSuccess
      ) => {
        set({
          isLoading: true,
          fetchSchoolDocumentsError: null,
          fetchSchoolDocumentsMessage: "",
        });
        try {
          const params = new URLSearchParams();
          if (query) params.append("query", query);
          if (categoryId) params.append("categoryId", categoryId.toString());
          if (gradeId) params.append("grade", gradeId.toString());
          if (subject) params.append("subject", subject);
          if (classId) params.append("classId", classId.toString());
          params.append("pageNumber", pageNumber.toString());
          params.append("pageSize", pageSize.toString());

          const response = await axiosInstance.get<
            ApiResponse<PagedDocumentResponse>
          >(`/Document/school/${schoolId}?${params.toString()}`);

          set({
            documents: response.data.data.items,
            totalCount: response.data.data.total,
            totalPages: response.data.data.totalPages,
            currentPage: response.data.data.page,
            success: true,
            fetchSchoolDocumentsMessage: "Documents fetched successfully",
          });
          if (handlerSuccess) {
            handlerSuccess();
          }
        } catch (error: unknown) {
          set({
            fetchSchoolDocumentsError: axiosMessageErrorHandler(error),
            success: false,
          });
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchOwnedDocuments: async (
        creatorId,
        query,
        categoryId,
        gradeId,
        subject,
        classId,
        pageNumber = 1,
        pageSize = 9,
        handlerSuccess
      ) => {
        set({
          isLoading: true,
          fetchOwnedDocumentsError: null,
          fetchOwnedDocumentsMessage: "",
        });
        try {
          const params = new URLSearchParams();
          if (query) params.append("query", query);
          if (categoryId) params.append("categoryId", categoryId.toString());
          if (gradeId) params.append("grade", gradeId.toString());
          if (subject) params.append("subject", subject);
          if (classId) params.append("classId", classId.toString());
          params.append("pageNumber", pageNumber.toString());
          params.append("pageSize", pageSize.toString());

          const response = await axiosInstance.get<
            ApiResponse<PagedDocumentResponse>
          >(`/Document/owned/${creatorId}?${params.toString()}`);

          set({
            documents: response.data.data.items,
            totalCount: response.data.data.total,
            totalPages: response.data.data.totalPages,
            currentPage: response.data.data.page,
            success: true,
            fetchOwnedDocumentsMessage: "Documents fetched successfully",
          });
          if (handlerSuccess) {
            handlerSuccess();
          }
        } catch (error: unknown) {
          set({
            fetchOwnedDocumentsError: axiosMessageErrorHandler(error),
            success: false,
          });
          console.error(error);
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
        pageSize = 10,
        handlerSuccess
      ) => {
        set({
          isLoading: true,
          fetchManagerPublicDocumentsError: null,
          fetchManagerPublicDocumentsMessage: "",
        });
        try {
          const params = new URLSearchParams();
          if (query) params.append("query", query);
          if (categoryId) params.append("categoryId", categoryId.toString());
          if (gradeId) params.append("grade", gradeId.toString());
          if (subject) params.append("subject", subject);
          if (classId) params.append("classId", classId.toString());
          if (isApproved !== undefined)
            params.append("isApproved", isApproved.toString());
          if (status !== undefined) params.append("status", status.toString());
          params.append("pageNumber", pageNumber.toString());
          params.append("pageSize", pageSize.toString());

          const response = await axiosInstance.get<
            ApiResponse<PagedDocumentResponse>
          >(`/Document/manager/public?${params.toString()}`);

          set({
            documents: response.data.data.items,
            totalCount: response.data.data.total,
            totalPages: response.data.data.totalPages,
            currentPage: response.data.data.page,
            success: true,
            fetchManagerPublicDocumentsMessage:
              "Documents fetched successfully",
          });
          if (handlerSuccess) {
            handlerSuccess();
          }
        } catch (error: unknown) {
          set({
            fetchManagerPublicDocumentsError: axiosMessageErrorHandler(error),
            success: false,
          });
          console.error(error);
        } finally {
          set({ isLoading: false });
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
        pageSize = 10,
        handlerSuccess
      ) => {
        set({
          isLoading: true,
          fetchManagerSchoolDocumentsError: null,
          fetchManagerSchoolDocumentsMessage: "",
        });
        try {
          const params = new URLSearchParams();
          if (query) params.append("query", query);
          if (categoryId) params.append("categoryId", categoryId.toString());
          if (gradeId) params.append("grade", gradeId.toString());
          if (subject) params.append("subject", subject);
          if (classId) params.append("classId", classId.toString());
          if (isApproved !== undefined) {
            if (isApproved === true) {
              params.append("isApproved", "true");
            } else if (isApproved === false) {
              params.append("isApproved", "false");
            }
          }
          if (status !== undefined) params.append("status", status.toString());
          params.append("pageNumber", pageNumber.toString());
          params.append("pageSize", pageSize.toString());

          const response = await axiosInstance.get<
            ApiResponse<PagedDocumentResponse>
          >(`/Document/manager/school/${schoolId}?${params.toString()}`);

          set({
            documents: response.data.data.items,
            totalCount: response.data.data.total,
            totalPages: response.data.data.totalPages,
            currentPage: response.data.data.page,
            success: true,
            fetchManagerSchoolDocumentsMessage:
              "Documents fetched successfully",
          });
          if (handlerSuccess) {
            handlerSuccess();
          }
        } catch (error: unknown) {
          set({
            fetchManagerSchoolDocumentsError: axiosMessageErrorHandler(error),
            success: false,
          });
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },

      approveDocument: async (documentId, handlerSuccess) => {
        set({
          isLoading: true,
          approveDocumentError: null,
          approveDocumentMessage: "",
        });
        try {
          const response = await axiosInstance.post("/Document/approve", {
            documentId,
          });
          const { data } = response;
          set({
            success: data.success,
            approveDocumentMessage:
              data.message || "Phê duyệt tài liệu thành công",
          });
          if (data.success && handlerSuccess) {
            handlerSuccess();
          }
          return data.success;
        } catch (error: unknown) {
          set({
            success: false,
            approveDocumentError: axiosMessageErrorHandler(error),
          });
          console.error(error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      rejectDocument: async (documentId, handlerSuccess) => {
        set({
          isLoading: true,
          rejectDocumentError: null,
          rejectDocumentMessage: "",
        });
        try {
          const response = await axiosInstance.post("/Document/reject", {
            documentId,
          });
          const { data } = response;
          set({
            success: data.success,
            rejectDocumentMessage:
              data.message || "Từ chối tài liệu thành công",
          });
          if (data.success && handlerSuccess) {
            handlerSuccess();
          }
          return data.success;
        } catch (error: unknown) {
          set({
            success: false,
            rejectDocumentError: axiosMessageErrorHandler(error),
          });
          console.error(error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      revokeApproval: async (documentId, handlerSuccess) => {
        set({
          isLoading: true,
          revokeApprovalError: null,
          revokeApprovalMessage: "",
        });
        try {
          const response = await axiosInstance.post("/Document/revoke", {
            documentId,
          });
          const { data } = response;
          set({
            success: data.success,
            revokeApprovalMessage:
              data.message || "Thu hồi phê duyệt thành công",
          });
          if (data.success && handlerSuccess) {
            handlerSuccess();
          }
          return data.success;
        } catch (error: unknown) {
          set({
            success: false,
            revokeApprovalError: axiosMessageErrorHandler(error),
          });
          console.error(error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      softDeleteDocument: async (documentId, handlerSuccess) => {
        set({
          isLoading: true,
          softDeleteDocumentError: null,
          softDeleteDocumentMessage: "",
        });
        try {
          const response = await axiosInstance.patch(
            `/Document/soft-delete/${documentId}`
          );
          const { data } = response;
          set({
            success: data.success,
            softDeleteDocumentMessage: data.message || "Ẩn tài liệu thành công",
          });
          if (data.success && handlerSuccess) {
            handlerSuccess();
          }
          return data.success;
        } catch (error: unknown) {
          set({
            success: false,
            softDeleteDocumentError: axiosMessageErrorHandler(error),
          });
          console.error(error);
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      createDocument: async (formData, handlerSuccess) => {
        set({
          isLoading: true,
          createDocumentError: null,
          createDocumentMessage: "",
        });
        try {
          const response = await axiosInstance.post<
            ApiResponse<DocumentDetailDto>
          >("/Document/create", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          const { data } = response;
          set({
            success: data.success,
            createDocumentMessage: data.message || "Tạo tài liệu thành công",
          });
          if (data.success && handlerSuccess) {
            handlerSuccess();
          }
          return data.data;
        } catch (error: unknown) {
          set({
            success: false,
            createDocumentError: axiosMessageErrorHandler(error),
          });
          console.error(error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      getCategories: async (handlerSuccess) => {
        set({
          isLoading: true,
          getCategoriesError: null,
          getCategoriesMessage: "",
        });
        try {
          const response = await axiosInstance.get("/DocumentCategory");
          const categories = Array.isArray(response.data)
            ? response.data
            : response.data.data;
          set({
            categories,
            success: true,
            getCategoriesMessage: "Categories fetched successfully",
          });
          if (handlerSuccess) {
            handlerSuccess();
          }
        } catch (error: unknown) {
          set({
            success: false,
            getCategoriesError: axiosMessageErrorHandler(error),
          });
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },

      getSubjects: async (handlerSuccess) => {
        set({
          isLoading: true,
          getSubjectsError: null,
          getSubjectsMessage: "",
        });
        try {
          const response = await axiosInstance.get("/Subject/allsubject");
          const subjects = Array.isArray(response.data)
            ? response.data
            : response.data.data;
          set({
            subjects,
            success: true,
            getSubjectsMessage: "Subjects fetched successfully",
          });
          if (handlerSuccess) {
            handlerSuccess();
          }
        } catch (error: unknown) {
          set({
            success: false,
            getSubjectsError: axiosMessageErrorHandler(error),
          });
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },

      getUserClasses: async (userId, handlerSuccess) => {
        set({
          isLoading: true,
          getUserClassesError: null,
          getUserClassesMessage: "",
        });
        try {
          const response = await axiosInstance.get(
            `/Document/my-class/${userId}`
          );
          set({
            userClasses: response.data,
            success: true,
            getUserClassesMessage: "User classes fetched successfully",
          });
          if (handlerSuccess) {
            handlerSuccess();
          }
        } catch (error: unknown) {
          set({
            success: false,
            getUserClassesError: axiosMessageErrorHandler(error),
          });
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },

      setCurrentPage: (page: number) => set({ currentPage: page }),
    }),
    { name: "document-storage" }
  )
);
