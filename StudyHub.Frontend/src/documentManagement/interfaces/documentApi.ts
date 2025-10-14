export interface DocumentListDto {
  id: number
  name: string
  subjectId: number
  gradeId: number
  documentCategoryId: number
  accessibilityId: number
  thumbnail: string
  description: string
  createdAt: string
  createdBy: string
  isSchoolDocument: boolean
  isFeatured: boolean
  isApproved: boolean
}

export interface DocumentDetailDto {
  id: number
  name: string
  subjectId: number
  gradeId: number
  documentCategoryId: number
  accessibilityId: number
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
  price: number
  schoolId: number
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