// src/documentManagement/pages/manager/VerifyDocument.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/common/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Label } from "@/common/components/ui/label";
import {
  Eye,
  Check,
  X,
  RotateCcw,
  EyeOff,
  ChevronRight,
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/common/components/ui/collapsible";
import { useDocumentStore } from "@/documentManagement/stores/useDocumentStore";
import type { Document } from "@/documentManagement/interfaces/document";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { useManagerDocumentFilters } from "@/documentManagement/hooks/useManagerDocumentFilters";
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";

const ManagerDocumentApprovalList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    documents,
    subjects,
    categories,
    loading,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    searchQuery,
    sortBy,
    sortOrder,
    filters,
    openSections,
    isPublicManager,
    setCurrentPage,
    setPageSize,
    setSearchQuery,
    updateFilters,
    clearFilters,
    handleSort,
    toggleSection,
    refetch,
  } = useManagerDocumentFilters();

  const {
    approveDocument,
    rejectDocument,
    revokeApproval,
    softDeleteDocument,
    approveEditRequest,
    rejectEditRequest,
  } = useDocumentStore();

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    type:
      | "approve"
      | "reject"
      | "revoke"
      | "hide"
      | "approveEdit"
      | "rejectEdit"
      | null;
    documentId: number | null;
    documentName: string;
  }>({
    open: false,
    type: null,
    documentId: null,
    documentName: "",
  });

  const openDialog = (
    type: typeof dialogState.type,
    documentId: number,
    documentName: string
  ) => {
    setDialogState({
      open: true,
      type,
      documentId,
      documentName,
    });
  };

  const closeDialog = () => {
    setDialogState({
      open: false,
      type: null,
      documentId: null,
      documentName: "",
    });
  };

  const handleConfirmAction = async () => {
    if (!dialogState.documentId || !dialogState.type) return;

    let success = false;

    switch (dialogState.type) {
      case "approve":
        success = await approveDocument(dialogState.documentId);
        break;
      case "reject":
        success = await rejectDocument(dialogState.documentId);
        break;
      case "revoke":
        success = await revokeApproval(dialogState.documentId);
        break;
      case "hide":
        success = await softDeleteDocument(dialogState.documentId);
        break;
      case "approveEdit":
        success = await approveEditRequest(dialogState.documentId);
        break;
      case "rejectEdit":
        success = await rejectEditRequest(dialogState.documentId);
        break;
    }

    if (success) {
      const messages = {
        approve: "Phê duyệt tài liệu thành công",
        reject: "Từ chối tài liệu thành công",
        revoke: "Thu hồi phê duyệt thành công",
        hide: "Ẩn tài liệu thành công",
        approveEdit: "Chấp nhận yêu cầu chỉnh sửa thành công",
        rejectEdit: "Từ chối yêu cầu chỉnh sửa thành công",
      };
      setSuccessMessage(messages[dialogState.type]);
      setTimeout(() => setSuccessMessage(""), 3000);
      setTimeout(() => refetch(), 500);
    } else {
      setErrorMessage("Thao tác thất bại");
      setTimeout(() => setErrorMessage(""), 3000);
    }

    closeDialog();
  };

  const handleViewDocument = (id: number) => {
    navigate(`/document/student/details/${id}`);
  };

  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field)
      return <ArrowUpDown className="h-3 w-3 ml-1 inline" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 inline" />
    );
  };

  const toggleSubject = (subjectName: string) => {
    const newSubjects = filters.selectedSubjects.includes(subjectName)
      ? filters.selectedSubjects.filter((s) => s !== subjectName)
      : [...filters.selectedSubjects, subjectName];
    updateFilters({ selectedSubjects: newSubjects });
  };

  const toggleGrade = (grade: number) => {
    const newGrades = filters.selectedGrades.includes(grade)
      ? filters.selectedGrades.filter((g) => g !== grade)
      : [...filters.selectedGrades, grade];
    updateFilters({ selectedGrades: newGrades });
  };

  const toggleCategory = (categoryId: number) => {
    const newCategories = filters.selectedCategories.includes(categoryId)
      ? filters.selectedCategories.filter((c) => c !== categoryId)
      : [...filters.selectedCategories, categoryId];
    updateFilters({ selectedCategories: newCategories });
  };

  const getDialogContent = () => {
    const contents = {
      approve: {
        title: "Xác nhận phê duyệt",
        description: `Bạn có chắc chắn muốn phê duyệt tài liệu "${dialogState.documentName}"?`,
        confirmText: "Phê duyệt",
      },
      reject: {
        title: "Xác nhận từ chối",
        description: `Bạn có chắc chắn muốn từ chối tài liệu "${dialogState.documentName}"?`,
        confirmText: "Từ chối",
      },
      revoke: {
        title: "Xác nhận thu hồi",
        description: `Bạn có chắc chắn muốn thu hồi phê duyệt tài liệu "${dialogState.documentName}"?`,
        confirmText: "Thu hồi",
      },
      hide: {
        title: "Xác nhận ẩn",
        description: `Bạn có chắc chắn muốn ẩn tài liệu "${dialogState.documentName}"?`,
        confirmText: "Ẩn",
      },
      approveEdit: {
        title: "Chấp nhận yêu cầu chỉnh sửa",
        description: `Bạn có chắc chắn muốn cho phép chỉnh sửa tài liệu "${dialogState.documentName}"?`,
        confirmText: "Chấp nhận",
      },
      rejectEdit: {
        title: "Từ chối yêu cầu chỉnh sửa",
        description: `Bạn có chắc chắn muốn từ chối yêu cầu chỉnh sửa tài liệu "${dialogState.documentName}"?`,
        confirmText: "Từ chối",
      },
    };
    return dialogState.type
      ? contents[dialogState.type]
      : { title: "", description: "", confirmText: "" };
  };

  const renderDropdownMenu = (status: string, doc: Document) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => handleViewDocument(doc.id)}
            className="cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4" />
            <span>Xem chi tiết</span>
          </DropdownMenuItem>
          {doc.isRequested === true && (
            <>
              <DropdownMenuItem
                onClick={() => openDialog("approveEdit", doc.id, doc.name)}
                className="cursor-pointer bg-green-50 hover:bg-green-100"
              >
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">
                  Chấp nhận yêu cầu
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDialog("rejectEdit", doc.id, doc.name)}
                className="cursor-pointer bg-red-50 hover:bg-red-100"
              >
                <X className="mr-2 h-4 w-4 text-red-600" />
                <span className="font-medium text-red-600">
                  Từ chối yêu cầu
                </span>
              </DropdownMenuItem>
            </>
          )}
          {status === "pending" && doc.isRequested !== true && (
            <>
              <DropdownMenuItem
                onClick={() => openDialog("approve", doc.id, doc.name)}
                className="cursor-pointer"
              >
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Phê duyệt</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDialog("reject", doc.id, doc.name)}
                className="cursor-pointer"
              >
                <X className="mr-2 h-4 w-4 text-red-600" />
                <span>Từ chối</span>
              </DropdownMenuItem>
            </>
          )}
          {status === "approved" && doc.isRequested !== true && (
            <DropdownMenuItem
              onClick={() => openDialog("revoke", doc.id, doc.name)}
              className="cursor-pointer"
            >
              <RotateCcw className="mr-2 h-4 w-4 text-orange-600" />
              <span>Thu hồi phê duyệt</span>
            </DropdownMenuItem>
          )}
          {status === "rejected" && (
            <DropdownMenuItem
              onClick={() => openDialog("hide", doc.id, doc.name)}
              className="cursor-pointer"
            >
              <EyeOff className="mr-2 h-4 w-4 text-gray-600" />
              <span>Ẩn tài liệu</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const getPageTitle = () => {
    const prefix = isPublicManager ? "[Công khai] " : "[Trường] ";
    const statusTitles = {
      pending: "Danh sách tài liệu chờ phê duyệt",
      approved: "Danh sách tài liệu đã phê duyệt",
      rejected: "Danh sách tài liệu bị từ chối",
      editRequest: "Danh sách tài liệu chờ duyệt chỉnh sửa",
    };
    return (
      prefix +
      (statusTitles[filters.statusFilter as keyof typeof statusTitles] ||
        "Danh sách tài liệu")
    );
  };

  const dialogContent = getDialogContent();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold text-red-600 mb-2">
            Không có quyền truy cập
          </div>
          <div className="text-gray-600">
            Vui lòng đăng nhập với tài khoản quản lý
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1 h-screen p-1">
      <style>{`
        .scrollbar-custom::-webkit-scrollbar {
          width: 5px;
          height: 3px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 5px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 5px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>

      <div className="w-50 bg-white rounded-lg shadow-sm border flex-shrink-0 overflow-y-auto scrollbar-custom">
        <div className="p-4 border-b sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-base mb-3">Bộ lọc</h3>
          <Input
            placeholder="Tìm kiếm tài liệu..."
            className="text-sm h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="p-4 space-y-4">
          <div className="border-b pb-4">
            <Collapsible
              open={openSections.status}
              onOpenChange={() => toggleSection("status")}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">Trạng thái</span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    openSections.status ? "rotate-90" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2.5">
                {["pending", "approved", "rejected", "editRequest"].map(
                  (status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={status}
                        checked={filters.statusFilter === status}
                        onCheckedChange={() =>
                          updateFilters({ statusFilter: status })
                        }
                      />
                      <Label
                        htmlFor={status}
                        className="text-sm cursor-pointer font-normal"
                      >
                        {status === "pending"
                          ? "Chờ phê duyệt"
                          : status === "approved"
                          ? "Đã phê duyệt"
                          : status === "rejected"
                          ? "Bị từ chối"
                          : "Chờ duyệt chỉnh sửa"}
                      </Label>
                    </div>
                  )
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="border-b pb-4">
            <Collapsible
              open={openSections.subject}
              onOpenChange={() => toggleSection("subject")}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">Môn học</span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    openSections.subject ? "rotate-90" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2.5 max-h-60 overflow-y-auto scrollbar-custom">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject.id}`}
                      checked={filters.selectedSubjects.includes(subject.name)}
                      onCheckedChange={() => toggleSubject(subject.name)}
                    />
                    <Label
                      htmlFor={`subject-${subject.id}`}
                      className="text-sm cursor-pointer font-normal"
                    >
                      {subject.name}
                    </Label>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="border-b pb-4">
            <Collapsible
              open={openSections.grade}
              onOpenChange={() => toggleSection("grade")}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">Lớp</span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    openSections.grade ? "rotate-90" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2.5 max-h-60 overflow-y-auto scrollbar-custom">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                  <div key={grade} className="flex items-center space-x-2">
                    <Checkbox
                      id={`grade-${grade}`}
                      checked={filters.selectedGrades.includes(grade)}
                      onCheckedChange={() => toggleGrade(grade)}
                    />
                    <Label
                      htmlFor={`grade-${grade}`}
                      className="text-sm cursor-pointer font-normal"
                    >
                      Lớp {grade}
                    </Label>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="pb-4">
            <Collapsible
              open={openSections.category}
              onOpenChange={() => toggleSection("category")}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">Loại tài liệu</span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    openSections.category ? "rotate-90" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2.5 max-h-60 overflow-y-auto scrollbar-custom">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={filters.selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <Label
                      htmlFor={`category-${category.id}`}
                      className="text-sm cursor-pointer font-normal"
                    >
                      {category.name}
                    </Label>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <div className="p-4 border-t sticky bottom-0 bg-white">
          <Button
            variant="outline"
            className="w-full h-10 text-sm"
            onClick={clearFilters}
          >
            Xóa bộ lọc
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border flex flex-col overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{getPageTitle()}</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Số hàng:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(parseInt(value))}
              >
                <SelectTrigger className="w-20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto scrollbar-custom">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Đang tải...</div>
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50 z-10">
                <TableRow>
                  <TableHead className="text-center font-semibold text-gray-700 w-16">
                    STT
                  </TableHead>
                  <TableHead
                    className="text-center font-semibold text-gray-700 w-40 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("name")}
                  >
                    TÀI LIỆU {getSortIcon("name")}
                  </TableHead>
                  <TableHead className="text-center font-semibold text-gray-700 w-48">
                    MÔ TẢ
                  </TableHead>
                  <TableHead className="text-center font-semibold text-gray-700 w-32">
                    TÁC GIẢ
                  </TableHead>
                  <TableHead className="text-center font-semibold text-gray-700 w-32">
                    MÔN HỌC
                  </TableHead>
                  <TableHead className="text-center font-semibold text-gray-700 w-24">
                    KHỐI
                  </TableHead>
                  <TableHead className="text-center font-semibold text-gray-700 w-24">
                    ĐỘ DÀI
                  </TableHead>
                  <TableHead className="text-center font-semibold text-gray-700 w-24">
                    ĐỘ KHÓ
                  </TableHead>
                  <TableHead
                    className="text-center font-semibold text-gray-700 w-32 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("createdAt")}
                  >
                    NGÀY TẠO {getSortIcon("createdAt")}
                  </TableHead>
                  <TableHead className="text-center font-semibold text-gray-700 w-32">
                    TRẠNG THÁI
                  </TableHead>
                  {/* {filters.statusFilter === "approved" && (
                    <TableHead
                      className="text-center font-semibold text-gray-700 w-32 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("updatedAt")}
                    >
                      NGÀY DUYỆT {getSortIcon("updatedAt")}
                    </TableHead>
                  )} */}
                  <TableHead className="text-center font-semibold text-gray-700 w-24">
                    THAO TÁC
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc, index) => (
                  <TableRow key={doc.id} className="hover:bg-gray-50">
                    <TableCell className="text-center text-sm">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-center">
                        <div className="font-medium line-clamp-2">
                          {doc.name}
                        </div>
                        <div className="text-gray-500 text-[11px] mt-1">
                          {doc.fileType || "PDF"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs h-20 overflow-y-auto scrollbar-custom text-left px-2 whitespace-normal break-words">
                        {doc.description || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-center">
                        <div className="font-medium">
                          {doc.uploaderName || "N/A"}
                        </div>
                        <div className="text-gray-500 text-[11px] mt-1">
                          {doc.schoolName || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {doc.subjectName}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      Lớp {doc.grade}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {doc.documentLengthType === "Short"
                        ? "Ngắn"
                        : doc.documentLengthType === "Medium"
                        ? "TB"
                        : "Dài"}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {doc.documentLevel === "Easy"
                        ? "Dễ"
                        : doc.documentLevel === "Medium"
                        ? "TB"
                        : "Khó"}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        {doc.isRequested === true ? (
                          <span className="text-xs font-medium text-orange-700 animate-pulse">
                            Yêu cầu chỉnh sửa
                          </span>
                        ) : doc.isApproved === true ? (
                          <span className="text-xs font-medium text-green-700">
                            Đã duyệt
                          </span>
                        ) : doc.isApproved === null ? (
                          <span className="text-xs font-medium text-red-700">
                            Chờ duyệt
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-red-700">
                            Từ chối
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {renderDropdownMenu(filters.statusFilter, doc)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="p-3 border-t">
          <DocumentPagination
            pagination={{
              currentPage,
              totalPages,
              totalCount,
              pageSize,
            }}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <AlertDialog open={dialogState.open} onOpenChange={closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              {dialogContent.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManagerDocumentApprovalList;
