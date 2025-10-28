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

const STORAGE_KEY = "document-list-state";

const loadState = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Error loading state:", error);
  }
  return null;
};

const saveState = (state: any) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving state:", error);
  }
};

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
    isLoading,
  } = useDocumentStore();

  const savedState = loadState();

  const [searchQuery, setSearchQuery] = useState(savedState?.searchQuery || "");
  const [sortBy, setSortBy] = useState(savedState?.sortBy || "newest");
  const [currentPage, setCurrentPage] = useState(savedState?.currentPage || 1);
  const pageSize = 9;

  const [filters, setFilters] = useState<FilterState>(
    savedState?.filters || {
      showSchoolDocs: false,
      selectedGrades: [],
      selectedSubjects: [],
      selectedCategories: [],
    }
  );

  const userSchoolId = user?.schoolId;

  useEffect(() => {
    getCategories();
    getSubjects();
  }, []);

  useEffect(() => {
    saveState({
      searchQuery,
      sortBy,
      currentPage,
      filters,
    });
  }, [searchQuery, sortBy, currentPage, filters]);

  const fetchDocuments = useCallback(async () => {
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
        await fetchSchoolDocuments(
          userSchoolId.toString(),
          searchQuery || undefined,
          categoryParam,
          gradeParam,
          subjectParam,
          undefined,
          currentPage,
          pageSize
        );
      } else {
        await fetchPublicDocuments(
          searchQuery || undefined,
          categoryParam,
          gradeParam,
          subjectParam,
          undefined,
          currentPage,
          pageSize
        );
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  }, [
    currentPage,
    searchQuery,
    filters,
    userSchoolId,
    fetchPublicDocuments,
    fetchSchoolDocuments,
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

  const sortedDocuments = [...storeDocuments].sort((a, b) => {
    if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const filteredDocuments = sortedDocuments.filter((doc) => {
    if (filters.selectedGrades.length > 1) {
      if (!filters.selectedGrades.includes(Number(doc.grade))) {
        return false;
      }
    }

    if (filters.selectedSubjects.length > 1) {
      if (!filters.selectedSubjects.includes(doc.subjectName || "")) {
        return false;
      }
    }

    if (filters.selectedCategories.length > 1) {
      if (
        !filters.selectedCategories.includes(Number(doc.documentCategoryId))
      ) {
        return false;
      }
    }

    return true;
  });

  return {
    documents: filteredDocuments,
    subjects,
    categories,
    loading: isLoading,
    error: null,
    currentPage,
    totalPages: storeTotalPages,
    totalCount: storeTotalCount,
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
