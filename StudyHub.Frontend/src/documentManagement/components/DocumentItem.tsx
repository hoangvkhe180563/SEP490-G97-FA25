import type React from "react"
import { Card } from "@/common/components/ui/card"
import { Badge } from "@/common/components/ui/badge"
import type { Document } from "@/documentManagement/interfaces/document"

interface DocumentItemProps {
  document: Document
}

const getSubjectName = (subjectId: number): string => {
  const subjects: Record<number, string> = {
    1: "Toán",
    2: "Văn",
    3: "Tiếng Anh",
    4: "Vật lý",
    5: "Hóa học",
  }
  return subjects[subjectId] || "Khác"
}

const DocumentItem: React.FC<DocumentItemProps> = ({ document }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative aspect-video bg-gray-200">
        {document.thumbnail ? (
          <img
            src={document.thumbnail || "/placeholder.svg"}
            alt={document.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-sm">
              {getSubjectName(document.subjectId)} lớp {document.gradeId}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            Lớp {document.gradeId}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {getSubjectName(document.subjectId)}
          </Badge>
          {document.isSchoolDocument && <Badge className="text-xs bg-emerald-500 text-white">Tài liệu trường</Badge>}
        </div>
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{document.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{document.description || "Không có mô tả"}</p>
        <div className="text-xs text-gray-500">
          Cập nhật: {new Date(document.createdAt).toLocaleDateString("vi-VN")}
        </div>
      </div>
    </Card>
  )
}

export default DocumentItem
