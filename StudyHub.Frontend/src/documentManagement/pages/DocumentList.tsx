import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Input } from "@/common/components/ui/input"
import { Button } from "@/common/components/ui/button"
import { Checkbox } from "@/common/components/ui/checkbox"
import { Label } from "@/common/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/common/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/common/components/ui/pagination"
import { Search } from "lucide-react"
import DocumentItem from "@/documentManagement/components/DocumentItem"
import type { Document } from "@/documentManagement/interfaces/document"

const initialDocuments: Document[] = [
  {
    id: 1,
    name: "Bài tập nâng cao Toán lớp 5",
    subjectId: 1,
    gradeId: 5,
    documentCategoryId: 3,
    accessibilityId: 1,
    documentUrl: "/docs/math-5.pdf",
    createdAt: "2025-01-15T10:00:00Z",
    createdBy: "teacher1",
    updatedAt: null,
    updatedBy: null,
    deletedAt: null,
    isApproved: true,
    status: true,
    description: "Tuyển tập các bài tập nâng cao giúp học sinh phát triển tư duy toán học",
    thumbnail: "/math-textbook.png",
    schoolId: 1,
    isFeatured: true,
    price: 0,
    isSchoolDocument: false,
  },
  {
    id: 2,
    name: "Tác phẩm văn học lớp 8",
    subjectId: 2,
    gradeId: 8,
    documentCategoryId: 1,
    accessibilityId: 1,
    documentUrl: "/docs/van-8.pdf",
    createdAt: "2025-01-18T14:30:00Z",
    createdBy: "teacher2",
    updatedAt: null,
    updatedBy: null,
    deletedAt: null,
    isApproved: true,
    status: true,
    description: "Phân tích chi tiết các tác phẩm văn học trong chương trình lớp 8",
    thumbnail: "/literature-book.png",
    schoolId: 1,
    isFeatured: false,
    price: 0,
    isSchoolDocument: false,
  },
  {
    id: 3,
    name: "Grammar cơ bản lớp 10",
    subjectId: 3,
    gradeId: 10,
    documentCategoryId: 2,
    accessibilityId: 1,
    documentUrl: "/docs/english-10.pdf",
    createdAt: "2025-01-20T09:15:00Z",
    createdBy: "teacher3",
    updatedAt: null,
    updatedBy: null,
    deletedAt: null,
    isApproved: true,
    status: true,
    description: "Tổng hợp ngữ pháp tiếng Anh cơ bản cho học sinh lớp 10",
    thumbnail: "/english-grammar.jpg",
    schoolId: 1,
    isFeatured: true,
    price: 0,
    isSchoolDocument: true,
  },
  {
    id: 4,
    name: "Cơ học chất điểm",
    subjectId: 4,
    gradeId: 12,
    documentCategoryId: 1,
    accessibilityId: 1,
    documentUrl: "/docs/physics-12.pdf",
    createdAt: "2025-01-22T11:00:00Z",
    createdBy: "teacher4",
    updatedAt: null,
    updatedBy: null,
    deletedAt: null,
    isApproved: true,
    status: true,
    description: "Lý thuyết và bài tập về cơ học chất điểm cho kỳ thi THPT",
    thumbnail: "/physics-mechanics-diagram.png",
    schoolId: 1,
    isFeatured: false,
    price: 0,
    isSchoolDocument: false,
  },
  {
    id: 7,
    name: "Văn học Việt Nam hiện đại",
    subjectId: 2,
    gradeId: 11,
    documentCategoryId: 1,
    accessibilityId: 1,
    documentUrl: "/docs/van-11.pdf",
    createdAt: "2025-01-30T08:00:00Z",
    createdBy: "teacher2",
    updatedAt: null,
    updatedBy: null,
    deletedAt: null,
    isApproved: true,
    status: true,
    description: "Tổng quan văn học Việt Nam thời kỳ đổi mới",
    thumbnail: "/literature-book.png",
    schoolId: 1,
    isFeatured: false,
    price: 0,
    isSchoolDocument: false,
  },
  {
    id: 8,
    name: "Đề thi thử THPT Quốc gia",
    subjectId: 1,
    gradeId: 12,
    documentCategoryId: 3,
    accessibilityId: 1,
    documentUrl: "/docs/de-thi-thu.pdf",
    createdAt: "2025-02-01T15:00:00Z",
    createdBy: "teacher1",
    updatedAt: null,
    updatedBy: null,
    deletedAt: null,
    isApproved: true,
    status: true,
    description: "Bộ đề thi thử THPT Quốc gia môn Toán năm 2025",
    thumbnail: "/math-textbook.png",
    schoolId: 1,
    isFeatured: true,
    price: 0,
    isSchoolDocument: true,
  },
]

const DocumentList = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [documents] = useState<Document[]>(initialDocuments)
  const [showSchoolDocs, setShowSchoolDocs] = useState(false)

  const displayedDocuments = showSchoolDocs ? documents : documents.filter((doc) => !doc.isSchoolDocument)

  const handleDocumentClick = () => {
    // Lấy base path từ current location (/, /teacher, /parent)
    const basePath = location.pathname.split('/documents')[0]
    navigate(`${basePath}/documents/document-details`)
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input type="text" placeholder="Tìm kiếm tài liệu, người dùng..." className="pl-10" />
        </div>
        <Select defaultValue="newest">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sắp xếp theo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mới nhất</SelectItem>
            <SelectItem value="oldest">Cũ nhất</SelectItem>
            <SelectItem value="name">Tên A-Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-6">
        <div className="w-64 flex-shrink-0">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-4">Bộ lọc</h3>

            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="school-docs"
                  checked={showSchoolDocs}
                  onCheckedChange={(checked) => setShowSchoolDocs(checked === true)}
                />
                <Label htmlFor="school-docs" className="text-sm cursor-pointer">
                  Tài liệu của trường
                </Label>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-sm mb-3">Lớp</h4>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                  <Button key={grade} variant="outline" size="sm" className="h-9 bg-transparent">
                    {grade}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-sm mb-3">Môn học</h4>
              <div className="space-y-2">
                {["Toán", "Văn", "Tiếng Anh", "Vật lý", "Hóa học"].map((subject) => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox id={`subject-${subject}`} />
                    <Label htmlFor={`subject-${subject}`} className="text-sm cursor-pointer">
                      {subject}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-3">Loại Tài liệu</h4>
              <div className="space-y-2">
                {["Video", "Bài giảng", "Bài tập"].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox id={`type-${type}`} />
                    <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {displayedDocuments.map((doc) => (
              <div key={doc.id} onClick={handleDocumentClick} className="cursor-pointer">
                <DocumentItem document={doc} />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 px-2">
            <span className="text-sm text-gray-600">Showing 1 to {displayedDocuments.length} of 25 results</span>
            <div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">25</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentList