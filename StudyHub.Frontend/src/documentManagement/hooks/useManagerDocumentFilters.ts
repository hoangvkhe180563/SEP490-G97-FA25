// src/documentManagement/hooks/useManagerDocumentFilters.ts
import { useState, useEffect, useCallback } from "react";
import { useDocumentStore } from "@/documentManagement/stores/useDocumentStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";

interface ManagerFilterState {
  statusFilter: string;
  selectedGrades: number[];
  selectedSubjects: string[];
  selectedCategories: number[];
}

const STORAGE_KEY = "manager-document-verification-state";

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

export const useManagerDocumentFilters = () => {
  const { user } = useAuthStore();
  const {
    documents: storeDocuments,
    categories: storeCategories,
    subjects: storeSubjects,
    totalPages: storeTotalPages,
    totalCount: storeTotalCount,
    fetchManagerPublicDocuments,
    fetchManagerSchoolDocuments,
    getCategories,
    getSubjects,
    isLoading,
  } = useDocumentStore();

  const savedState = loadState();
  const managerSchoolId = user?.schoolId;
  const isPublicManager = !managerSchoolId;

  const [searchQuery, setSearchQuery] = useState(savedState?.searchQuery || "");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "name">(
    savedState?.sortBy || "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    savedState?.sortOrder || "desc"
  );
  const [currentPage, setCurrentPage] = useState(savedState?.currentPage || 1);
  const [pageSize, setPageSize] = useState(savedState?.pageSize || 5);

  const [filters, setFilters] = useState<ManagerFilterState>(
    savedState?.filters || {
      statusFilter: "pending",
      selectedGrades: [],
      selectedSubjects: [],
      selectedCategories: [],
    }
  );

  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>(
    savedState?.openSections || {
      status: true,
      subject: false,
      grade: false,
      category: false,
    }
  );

  useEffect(() => {
    getCategories();
    getSubjects();
  }, [getCategories, getSubjects]);

  useEffect(() => {
    saveState({
      searchQuery,
      sortBy,
      sortOrder,
      currentPage,
      pageSize,
      filters,
      openSections,
    });
  }, [
    searchQuery,
    sortBy,
    sortOrder,
    currentPage,
    pageSize,
    filters,
    openSections,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    filters.statusFilter,
    filters.selectedGrades,
    filters.selectedSubjects,
    filters.selectedCategories,
  ]);

  const fetchDocuments = useCallback(async () => {
    try {
      let isApproved: boolean | undefined = undefined;

      if (filters.statusFilter === "approved") {
        isApproved = true;
      } else if (filters.statusFilter === "rejected") {
        isApproved = false;
      }

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

      if (isPublicManager) {
        await fetchManagerPublicDocuments(
          searchQuery || undefined,
          categoryParam,
          gradeParam,
          subjectParam,
          undefined,
          isApproved,
          true,
          currentPage,
          pageSize
        );
      } else {
        if (!managerSchoolId) return;
        await fetchManagerSchoolDocuments(
          managerSchoolId.toString(),
          searchQuery || undefined,
          categoryParam,
          gradeParam,
          subjectParam,
          undefined,
          isApproved,
          true,
          currentPage,
          pageSize
        );
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  }, [
    currentPage,
    pageSize,
    searchQuery,
    filters,
    isPublicManager,
    managerSchoolId,
    fetchManagerPublicDocuments,
    fetchManagerSchoolDocuments,
  ]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const sortedDocuments = [...storeDocuments].sort((a, b) => {
    if (!sortBy) return 0;

    let comparison = 0;

    if (sortBy === "name") {
      comparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    } else if (sortBy === "createdAt" || sortBy === "updatedAt") {
      const aValue = a[sortBy] ? new Date(a[sortBy]!).getTime() : 0;
      const bValue = b[sortBy] ? new Date(b[sortBy]!).getTime() : 0;
      comparison = aValue - bValue;
    }

    return sortOrder === "asc" ? comparison : -comparison;
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

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateFilters = (updates: Partial<ManagerFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilters({
      statusFilter: "pending",
      selectedGrades: [],
      selectedSubjects: [],
      selectedCategories: [],
    });
  };

  return {
    documents: filteredDocuments,
    subjects: storeSubjects,
    categories: storeCategories,
    loading: isLoading,
    currentPage,
    totalPages: storeTotalPages,
    totalCount: storeTotalCount,
    pageSize,
    searchQuery,
    sortBy,
    sortOrder,
    filters,
    openSections,
    isPublicManager,
    setCurrentPage,
    setPageSize,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    updateFilters,
    clearFilters,
    handleSort,
    toggleSection,
    refetch: fetchDocuments,
  };
};
