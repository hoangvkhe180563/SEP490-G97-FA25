//documentManagement/services/documentService.ts
import axios from "axios"
import type {
  DocumentSearchResponse,
  DocumentFilterParams,
  ApiResponse,
  PagedDocumentResponse,
} from "@/documentManagement/interfaces/document"
import type {
  DocumentCategoryDto,
  SubjectDto,
  DocumentListDto,
} from "@/documentManagement/interfaces/documentApi"

const BASE_URL = "http://localhost:6789/api"

export const documentService = {
  searchDocuments: async (params: DocumentFilterParams = {}): Promise<DocumentSearchResponse> => {
    const payload = {
      query: params.query || null,
      categoryId: params.categoryId || null,
      gradeId: params.gradeId || null,
      schoolId: params.schoolId || null,
      subject: params.subject || null,
      pageNumber: params.pageNumber || 1,
      pageSize: params.pageSize || 9,
    }
    
    const response = await axios.post<DocumentSearchResponse>(`${BASE_URL}/Document/search`, payload)
    return response.data
  },

  getPublicDocuments: async (pageNumber: number = 1, pageSize: number = 9): Promise<ApiResponse<PagedDocumentResponse>> => {
    const response = await axios.get<ApiResponse<PagedDocumentResponse>>(
      `${BASE_URL}/Document/public?pageNumber=${pageNumber}&pageSize=${pageSize}`
    )
    return response.data
  },

  getSchoolDocuments: async (schoolId: number, pageNumber: number = 1, pageSize: number = 9): Promise<ApiResponse<PagedDocumentResponse>> => {
    const response = await axios.get<ApiResponse<PagedDocumentResponse>>(
      `${BASE_URL}/Document/by-school/${schoolId}?pageNumber=${pageNumber}&pageSize=${pageSize}`
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
getDocumentsBySubject: async (subjectId: number): Promise<ApiResponse<DocumentListDto[]>> => {
  const response = await axios.get<ApiResponse<DocumentListDto[]>>(
    `${BASE_URL}/Document/by-subject/${subjectId}`
  )
  return response.data
},
}