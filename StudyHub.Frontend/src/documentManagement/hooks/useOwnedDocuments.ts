// src/documentManagement/hooks/useOwnedDocuments.ts
import { useState, useEffect, useCallback } from "react";
import { useDocumentStore } from "@/documentManagement/stores/useDocumentStore";
import type { Document } from "@/documentManagement/interfaces/document";

interface FilterState {
  selectedGrades: number[];
  selectedSubjects: string[];
  selectedCategories: string[];
  selectedAccessTypes: string[];
  approvalStatus: string;
}

interface AvailableFilters {
  grades: number[];
  subjects: string[];
  categories: string[];
  accessTypes: string[];
}

export const useOwnedDocuments = (creatorId: string, pageSize: number = 18) => {
  const {
    documents: storeDocuments,
    categories,
    subjects,
    fetchOwnedDocuments,
    getCategories,
    getSubjects,
    isLoading,
  } = useDocumentStore();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [availableFilters, setAvailableFilters] = useState<AvailableFilters>({
    grades: [],
    subjects: [],
    categories: [],
    accessTypes: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [filters, setFilters] = useState<FilterState>({
    selectedGrades: [],
    selectedSubjects: [],
    selectedCategories: [],
    selectedAccessTypes: [],
    approvalStatus: "all",
  });

  useEffect(() => {
    getCategories();
    getSubjects();
  }, [getCategories, getSubjects]);

  const getAccessType = (doc: Document): string => {
    if (!doc.schoolId && doc.isInClass === false) return "public";
    if (doc.schoolId && doc.isInClass === false) return "school";
    if (doc.isInClass === true) return "class";
    return "public";
  };

  const calculateAvailableFilters = (docs: Document[]) => {
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
  };

  const applySorting = (docs: Document[]) => {
    const sorted = [...docs];
    if (sortBy === "oldest") {
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (sortBy === "name-asc") {
      sorted.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    } else if (sortBy === "name-desc") {
      sorted.sort((a, b) => b.name.localeCompare(a.name, "vi"));
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return sorted;
  };

  const applyFilters = (docs: Document[]) => {
    let filtered = [...docs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.description?.toLowerCase().includes(query) ||
          d.uploaderName?.toLowerCase().includes(query)
      );
    }

    if (filters.selectedGrades.length > 0) {
      filtered = filtered.filter((d) =>
        filters.selectedGrades.includes(d.grade)
      );
    }

    if (filters.selectedSubjects.length > 0) {
      filtered = filtered.filter(
        (d) => d.subjectName && filters.selectedSubjects.includes(d.subjectName)
      );
    }

    if (filters.selectedCategories.length > 0) {
      filtered = filtered.filter(
        (d) =>
          d.categoryName && filters.selectedCategories.includes(d.categoryName)
      );
    }

    if (filters.selectedAccessTypes.length > 0) {
      filtered = filtered.filter((d) =>
        filters.selectedAccessTypes.includes(getAccessType(d))
      );
    }

    if (filters.approvalStatus === "approved") {
      filtered = filtered.filter((d) => d.isApproved === true);
    } else if (filters.approvalStatus === "pending") {
      filtered = filtered.filter((d) => d.isApproved === null);
    } else if (filters.approvalStatus === "rejected") {
      filtered = filtered.filter((d) => d.isApproved === false);
    }

    return filtered;
  };

  const fetchDocuments = useCallback(async () => {
    if (!creatorId) return;

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

      const allDocs = storeDocuments;
      setAllDocuments(allDocs);
      calculateAvailableFilters(allDocs);

      let filteredDocs = applyFilters(allDocs);
      filteredDocs = applySorting(filteredDocs);

      const total = filteredDocs.length;
      const pages = Math.ceil(total / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedDocs = filteredDocs.slice(startIndex, endIndex);

      setDocuments(paginatedDocs);
      setTotalPages(pages);
      setTotalCount(total);
    } catch (err) {
      setError("Không thể tải danh sách tài liệu");
      console.error(err);
    }
  }, [creatorId, pageSize, fetchOwnedDocuments, storeDocuments]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (allDocuments.length > 0) {
      let filteredDocs = applyFilters(allDocuments);
      filteredDocs = applySorting(filteredDocs);

      const total = filteredDocs.length;
      const pages = Math.ceil(total / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedDocs = filteredDocs.slice(startIndex, endIndex);

      setDocuments(paginatedDocs);
      setTotalPages(pages);
      setTotalCount(total);
    }
  }, [currentPage, searchQuery, sortBy, filters, allDocuments, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  return {
    documents,
    subjects,
    categories,
    availableFilters,
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
    getAccessType,
  };
};
