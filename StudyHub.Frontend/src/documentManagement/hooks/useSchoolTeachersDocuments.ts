// src/documentManagement/hooks/useSchoolTeachersDocuments.ts
import { useEffect, useState, useMemo } from "react";
import { useDocumentStore } from "../stores/useDocumentStore";
import type { FilterState, AvailableFilters } from "../interfaces/document";

export const useSchoolTeachersDocuments = (
  schoolId: number,
  pageSize: number = 10
) => {
  const {
    schoolTeachersDocuments: documents,
    totalCount,
    currentPage,
    isLoading,
    fetchSchoolTeachersDocuments,
    setCurrentPage,
  } = useDocumentStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState<FilterState>({
    selectedGrades: [],
    selectedSubjects: [],
    selectedCategories: [],
    selectedAccessTypes: [],
    approvalStatus: "",
    selectedDocumentLengths: [],
    selectedDocumentLevels: [],
  });

  const availableFilters: AvailableFilters = useMemo(() => {
    const grades = Array.from(new Set(documents.map((d) => d.grade))).sort(
      (a, b) => a - b
    );
    const subjects = Array.from(
      new Set(documents.map((d) => d.subjectName).filter(Boolean))
    ).sort() as string[];
    const categories = Array.from(
      new Set(documents.map((d) => d.categoryName).filter(Boolean))
    ).sort() as string[];

    return { grades, subjects, categories, accessTypes: [] };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    if (filters.selectedGrades.length > 0) {
      result = result.filter((doc) =>
        filters.selectedGrades.includes(doc.grade)
      );
    }

    if (filters.selectedSubjects.length > 0) {
      result = result.filter((doc) =>
        filters.selectedSubjects.includes(doc.subjectName || "")
      );
    }

    if (filters.selectedCategories.length > 0) {
      result = result.filter((doc) =>
        filters.selectedCategories.includes(doc.categoryName || "")
      );
    }

    if (
      filters.selectedDocumentLengths &&
      filters.selectedDocumentLengths.length > 0
    ) {
      result = result.filter((doc) =>
        filters.selectedDocumentLengths!.includes(doc.documentLengthType || "")
      );
    }

    if (
      filters.selectedDocumentLevels &&
      filters.selectedDocumentLevels.length > 0
    ) {
      result = result.filter((doc) =>
        filters.selectedDocumentLevels!.includes(doc.documentLevel || "")
      );
    }

    switch (sortBy) {
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return result;
  }, [documents, filters, sortBy]);

  useEffect(() => {
    fetchSchoolTeachersDocuments(
      schoolId,
      searchQuery || null,
      null,
      null,
      null,
      null,
      currentPage,
      pageSize
    );
  }, [
    schoolId,
    searchQuery,
    currentPage,
    pageSize,
    fetchSchoolTeachersDocuments,
  ]);

  const clearFilters = () => {
    setFilters({
      selectedGrades: [],
      selectedSubjects: [],
      selectedCategories: [],
      selectedAccessTypes: [],
      approvalStatus: "",
      selectedDocumentLengths: [],
      selectedDocumentLevels: [],
    });
  };

  return {
    documents: filteredDocuments,
    availableFilters,
    loading: isLoading,
    searchQuery,
    sortBy,
    filters,
    totalCount,
    currentPage,
    setFilters,
    setSearchQuery,
    setSortBy,
    setCurrentPage,
    clearFilters,
  };
};
