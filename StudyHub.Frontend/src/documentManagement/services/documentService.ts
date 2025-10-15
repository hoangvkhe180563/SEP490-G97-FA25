import axios from "axios"
import type {
  DocumentSearchResponse,
  DocumentFilterParams,
  ApiResponse,
} from "@/documentManagement/interfaces/document"
import type {
  DocumentCategoryDto,
  GradeDto,
  SubjectDto,
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
      accessibility: params.accessibility ? params.accessibility.toString() : null,
      pageNumber: params.pageNumber || 1,
      pageSize: params.pageSize || 9,
    }
    
    const response = await axios.post<DocumentSearchResponse>(`${BASE_URL}/Document/search`, payload)
    return response.data
  },

  getDocumentCategories: async (): Promise<DocumentCategoryDto[]> => {
    const response = await axios.get<DocumentCategoryDto[] | ApiResponse<DocumentCategoryDto[]>>(`${BASE_URL}/DocumentCategory/alldoccate`)
    return Array.isArray(response.data) ? response.data : response.data.data
  },

  getGrades: async (): Promise<GradeDto[]> => {
    const response = await axios.get<GradeDto[] | ApiResponse<GradeDto[]>>(`${BASE_URL}/Grade/allgrade`)
    return Array.isArray(response.data) ? response.data : response.data.data
  },

  getSubjects: async (): Promise<SubjectDto[]> => {
    const response = await axios.get<SubjectDto[] | ApiResponse<SubjectDto[]>>(`${BASE_URL}/Subject/allsubject`)
    return Array.isArray(response.data) ? response.data : response.data.data
  },
}