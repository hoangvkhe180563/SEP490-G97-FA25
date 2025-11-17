// src/documentManagement/components/OwnedDocumentItem.tsx
import { FileText } from "lucide-react";
import { Card } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import type { Document } from "@/documentManagement/interfaces/document";

interface OwnedDocumentItemProps {
  document: Document;
  onClick: () => void;
  onDoubleClick: () => void;
  getAccessType: (doc: Document) => string;
}

const getAccessLabel = (type: string) => {
  switch (type) {
    case "public":
      return "Công khai";
    case "school":
      return "Trường";
    case "class":
      return "Lớp học";
    default:
      return "Công khai";
  }
};

const getAccessBadgeClass = (type: string) => {
  switch (type) {
    case "public":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "school":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "class":
      return "bg-green-50 text-green-700 border-green-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const getApprovalStatus = (
  isApproved: boolean | null,
  hasEditRequest?: boolean
) => {
  if (hasEditRequest === true)
    return {
      label: "Chờ duyệt sửa",
      class: "bg-orange-50 text-orange-700 border-orange-200",
    };
  if (isApproved === true)
    return {
      label: "Đã duyệt",
      class: "bg-green-50 text-green-700 border-green-200",
    };
  if (isApproved === false)
    return { label: "Từ chối", class: "bg-red-50 text-red-700 border-red-200" };
  return {
    label: "Chờ duyệt",
    class: "bg-amber-50 text-amber-700 border-amber-200",
  };
};

export default function OwnedDocumentItem({
  document,
  onClick,
  onDoubleClick,
  getAccessType,
}: OwnedDocumentItemProps) {
  const accessType = getAccessType(document);
  const status = getApprovalStatus(document.isApproved, document.isRequested);

  return (
    <Card
      className="group relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200 border border-slate-200 bg-white"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
        {document.thumbnail ? (
          <img
            src={document.thumbnail}
            alt={document.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-24 bg-white rounded shadow-sm flex items-center justify-center">
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge
            variant="secondary"
            className={`text-[10px] px-2 py-0.5 font-medium ${getAccessBadgeClass(
              accessType
            )}`}
          >
            {getAccessLabel(accessType)}
          </Badge>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-normal text-sm text-slate-900 line-clamp-2 min-h-[2.5rem] mb-1">
          {document.name}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <span>Lớp {document.grade}</span>
          {document.subjectName && (
            <>
              <span>•</span>
              <span className="truncate">{document.subjectName}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 mb-2">
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-300"
          >
            {document.documentLengthType === "Short"
              ? "Ngắn"
              : document.documentLengthType === "Medium"
              ? "TB"
              : "Dài"}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-300"
          >
            {document.documentLevel === "Easy"
              ? "Dễ"
              : document.documentLevel === "Medium"
              ? "TB"
              : "Khó"}
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            {new Date(document.createdAt).toLocaleDateString("vi-VN")}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 font-medium ${status.class}`}
          >
            {status.label}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
