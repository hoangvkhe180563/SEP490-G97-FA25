import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DocumentSearchHeader from "@/documentManagement/components/documents/DocumentSearchBar";
import DocumentFilterSidebar from "@/documentManagement/components/documents/DocumentFilterSidebar";
import DocumentGrid from "@/documentManagement/components/documents/DocumentGrid";
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";
import { documentService } from "@/documentManagement/services/documentService";
import type {
  Document,
  PaginationInfo,
} from "@/documentManagement/interfaces/document";
// src/documentManagement/pages/DocumentList.tsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DocumentSearchHeader from "@/documentManagement/components/documents/DocumentSearchBar";
import DocumentFilterSidebar from "@/documentManagement/components/documents/DocumentFilterSidebar";
import DocumentGrid from "@/documentManagement/components/documents/DocumentGrid";
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";
import DocumentListLayout from "@/documentManagement/components/documents/DocumentListLayout";
import { useDocumentFilters } from "@/documentManagement/hooks/useDocumentFilters";
import { useAuthStore } from "@/auth/stores/useAuthStore";

const DocumentList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showSchoolDocs, setShowSchoolDocs] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 9,
    totalCount: 0,
    totalPages: 0,
  });

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let allDocuments: Document[] = [];

      if (showSchoolDocs) {
        const [publicDocs, schoolDocs] = await Promise.all([
          documentService.getPublicDocuments(
            pagination.currentPage,
            pagination.pageSize
          ),
          documentService.getSchoolDocuments(
            1,
            pagination.currentPage,
            pagination.pageSize
          ),
        ]);

        allDocuments = [...publicDocs.data.items, ...schoolDocs.data.items];

        setPagination({
          currentPage: pagination.currentPage,
          pageSize: pagination.pageSize,
          totalCount: publicDocs.data.total + schoolDocs.data.total,
          totalPages: Math.ceil(
            (publicDocs.data.total + schoolDocs.data.total) /
              pagination.pageSize
          ),
        });
      } else {
        const response = await documentService.getPublicDocuments(
          pagination.currentPage,
          pagination.pageSize
        );
        allDocuments = response.data.items;
        setPagination({
          currentPage: response.data.page,
          pageSize: response.data.limit,
          totalCount: response.data.total,
          totalPages: response.data.totalPages,
        });
      }

      let filteredDocs = allDocuments;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredDocs = filteredDocs.filter(
          (doc) =>
            doc.name.toLowerCase().includes(query) ||
            doc.description?.toLowerCase().includes(query) ||
            doc.uploaderName?.toLowerCase().includes(query)
        );
      }

      if (selectedGrades.length > 0) {
        filteredDocs = filteredDocs.filter((doc) =>
          selectedGrades.includes(doc.gradeId)
        );
      }

      if (selectedSubjects.length > 0) {
        filteredDocs = filteredDocs.filter((doc) =>
          selectedSubjects.includes(doc.subjectId)
        );
      }

      if (selectedCategories.length > 0) {
        filteredDocs = filteredDocs.filter((doc) =>
          selectedCategories.includes(doc.documentCategoryId)
        );
      }

      if (sortBy === "oldest") {
        filteredDocs.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else if (sortBy === "name") {
        filteredDocs.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        filteredDocs.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      setDocuments(filteredDocs);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const locationState = location.state as {
    searchQuery?: string;
    showSchoolDocs?: boolean;
  } | null;

  const {
    documents,
    loading,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    searchQuery,
    sortBy,
    showSchoolDocs,
    selectedGrades,
    selectedSubjects,
    selectedCategories,
    pagination.currentPage,
  ]);
    filters,
    setFilters,
    setCurrentPage,
    setSearchQuery,
    setSortBy,
  } = useDocumentFilters();

  const hasSchoolAccess = !!(user && user.schoolId);

  useEffect(() => {
    if (locationState?.searchQuery) {
      setSearchQuery(locationState.searchQuery);
    }
    if (locationState?.showSchoolDocs !== undefined && hasSchoolAccess) {
      setFilters((prev) => ({
        ...prev,
        showSchoolDocs: !!locationState.showSchoolDocs,
      }));
    }
    if (locationState) {
      window.history.replaceState({}, document.title);
    }
  }, []);

  const handleGradeChange = (gradeId: number) => {
    setSelectedGrades((prev) =>
      prev.includes(gradeId)
        ? prev.filter((id) => id !== gradeId)
        : [...prev, gradeId]
    );
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };
    setFilters((prev) => ({
      ...prev,
      selectedGrades: prev.selectedGrades.includes(gradeId)
        ? prev.selectedGrades.filter((id) => id !== gradeId)
        : [...prev.selectedGrades, gradeId],
    }));
    setCurrentPage(1);
  };

  const handleSubjectChange = (subjectId: number) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };
  const handleSubjectChange = (subject: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subject)
        ? prev.selectedSubjects.filter((s) => s !== subject)
        : [...prev.selectedSubjects, subject],
    }));
    setCurrentPage(1);
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };
    setFilters((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter((id) => id !== categoryId)
        : [...prev.selectedCategories, categoryId],
    }));
    setCurrentPage(1);
  };

  const handleSchoolDocsChange = (checked: boolean) => {
    if (hasSchoolAccess) {
      setFilters((prev) => ({ ...prev, showSchoolDocs: checked }));
      setCurrentPage(1);
    }
  };

  const handleDocumentClick = (documentId: number) => {
    const basePath = location.pathname.split("/documents")[0];
    navigate(`${basePath}/details/${documentId}`);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };
    const basePath = location.pathname.split("/documents")[0];
    navigate(`${basePath}/details/${documentId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📚 Thư viện tài liệu
            </h1>
            <p className="text-gray-600">
              Khám phá và tải xuống tài liệu học tập chất lượng cao
            </p>
          </div>

          <DocumentSearchHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          <div className="flex gap-6">
            <DocumentFilterSidebar
              showSchoolDocs={showSchoolDocs}
              onSchoolDocsChange={setShowSchoolDocs}
              selectedGrades={selectedGrades}
              onGradeChange={handleGradeChange}
              selectedSubjects={selectedSubjects}
              onSubjectChange={handleSubjectChange}
              selectedCategories={selectedCategories}
              onCategoryChange={handleCategoryChange}
            />

            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">
                      Đang tải tài liệu...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <DocumentGrid
                    documents={documents}
                    onDocumentClick={handleDocumentClick}
                  />
                  {documents.length > 0 && (
                    <DocumentPagination
                      pagination={pagination}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
    <DocumentListLayout
      searchHeader={
        <DocumentSearchHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      }
      filterSidebar={
        <DocumentFilterSidebar
          showSchoolDocs={filters.showSchoolDocs}
          onSchoolDocsChange={handleSchoolDocsChange}
          selectedGrades={filters.selectedGrades}
          onGradeChange={handleGradeChange}
          selectedSubjects={filters.selectedSubjects}
          onSubjectChange={handleSubjectChange}
          selectedCategories={filters.selectedCategories}
          onCategoryChange={handleCategoryChange}
          hasSchoolAccess={hasSchoolAccess}
        />
      }
      mainContent={
        <>
          <DocumentGrid
            documents={documents}
            loading={loading}
            onDocumentClick={handleDocumentClick}
          />
          {documents.length > 0 && !loading && (
            <DocumentPagination
              pagination={{ currentPage, totalPages, totalCount, pageSize }}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      }
    />
  );
};

export default DocumentList;

export default DocumentList;
