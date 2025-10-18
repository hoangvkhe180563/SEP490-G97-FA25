// src/documentManagement/services/documentService.ts
import axios from "axios"
import type {
  ApiResponse,
  PagedDocumentResponse,
} from "@/documentManagement/interfaces/document"
import type {
  DocumentCategoryDto,
  SubjectDto,
} from "@/documentManagement/interfaces/documentApi"

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

  getDocumentCategories: async (): Promise<DocumentCategoryDto[]> => {
    const response = await axios.get<DocumentCategoryDto[] | ApiResponse<DocumentCategoryDto[]>>(`${BASE_URL}/DocumentCategory`)
    return Array.isArray(response.data) ? response.data : response.data.data
  },

  getSubjects: async (): Promise<SubjectDto[]> => {
    const response = await axios.get<SubjectDto[] | ApiResponse<SubjectDto[]>>(`${BASE_URL}/Subject/allsubject`)
    return Array.isArray(response.data) ? response.data : response.data.data
  },
}