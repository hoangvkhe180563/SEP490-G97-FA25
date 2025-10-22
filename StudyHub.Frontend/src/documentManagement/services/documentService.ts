// src/documentManagement/services/documentService.ts
import axios from "axios"
import type {
  ApiResponse,
  PagedDocumentResponse,
} from "@/documentManagement/interfaces/document"
import type {
  DocumentCategoryDto,
  SubjectDto,
  DocumentDetailDto,
} from "@/documentManagement/interfaces/documentApi"
import type {
  ClassListDto,
} from "@/classManagement/interfaces/class"
const BASE_URL = "http://localhost:6789/api"

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
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (categoryId) params.append('categoryId', categoryId.toString())
    if (gradeId) params.append('grade', gradeId.toString())
    if (subject) params.append('subject', subject)
    if (classId) params.append('classId', classId.toString())
    params.append('pageNumber', pageNumber.toString())
    params.append('pageSize', pageSize.toString())

    const response = await axios.get<ApiResponse<PagedDocumentResponse>>(
      `${BASE_URL}/Document/public?${params.toString()}`
    )
    return response.data
  },

  getSchoolDocuments: async (
    schoolId: number,
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    pageNumber: number = 1,
    pageSize: number = 9
  ): Promise<ApiResponse<PagedDocumentResponse>> => {
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (categoryId) params.append('categoryId', categoryId.toString())
    if (gradeId) params.append('grade', gradeId.toString())
    if (subject) params.append('subject', subject)
    if (classId) params.append('classId', classId.toString())
    params.append('pageNumber', pageNumber.toString())
    params.append('pageSize', pageSize.toString())

    const response = await axios.get<ApiResponse<PagedDocumentResponse>>(
      `${BASE_URL}/Document/school/${schoolId}?${params.toString()}`
    )
    return response.data
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
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (categoryId) params.append('categoryId', categoryId.toString())
    if (gradeId) params.append('grade', gradeId.toString())
    if (subject) params.append('subject', subject)
    if (classId) params.append('classId', classId.toString())
    params.append('pageNumber', pageNumber.toString())
    params.append('pageSize', pageSize.toString())

    const response = await axios.get<ApiResponse<PagedDocumentResponse>>(
      `${BASE_URL}/Document/owned/${creatorId}?${params.toString()}`
    )
    return response.data
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
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (categoryId) params.append('categoryId', categoryId.toString())
    if (gradeId) params.append('grade', gradeId.toString())
    if (subject) params.append('subject', subject)
    if (classId) params.append('classId', classId.toString())
    if (isApproved !== undefined) params.append('isApproved', isApproved.toString())
    if (status !== undefined) params.append('status', status.toString())
    params.append('pageNumber', pageNumber.toString())
    params.append('pageSize', pageSize.toString())

    const response = await axios.get<ApiResponse<PagedDocumentResponse>>(
      `${BASE_URL}/Document/manager/public?${params.toString()}`
    )
    return response.data
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
    const params = new URLSearchParams()
    if (query) params.append('query', query)
    if (categoryId) params.append('categoryId', categoryId.toString())
    if (gradeId) params.append('grade', gradeId.toString())
    if (subject) params.append('subject', subject)
    if (classId) params.append('classId', classId.toString())
    if (isApproved !== undefined) params.append('isApproved', isApproved.toString())
    if (status !== undefined) params.append('status', status.toString())
    params.append('pageNumber', pageNumber.toString())
    params.append('pageSize', pageSize.toString())

    const response = await axios.get<ApiResponse<PagedDocumentResponse>>(
      `${BASE_URL}/Document/manager/school/${schoolId}?${params.toString()}`
    )
    return response.data
  },

  approveDocument: async (documentId: number, approvedBy: string): Promise<ApiResponse<DocumentDetailDto>> => {
    const response = await axios.post<ApiResponse<DocumentDetailDto>>(
      `${BASE_URL}/Document/approve`,
      { documentId, approvedBy }
    )
    return response.data
  },

  rejectDocument: async (documentId: number, approvedBy: string): Promise<ApiResponse<DocumentDetailDto>> => {
    const response = await axios.post<ApiResponse<DocumentDetailDto>>(
      `${BASE_URL}/Document/reject`,
      { documentId, approvedBy }
    )
    return response.data
  },

  revokeApproval: async (documentId: number, approvedBy: string): Promise<ApiResponse<DocumentDetailDto>> => {
    const response = await axios.post<ApiResponse<DocumentDetailDto>>(
      `${BASE_URL}/Document/revoke`,
      { documentId, approvedBy }
    )
    return response.data
  },

  softDeleteDocument: async (documentId: number, deletedBy: string): Promise<ApiResponse<DocumentDetailDto>> => {
    const response = await axios.patch<ApiResponse<DocumentDetailDto>>(
      `${BASE_URL}/Document/soft-delete/${documentId}`,
      JSON.stringify(deletedBy),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data
  },

  getDocumentCategories: async (): Promise<DocumentCategoryDto[]> => {
    const response = await axios.get<DocumentCategoryDto[] | ApiResponse<DocumentCategoryDto[]>>(`${BASE_URL}/DocumentCategory`)
    return Array.isArray(response.data) ? response.data : response.data.data
  },

  getSubjects: async (): Promise<SubjectDto[]> => {
    const response = await axios.get<SubjectDto[] | ApiResponse<SubjectDto[]>>(`${BASE_URL}/Subject/allsubject`)
    return Array.isArray(response.data) ? response.data : response.data.data
  },

  getUserClasses: async (userId: string): Promise<ClassListDto[]> => {
    const response = await axios.get(`${BASE_URL}/Document/my-class/${userId}`)
    return response.data
  },

  createDocument: async (formData: FormData): Promise<ApiResponse<DocumentDetailDto>> => {
    const response = await axios.post<ApiResponse<DocumentDetailDto>>(
      `${BASE_URL}/Document/create`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response.data
  }
}