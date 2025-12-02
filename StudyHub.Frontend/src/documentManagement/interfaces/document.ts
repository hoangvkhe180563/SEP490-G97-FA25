// src/documentManagement/interfaces/document.ts
import type { ClassListDto } from "@/classManagement/interfaces/class";
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
  isRequested?: boolean;
  editRequestedAt?: string;
  documentLengthType: string;
  documentLevel: string;
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
  isRequested?: boolean;
  editRequestedAt?: string;
  documentLengthType: string;
  documentLevel: string;
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

export interface FilterState {
  selectedGrades: number[];
  selectedSubjects: string[];
  selectedCategories: string[];
  selectedAccessTypes: string[];
  approvalStatus: string;
  selectedDocumentLengths: string[];
  selectedDocumentLevels: string[];
}

export interface AvailableFilters {
  grades: number[];
  subjects: string[];
  categories: string[];
  accessTypes: string[];
}

export interface FilterSidebarProps {
  availableFilters: AvailableFilters;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export interface DocumentHeaderProps {
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  approvalStatus: string;
  setApprovalStatus: (status: string) => void;
  onCreateDocument: () => void;
}

export interface DocumentGridProps {
  documents: Document[];
  loading: boolean;
  viewMode: "grid" | "list";
  onSelectDocument: (id: number) => void;
  onEditDocument: (id: number) => void;
  getAccessType: (doc: Document) => string;
  onPreviewDocument?: (id: number) => void;
  hasDetailPanel: boolean;
}

export interface DocumentDetailProps {
  document: Document;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
  getAccessType: (doc: Document) => string;
  requestEditDocument: (documentId: number) => Promise<boolean>;
}
export interface PdfOutlineItem {
  title: string;
  page: number;
}

export interface PdfPage {
  getViewport: (params: { scale: number; rotation?: number }) => {
    width: number;
    height: number;
  };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => {
    promise: Promise<void>;
  };
}

export interface PdfDocument {
  numPages: number;
  getOutline: () => Promise<Array<{ title: string; dest: unknown }> | null>;
  getPage: (num: number) => Promise<PdfPage>;
}

export interface PdfJs {
  getDocument: (params: { data: ArrayBuffer }) => {
    promise: Promise<PdfDocument>;
  };
  GlobalWorkerOptions: { workerSrc: string };
}

export type ViewMode = "normal" | "flipbook";

export interface FlipBookRef {
  pageFlip: () => {
    flip: (page: number) => void;
    flipNext: () => void;
    flipPrev: () => void;
  };
}
export interface DocumentDetailProps {
  document: Document;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
  getAccessType: (doc: Document) => string;
}
export interface DocumentState {
  document: DocumentDetailDto | null;
  documents: Document[];
  categories: DocumentCategoryDto[];
  subjects: SubjectDto[];
  userClasses: ClassListDto[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  success: boolean;
  message: string;
  error: string | null;
  getDocumentByIdMessage: string;
  getDocumentByIdError: string | null;
  downloadDocumentMessage: string;
  downloadDocumentError: string | null;
  previewDocumentMessage: string;
  previewDocumentError: string | null;
  fetchPublicDocumentsMessage: string;
  fetchPublicDocumentsError: string | null;
  fetchSchoolDocumentsMessage: string;
  fetchSchoolDocumentsError: string | null;
  fetchOwnedDocumentsMessage: string;
  fetchOwnedDocumentsError: string | null;
  fetchManagerPublicDocumentsMessage: string;
  fetchManagerPublicDocumentsError: string | null;
  fetchManagerSchoolDocumentsMessage: string;
  fetchManagerSchoolDocumentsError: string | null;
  approveDocumentMessage: string;
  approveDocumentError: string | null;
  rejectDocumentMessage: string;
  rejectDocumentError: string | null;
  revokeApprovalMessage: string;
  revokeApprovalError: string | null;
  softDeleteDocumentMessage: string;
  softDeleteDocumentError: string | null;
  createDocumentMessage: string;
  createDocumentError: string | null;
  getCategoriesMessage: string;
  getCategoriesError: string | null;
  getSubjectsMessage: string;
  getSubjectsError: string | null;
  getUserClassesMessage: string;
  getUserClassesError: string | null;
  requestEditDocumentMessage: string;
  requestEditDocumentError: string | null;
  fetchEditRequestDocumentsMessage: string;
  fetchEditRequestDocumentsError: string | null;
  approveEditRequestMessage: string;
  approveEditRequestError: string | null;
  rejectEditRequestMessage: string;
  rejectEditRequestError: string | null;
  submitForApprovalMessage: string;
  submitForApprovalError: string | null;
  cancelEditRequestMessage: string;
  cancelEditRequestError: string | null;
  cancelEditRequest: (
    documentId: number,
    handlerSuccess?: () => void
  ) => Promise<boolean>;
  getDocumentById: (
    id: number,
    handlerSuccess?: () => void
  ) => Promise<DocumentDetailDto | null>;
  downloadDocument: (
    id: number,
    handlerSuccess?: () => void
  ) => Promise<Blob | null>;
  previewDocument: (
    id: number,
    handlerSuccess?: () => void
  ) => Promise<Blob | null>;
  fetchPublicDocuments: (
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    pageNumber?: number,
    pageSize?: number,
    handlerSuccess?: () => void
  ) => Promise<void>;
  fetchSchoolDocuments: (
    schoolId: string,
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    pageNumber?: number,
    pageSize?: number,
    handlerSuccess?: () => void
  ) => Promise<void>;
  fetchOwnedDocuments: (
    creatorId: string,
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    pageNumber?: number,
    pageSize?: number,
    handlerSuccess?: () => void
  ) => Promise<void>;
  fetchManagerPublicDocuments: (
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    isApproved?: boolean | null,
    status?: boolean,
    isRequested?: boolean | null,
    pageNumber?: number,
    pageSize?: number,
    handlerSuccess?: () => void
  ) => Promise<void>;
  fetchManagerSchoolDocuments: (
    schoolId: string,
    query?: string,
    categoryId?: number,
    gradeId?: number,
    subject?: string,
    classId?: number,
    isApproved?: boolean | null,
    status?: boolean,
    isRequested?: boolean | null,
    pageNumber?: number,
    pageSize?: number,
    handlerSuccess?: () => void
  ) => Promise<void>;
  approveDocument: (
    documentId: number,
    handlerSuccess?: () => void
  ) => Promise<boolean>;
  rejectDocument: (
    documentId: number,
    handlerSuccess?: () => void
  ) => Promise<boolean>;
  revokeApproval: (
    documentId: number,
    handlerSuccess?: () => void
  ) => Promise<boolean>;
  softDeleteDocument: (
    documentId: number,
    handlerSuccess?: () => void
  ) => Promise<boolean>;
  createDocument: (
    formData: FormData,
    handlerSuccess?: () => void
  ) => Promise<DocumentDetailDto | null>;
  getCategories: (handlerSuccess?: () => void) => Promise<void>;
  getSubjects: (handlerSuccess?: () => void) => Promise<void>;
  getUserClasses: (
    userId: string,
    handlerSuccess?: () => void
  ) => Promise<void>;
  requestEditDocument: (
    documentId: number,
    handlerSuccess?: () => void
  ) => Promise<boolean>;
  fetchEditRequestDocuments: (
    isRequested?: boolean,
    pageNumber?: number,
    pageSize?: number,
    handlerSuccess?: () => void
  ) => Promise<void>;
  approveEditRequest: (
    documentId: number,
    handlerSuccess?: () => void
  ) => Promise<boolean>;
  rejectEditRequest: (
    documentId: number,
    handlerSuccess?: () => void
  ) => Promise<boolean>;
  setCurrentPage: (page: number) => void;
  submitForApproval: (
    documentId: number,
    handlerSuccess?: () => void
  ) => Promise<boolean>;
}
