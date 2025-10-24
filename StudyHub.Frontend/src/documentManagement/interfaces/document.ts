// src/documentManagement/interfaces/document.ts
export interface Document {
  id: number;
  name: string;
  subjectId: number;
  subjectName?: string;
  gradeId: number;
  grade: number;
  documentCategoryId: number;
  categoryName?: string;
  accessibilityId?: number;
  documentUrl: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  isApproved: boolean | null;
  status: boolean;
  description: string;
  uploaderName: string;
  uploaderFullname?: string;
  uploaderUrl?: string;
  thumbnail: string;
  schoolId: number | null;
  schoolName?: string;
  isFeatured: boolean;
  price?: number;
  isSchoolDocument?: boolean;
  fileType?: string;
  classId?: number;
  isInClass?: boolean;
  classes?: Array<{ id: number; name?: string }>;
}

export interface DocumentFilterParams {
  query?: string;
  categoryId?: number;
  gradeId?: number;
  schoolId?: number;
  subject?: string;
  accessibility?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PagedDocumentResponse {
  items: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DocumentSearchResponse {
  success: boolean;
  data: Document[];
  pagination: PaginationInfo;
}

export interface DocumentCategory {
  id: number;
  name: string;
}

export interface Grade {
  id: number;
  name: string;
  gradeLevel?: number;
}

export interface Subject {
  id: number;
  name: string;
  code?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DocumentsBySubjectResponse {
  success: boolean;
  data: Document[];
}

export interface DocumentDetailDto {
  id: number;
  name: string;
  subjectId: number;
  subjectName?: string;
  gradeId: number;
  grade: number;
  documentCategoryId: number;
  categoryName?: string;
  accessibilityId?: number;
  documentUrl: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  isApproved: boolean | null;
  status: boolean;
  description: string;
  uploaderName: string;
  uploaderFullname?: string;
  uploaderUrl?: string;
  thumbnail: string;
  schoolId: number | null;
  schoolName?: string;
  isFeatured: boolean;
  price?: number;
  isSchoolDocument?: boolean;
  fileType?: string;
  classId?: number;
  isInClass?: boolean;
  classes?: Array<{ id: number; name?: string }>;
}

export interface DocumentListDto {
  id: number;
  name: string;
  subjectId: number;
  subjectName?: string;
  gradeId: number;
  grade: number;
  documentCategoryId: number;
  categoryName?: string;
  accessibilityId: number;
  documentUrl: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  isApproved: boolean;
  status: boolean;
  description: string;
  uploaderName: string;
  thumbnail: string;
  schoolId: number;
  schoolName?: string;
  isFeatured: boolean;
  price: number;
  isSchoolDocument: boolean;
  fileType?: string;
  classId?: number;
}

export interface DocumentCategoryDto {
  id: number;
  name: string;
}

export interface GradeDto {
  id: number;
  name: string;
}

export interface SubjectDto {
  id: number;
  name: string;
}
interface HTMLFlipBookProps {
  width: number;
  height: number;
  size?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  maxShadowOpacity?: number;
  showCover?: boolean;
  mobileScrollSupport?: boolean;
  onFlip?: (e: { data: number }) => void;
  className?: string;
  startPage?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  drawShadow?: boolean;
  flippingTime?: number;
  usePortrait?: boolean;
  startZIndex?: number;
  autoSize?: boolean;
  clickEventForward?: boolean;
  useMouseEvents?: boolean;
  swipeDistance?: number;
  showPageCorners?: boolean;
  disableFlipByClick?: boolean;
}
