import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import DocumentSearchHeader from "@/documentManagement/components/documents/DocumentSearchBar"
import DocumentFilterSidebar from "@/documentManagement/components/documents/DocumentFilterSidebar"
import DocumentGrid from "@/documentManagement/components/documents/DocumentGrid"
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination"
import { documentService } from "@/documentManagement/services/documentService"
import type { Document, PaginationInfo } from "@/documentManagement/interfaces/document"

const DocumentList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const locationState = location.state as { searchQuery?: string; showSchoolDocs?: boolean } | null
  
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState(locationState?.searchQuery || "")
  const [sortBy, setSortBy] = useState("newest")
  const [showSchoolDocs, setShowSchoolDocs] = useState(locationState?.showSchoolDocs || false)
  const [selectedGrades, setSelectedGrades] = useState<number[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 9,
    totalCount: 0,
    totalPages: 0,
  })

  const userSchoolId = 1

  useEffect(() => {
    if (locationState?.searchQuery || locationState?.showSchoolDocs !== undefined) {
      window.history.replaceState({}, document.title)
    }
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const gradeParam = selectedGrades.length === 1 ? selectedGrades[0] : undefined
      const categoryParam = selectedCategories.length === 1 ? selectedCategories[0] : undefined
      const subjectParam = selectedSubjects.length === 1 ? selectedSubjects[0] : undefined

      if (showSchoolDocs && userSchoolId) {
        const publicResponse = await documentService.getPublicDocuments(
          searchQuery || undefined,
          categoryParam,
          gradeParam,
          subjectParam,
          undefined,
          1,
          999
        )

        const schoolResponse = await documentService.getSchoolDocuments(
          userSchoolId,
          searchQuery || undefined,
          categoryParam,
          gradeParam,
          subjectParam,
          undefined,
          1,
          999
        )

        const publicDocs = publicResponse.data.items.map(doc => ({ ...doc, isSchoolDocument: false }))
        const schoolDocs = schoolResponse.data.items.map(doc => ({ ...doc, isSchoolDocument: true }))
        
        let allDocs = [...publicDocs, ...schoolDocs]

        if (selectedGrades.length > 1) {
          allDocs = allDocs.filter(doc => selectedGrades.includes(doc.gradeId))
        }

        if (selectedSubjects.length > 1) {
          allDocs = allDocs.filter(doc => selectedSubjects.includes(doc.subjectName || ''))
        }

        if (selectedCategories.length > 1) {
          allDocs = allDocs.filter(doc => selectedCategories.includes(doc.documentCategoryId))
        }

        applySorting(allDocs)

        const totalCount = allDocs.length
        const totalPages = Math.ceil(totalCount / pagination.pageSize)
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize
        const endIndex = startIndex + pagination.pageSize
        const paginatedDocs = allDocs.slice(startIndex, endIndex)

        setDocuments(paginatedDocs)
        setPagination(prev => ({
          ...prev,
          totalCount: totalCount,
          totalPages: totalPages
        }))
      } else {
        const response = await documentService.getPublicDocuments(
          searchQuery || undefined,
          categoryParam,
          gradeParam,
          subjectParam,
          undefined,
          1,
          999
        )

        let filteredDocs = response.data.items.map(doc => ({ ...doc, isSchoolDocument: false }))

        if (selectedGrades.length > 1) {
          filteredDocs = filteredDocs.filter(doc => selectedGrades.includes(doc.gradeId))
        }

        if (selectedSubjects.length > 1) {
          filteredDocs = filteredDocs.filter(doc => selectedSubjects.includes(doc.subjectName || ''))
        }

        if (selectedCategories.length > 1) {
          filteredDocs = filteredDocs.filter(doc => selectedCategories.includes(doc.documentCategoryId))
        }

        applySorting(filteredDocs)

        const totalCount = filteredDocs.length
        const totalPages = Math.ceil(totalCount / pagination.pageSize)
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize
        const endIndex = startIndex + pagination.pageSize
        const paginatedDocs = filteredDocs.slice(startIndex, endIndex)

        setDocuments(paginatedDocs)
        setPagination(prev => ({
          ...prev,
          totalCount: totalCount,
          totalPages: totalPages
        }))
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const applySorting = (docs: Document[]) => {
    if (sortBy === "oldest") {
      docs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else if (sortBy === "name") {
      docs.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [
    searchQuery,
    sortBy,
    showSchoolDocs,
    selectedGrades,
    selectedSubjects,
    selectedCategories,
    pagination.currentPage,
  ])

  const handleGradeChange = (gradeId: number) => {
    setSelectedGrades((prev) =>
      prev.includes(gradeId) ? prev.filter((id) => id !== gradeId) : [...prev, gradeId]
    )
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }

  const handleSubjectChange = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    )
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    )
    setPagination((prev) => ({ ...prev, currentPage: 1 }))
  }

  const handleDocumentClick = (documentId: number) => {
    const basePath = location.pathname.split("/documents")[0]
    navigate(`${basePath}/details/${documentId}`)
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">📚 Thư viện tài liệu</h1>
            <p className="text-gray-600">Khám phá và tải xuống tài liệu học tập chất lượng cao</p>
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
              hasSchoolAccess={!!userSchoolId}
            />

            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Đang tải tài liệu...</p>
                  </div>
                </div>
              ) : (
                <>
                  <DocumentGrid documents={documents} onDocumentClick={handleDocumentClick} />
                  {documents.length > 0 && (
                    <DocumentPagination pagination={pagination} onPageChange={handlePageChange} />
                  )}
                  {documents.length === 0 && !loading && (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-gray-500">Không tìm thấy tài liệu nào</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentList