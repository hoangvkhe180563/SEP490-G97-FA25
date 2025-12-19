// src/documentManagement/services/documentService.ts
import { axiosInstance } from "@/lib/axios";
import type {
  ApiResponse,
  PagedDocumentResponse,
} from "@/documentManagement/interfaces/document";
import type {
  DocumentCategoryDto,
  SubjectDto,
  DocumentDetailDto,
} from "@/documentManagement/interfaces/documentApi";
import type { ClassListDto } from "@/classManagement/interfaces/class";

export const documentService = {
  getPublicDocuments: async (
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    pageNumber: number = 1,
    pageSize: number = 9
  ): Promise<ApiResponse<PagedDocumentResponse>> => {
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
    >(`/Document/public?${params.toString()}`, { withCredentials: true });
    return response.data;
  },

  getSchoolDocuments: async (
    schoolId: string,
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    pageNumber: number = 1,
    pageSize: number = 9
  ): Promise<ApiResponse<PagedDocumentResponse>> => {
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
    >(`/Document/school/${schoolId}?${params.toString()}`, {
      withCredentials: true,
    });
    return response.data;
  },

  getOwnedDocuments: async (
    creatorId: string,
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    pageNumber: number = 1,
    pageSize: number = 9
  ): Promise<ApiResponse<PagedDocumentResponse>> => {
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
    >(`/Document/owned/${creatorId}?${params.toString()}`, {
      withCredentials: true,
    });
    return response.data;
  },

  submitForApproval: async (
    documentId: number
  ): Promise<ApiResponse<DocumentDetailDto>> => {
    const response = await axiosInstance.post<ApiResponse<DocumentDetailDto>>(
      `/Document/submit-for-approval`,
      { documentId },
      { withCredentials: true }
    );
    return response.data;
  },

  getManagerPublicDocuments: async (
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    isApproved?: boolean,
    status?: boolean,
    pageNumber: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<PagedDocumentResponse>> => {
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
    >(`/Document/manager/public?${params.toString()}`, {
      withCredentials: true,
    });
    return response.data;
  },

  getManagerSchoolDocuments: async (
    schoolId: number,
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    isApproved?: boolean,
    status?: boolean,
    pageNumber: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<PagedDocumentResponse>> => {
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
    >(`/Document/manager/school/${schoolId}?${params.toString()}`, {
      withCredentials: true,
    });
    return response.data;
  },

  approveDocument: async (
    documentId: number
  ): Promise<ApiResponse<DocumentDetailDto>> => {
    const response = await axiosInstance.post<ApiResponse<DocumentDetailDto>>(
      `/Document/approve`,
      { documentId },
      { withCredentials: true }
    );
    return response.data;
  },

  rejectDocument: async (
    documentId: number
  ): Promise<ApiResponse<DocumentDetailDto>> => {
    const response = await axiosInstance.post<ApiResponse<DocumentDetailDto>>(
      `/Document/reject`,
      { documentId },
      { withCredentials: true }
    );
    return response.data;
  },

  revokeApproval: async (
    documentId: number
  ): Promise<ApiResponse<DocumentDetailDto>> => {
    const response = await axiosInstance.post<ApiResponse<DocumentDetailDto>>(
      `/Document/revoke`,
      { documentId },
      { withCredentials: true }
    );
    return response.data;
  },

  softDeleteDocument: async (
    documentId: number
  ): Promise<ApiResponse<DocumentDetailDto>> => {
    const response = await axiosInstance.patch<ApiResponse<DocumentDetailDto>>(
      `/Document/soft-delete/${documentId}`,
      null,
      { withCredentials: true }
    );
    return response.data;
  },

  getDocumentCategories: async (): Promise<DocumentCategoryDto[]> => {
    const response = await axiosInstance.get<
      DocumentCategoryDto[] | ApiResponse<DocumentCategoryDto[]>
    >(`/DocumentCategory`, { withCredentials: true });
    return Array.isArray(response.data) ? response.data : response.data.data;
  },

  getSubjects: async (): Promise<SubjectDto[]> => {
    const response = await axiosInstance.get<
      SubjectDto[] | ApiResponse<SubjectDto[]>
    >(`/Subject/allsubject`, { withCredentials: true });
    return Array.isArray(response.data) ? response.data : response.data.data;
  },

  getUserClasses: async (userId: string): Promise<ClassListDto[]> => {
    const response = await axiosInstance.get(`/Document/my-class/${userId}`, {
      withCredentials: true,
    });
    return response.data;
  },

  createDocument: async (
    formData: FormData
  ): Promise<ApiResponse<DocumentDetailDto>> => {
    const response = await axiosInstance.post<ApiResponse<DocumentDetailDto>>(
      `/Document/create`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      }
    );
    return response.data;
  },
};
