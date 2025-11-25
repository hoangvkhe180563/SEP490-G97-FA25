// src/documentManagement/interfaces/document-dashboard.ts
export interface DocumentStatsDto {
  totalDocuments: number;
  publicDocuments: number;
  schoolDocuments: number;
  pendingApproval: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  editRequests: number;
  featuredDocuments: number;
}

export interface DocumentCategoryStatsDto {
  categoryId: number;
  categoryName: string;
  count: number;
  percentage: number;
}

export interface DocumentGradeStatsDto {
  grade: number;
  count: number;
  percentage: number;
}

export interface DocumentSubjectStatsDto {
  subjectId: number;
  subjectName: string;
  count: number;
  percentage: number;
}

export interface DocumentUploaderStatsDto {
  uploaderId: string;
  uploaderName: string;
  totalDocuments: number;
  approvedDocuments: number;
  pendingDocuments: number;
}

export interface DocumentLengthStatsDto {
  lengthType: string;
  count: number;
  percentage: number;
}

export interface DocumentLevelStatsDto {
  level: string;
  count: number;
  percentage: number;
}

export interface DocumentDashboardState {
  stats: DocumentStatsDto | null;
  categoryStats: DocumentCategoryStatsDto[];
  gradeStats: DocumentGradeStatsDto[];
  subjectStats: DocumentSubjectStatsDto[];
  uploaderStats: DocumentUploaderStatsDto[];
  lengthStats: DocumentLengthStatsDto[];
  levelStats: DocumentLevelStatsDto[];
  isLoading: boolean;
  error: string | null;

  calculateStats: (schoolId?: number) => Promise<void>;
}
