// src/documentManagement/hooks/useDocumentFilters.ts
import { useState, useEffect, useCallback } from "react";
import { useDocumentStore } from "@/documentManagement/stores/useDocumentStore";
import type { Document } from "@/documentManagement/interfaces/document";
import { useAuthStore } from "@/auth/stores/useAuthStore";

interface FilterState {
  showSchoolDocs: boolean;
  selectedGrades: number[];
  selectedSubjects: string[];
  selectedCategories: number[];
}

export const useDocumentFilters = () => {
  const { user } = useAuthStore();
  const {
    documents: storeDocuments,
    categories,
    subjects,
    totalPages: storeTotalPages,
    totalCount: storeTotalCount,
    currentPage: storeCurrentPage,
    fetchPublicDocuments,
    fetchSchoolDocuments,
    getCategories,
    getSubjects,
    setCurrentPage: setStoreCurrentPage,
    isLoading,
  } = useDocumentStore();

  const [documents, setDocuments] = useState<Document[]>([]);
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
    getCategories();
    getSubjects();
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
        await Promise.all([
          fetchPublicDocuments(
            searchQuery || undefined,
            categoryParam,
            gradeParam,
            subjectParam,
            undefined,
            1,
            999
          ),
          fetchSchoolDocuments(
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
      } else {
        await fetchPublicDocuments(
          searchQuery || undefined,
          categoryParam,
          gradeParam,
          subjectParam,
          undefined,
          1,
          999
        );
      }
    } catch (err) {
      setError("Không thể tải danh sách tài liệu");
      console.error(err);
    }
  }, [
    currentPage,
    searchQuery,
    filters,
    userSchoolId,
    fetchPublicDocuments,
    fetchSchoolDocuments,
  ]);

  useEffect(() => {
    if (isLoading) return;

    let allDocs: Document[] = [];

    if (filters.showSchoolDocs && userSchoolId) {
      const publicDocs = storeDocuments.map((d) => ({
        ...d,
        isSchoolDocument: false,
      }));
      const schoolDocs = storeDocuments.map((d) => ({
        ...d,
        isSchoolDocument: true,
      }));
      allDocs = [...publicDocs, ...schoolDocs];
    } else {
      allDocs = storeDocuments.map((d) => ({
        ...d,
        isSchoolDocument: false,
      }));
    }

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
  }, [
    storeDocuments,
    currentPage,
    sortBy,
    filters,
    isLoading,
    userSchoolId,
    pageSize,
  ]);

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
    loading: isLoading,
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
