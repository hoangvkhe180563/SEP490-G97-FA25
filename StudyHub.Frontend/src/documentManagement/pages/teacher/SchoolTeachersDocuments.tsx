// src/documentManagement/pages/teacher/SchoolTeachersDocuments.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
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
import { Search, ChevronDown, FileText } from "lucide-react";
import { useSchoolTeachersDocuments } from "@/documentManagement/hooks/useSchoolTeachersDocuments";
import type { FilterSidebarProps } from "@/documentManagement/interfaces/document";
import { Paging } from "@/common/components/Paging";

const ITEMS_PER_PAGE = 10;

function FilterBar({
  availableFilters,
  filters,
  setFilters,
  onClearFilters,
}: FilterSidebarProps) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const toggleFilter = (
    type: "grade" | "subject" | "category" | "documentLength" | "documentLevel",
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
      ...(type === "documentLength" && {
        selectedDocumentLengths: (
          filters.selectedDocumentLengths || []
        ).includes(value as string)
          ? (filters.selectedDocumentLengths || []).filter((v) => v !== value)
          : [...(filters.selectedDocumentLengths || []), value as string],
      }),
      ...(type === "documentLevel" && {
        selectedDocumentLevels: (filters.selectedDocumentLevels || []).includes(
          value as string
        )
          ? (filters.selectedDocumentLevels || []).filter((v) => v !== value)
          : [...(filters.selectedDocumentLevels || []), value as string],
      }),
    });
  };

  const hasActiveFilters =
    filters.selectedGrades.length > 0 ||
    filters.selectedSubjects.length > 0 ||
    filters.selectedCategories.length > 0 ||
    (filters.selectedDocumentLengths?.length || 0) > 0 ||
    (filters.selectedDocumentLevels?.length || 0) > 0;

  const getFilterLabel = (type: string, count: number) => {
    const labels: Record<string, string> = {
      grades: "Khối lớp",
      subjects: "Môn học",
      categories: "Loại tài liệu",
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

        <Popover
          open={openPopover === "documentLength"}
          onOpenChange={(open) =>
            setOpenPopover(open ? "documentLength" : null)
          }
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`h-9 text-sm ${
                (filters.selectedDocumentLengths?.length || 0) > 0
                  ? "bg-amber-50 text-amber-700 border-amber-300"
                  : ""
              }`}
            >
              Độ dài
              {(filters.selectedDocumentLengths?.length || 0) > 0
                ? ` (${filters.selectedDocumentLengths.length})`
                : ""}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-2">
              {["Short", "Medium", "Long"].map((length) => (
                <div key={length} className="flex items-center space-x-2">
                  <Checkbox
                    id={`length-${length}`}
                    checked={
                      filters.selectedDocumentLengths?.includes(length) || false
                    }
                    onCheckedChange={() =>
                      toggleFilter("documentLength", length)
                    }
                  />
                  <label
                    htmlFor={`length-${length}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {length === "Short"
                      ? "Ngắn"
                      : length === "Medium"
                      ? "Trung bình"
                      : "Dài"}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover
          open={openPopover === "documentLevel"}
          onOpenChange={(open) => setOpenPopover(open ? "documentLevel" : null)}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={`h-9 text-sm ${
                (filters.selectedDocumentLevels?.length || 0) > 0
                  ? "bg-red-50 text-red-700 border-red-300"
                  : ""
              }`}
            >
              Độ khó
              {(filters.selectedDocumentLevels?.length || 0) > 0
                ? ` (${filters.selectedDocumentLevels.length})`
                : ""}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-2">
              {["Easy", "Medium", "Hard"].map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={`level-${level}`}
                    checked={
                      filters.selectedDocumentLevels?.includes(level) || false
                    }
                    onCheckedChange={() => toggleFilter("documentLevel", level)}
                  />
                  <label
                    htmlFor={`level-${level}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {level === "Easy"
                      ? "Dễ"
                      : level === "Medium"
                      ? "Trung bình"
                      : "Khó"}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

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

export default function SchoolTeachersDocuments() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

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
    clearFilters,
  } = useSchoolTeachersDocuments(user?.schoolId || 0, ITEMS_PER_PAGE);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (!user || !user.schoolId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold text-red-600 mb-2">
            Không có quyền truy cập
          </div>
          <div className="text-gray-600">
            Bạn cần thuộc một trường học để xem tài liệu
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white overflow-hidden flex-col">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Tìm kiếm tài liệu giáo viên"
              className="pl-10 h-10 bg-slate-50 border-slate-200 focus-visible:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
        </div>
      </div>

      <FilterBar
        availableFilters={availableFilters}
        filters={filters}
        setFilters={setFilters}
        onClearFilters={clearFilters}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500">Đang tải...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500">Không tìm thấy tài liệu nào</p>
            </div>
          ) : (
            <div className="py-2">
              <div className="px-4 py-2 flex items-center gap-3 text-xs font-medium text-slate-500 border-b border-slate-200 sticky top-0 bg-white">
                <div className="w-24">Ảnh</div>
                <div className="flex-1">Tên</div>
                <div className="w-24">Khối</div>
                <div className="w-32">Môn học</div>
                <div className="w-32">Loại</div>
                <div className="w-50">Người tạo</div>
                <div className="w-30">Ngày tạo</div>
              </div>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/document/details/${doc.id}`)}
                  className="px-4 py-3 flex items-center gap-3 border-b border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="w-24 font-large  text-sm text-slate-900 truncate">
                    {doc.thumbnail ? (
                      <img
                        src={doc.thumbnail}
                        alt={doc.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <FileText className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 font-medium text-sm text-slate-900 truncate">
                    {doc.name}
                  </div>
                  <div className="w-24 text-sm text-slate-600">
                    Lớp {doc.grade}
                  </div>
                  <div className="w-32 text-sm text-slate-600 truncate">
                    {doc.subjectName}
                  </div>
                  <div className="w-32 text-sm text-slate-600 truncate">
                    {doc.categoryName}
                  </div>
                  <div className="w-50 text-sm text-slate-600 truncate">
                    {doc.uploaderName || "Không rõ"}
                  </div>
                  <div className="w-30 text-sm text-slate-600 truncate">
                    {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="bg-white border-t border-slate-200 px-4 flex-shrink-0">
        <Paging
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
