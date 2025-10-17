// hooks/useDocumentFilters.ts
import { useState, useEffect, useCallback } from "react"
import { documentService } from "@/documentManagement/services/documentService"
import type { DocumentListDto, DocumentFilterParams } from "@/documentManagement/interfaces/documentApi"
import type {  Subject, DocumentCategory } from "@/documentManagement/interfaces/masterData"

interface FilterState {
  showSchoolDocs: boolean
  selectedGrades: number[]
  selectedSubjects: number[]
  selectedCategories: number[]
}

export const useDocumentFilters = () => {
  const [documents, setDocuments] = useState<DocumentListDto[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [categories, setCategories] = useState<DocumentCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const pageSize = 9

  const [filters, setFilters] = useState<FilterState>({
    showSchoolDocs: false,
    selectedGrades: [],
    selectedSubjects: [],
    selectedCategories: [],
  })

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [ subjectsData, categoriesData] = await Promise.all([
          documentService.getSubjects(),
          documentService.getDocumentCategories(),
        ])
        setSubjects(subjectsData)
        setCategories(categoriesData)
      } catch (err) {
        console.error("Failed to fetch master data", err)
      }
    }
    fetchMasterData()
  }, [])

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params: DocumentFilterParams = {
        query: searchQuery || undefined,
        gradeId: filters.selectedGrades.length === 1 ? filters.selectedGrades[0] : undefined,
        categoryId: filters.selectedCategories.length === 1 ? filters.selectedCategories[0] : undefined,
        accessibility: filters.showSchoolDocs ? undefined : 1,
        pageNumber: currentPage,
        pageSize,
      }

      const response = await documentService.searchDocuments(params)

      if (response.success) {
        let filteredDocs = response.data

        if (filters.selectedGrades.length > 1) {
          filteredDocs = filteredDocs.filter((doc) => filters.selectedGrades.includes(doc.gradeId))
        }

        if (filters.selectedSubjects.length > 0) {
          filteredDocs = filteredDocs.filter((doc) => filters.selectedSubjects.includes(doc.subjectId))
        }

        if (filters.selectedCategories.length > 1) {
          filteredDocs = filteredDocs.filter((doc) =>
            filters.selectedCategories.includes(doc.documentCategoryId)
          )
        }

        if (!filters.showSchoolDocs) {
          filteredDocs = filteredDocs.filter((doc) => doc.accessibilityId === 1)
        }

        switch (sortBy) {
          case "oldest":
            filteredDocs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            break
          case "name":
            filteredDocs.sort((a, b) => a.name.localeCompare(b.name))
            break
          default:
            filteredDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }

        setDocuments(filteredDocs)
        setTotalPages(response.pagination.totalPages)
        setTotalCount(response.pagination.totalCount)
      }
    } catch (err) {
      setError("Không thể tải danh sách tài liệu")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, sortBy, filters])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return {
    documents,
    subjects,
    categories,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    filters,
    setFilters,
    setCurrentPage,
    setSearchQuery,
    setSortBy,
  }
}