// src/documentManagement/stores/useDocumentDashboardStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { axiosInstance, axiosMessageErrorHandler } from "@/lib/axios";
import type {
  DocumentDashboardState,
  DocumentStatsDto,
  DocumentCategoryStatsDto,
  DocumentGradeStatsDto,
  DocumentSubjectStatsDto,
  DocumentUploaderStatsDto,
  DocumentLengthStatsDto,
  DocumentLevelStatsDto,
} from "@/documentManagement/interfaces/document-dashboard";
import type { Document } from "@/documentManagement/interfaces/document";

export const useDocumentDashboardStore = create<DocumentDashboardState>()(
  devtools((set) => ({
    stats: null,
    categoryStats: [],
    gradeStats: [],
    subjectStats: [],
    uploaderStats: [],
    lengthStats: [],
    levelStats: [],
    isLoading: false,
    error: null,

    calculateStats: async (schoolId?: number) => {
      set({ isLoading: true, error: null });
      try {
        const params = new URLSearchParams();
        params.append("pageNumber", "1");
        params.append("pageSize", "10000");

        let publicResponse, schoolResponse;

        if (schoolId) {
          schoolResponse = await axiosInstance.get(
            `/Document/manager/school/${schoolId}?${params.toString()}`
          );
        } else {
          publicResponse = await axiosInstance.get(
            `/Document/manager/public?${params.toString()}`
          );
        }

        const documents: Document[] = schoolId
          ? schoolResponse?.data?.data?.items || []
          : publicResponse?.data?.data?.items || [];

        const stats: DocumentStatsDto = {
          totalDocuments: documents.length,
          publicDocuments: documents.filter((d) => !d.isInClass).length,
          schoolDocuments: documents.filter((d) => d.isInClass).length,
          pendingApproval: documents.filter((d) => d.isApproved === null)
            .length,
          approvedDocuments: documents.filter((d) => d.isApproved === true)
            .length,
          rejectedDocuments: documents.filter((d) => d.isApproved === false)
            .length,
          editRequests: documents.filter((d) => d.isRequested === true).length,
          featuredDocuments: documents.filter((d) => d.isFeatured).length,
        };

        const categoryMap = new Map<number, { name: string; count: number }>();
        documents.forEach((doc) => {
          if (doc.documentCategoryId) {
            const existing = categoryMap.get(doc.documentCategoryId);
            if (existing) {
              existing.count++;
            } else {
              categoryMap.set(doc.documentCategoryId, {
                name: doc.categoryName || `Danh mục ${doc.documentCategoryId}`,
                count: 1,
              });
            }
          }
        });

        const categoryStats: DocumentCategoryStatsDto[] = Array.from(
          categoryMap.entries()
        ).map(([id, data]) => ({
          categoryId: id,
          categoryName: data.name,
          count: data.count,
          percentage: (data.count / documents.length) * 100,
        }));

        const gradeMap = new Map<number, number>();
        documents.forEach((doc) => {
          const count = gradeMap.get(doc.grade) || 0;
          gradeMap.set(doc.grade, count + 1);
        });

        const gradeStats: DocumentGradeStatsDto[] = Array.from(
          gradeMap.entries()
        )
          .map(([grade, count]) => ({
            grade,
            count,
            percentage: (count / documents.length) * 100,
          }))
          .sort((a, b) => a.grade - b.grade);

        const subjectMap = new Map<number, { name: string; count: number }>();
        documents.forEach((doc) => {
          if (doc.subjectId) {
            const existing = subjectMap.get(doc.subjectId);
            if (existing) {
              existing.count++;
            } else {
              subjectMap.set(doc.subjectId, {
                name: doc.subjectName || `Môn ${doc.subjectId}`,
                count: 1,
              });
            }
          }
        });

        const subjectStats: DocumentSubjectStatsDto[] = Array.from(
          subjectMap.entries()
        ).map(([id, data]) => ({
          subjectId: id,
          subjectName: data.name,
          count: data.count,
          percentage: (data.count / documents.length) * 100,
        }));

        const uploaderMap = new Map<
          string,
          {
            name: string;
            total: number;
            approved: number;
            pending: number;
          }
        >();

        documents.forEach((doc) => {
          if (doc.createdBy) {
            const existing = uploaderMap.get(doc.createdBy);
            if (existing) {
              existing.total++;
              if (doc.isApproved === true) existing.approved++;
              if (doc.isApproved === null) existing.pending++;
            } else {
              uploaderMap.set(doc.createdBy, {
                name:
                  doc.uploaderName || doc.uploaderFullname || "Không xác định",
                total: 1,
                approved: doc.isApproved === true ? 1 : 0,
                pending: doc.isApproved === null ? 1 : 0,
              });
            }
          }
        });

        const uploaderStats: DocumentUploaderStatsDto[] = Array.from(
          uploaderMap.entries()
        )
          .map(([id, data]) => ({
            uploaderId: id,
            uploaderName: data.name,
            totalDocuments: data.total,
            approvedDocuments: data.approved,
            pendingDocuments: data.pending,
          }))
          .sort((a, b) => b.totalDocuments - a.totalDocuments)
          .slice(0, 10);

        const lengthMap = new Map<string, number>();
        documents.forEach((doc) => {
          if (doc.documentLengthType) {
            const count = lengthMap.get(doc.documentLengthType) || 0;
            lengthMap.set(doc.documentLengthType, count + 1);
          }
        });

        const lengthStats: DocumentLengthStatsDto[] = Array.from(
          lengthMap.entries()
        ).map(([type, count]) => ({
          lengthType: type,
          count,
          percentage: (count / documents.length) * 100,
        }));

        const levelMap = new Map<string, number>();
        documents.forEach((doc) => {
          if (doc.documentLevel) {
            const count = levelMap.get(doc.documentLevel) || 0;
            levelMap.set(doc.documentLevel, count + 1);
          }
        });

        const levelStats: DocumentLevelStatsDto[] = Array.from(
          levelMap.entries()
        ).map(([level, count]) => ({
          level,
          count,
          percentage: (count / documents.length) * 100,
        }));

        set({
          stats,
          categoryStats,
          gradeStats,
          subjectStats,
          uploaderStats,
          lengthStats,
          levelStats,
        });
      } catch (error) {
        set({ error: axiosMessageErrorHandler(error) });
        console.error(error);
      } finally {
        set({ isLoading: false });
      }
    },
  }))
);
