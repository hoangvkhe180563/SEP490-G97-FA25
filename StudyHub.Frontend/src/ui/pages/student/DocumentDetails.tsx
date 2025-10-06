"use client"
import { Button } from "@/common/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/common/components/ui/carousel"
import { FileText, Download } from "lucide-react"

// COMPONENT: Document preview with thumbnail
function DocumentPreview() {
  return (
    <Card className="w-40 h-48 flex flex-col items-center justify-center bg-gray-100">
      <FileText className="w-16 h-16 text-gray-400 mb-2" />
      <p className="text-sm font-medium text-gray-700">PDF Document</p>
      <p className="text-xs text-gray-500">15 trang</p>
    </Card>
  )
}

// COMPONENT: Document header with title and actions
function DocumentHeader() {
  return (
    <div className="flex-1">
      <p className="text-sm text-gray-600 mb-1">Toán - Lớp 2</p>
      <h1 className="text-2xl font-bold mb-4">Bài giảng Hàm số bậc 2 - Chương 3</h1>
      <div className="flex gap-3">
        <Button className="bg-gray-800 hover:bg-gray-900">
          <FileText className="w-4 h-4 mr-2" />
          Xem tài liệu
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Tải xuống
        </Button>
      </div>
    </div>
  )
}

// COMPONENT: Document description
function DocumentDescription() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mô tả tài liệu:</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 leading-relaxed">
          Tài liệu bài giảng chi tiết về hàm số bậc hai, bao gồm định nghĩa, tính chất, đồ thị parabol và các dạng bài
          tập cơ bản. Phù hợp cho học sinh lớp 10 học chương trình chuẩn.
        </p>
      </CardContent>
    </Card>
  )
}

// COMPONENT: Document details info
function DocumentDetailsInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thông tin chi tiết</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Ngày tạo:</span>
          <span className="font-medium">15/03/2024</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Quyền truy cập</span>
          <span className="font-medium">Công khai</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Lần cập nhất:</span>
          <span className="font-medium">20/03/2024</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Định dạng:</span>
          <span className="font-medium">PDF</span>
        </div>
      </CardContent>
    </Card>
  )
}

// COMPONENT: User info with avatar
function UserInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thông tin người dùng</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <Avatar className="w-20 h-20">
          <AvatarImage src="/placeholder.svg" />
          <AvatarFallback className="bg-gray-700 text-white text-2xl">N</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="font-semibold text-base">Nguyễn Văn A</p>
          <p className="text-sm text-gray-600">Giáo viên Trường THPT</p>
        </div>
        <Button variant="outline" className="w-full bg-transparent">
          Xem thêm tài liệu cùng tác giả
        </Button>
      </CardContent>
    </Card>
  )
}

// COMPONENT: Related document card
function RelatedDocumentCard({
  title,
  author,
  grade,
}: {
  title: string
  author: string
  grade: string
}) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm mb-1 line-clamp-2">{title}</h4>
            <p className="text-xs text-gray-600">
              {author} • {grade}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// COMPONENT: Related documents carousel section
function RelatedDocumentsSection() {
  const relatedDocs = [
    {
      id: 1,
      title: "Lượng giác cơ bản",
      author: "Lê Thị B",
      grade: "Lớp 10",
    },
    {
      id: 2,
      title: "Phương trình và bất phương trình bậc hai",
      author: "Trần Văn C",
      grade: "Lớp 10",
    },
    {
      id: 3,
      title: "Thống kê và xác suất",
      author: "Phạm Thị D",
      grade: "Lớp 10",
    },
    {
      id: 4,
      title: "Hình học không gian",
      author: "Hoàng Văn E",
      grade: "Lớp 10",
    },
  ]

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-2">Tài liệu cùng môn Toán học</h2>
      <p className="text-sm text-gray-600 mb-6">Khám phá thêm các tài liệu Toán học khác</p>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {relatedDocs.map((doc) => (
            <CarouselItem key={doc.id} className="md:basis-1/2 lg:basis-1/3">
              <RelatedDocumentCard title={doc.title} author={doc.author} grade={doc.grade} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      <div className="flex justify-center gap-2 mt-4">
        <div className="w-2 h-2 rounded-full bg-gray-800" />
        <div className="w-2 h-2 rounded-full bg-gray-300" />
        <div className="w-2 h-2 rounded-full bg-gray-300" />
      </div>
    </div>
  )
}

// COMPONENT: Main page
export default function DocumentDetails() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex gap-6 mb-6">
        <DocumentPreview />
        <DocumentHeader />
        <Button variant="outline" className="self-start bg-transparent">
          Feedback
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DocumentDescription />
        <DocumentDetailsInfo />
        <UserInfo />
      </div>

      <RelatedDocumentsSection />
    </div>
  )
}
