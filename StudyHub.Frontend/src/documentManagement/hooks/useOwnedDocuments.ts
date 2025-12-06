// src/documentManagement/hooks/useOwnedDocuments.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useDocumentStore } from "@/documentManagement/stores/useDocumentStore";
import type {
  Document,
  FilterState,
  AvailableFilters,
} from "@/documentManagement/interfaces/document";

const STORAGE_KEY = "ownedDocuments_filters";

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

export const useOwnedDocuments = (creatorId: string, pageSize: number = 18) => {
  const {
    ownedDocuments: storeDocuments = [],
    categories,
    subjects,
    fetchOwnedDocuments,
    getCategories,
    getSubjects,
    isLoading,
  } = useDocumentStore();

  const savedState = loadState();

  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [availableFilters, setAvailableFilters] = useState<AvailableFilters>({
    grades: [],
    subjects: [],
    categories: [],
    accessTypes: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(savedState?.currentPage || 1);
  const [searchQuery, setSearchQuery] = useState(savedState?.searchQuery || "");
  const [sortBy, setSortBy] = useState(savedState?.sortBy || "newest");

  const [filters, setFilters] = useState<FilterState>(
    savedState?.filters || {
      selectedGrades: [],
      selectedSubjects: [],
      selectedCategories: [],
      selectedAccessTypes: [],
      approvalStatus: "all",
      selectedDocumentLengths: [],
      selectedDocumentLevels: [],
    }
  );

  const hasFetchedRef = useRef(false);
  const previousCreatorIdRef = useRef(creatorId);

  useEffect(() => {
    if (previousCreatorIdRef.current !== creatorId) {
      hasFetchedRef.current = false;
      previousCreatorIdRef.current = creatorId;
    }
  }, [creatorId]);

  useEffect(() => {
    getCategories();
    getSubjects();
  }, [getCategories, getSubjects]);

  useEffect(() => {
    saveState({
      searchQuery,
      sortBy,
      currentPage,
      filters,
    });
  }, [searchQuery, sortBy, currentPage, filters]);

  const getAccessType = (doc: Document): string => {
    if (!doc.schoolId && doc.isInClass === false) return "public";
    if (doc.schoolId && doc.isInClass === false) return "school";
    if (doc.isInClass === true) return "class";
    return "public";
  };

  const calculateAvailableFilters = useCallback((docs: Document[]) => {
    if (!docs || docs.length === 0) {
      setAvailableFilters({
        grades: [],
        subjects: [],
        categories: [],
        accessTypes: [],
      });
      return;
    }

    const grades = Array.from(new Set(docs.map((d) => d.grade))).sort(
      (a, b) => a - b
    );
    const subjectNames = Array.from(
      new Set(docs.map((d) => d.subjectName).filter(Boolean))
    ) as string[];
    const categoryNames = Array.from(
      new Set(docs.map((d) => d.categoryName).filter(Boolean))
    ) as string[];
    const accessTypes = Array.from(new Set(docs.map((d) => getAccessType(d))));

    setAvailableFilters({
      grades,
      subjects: subjectNames,
      categories: categoryNames,
      accessTypes,
    });
  }, []);

  useEffect(() => {
    if (!creatorId || hasFetchedRef.current) return;

    const fetchDocuments = async () => {
      setError(null);
      try {
        await fetchOwnedDocuments(
          creatorId,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          1,
          9999
        );
        hasFetchedRef.current = true;
      } catch (err) {
        setError("Không thể tải danh sách tài liệu");
        console.error(err);
      }
    };

    fetchDocuments();
  }, [creatorId, fetchOwnedDocuments]);

  useEffect(() => {
    if (storeDocuments && storeDocuments.length > 0) {
      setAllDocuments(storeDocuments);
      calculateAvailableFilters(storeDocuments);
    }
  }, [storeDocuments, calculateAvailableFilters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    filters.selectedGrades,
    filters.selectedSubjects,
    filters.selectedCategories,
    filters.selectedAccessTypes,
    filters.approvalStatus,
    filters.selectedDocumentLengths,
    filters.selectedDocumentLevels,
  ]);

  const sortedDocuments = [...allDocuments].sort((a, b) => {
    if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === "name-asc") {
      return a.name.localeCompare(b.name, "vi");
    } else if (sortBy === "name-desc") {
      return b.name.localeCompare(a.name, "vi");
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
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        doc.name.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.uploaderName?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (filters.selectedGrades.length > 0) {
      if (!filters.selectedGrades.includes(doc.grade)) {
        return false;
      }
    }

    if (filters.selectedSubjects.length > 0) {
      if (!filters.selectedSubjects.includes(doc.subjectName || "")) {
        return false;
      }
    }

    if (filters.selectedCategories.length > 0) {
      if (!filters.selectedCategories.includes(doc.categoryName || "")) {
        return false;
      }
    }

    if (filters.selectedAccessTypes.length > 0) {
      if (!filters.selectedAccessTypes.includes(getAccessType(doc))) {
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

    if (filters.approvalStatus === "approved") {
      if (doc.isApproved !== true) return false;
    } else if (filters.approvalStatus === "pending") {
      if (doc.isApproved !== null) return false;
    } else if (filters.approvalStatus === "draft") {
      if (doc.isApproved !== false) return false;
    } else if (filters.approvalStatus === "editRequest") {
      if (doc.isRequested !== true) return false;
    }

    return true;
  });

  const total = filteredDocuments.length;
  const pages = Math.ceil(total / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedDocs = filteredDocuments.slice(startIndex, endIndex);

  const clearFilters = useCallback(() => {
    const defaultFilters = {
      selectedGrades: [],
      selectedSubjects: [],
      selectedCategories: [],
      selectedAccessTypes: [],
      approvalStatus: "all",
      selectedDocumentLengths: [],
      selectedDocumentLevels: [],
    };
    setFilters(defaultFilters);
    setSearchQuery("");
  }, []);

  // src/documentManagement/hooks/useOwnedDocuments.ts

  // Xóa useEffect line 270-274

  // Sửa phần return:
  return {
    documents: paginatedDocs, // ← Trả trực tiếp
    subjects,
    categories,
    availableFilters,
    loading: isLoading,
    error,
    currentPage,
    totalPages: pages, // ← Trả trực tiếp
    totalCount: total, // ← Trả trực tiếp
    pageSize,
    searchQuery,
    sortBy,
    filters,
    setFilters,
    setCurrentPage,
    setSearchQuery,
    setSortBy,
    getAccessType,
    clearFilters,
  };
};
