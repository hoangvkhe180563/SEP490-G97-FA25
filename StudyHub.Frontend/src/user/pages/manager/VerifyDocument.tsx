import { useState } from "react"
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/common/components/ui/pagination"

const mockDocuments = [
  {
    id: 1,
    stt: 1,
    title: "Bài học Lịch sử Việt Nam",
    fileInfo: "PDF • 1.9 MB • 18 trang",
    description: "Tài liệu cho ABC",
    author: "GV Lê Tài Liêu",
    authorType: "THCS Tài liệu Khối 2",
    subject: "Tài liệu Khối 2",
    grade: "Khối 2",
    createdDate: "17/03/2025",
    approvalDate: "18/03/2025",
    status: "pending" as const,
    price: 0,
  },
  {
    id: 2,
    stt: 2,
    title: "Bài học Lịch sử Việt Nam",
    fileInfo: "PDF • 1.9 MB • 18 trang",
    description: "Tài liệu cho ABC",
    author: "GV Lê Tài Liêu",
    authorType: "THCS Tài liệu Khối 2",
    subject: "Tài liệu Khối 2",
    grade: "Khối 2",
    createdDate: "17/03/2025",
    approvalDate: "18/03/2025",
    status: "pending" as const,
    price: 50000,
  },
  {
    id: 3,
    stt: 3,
    title: "Bài học Lịch sử Việt Nam",
    fileInfo: "PDF • 1.9 MB • 18 trang",
    description: "Tài liệu cho ABC",
    author: "GV Lê Tài Liêu",
    authorType: "THCS Tài liệu Khối 2",
    subject: "Tài liệu Khối 2",
    grade: "Khối 2",
    createdDate: "17/03/2025",
    approvalDate: "18/03/2025",
    status: "pending" as const,
    price: 0,
  },
  {
    id: 4,
    stt: 4,
    title: "Bài học Toán học",
    fileInfo: "PDF • 2.1 MB • 20 trang",
    description: "Tài liệu cho DEF",
    author: "GV Nguyễn Văn A",
    authorType: "THCS Tài liệu Khối 3",
    subject: "Toán học",
    grade: "Khối 3",
    createdDate: "15/03/2025",
    approvalDate: "16/03/2025",
    status: "approved" as const,
    price: 100000,
  },
  {
    id: 5,
    stt: 5,
    title: "Bài học Văn học",
    fileInfo: "PDF • 1.5 MB • 15 trang",
    description: "Tài liệu cho GHI",
    author: "GV Trần Thị B",
    authorType: "THCS Tài liệu Khối 4",
    subject: "Văn học",
    grade: "Khối 4",
    createdDate: "14/03/2025",
    approvalDate: "15/03/2025",
    status: "rejected" as const,
    price: 0,
  },
]

const DocumentApprovalList = () => {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [documents] = useState(mockDocuments)

  const filteredDocuments = documents.filter((doc) => {
    if (statusFilter === "all") return true
    return doc.status === statusFilter
  })

  const handleViewDocument = () => {
    navigate("/manager/documents-list/view")
  }

  const formatPrice = (price: number) => {
    if (price === 0) return "Miễn phí"
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const renderActionButtons = (status: string) => {
    if (status === "all") {
      return (
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs bg-transparent px-3 h-8"
            onClick={handleViewDocument}
          >
            Xem
          </Button>
        </div>
      )
    } else if (status === "pending") {
      return (
        <div className="flex flex-col gap-1.5 items-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs bg-transparent px-3 h-8 w-24"
            onClick={handleViewDocument}
          >
            Xem
          </Button>
          <Button variant="outline" size="sm" className="text-xs bg-transparent px-3 h-8 w-24">
            Từ chối
          </Button>
          <Button variant="outline" size="sm" className="text-xs bg-transparent px-3 h-8 w-24">
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
            className="text-xs bg-transparent px-3 h-8 w-24"
            onClick={handleViewDocument}
          >
            Xem
          </Button>
          <Button variant="outline" size="sm" className="text-xs bg-transparent px-3 h-8 w-24">
            Thu hồi
          </Button>
        </div>
      )
    } else if (status === "rejected") {
      return (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" className="text-xs bg-transparent px-3 h-8 w-24">
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

  return (
    <div className="flex gap-4">
      <div className="w-40 bg-white rounded-xl shadow-md p-4 h-fit flex-shrink-0">
        <h3 className="font-semibold mb-3 text-sm">Bộ lọc</h3>

        <div className="mb-3">
          <label className="text-xs text-gray-600 mb-1.5 block">Tìm kiếm</label>
          <Input placeholder="Tên tài liệu..." className="text-xs h-8" />
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-600 mb-1.5 block">Trạng thái</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ phê duyệt</SelectItem>
                <SelectItem value="approved">Đã phê duyệt</SelectItem>
                <SelectItem value="rejected">Bị từ chối</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-600 mb-1.5 block">Môn học</label>
          <Select>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Tất cả môn" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tất cả môn</SelectItem>
                <SelectItem value="math">Toán học</SelectItem>
                <SelectItem value="literature">Văn học</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-600 mb-1.5 block">Lớp</label>
          <Select>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Tất cả lớp" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tất cả lớp</SelectItem>
                <SelectItem value="10">Lớp 10</SelectItem>
                <SelectItem value="11">Lớp 11</SelectItem>
                <SelectItem value="12">Lớp 12</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-600 mb-1.5 block">Loại tài liệu</label>
          <Select>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Tất cả loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="lecture">Bài giảng</SelectItem>
                <SelectItem value="exercise">Bài tập</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4">
          <label className="text-xs text-gray-600 mb-1.5 block">Ngày phê duyệt</label>
          <div className="flex flex-col gap-1.5">
            <Input type="date" className="text-xs h-8" placeholder="dd/mm/yyyy" />
            <span className="text-xs text-gray-500 text-center">đến</span>
            <Input type="date" className="text-xs h-8" placeholder="dd/mm/yyyy" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white h-8 text-xs">Áp dụng</Button>
          <Button variant="outline" className="w-full bg-transparent h-8 text-xs">
            Xóa bộ lọc
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{getPageTitle()}</h2>
          <Button variant="outline" size="sm">
            Ẩn tất cả
          </Button>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="text-center font-semibold text-gray-700 w-14 px-2">STT</TableHead>
                <TableHead className="text-center font-semibold text-gray-700 min-w-[200px] px-3">TÀI LIỆU</TableHead>
                <TableHead className="text-center font-semibold text-gray-700 min-w-[130px] px-3">MÔ TẢ</TableHead>
                <TableHead className="text-center font-semibold text-gray-700 min-w-[160px] px-3">TÁC GIẢ</TableHead>
                <TableHead className="text-center font-semibold text-gray-700 min-w-[130px] px-3">MÔN HỌC</TableHead>
                <TableHead className="text-center font-semibold text-gray-700 w-24 px-2">GIÁ</TableHead>
                <TableHead className="text-center font-semibold text-gray-700 w-28 px-2">NGÀY TẠO</TableHead>
                {(statusFilter === "pending" || statusFilter === "approved") && (
                  <TableHead className="text-center font-semibold text-gray-700 w-28 px-2">
                    NGÀY<br />PHÊ DUYỆT
                  </TableHead>
                )}
                <TableHead className="text-center font-semibold text-gray-700 w-32 px-2">THAO TÁC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-gray-50">
                  <TableCell className="text-center text-sm py-3 px-2">{doc.stt}</TableCell>
                  <TableCell className="py-3 px-3">
                    <div className="text-xs">
                      <div className="font-medium mb-0.5">{doc.title}</div>
                      <div className="text-gray-500 text-[11px]">{doc.fileInfo}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs py-3 px-3">{doc.description}</TableCell>
                  <TableCell className="py-3 px-3">
                    <div className="text-xs">
                      <div className="font-medium mb-0.5">{doc.author}</div>
                      <div className="text-gray-500 text-[11px]">{doc.authorType}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-3 px-3">
                    <div className="text-xs mb-0.5">{doc.subject}</div>
                    <div className="text-gray-500 text-[11px]">{doc.grade}</div>
                  </TableCell>
                  <TableCell className="text-center text-xs py-3 px-2">
                    {formatPrice(doc.price)}
                  </TableCell>
                  <TableCell className="text-center text-xs py-3 px-2">{doc.createdDate}</TableCell>
                  {(statusFilter === "pending" || statusFilter === "approved") && (
                    <TableCell className="text-center text-xs py-3 px-2">{doc.approvalDate}</TableCell>
                  )}
                  <TableCell className="py-3 px-2">{renderActionButtons(statusFilter)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4 px-2">
          <span className="text-sm text-gray-600">Hiển thị 1-5 trong tổng số 156 tài liệu</span>
          <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Hiển thị:</span>
              <Select defaultValue="5">
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
      </div>
    </div>
  )
}

export default DocumentApprovalList