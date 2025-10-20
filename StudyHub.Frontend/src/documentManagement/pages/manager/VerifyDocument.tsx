// src/documentManagement/pages/manager/VerifyDocument.tsx
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/common/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select"
import { Button } from "@/common/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/common/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/common/components/ui/pagination"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/common/components/ui/alert-dialog"
import { useDocumentStore } from "@/documentManagement/stores/useDocumentStore"
import { documentService } from "@/documentManagement/services/documentService"
import type { Subject, DocumentCategory } from "@/documentManagement/interfaces/masterData"
import type { Document } from "@/documentManagement/interfaces/document"

const MANAGER_SCHOOL_ID = 1
const UPDATED_BY = "a1b2c3d4-e5f6-7890-1234-567890abcdef"

const ManagerDocumentApprovalList = () => {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedGrade, setSelectedGrade] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [pageSize, setPageSize] = useState(5)
  
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [categories, setCategories] = useState<DocumentCategory[]>([])
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const [dialogState, setDialogState] = useState<{
    open: boolean
    type: "approve" | "reject" | "revoke" | "hide" | null
    documentId: number | null
    documentName: string
  }>({
    open: false,
    type: null,
    documentId: null,
    documentName: ""
  })

  const {
    documents,
    totalCount,
    totalPages,
    currentPage,
    isLoading,
    fetchManagerSchoolDocuments,
    approveDocument,
    rejectDocument,
    revokeApproval,
    softDeleteDocument,
    setCurrentPage
  } = useDocumentStore()

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [subjectsData, categoriesData] = await Promise.all([
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

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, searchQuery, selectedCategory, selectedGrade, selectedSubject])

  useEffect(() => {
    fetchDocuments()
  }, [statusFilter, searchQuery, selectedCategory, selectedGrade, selectedSubject, currentPage, pageSize])

const fetchDocuments = () => {
  let isApproved: boolean | undefined = undefined

  if (statusFilter === "approved") {
    isApproved = true
  } else if (statusFilter === "rejected") {
    isApproved = false
  }

  fetchManagerSchoolDocuments(
    MANAGER_SCHOOL_ID,
    searchQuery || undefined,
    selectedCategory !== "all" ? parseInt(selectedCategory) : undefined,
    selectedGrade !== "all" ? parseInt(selectedGrade) : undefined,
    selectedSubject !== "all" ? selectedSubject : undefined,
    undefined,
    isApproved,
    true,
    currentPage,
    pageSize
  )
}

  const handleClearFilters = () => {
    setSearchQuery("")
    setSelectedSubject("all")
    setSelectedGrade("all")
    setSelectedCategory("all")
    setStatusFilter("pending")
  }

  const openDialog = (type: typeof dialogState.type, documentId: number, documentName: string) => {
    setDialogState({
      open: true,
      type,
      documentId,
      documentName
    })
  }

  const closeDialog = () => {
    setDialogState({
      open: false,
      type: null,
      documentId: null,
      documentName: ""
    })
  }

  const handleConfirmAction = async () => {
    if (!dialogState.documentId || !dialogState.type) return

    let success = false

    switch (dialogState.type) {
      case "approve":
        success = await approveDocument(dialogState.documentId, UPDATED_BY)
        break
      case "reject":
        success = await rejectDocument(dialogState.documentId, UPDATED_BY)
        break
      case "revoke":
        success = await revokeApproval(dialogState.documentId, UPDATED_BY)
        break
      case "hide":
        success = await softDeleteDocument(dialogState.documentId, UPDATED_BY)
        break
    }

    if (success) {
      if (dialogState.type === "approve") {
        setSuccessMessage("Phê duyệt tài liệu thành công")
      } else if (dialogState.type === "reject") {
        setSuccessMessage("Từ chối tài liệu thành công")
      } else if (dialogState.type === "revoke") {
        setSuccessMessage("Thu hồi phê duyệt thành công")
      } else if (dialogState.type === "hide") {
        setSuccessMessage("Ẩn tài liệu thành công")
      }
      
      setTimeout(() => setSuccessMessage(""), 3000)
      setTimeout(() => fetchDocuments(), 500)
    } else {
      setErrorMessage("Thao tác thất bại")
      setTimeout(() => setErrorMessage(""), 3000)
    }

    closeDialog()
  }

  const handleViewDocument = (id: number) => {
    navigate(`/manager/documents-list/view/${id}`)
  }

  const getDialogContent = () => {
    switch (dialogState.type) {
      case "approve":
        return {
          title: "Xác nhận phê duyệt",
          description: `Bạn có chắc chắn muốn phê duyệt tài liệu "${dialogState.documentName}"?`,
          confirmText: "Phê duyệt"
        }
      case "reject":
        return {
          title: "Xác nhận từ chối",
          description: `Bạn có chắc chắn muốn từ chối tài liệu "${dialogState.documentName}"?`,
          confirmText: "Từ chối"
        }
      case "revoke":
        return {
          title: "Xác nhận thu hồi",
          description: `Bạn có chắc chắn muốn thu hồi phê duyệt tài liệu "${dialogState.documentName}"?`,
          confirmText: "Thu hồi"
        }
      case "hide":
        return {
          title: "Xác nhận ẩn",
          description: `Bạn có chắc chắn muốn ẩn tài liệu "${dialogState.documentName}"?`,
          confirmText: "Ẩn"
        }
      default:
        return {
          title: "",
          description: "",
          confirmText: ""
        }
    }
  }

  const renderActionButtons = (status: string, doc: Document) => {
    if (status === "pending") {
      return (
        <div className="flex flex-col gap-1.5 items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs bg-transparent px-3 h-8 w-20"
            onClick={() => handleViewDocument(doc.id)}
          >
            Xem
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs bg-transparent px-3 h-8 w-20"
            onClick={() => openDialog("reject", doc.id, doc.name)}
          >
            Từ chối
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs bg-transparent px-3 h-8 w-20"
            onClick={() => openDialog("approve", doc.id, doc.name)}
          >
            Chấp nhận
          </Button>
        </div>
      )
    } else if (status === "approved") {
      return (
        <div className="flex flex-col gap-1.5 items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs bg-transparent px-3 h-8 w-20"
            onClick={() => handleViewDocument(doc.id)}
          >
            Xem
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs bg-transparent px-3 h-8 w-20"
            onClick={() => openDialog("revoke", doc.id, doc.name)}
          >
            Thu hồi
          </Button>
        </div>
      )
    } else if (status === "rejected") {
      return (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs bg-transparent px-3 h-8 w-20"
            onClick={() => openDialog("hide", doc.id, doc.name)}
          >
            Ẩn
          </Button>
        </div>
      )
    }
  }

  const getPageTitle = () => {
    if (statusFilter === "pending") return "Danh sách tài liệu chờ phê duyệt"
    if (statusFilter === "approved") return "Danh sách tài liệu đã phê duyệt"
    if (statusFilter === "rejected") return "Danh sách tài liệu bị từ chối"
    return "Danh sách tài liệu"
  }

  const dialogContent = getDialogContent()

  return (
    <div className="flex gap-4">
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
      `}</style>

      <div className="w-40 bg-white rounded-xl shadow-md p-4 h-fit flex-shrink-0">
        <h3 className="font-semibold mb-3 text-sm">Bộ lọc</h3>

        <div className="mb-3">
          <label className="text-xs text-gray-600 mb-1.5 block">Tìm kiếm</label>
          <Input 
            placeholder="Tên tài liệu..." 
            className="text-xs h-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-600 mb-1.5 block">Trạng thái</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="pending">Chờ phê duyệt</SelectItem>
                <SelectItem value="approved">Đã phê duyệt</SelectItem>
                <SelectItem value="rejected">Bị từ chối</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-600 mb-1.5 block">Môn học</label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Tất cả môn" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tất cả môn</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.name}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-600 mb-1.5 block">Lớp</label>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Tất cả lớp" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tất cả lớp</SelectItem>
                {[...Array(12)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    Lớp {i + 1}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-600 mb-1.5 block">Loại tài liệu</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Tất cả loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Button 
            variant="outline" 
            className="w-full bg-transparent h-8 text-xs"
            onClick={handleClearFilters}
          >
            Xóa bộ lọc
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{getPageTitle()}</h2>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="text-center font-semibold text-gray-700 w-12 px-2">STT</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700 w-20 px-2">TÀI LIỆU</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700 w-32 px-2">MÔ TẢ</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700 w-32 px-2">TÁC GIẢ</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700 w-24 px-2">MÔN HỌC</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700 w-24 px-2">NGÀY TẠO</TableHead>
                    {statusFilter === "approved" && (
                      <TableHead className="text-center font-semibold text-gray-700 w-24 px-2">NGÀY DUYỆT</TableHead>
                    )}
                    <TableHead className="text-center font-semibold text-gray-700 w-32 px-2">THAO TÁC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc, index) => (
                    <TableRow key={doc.id} className="hover:bg-gray-50">
                      <TableCell className="text-center text-sm py-3 px-2">
                        {(currentPage - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell className="py-3 px-2">
                        <div className="flex items-center justify-center h-full">
                          <div className="text-xs w-20 break-words text-center">
                            <div className="font-medium line-clamp-2">{doc.name}</div>
                            <div className="text-gray-500 text-[11px]">
                              {doc.fileType || "PDF"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-2">
                        <div className="flex items-center justify-center h-full">
                          <div className="text-xs w-32 h-20 overflow-y-auto scrollbar-thin text-left px-1 whitespace-normal break-words">
                            {doc.description || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-2">
                        <div className="flex items-center justify-center h-full">
                          <div className="text-xs w-32 break-words text-center">
                            <div className="font-medium line-clamp-1">{doc.uploaderName || "N/A"}</div>
                            <div className="text-gray-500 text-[11px] line-clamp-1">{doc.schoolName || "N/A"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-3 px-2">
                        <div className="text-xs">
                          <div className="mb-0.5">{doc.subjectName}</div>
                          <div className="text-gray-500 text-[11px]">Lớp {doc.grade}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs py-3 px-2">
                        {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      {statusFilter === "approved" && (
                        <TableCell className="text-center text-xs py-3 px-2">
                          {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString("vi-VN") : "-"}
                        </TableCell>
                      )}
                      <TableCell className="py-3 px-2">
                        <div className="flex items-center justify-center h-full">
                          {renderActionButtons(statusFilter, doc)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4 px-2">
              <span className="text-sm text-gray-600">
                Hiển thị {Math.min((currentPage - 1) * pageSize + 1, totalCount)}-
                {Math.min(currentPage * pageSize, totalCount)} trong tổng số {totalCount} tài liệu
              </span>
              <div className="flex items-center gap-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      let pageNumber: number
                      if (totalPages <= 5) {
                        pageNumber = i + 1
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i
                      } else {
                        pageNumber = currentPage - 2 + i
                      }
                      
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink 
                            onClick={() => setCurrentPage(pageNumber)}
                            isActive={currentPage === pageNumber}
                            className="cursor-pointer"
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Hiển thị:</span>
                  <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600">/trang</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AlertDialog open={dialogState.open} onOpenChange={closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              {dialogContent.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ManagerDocumentApprovalList