//src/documentManagement/interfaces/document.ts
export interface Document {
  id: number
  name: string
  subjectId: number
  subjectName?: string 
  gradeId: number
  grade: number  
  documentCategoryId: number
  categoryName?: string 
  accessibilityId: number
  documentUrl: string
  createdAt: string
  createdBy: string
  updatedAt: string | null
  updatedBy: string | null
  deletedAt: string | null
  isApproved: boolean
  status: boolean
  description: string
  uploaderName: string
  thumbnail: string
  schoolId: number
  schoolName?: string  
  isFeatured: boolean
  price: number
  isSchoolDocument: boolean
  fileType?: string  
  classId?: number  
}

export interface DocumentFilterParams {
  query?: string
  categoryId?: number
  gradeId?: number
  schoolId?: number
  subject?: string
  accessibility?: number
  pageNumber?: number
  pageSize?: number
}

export interface PaginationInfo {
  currentPage: number
  pageSize: number
  totalCount: number
  totalPages: number
}
export interface PagedDocumentResponse {
  items: Document[]
  total: number
  page: number
  limit: number
  totalPages: number
}
export interface DocumentSearchResponse {
  success: boolean
  data: Document[]
  pagination: PaginationInfo
}

export interface DocumentCategory {
  id: number
  name: string
}

export interface Grade {
  id: number
  name: string
  gradeLevel?: number
}

export interface Subject {
  id: number
  name: string
  code?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
export interface DocumentsBySubjectResponse {
  success: boolean
  data: Document[]
}