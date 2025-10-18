// src/documentManagement/components/documents/DocumentGrid.tsx
import DocumentItem from "@/documentManagement/components/DocumentItem"
import type { Document } from "@/documentManagement/interfaces/document"

interface DocumentGridProps {
  documents: Document[]
  loading?: boolean
  onDocumentClick: (documentId: number) => void
}

const DocumentGrid = ({ documents, loading, onDocumentClick }: DocumentGridProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải tài liệu...</p>
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Không tìm thấy tài liệu nào</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {documents.map((d) => (
        <div key={d.id} onClick={() => onDocumentClick(d.id)} className="cursor-pointer">
          <DocumentItem document={d} />
        </div>
      ))}
    </div>
  )
}

export default DocumentGrid