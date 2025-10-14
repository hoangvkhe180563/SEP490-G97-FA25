import DocumentItem from "@/documentManagement/components/DocumentItem"
import type { Document } from "@/documentManagement/interfaces/document"

interface DocumentGridProps {
  documents: Document[]
  onDocumentClick: (documentId: number) => void
}

const DocumentGrid = ({ documents, onDocumentClick }: DocumentGridProps) => {
  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Không tìm thấy tài liệu nào</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {documents.map((doc) => (
        <div key={doc.id} onClick={() => onDocumentClick(doc.id)} className="cursor-pointer">
          <DocumentItem document={doc} />
        </div>
      ))}
    </div>
  )
}

export default DocumentGrid