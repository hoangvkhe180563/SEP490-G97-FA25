// src/documentManagement/pages/teacher/OwnedDocument.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Label } from "@/common/components/ui/label";
import { ScrollArea } from "@/common/components/ui/scroll-area";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { Checkbox } from "@/common/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/common/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/common/components/ui/select";
import {
  Search,
  LayoutGrid,
  List,
  FileText,
  Download,
  Edit,
  Trash2,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
} from "lucide-react";
import { useOwnedDocuments } from "@/documentManagement/hooks/useOwnedDocuments";
import OwnedDocumentItem from "@/documentManagement/components/OwnedDocumentItem";
import OwnedDocumentListItem from "@/documentManagement/components/OwnedDocumentListItem";
import type {
  Document,
  FilterSidebarProps,
  DocumentHeaderProps,
  DocumentGridProps,
  DocumentDetailProps,
} from "@/documentManagement/interfaces/document";

const ITEMS_PER_PAGE = 12;

function FilterBar({
  availableFilters,
  filters,
  setFilters,
  onClearFilters,
}: FilterSidebarProps) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const toggleFilter = (
    type: "grade" | "subject" | "category" | "accessType",
    value: number | string
  ) => {
    setFilters({
      ...filters,
      ...(type === "grade" && {
        selectedGrades: filters.selectedGrades.includes(value as number)
          ? filters.selectedGrades.filter((v) => v !== value)
          : [...filters.selectedGrades, value as number],
      }),
      ...(type === "subject" && {
        selectedSubjects: filters.selectedSubjects.includes(value as string)
          ? filters.selectedSubjects.filter((v) => v !== value)
          : [...filters.selectedSubjects, value as string],
      }),
      ...(type === "category" && {
        selectedCategories: filters.selectedCategories.includes(value as string)
          ? filters.selectedCategories.filter((v) => v !== value)
          : [...filters.selectedCategories, value as string],
      }),
      ...(type === "accessType" && {
        selectedAccessTypes: filters.selectedAccessTypes.includes(
          value as string
        )
          ? filters.selectedAccessTypes.filter((v) => v !== value)
          : [...filters.selectedAccessTypes, value as string],
      }),
    });
  };

  const getAccessLabel = (type: string) => {
    switch (type) {
      case "public":
        return "Công khai";
      case "school":
        return "Trường";
      case "class":
        return "Lớp học";
      default:
        return type;
    }
  };

  const hasActiveFilters =
    filters.selectedGrades.length > 0 ||
    filters.selectedSubjects.length > 0 ||
    filters.selectedCategories.length > 0 ||
    filters.selectedAccessTypes.length > 0 ||
    filters.approvalStatus !== "all";

  const getFilterLabel = (type: string, count: number) => {
    const labels: Record<string, string> = {
      grades: "Khối lớp",
      subjects: "Môn học",
      categories: "Loại tài liệu",
      accessTypes: "Quyền truy cập",
    };
    return count > 0 ? `${labels[type]} (${count})` : labels[type];
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700 flex-shrink-0">
          Bộ lọc:
        </span>

        {availableFilters.grades.length > 0 && (
          <Popover
            open={openPopover === "grades"}
            onOpenChange={(open) => setOpenPopover(open ? "grades" : null)}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`h-9 text-sm ${
                  filters.selectedGrades.length > 0
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : ""
                }`}
              >
                {getFilterLabel("grades", filters.selectedGrades.length)}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-2">
                {availableFilters.grades.map((grade) => (
                  <div key={grade} className="flex items-center space-x-2">
                    <Checkbox
                      id={`grade-${grade}`}
                      checked={filters.selectedGrades.includes(grade)}
                      onCheckedChange={() => toggleFilter("grade", grade)}
                    />
                    <label
                      htmlFor={`grade-${grade}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      Lớp {grade}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {availableFilters.subjects.length > 0 && (
          <Popover
            open={openPopover === "subjects"}
            onOpenChange={(open) => setOpenPopover(open ? "subjects" : null)}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`h-9 text-sm ${
                  filters.selectedSubjects.length > 0
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : ""
                }`}
              >
                {getFilterLabel("subjects", filters.selectedSubjects.length)}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableFilters.subjects.map((subject) => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject}`}
                      checked={filters.selectedSubjects.includes(subject)}
                      onCheckedChange={() => toggleFilter("subject", subject)}
                    />
                    <label
                      htmlFor={`subject-${subject}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {subject}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {availableFilters.categories.length > 0 && (
          <Popover
            open={openPopover === "categories"}
            onOpenChange={(open) => setOpenPopover(open ? "categories" : null)}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`h-9 text-sm ${
                  filters.selectedCategories.length > 0
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : ""
                }`}
              >
                {getFilterLabel(
                  "categories",
                  filters.selectedCategories.length
                )}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableFilters.categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={filters.selectedCategories.includes(category)}
                      onCheckedChange={() => toggleFilter("category", category)}
                    />
                    <label
                      htmlFor={`category-${category}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {availableFilters.accessTypes.length > 0 && (
          <Popover
            open={openPopover === "accessTypes"}
            onOpenChange={(open) => setOpenPopover(open ? "accessTypes" : null)}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`h-9 text-sm ${
                  filters.selectedAccessTypes.length > 0
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : ""
                }`}
              >
                {getFilterLabel(
                  "accessTypes",
                  filters.selectedAccessTypes.length
                )}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-2">
                {availableFilters.accessTypes.map((accessType) => (
                  <div key={accessType} className="flex items-center space-x-2">
                    <Checkbox
                      id={`access-${accessType}`}
                      checked={filters.selectedAccessTypes.includes(accessType)}
                      onCheckedChange={() =>
                        toggleFilter("accessType", accessType)
                      }
                    />
                    <label
                      htmlFor={`access-${accessType}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {getAccessLabel(accessType)}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 text-sm text-slate-600 hover:text-slate-900"
            onClick={onClearFilters}
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>
    </div>
  );
}

function DocumentHeader({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  approvalStatus,
  setApprovalStatus,
  onCreateDocument,
}: DocumentHeaderProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Tìm kiếm trong Tài liệu của tôi"
            className="pl-10 h-10 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-normal text-slate-600 whitespace-nowrap">
              Trạng thái:
            </Label>
            <Select value={approvalStatus} onValueChange={setApprovalStatus}>
              <SelectTrigger className="w-[130px] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
              <SelectItem value="name-asc">Tên A-Z</SelectItem>
              <SelectItem value="name-desc">Tên Z-A</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-0.5 ml-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-9 w-9 p-0 ${
                viewMode === "list" ? "bg-slate-100" : "hover:bg-slate-100"
              }`}
              onClick={() => setViewMode("list")}
            >
              <List className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-9 w-9 p-0 ${
                viewMode === "grid" ? "bg-slate-100" : "hover:bg-slate-100"
              }`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-5 h-5" />
            </Button>
          </div>

          <Button
            onClick={onCreateDocument}
            className="bg-blue-600 text-white hover:bg-blue-700 h-9 ml-2"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo tài liệu
          </Button>
        </div>
      </div>
    </div>
  );
}

function DocumentGrid({
  documents,
  loading,
  viewMode,
  onSelectDocument,
  onEditDocument,
  getAccessType,
  hasDetailPanel,
}: DocumentGridProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500">Đang tải...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500">Không tìm thấy tài liệu nào</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <ScrollArea className="flex-1">
        <div className="py-2">
          <div className="px-4 py-2 flex items-center gap-3 text-xs font-medium text-slate-500 border-b border-slate-200 sticky top-0 bg-white">
            <div className="w-8"></div>
            <div className="flex-1">Tên</div>
            <div className="w-20">Quyền</div>
            <div className="w-24">Khối</div>
            <div className="w-32">Môn học</div>
            <div className="w-20">Trạng thái</div>
            <div className="w-24 text-right">Ngày tạo</div>
            <div className="w-8"></div>
          </div>
          {documents.map((doc) => (
            <OwnedDocumentListItem
              key={doc.id}
              document={doc}
              onClick={() => onSelectDocument(doc.id)}
              onDoubleClick={() => onEditDocument(doc.id)}
              getAccessType={getAccessType}
            />
          ))}
        </div>
      </ScrollArea>
    );
  }

  const gridColsClass = hasDetailPanel
    ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4"
    : "grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

  return (
    <ScrollArea className="flex-1">
      <div className={`p-6 grid ${gridColsClass} gap-4`}>
        {documents.map((doc) => (
          <OwnedDocumentItem
            key={doc.id}
            document={doc}
            onClick={() => onSelectDocument(doc.id)}
            onDoubleClick={() => onEditDocument(doc.id)}
            getAccessType={getAccessType}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function DocumentDetail({
  document,
  onClose,
  onEdit,
  onDelete,
  onPreview,
  getAccessType,
}: DocumentDetailProps) {
  const accessType = getAccessType(document);

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

  const getApprovalLabel = (isApproved: boolean | null) => {
    if (isApproved === true) return "Đã duyệt";
    if (isApproved === false) return "Từ chối";
    return "Chờ duyệt";
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex-shrink-0">
      <ScrollArea className="h-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-medium text-base text-slate-900">
              Chi tiết tài liệu
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-col items-center mb-6">
            <div className="w-40 h-40 rounded-lg bg-slate-50 flex items-center justify-center mb-4 overflow-hidden border border-slate-200">
              {document.thumbnail ? (
                <img
                  src={document.thumbnail || "/placeholder.svg"}
                  alt={document.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText className="w-16 h-16 text-slate-400" />
              )}
            </div>
            <h3
              className="font-medium text-sm px-2 text-center break-words w-full"
              title={document.name}
            >
              {document.name}
            </h3>
            <div className="flex gap-2 text-xs text-slate-500 mt-2">
              <span>{document.fileType || "PDF"}</span>
              <span>•</span>
              <span>{document.subjectName}</span>
              <span>•</span>
              <span>Lớp {document.grade}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs bg-transparent"
            >
              <Download className="w-4 h-4 mr-1" />
              Tải xuống
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs bg-transparent"
              onClick={onPreview}
            >
              <Eye className="w-4 h-4 mr-1" />
              Xem trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs bg-transparent"
              onClick={onEdit}
            >
              <Edit className="w-4 h-4 mr-1" />
              Chỉnh sửa
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Xóa
            </Button>
          </div>

          <div>
            <h3 className="font-medium text-sm mb-4 text-slate-900">
              Thông tin
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm gap-2">
                <span className="text-slate-500 flex-shrink-0">Ngày tạo</span>
                <span className="font-normal text-slate-900 text-right">
                  {new Date(document.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between text-sm gap-2">
                <span className="text-slate-500 flex-shrink-0">Người tạo</span>
                <span
                  className="font-normal text-slate-900 text-right truncate"
                  title={document.uploaderName || "Không rõ"}
                >
                  {document.uploaderName || "Không rõ"}
                </span>
              </div>
              <div className="flex justify-between text-sm gap-2">
                <span className="text-slate-500 flex-shrink-0">
                  Quyền truy cập
                </span>
                <span className="font-normal text-slate-900 text-right">
                  {getAccessLabel(accessType)}
                </span>
              </div>
              <div className="flex justify-between text-sm gap-2">
                <span className="text-slate-500 flex-shrink-0">Trạng thái</span>
                <span className="font-normal text-slate-900 text-right">
                  {getApprovalLabel(document.isApproved)}
                </span>
              </div>
              <div className="flex justify-between text-sm gap-2">
                <span className="text-slate-500 flex-shrink-0">Loại</span>
                <span
                  className="font-normal text-slate-900 text-right truncate"
                  title={document.categoryName || "Không rõ"}
                >
                  {document.categoryName || "Không rõ"}
                </span>
              </div>
              {document.schoolName && (
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-slate-500 flex-shrink-0">Trường</span>
                  <span
                    className="font-normal text-slate-900 text-right truncate"
                    title={document.schoolName}
                  >
                    {document.schoolName}
                  </span>
                </div>
              )}
              {document.description && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-slate-500 text-sm block mb-2">
                    Mô tả
                  </span>
                  <p
                    className="text-sm text-slate-900 leading-relaxed break-words"
                    title={document.description}
                  >
                    {document.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default function OwnedDocument() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const {
    documents,
    availableFilters,
    loading,
    searchQuery,
    sortBy,
    filters,
    totalCount,
    currentPage,
    setFilters,
    setSearchQuery,
    setSortBy,
    setCurrentPage,
    getAccessType,
    clearFilters,
  } = useOwnedDocuments(user?.id || "", ITEMS_PER_PAGE);

  const selectedDoc = documents.find((doc) => doc.id === selectedDocument);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold text-red-600 mb-2">
            Vui lòng đăng nhập
          </div>
          <div className="text-gray-600">
            Bạn cần đăng nhập để xem tài liệu của mình
          </div>
        </div>
      </div>
    );
  }

  const handleCreateDocument = () => {
    navigate("/document/teacher/create-document");
  };

  const handleEdit = (docId: number) => {
    navigate(`/document/teacher/update-document/${docId}`);
  };

  const handleDelete = () => {
    if (selectedDoc) {
      console.log("Delete document:", selectedDoc.id);
    }
  };

  const handlePreview = (docId: number) => {
    navigate(`/document/student/doc-info/${docId}`);
  };

  const handleApprovalStatusChange = (status: string) => {
    setFilters({
      ...filters,
      approvalStatus: status,
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden flex-col">
      <DocumentHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        approvalStatus={filters.approvalStatus}
        setApprovalStatus={handleApprovalStatusChange}
        onCreateDocument={handleCreateDocument}
      />
      <FilterBar
        availableFilters={availableFilters}
        filters={filters}
        setFilters={setFilters}
        onClearFilters={clearFilters}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <DocumentGrid
          documents={documents}
          loading={loading}
          viewMode={viewMode}
          onSelectDocument={setSelectedDocument}
          onEditDocument={handleEdit}
          onPreviewDocument={handlePreview}
          getAccessType={getAccessType}
          hasDetailPanel={!!selectedDoc}
        />
        {selectedDoc && (
          <DocumentDetail
            document={selectedDoc}
            onClose={() => setSelectedDocument(null)}
            onEdit={() => handleEdit(selectedDoc.id)}
            onDelete={handleDelete}
            onPreview={() => handlePreview(selectedDoc.id)}
            getAccessType={getAccessType}
          />
        )}
      </div>
      <div className="bg-white border-t border-slate-200 px-4 py-3 flex-shrink-0 flex items-center justify-between">
        <span className="text-sm text-slate-600">
          Hiển thị{" "}
          {documents.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}{" "}
          đến {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} trong{" "}
          {totalCount} tài liệu
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-600">
            Trang {currentPage} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handlePageChange(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
