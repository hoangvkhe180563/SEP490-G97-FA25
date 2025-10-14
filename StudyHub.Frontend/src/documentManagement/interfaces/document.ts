// export interface Document {
//   id: number;
//   name: string;
//   subjectId: number;
//   gradeId: number;
//   documentCategoryId: number;
//   accessibilityId: number;
//   documentUrl: string;
//   createdAt: string;
//   createdBy: string;
//   updatedAt?: string | null;
//   updatedBy?: string | null;
//   deletedAt?: string | null;
//   isApproved?: boolean | null;
//   status: boolean;
//   description?: string | null;
//   thumbnail?: string | null;
//   schoolId?: number | null;
//   isFeatured: boolean;
//   price: number;
//     isSchoolDocument: boolean;
// }
export interface Document {
  id: number
  name: string
  subjectId: number
  gradeId: number
  documentCategoryId: number
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
  thumbnail: string
  schoolId: number
  isFeatured: boolean
  price: number
  isSchoolDocument: boolean
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