//src/documentManagement/interfaces/documentApi.ts
export interface DocumentListDto {
  id: number
  name: string
  subjectId: number
  subjectName?: string  // Thêm
  gradeId: number
  grade: number  // Thêm (alias cho gradeId)
  documentCategoryId: number
  categoryName?: string  // Thêm
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
  schoolName?: string  // Thêm
  isFeatured: boolean
  price: number
  isSchoolDocument: boolean
  fileType?: string  // Thêm
  classId?: number  // Thêm
}

export interface DocumentDetailDto {
  id: number
  name: string
  subjectId: number
  subjectName?: string
  grade: number
  documentCategoryId: number
  categoryName?: string
  documentUrl: string
  thumbnail: string
  description: string
  createdAt: string
  createdBy: string
  updatedAt: string | null
  updatedBy: string | null
  isSchoolDocument: boolean
  isFeatured: boolean
  isApproved: boolean
  status: boolean
  schoolId?: number
  schoolName?: string
  classId?: number
  fileType?: string
}

export interface DocumentCategoryDto {
  id: number
  name: string
}

export interface GradeDto {
  id: number
  name: string
}

export interface SubjectDto {
  id: number
  name: string
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
export interface DocumentsBySubjectResponse {
  success: boolean
  data: DocumentListDto[]
}