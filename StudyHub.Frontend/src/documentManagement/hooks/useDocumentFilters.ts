// src/documentManagement/hooks/useDocumentFilters.ts
import { useState, useEffect, useCallback } from "react";
import { documentService } from "@/documentManagement/services/documentService";
import type { Document } from "@/documentManagement/interfaces/document";
import type {
  Subject,
  DocumentCategory,
} from "@/documentManagement/interfaces/masterData";
import { useAuthStore } from "@/auth/stores/useAuthStore";

interface FilterState {
  showSchoolDocs: boolean;
  selectedGrades: number[];
  selectedSubjects: string[];
  selectedCategories: number[];
}

export const useDocumentFilters = () => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const pageSize = 9;

  const [filters, setFilters] = useState<FilterState>({
    showSchoolDocs: false,
    selectedGrades: [],
    selectedSubjects: [],
    selectedCategories: [],
  });

  const userSchoolId = user?.schoolId;

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [subjectsData, categoriesData] = await Promise.all([
          documentService.getSubjects(),
          documentService.getDocumentCategories(),
        ]);
        setSubjects(subjectsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error("Failed to fetch master data", err);
      }
    };
    fetchMasterData();
  }, []);

  const applySorting = (docs: Document[]) => {
    if (sortBy === "oldest") {
      docs.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (sortBy === "name") {
      docs.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      docs.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  };

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const gradeParam =
        filters.selectedGrades.length === 1
          ? filters.selectedGrades[0]
          : undefined;
      const categoryParam =
        filters.selectedCategories.length === 1
          ? filters.selectedCategories[0]
          : undefined;
      const subjectParam =
        filters.selectedSubjects.length === 1
          ? filters.selectedSubjects[0]
          : undefined;

      if (filters.showSchoolDocs && userSchoolId) {
        const [publicResponse, schoolResponse] = await Promise.all([
          documentService.getPublicDocuments(
            searchQuery || undefined,
            categoryParam,
            gradeParam,
            subjectParam,
            undefined,
            1,
            999
          ),
          documentService.getSchoolDocuments(
            userSchoolId,
            searchQuery || undefined,
            categoryParam,
            gradeParam,
            subjectParam,
            undefined,
            1,
            999
          ),
        ]);

        const publicDocs = publicResponse.data.items.map((d) => ({
          ...d,
          isSchoolDocument: false,
        }));
        const schoolDocs = schoolResponse.data.items.map((d) => ({
          ...d,
          isSchoolDocument: true,
        }));

        let allDocs = [...publicDocs, ...schoolDocs];

        if (filters.selectedGrades.length > 1) {
          allDocs = allDocs.filter((d) =>
            filters.selectedGrades.includes(Number(d.grade))
          );
        }

        if (filters.selectedSubjects.length > 1) {
          allDocs = allDocs.filter((d) =>
            filters.selectedSubjects.includes(d.subjectName || "")
          );
        }

        if (filters.selectedCategories.length > 1) {
          allDocs = allDocs.filter((d) =>
            filters.selectedCategories.includes(Number(d.documentCategoryId))
          );
        }

        applySorting(allDocs);

        const total = allDocs.length;
        const pages = Math.ceil(total / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedDocs = allDocs.slice(startIndex, endIndex);

        setDocuments(paginatedDocs);
        setTotalPages(pages);
        setTotalCount(total);
      } else {
        const response = await documentService.getPublicDocuments(
          searchQuery || undefined,
          categoryParam,
          gradeParam,
          subjectParam,
          undefined,
          1,
          999
        );

        let filteredDocs = response.data.items.map((d) => ({
          ...d,
          isSchoolDocument: false,
        }));

        if (filters.selectedGrades.length > 1) {
          filteredDocs = filteredDocs.filter((d) =>
            filters.selectedGrades.includes(Number(d.grade))
          );
        }

        if (filters.selectedSubjects.length > 1) {
          filteredDocs = filteredDocs.filter((d) =>
            filters.selectedSubjects.includes(d.subjectName || "")
          );
        }

        if (filters.selectedCategories.length > 1) {
          filteredDocs = filteredDocs.filter((d) =>
            filters.selectedCategories.includes(Number(d.documentCategoryId))
          );
        }

        applySorting(filteredDocs);

        const total = filteredDocs.length;
        const pages = Math.ceil(total / pageSize);
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedDocs = filteredDocs.slice(startIndex, endIndex);

        setDocuments(paginatedDocs);
        setTotalPages(pages);
        setTotalCount(total);
      }
    } catch (err) {
      setError("Không thể tải danh sách tài liệu");
      console.error(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, sortBy, filters, userSchoolId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    filters.showSchoolDocs,
    filters.selectedGrades,
    filters.selectedSubjects,
    filters.selectedCategories,
  ]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    subjects,
    categories,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    searchQuery,
    sortBy,
    filters,
    setFilters,
    setCurrentPage,
    setSearchQuery,
    setSortBy,
  };
};
