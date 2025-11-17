// src/documentManagement/hooks/useDocumentFilters.ts
import { useState, useEffect, useCallback } from "react";
import { useDocumentStore } from "@/documentManagement/stores/useDocumentStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";

interface FilterState {
  showSchoolDocs: boolean;
  selectedGrades: number[];
  selectedSubjects: string[];
  selectedCategories: number[];
  selectedDocumentLengths: string[];
  selectedDocumentLevels: string[];
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
      selectedDocumentLengths: [],
      selectedDocumentLevels: [],
    }
  );

  const userSchoolId = user?.schoolId;

  useEffect(() => {
    getCategories();
    getSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    filters.selectedDocumentLengths,
    filters.selectedDocumentLevels,
  ]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const sortedDocuments = [...storeDocuments].sort((a, b) => {
    if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "length-short") {
      const order = { Short: 1, Medium: 2, Long: 3 };
      return (
        (order[a.documentLengthType as keyof typeof order] || 4) -
        (order[b.documentLengthType as keyof typeof order] || 4)
      );
    } else if (sortBy === "length-medium") {
      const order = { Medium: 1, Short: 2, Long: 3 };
      return (
        (order[a.documentLengthType as keyof typeof order] || 4) -
        (order[b.documentLengthType as keyof typeof order] || 4)
      );
    } else if (sortBy === "length-long") {
      const order = { Long: 1, Medium: 2, Short: 3 };
      return (
        (order[a.documentLengthType as keyof typeof order] || 4) -
        (order[b.documentLengthType as keyof typeof order] || 4)
      );
    } else if (sortBy === "level-easy") {
      const order = { Easy: 1, Medium: 2, Hard: 3 };
      return (
        (order[a.documentLevel as keyof typeof order] || 4) -
        (order[b.documentLevel as keyof typeof order] || 4)
      );
    } else if (sortBy === "level-medium") {
      const order = { Medium: 1, Easy: 2, Hard: 3 };
      return (
        (order[a.documentLevel as keyof typeof order] || 4) -
        (order[b.documentLevel as keyof typeof order] || 4)
      );
    } else if (sortBy === "level-hard") {
      const order = { Hard: 1, Medium: 2, Easy: 3 };
      return (
        (order[a.documentLevel as keyof typeof order] || 4) -
        (order[b.documentLevel as keyof typeof order] || 4)
      );
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

    if (filters.selectedDocumentLengths.length > 0) {
      if (!filters.selectedDocumentLengths.includes(doc.documentLengthType)) {
        return false;
      }
    }

    if (filters.selectedDocumentLevels.length > 0) {
      if (!filters.selectedDocumentLevels.includes(doc.documentLevel)) {
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
