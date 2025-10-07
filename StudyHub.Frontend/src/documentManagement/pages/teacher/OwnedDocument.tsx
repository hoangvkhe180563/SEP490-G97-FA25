import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/common/components/ui/input"
import { Button } from "@/common/components/ui/button"
import { Card } from "@/common/components/ui/card"
import { Badge } from "@/common/components/ui/badge"
import { Checkbox } from "@/common/components/ui/checkbox"
import { Label } from "@/common/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/common/components/ui/select"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/common/components/ui/form"
import { Search, Grid3x3, List, FileText, Download, Edit, Trash2, Share2, X, ChevronDown } from "lucide-react"

const mockDocuments = [
  {
    id: 1,
    name: "Bài tập Vật lý nâng cao - Dao động cơ",
    subject: "Vật lý",
    grade: "Lớp 12",
    type: "Bài tập",
    date: "12/03/2024",
    status: "Công khai",
    creator: "Nguyễn Văn A",
    accessRight: "Công khai",
    documentStatus: "Chưa duyệt",
  },
  {
    id: 2,
    name: "Bài giảng Hóa học - Phản ứng oxi hóa khử",
    subject: "Hóa học",
    grade: "Lớp 11",
    type: "Bài giảng",
    date: "08/03/2024",
    status: "Trường",
    creator: "Nguyễn Văn A",
    accessRight: "Trường",
    documentStatus: "Chưa duyệt",
  },
  {
    id: 3,
    name: "Bài tập thí nghiệm Hóa học - Điện phân",
    subject: "Hóa học",
    grade: "Lớp 11",
    type: "Bài tập",
    date: "28/02/2024",
    status: "Công khai",
    creator: "Nguyễn Văn A",
    accessRight: "Công khai",
    documentStatus: "Chưa duyệt",
  },
]

const filterSchema = z.object({
  grade: z.string(),
  subject: z.string(),
  type: z.string(),
  access: z.string(),
  pendingOnly: z.boolean(),
  sortBy: z.string(),
})

type FilterValues = z.infer<typeof filterSchema>

// Sidebar Component - Bộ lọc bên trái
interface FilterSidebarProps {
  form: UseFormReturn<FilterValues>
}

function FilterSidebar({ form }: FilterSidebarProps) {
  const { control } = form

  return (
    <div className="w-56 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <ChevronDown className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Bộ lọc</h3>
        </div>

        <div className="space-y-4">
          <FormField
            control={control}
            name="grade"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Khối lớp</FormLabel>
                <FormControl>
                  <div className="space-y-1">
                    {["Tất cả", "Lớp 11", "Lớp 12"].map((grade) => (
                      <Button
                        key={grade}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start h-8 px-3 text-sm ${
                          field.value === grade 
                            ? "bg-gray-900 text-white hover:bg-gray-900 hover:text-white" 
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => field.onChange(grade)}
                      >
                        {grade}
                      </Button>
                    ))}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Môn học</FormLabel>
                <FormControl>
                  <div className="space-y-1">
                    {["Tất cả", "Vật lý", "Hóa học"].map((subject) => (
                      <Button
                        key={subject}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start h-8 px-3 text-sm ${
                          field.value === subject 
                            ? "bg-gray-900 text-white hover:bg-gray-900 hover:text-white" 
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => field.onChange(subject)}
                      >
                        {subject}
                      </Button>
                    ))}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Loại tài liệu</FormLabel>
                <FormControl>
                  <div className="space-y-1">
                    {["Tất cả", "Bài giảng", "Bài tập", "Đề thi"].map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start h-8 px-3 text-sm ${
                          field.value === type 
                            ? "bg-gray-900 text-white hover:bg-gray-900 hover:text-white" 
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => field.onChange(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="access"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium">Quyền Truy cập</FormLabel>
                <FormControl>
                  <div className="space-y-1">
                    {["Tất cả", "Công khai", "Trường", "Riêng tư"].map((access) => (
                      <Button
                        key={access}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start h-8 px-3 text-sm ${
                          field.value === access 
                            ? "bg-gray-900 text-white hover:bg-gray-900 hover:text-white" 
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => field.onChange(access)}
                      >
                        {access}
                      </Button>
                    ))}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}

// Header Component - Search, Trạng thái, Sort, View toggle
interface DocumentHeaderProps {
  form: UseFormReturn<FilterValues>
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
}

function DocumentHeader({ form, viewMode, setViewMode }: DocumentHeaderProps) {
  const { control } = form

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Tìm kiếm tài liệu, tác giả ..." 
            className="pl-10 h-9 text-sm"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">Trạng thái</Label>
            <FormField
              control={control}
              name="pendingOnly"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <Label className="text-sm font-normal cursor-pointer">
                    Chờ duyệt
                  </Label>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="sortBy"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Cập nhật gần đây</SelectItem>
                      <SelectItem value="name">Tên tài liệu</SelectItem>
                      <SelectItem value="date">Ngày tạo</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex gap-1 ml-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-9 w-9 p-0 ${viewMode === "list" ? "bg-gray-100" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-9 w-9 p-0 ${viewMode === "grid" ? "bg-gray-100" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Document Grid Component - Hiển thị danh sách tài liệu dạng grid
interface DocumentGridProps {
  documents: typeof mockDocuments
  onSelectDocument: (id: number) => void
}

function DocumentGrid({ documents, onSelectDocument }: DocumentGridProps) {
  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
      <div className="grid grid-cols-2 gap-4">
        {documents.map((doc) => (
          <Card
            key={doc.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow border border-gray-200 bg-white"
            onClick={() => onSelectDocument(doc.id)}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-600 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm mb-2 line-clamp-2">{doc.name}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <span>{doc.subject}</span>
                  <span>•</span>
                  <span>{doc.grade}</span>
                  <span>•</span>
                  <span>{doc.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{doc.date}</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      doc.status === "Công khai"
                        ? "border-gray-900 text-gray-900"
                        : doc.status === "Trường"
                        ? "border-gray-600 text-gray-600"
                        : "border-gray-400 text-gray-500"
                    }`}
                  >
                    • {doc.status}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Document Detail Component - Sidebar bên phải hiển thị chi tiết tài liệu
interface DocumentDetailProps {
  document: typeof mockDocuments[0]
  onClose: () => void
  onEdit: () => void
}

function DocumentDetail({ document, onClose, onEdit }: DocumentDetailProps) {
  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg">Chi tiết tài liệu</h2>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="w-32 h-32 rounded-lg bg-gray-600 flex items-center justify-center mb-4">
            <FileText className="w-16 h-16 text-white" />
          </div>
          <h3 className="font-medium text-center mb-2 px-2">{document.name}</h3>
          <div className="flex gap-2 text-xs text-gray-500">
            <span>PDF</span>
            <span>•</span>
            <span>{document.subject}</span>
            <span>•</span>
            <span>{document.grade}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <Button type="button" variant="outline" size="sm" className="h-9 text-xs">
            <Download className="w-4 h-4 mr-1" />
            Tải xuống
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 text-xs">
            <Share2 className="w-4 h-4 mr-1" />
            Chia sẻ
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="h-9 text-xs"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4 mr-1" />
            Chỉnh sửa
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-9 text-xs text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-1" />
            Xóa
          </Button>
        </div>

        <div>
          <h3 className="font-semibold text-sm mb-4">Thông tin</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ngày tạo</span>
              <span className="font-medium">{document.date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Người tạo</span>
              <span className="font-medium">{document.creator}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Quyền truy cập</span>
              <span className="font-medium">{document.accessRight}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Trạng thái</span>
              <span className="font-medium">{document.documentStatus}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main Component
export default function OwnedDocument() {
  const navigate = useNavigate()
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      grade: "Tất cả",
      subject: "Tất cả",
      type: "Tất cả",
      access: "Tất cả",
      pendingOnly: false,
      sortBy: "recent",
    },
  })

  const selectedDoc = mockDocuments.find((doc) => doc.id === selectedDocument)

  return (
    <Form {...form}>
      <div className="flex h-screen bg-gray-50">
        <FilterSidebar form={form} />
        <div className="flex-1 flex flex-col">
          <DocumentHeader form={form} viewMode={viewMode} setViewMode={setViewMode} />
          <DocumentGrid documents={mockDocuments} onSelectDocument={setSelectedDocument} />
        </div>
        {selectedDoc && (
          <DocumentDetail 
            document={selectedDoc} 
            onClose={() => setSelectedDocument(null)}
            onEdit={() => navigate('/teacher/update-document')}
          />
        )}
      </div>
    </Form>
  )
}