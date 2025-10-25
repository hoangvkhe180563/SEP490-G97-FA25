// src/documentManagement/components/OwnedDocumentListItem.tsx
import { FileText } from "lucide-react"
import { Badge } from "@/common/components/ui/badge"
import type { Document } from "@/documentManagement/interfaces/document"

interface OwnedDocumentListItemProps {
  document: Document
  onClick: () => void
  onDoubleClick: () => void
  getAccessType: (doc: Document) => string
}

const getAccessLabel = (type: string) => {
  switch (type) {
    case "public": return "Công khai"
    case "school": return "Trường"
    case "class": return "Lớp học"
    default: return "Công khai"
  }
}

const getApprovalStatus = (isApproved: boolean | null) => {
  if (isApproved === true) return { label: "Đã duyệt", class: "bg-green-50 text-green-700 border-green-200" }
  if (isApproved === false) return { label: "Từ chối", class: "bg-red-50 text-red-700 border-red-200" }
  return { label: "Chờ duyệt", class: "bg-amber-50 text-amber-700 border-amber-200" }
}

export default function OwnedDocumentListItem({ document, onClick, onDoubleClick, getAccessType }: OwnedDocumentListItemProps) {
  const accessType = getAccessType(document)
  const status = getApprovalStatus(document.isApproved)

  return (
    <div
      className="group grid grid-cols-[32px_1fr_90px_90px_120px_90px_90px] items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
        {document.thumbnail ? (
          <img
            src={document.thumbnail}
            alt={document.name}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <FileText className="w-4 h-4 text-slate-500" />
        )}
      </div>

      <div className="min-w-0">
        <h3 className="font-normal text-sm text-slate-900 truncate">
          {document.name}
        </h3>
      </div>

      <span className="text-xs text-slate-500">
        {getAccessLabel(accessType)}
      </span>

      <span className="text-xs text-slate-500">
        Lớp {document.grade}
      </span>

      <span className="text-xs text-slate-500 truncate">
        {document.subjectName || "-"}
      </span>

      <Badge variant="outline" className={`text-xs font-normal justify-center ${status.class}`}>
        {status.label}
      </Badge>

      <span className="text-xs text-slate-500 text-right">
        {new Date(document.createdAt).toLocaleDateString("vi-VN")}
      </span>
    </div>
  )
}