// src/documentManagement/pages/DocumentList.tsx
import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import DocumentSearchHeader from "@/documentManagement/components/documents/DocumentSearchBar"
import DocumentFilterSidebar from "@/documentManagement/components/documents/DocumentFilterSidebar"
import DocumentGrid from "@/documentManagement/components/documents/DocumentGrid"
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination"
import DocumentListLayout from "@/documentManagement/components/documents/DocumentListLayout"
import { useDocumentFilters } from "@/documentManagement/hooks/useDocumentFilters"

const DocumentList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const locationState = location.state as { searchQuery?: string; showSchoolDocs?: boolean } | null
  
  const {
    documents,
    loading,
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
  } = useDocumentFilters()

useEffect(() => {
  if (locationState?.searchQuery) {
    setSearchQuery(locationState.searchQuery)
  }
  if (locationState?.showSchoolDocs !== undefined) {
    setFilters(prev => ({ ...prev, showSchoolDocs: !!locationState.showSchoolDocs }))
  }
  if (locationState) {
    window.history.replaceState({}, document.title)
  }
}, [locationState?.searchQuery, locationState?.showSchoolDocs, locationState?.timestamp])

  const handleGradeChange = (gradeId: number) => {
    setFilters(prev => ({
      ...prev,
      selectedGrades: prev.selectedGrades.includes(gradeId)
        ? prev.selectedGrades.filter(id => id !== gradeId)
        : [...prev.selectedGrades, gradeId]
    }))
    setCurrentPage(1)
  }

  const handleSubjectChange = (subject: string) => {
    setFilters(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subject)
        ? prev.selectedSubjects.filter(s => s !== subject)
        : [...prev.selectedSubjects, subject]
    }))
    setCurrentPage(1)
  }

  const handleCategoryChange = (categoryId: number) => {
    setFilters(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter(id => id !== categoryId)
        : [...prev.selectedCategories, categoryId]
    }))
    setCurrentPage(1)
  }

  const handleDocumentClick = (documentId: number) => {
    const basePath = location.pathname.split("/documents")[0]
    navigate(`${basePath}/details/${documentId}`)
  }

  return (
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
          onSchoolDocsChange={(checked) => setFilters(prev => ({ ...prev, showSchoolDocs: checked }))}
          selectedGrades={filters.selectedGrades}
          onGradeChange={handleGradeChange}
          selectedSubjects={filters.selectedSubjects}
          onSubjectChange={handleSubjectChange}
          selectedCategories={filters.selectedCategories}
          onCategoryChange={handleCategoryChange}
          hasSchoolAccess={true}
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
  )
}

export default DocumentList