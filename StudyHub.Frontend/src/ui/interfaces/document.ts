export interface Document {
  id: number;
  name: string;
  subjectId: number;
  gradeId: number;
  documentCategoryId: number;
  accessibilityId: number;
  documentUrl: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  deletedAt?: string | null;
  isApproved?: boolean | null;
  status: boolean;
  description?: string | null;
  thumbnail?: string | null;
  schoolId?: number | null;
  isFeatured: boolean;
  price: number;
    isSchoolDocument: boolean;
}
