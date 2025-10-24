// src/documentManagement/pages/manager/VerifyDocument.tsx
import { useState, useEffect } from "react";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/common/components/ui/pagination";
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
  ChevronLeft,
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
import type {
  SubjectDto,
  DocumentCategoryDto,
  Document,
} from "@/documentManagement/interfaces/document";
import { useAuthStore } from "@/auth/stores/useAuthStore";

type SortField = "createdAt" | "updatedAt" | "name" | null;
type SortOrder = "asc" | "desc";

const ManagerDocumentApprovalList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(5);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [categories, setCategories] = useState<DocumentCategoryDto[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    status: true,
    subject: false,
    grade: false,
    category: false,
  });

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    type: "approve" | "reject" | "revoke" | "hide" | null;
    documentId: number | null;
    documentName: string;
  }>({
    open: false,
    type: null,
    documentId: null,
    documentName: "",
  });

  const {
    documents,
    totalPages,
    currentPage,
    isLoading,
    fetchManagerPublicDocuments,
    fetchManagerSchoolDocuments,
    approveDocument,
    rejectDocument,
    revokeApproval,
    softDeleteDocument,
    setCurrentPage,
    getCategories,
    getSubjects,
    categories: storeCategoriesRaw,
    subjects: storeSubjectsRaw,
  } = useDocumentStore();

  const managerSchoolId = user?.schoolId;
  const isPublicManager = !managerSchoolId;

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        await getCategories();
        await getSubjects();
      } catch (err) {
        console.error("Failed to fetch master data", err);
      }
    };
    fetchMasterData();
  }, []);

  useEffect(() => {
    if (storeSubjectsRaw && storeSubjectsRaw.length > 0) {
      setSubjects(storeSubjectsRaw);
    }
  }, [storeSubjectsRaw]);

  useEffect(() => {
    if (storeCategoriesRaw && storeCategoriesRaw.length > 0) {
      setCategories(storeCategoriesRaw);
    }
  }, [storeCategoriesRaw]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    statusFilter,
    searchQuery,
    selectedCategories,
    selectedGrades,
    selectedSubjects,
    setCurrentPage,
  ]);

  useEffect(() => {
    fetchDocuments();
  }, [
    statusFilter,
    searchQuery,
    selectedCategories,
    selectedGrades,
    selectedSubjects,
    currentPage,
    pageSize,
    sortField,
    sortOrder,
    managerSchoolId,
  ]);

  const fetchDocuments = () => {
    let isApproved: boolean | undefined = undefined;

    if (statusFilter === "approved") {
      isApproved = true;
    } else if (statusFilter === "rejected") {
      isApproved = false;
    }

    if (isPublicManager) {
      fetchManagerPublicDocuments(
        searchQuery || undefined,
        selectedCategories.length > 0
          ? parseInt(selectedCategories[0])
          : undefined,
        selectedGrades.length > 0 ? parseInt(selectedGrades[0]) : undefined,
        selectedSubjects.length > 0 ? selectedSubjects[0] : undefined,
        undefined,
        isApproved,
        true,
        currentPage,
        pageSize
      );
    } else {
      const schoolIdNum = parseInt(managerSchoolId!);
      if (isNaN(schoolIdNum)) {
        setErrorMessage("School ID không hợp lệ");
        return;
      }

      fetchManagerSchoolDocuments(
        managerSchoolId!,
        searchQuery || undefined,
        selectedCategories.length > 0
          ? parseInt(selectedCategories[0])
          : undefined,
        selectedGrades.length > 0 ? parseInt(selectedGrades[0]) : undefined,
        selectedSubjects.length > 0 ? selectedSubjects[0] : undefined,
        undefined,
        isApproved,
        true,
        currentPage,
        pageSize
      );
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;

    if (sortField === "name") {
      const aValue = a.name.toLowerCase();
      const bValue = b.name.toLowerCase();
      comparison = aValue > bValue ? 1 : -1;
    } else if (sortField === "createdAt" || sortField === "updatedAt") {
      const aValue = a[sortField] ? new Date(a[sortField]!).getTime() : 0;
      const bValue = b[sortField] ? new Date(b[sortField]!).getTime() : 0;
      comparison = aValue > bValue ? 1 : -1;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 ml-1 inline" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 inline" />
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedSubjects([]);
    setSelectedGrades([]);
    setSelectedCategories([]);
    setStatusFilter("pending");
  };

  const toggleSubject = (subjectName: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectName)
        ? prev.filter((s) => s !== subjectName)
        : [...prev, subjectName]
    );
  };

  const toggleGrade = (grade: string) => {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
    }

    if (success) {
      if (dialogState.type === "approve") {
        setSuccessMessage("Phê duyệt tài liệu thành công");
      } else if (dialogState.type === "reject") {
        setSuccessMessage("Từ chối tài liệu thành công");
      } else if (dialogState.type === "revoke") {
        setSuccessMessage("Thu hồi phê duyệt thành công");
      } else if (dialogState.type === "hide") {
        setSuccessMessage("Ẩn tài liệu thành công");
      }

      setTimeout(() => setSuccessMessage(""), 3000);
      setTimeout(() => fetchDocuments(), 500);
    } else {
      setErrorMessage("Thao tác thất bại");
      setTimeout(() => setErrorMessage(""), 3000);
    }

    closeDialog();
  };

  const handleViewDocument = (id: number) => {
    navigate(`/document/student/details/${id}`);
  };

  const getDialogContent = () => {
    switch (dialogState.type) {
      case "approve":
        return {
          title: "Xác nhận phê duyệt",
          description: `Bạn có chắc chắn muốn phê duyệt tài liệu "${dialogState.documentName}"?`,
          confirmText: "Phê duyệt",
        };
      case "reject":
        return {
          title: "Xác nhận từ chối",
          description: `Bạn có chắc chắn muốn từ chối tài liệu "${dialogState.documentName}"?`,
          confirmText: "Từ chối",
        };
      case "revoke":
        return {
          title: "Xác nhận thu hồi",
          description: `Bạn có chắc chắn muốn thu hồi phê duyệt tài liệu "${dialogState.documentName}"?`,
          confirmText: "Thu hồi",
        };
      case "hide":
        return {
          title: "Xác nhận ẩn",
          description: `Bạn có chắc chắn muốn ẩn tài liệu "${dialogState.documentName}"?`,
          confirmText: "Ẩn",
        };
      default:
        return {
          title: "",
          description: "",
          confirmText: "",
        };
    }
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
          {status === "pending" && (
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
          {status === "approved" && (
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
    if (statusFilter === "pending")
      return prefix + "Danh sách tài liệu chờ phê duyệt";
    if (statusFilter === "approved")
      return prefix + "Danh sách tài liệu đã phê duyệt";
    if (statusFilter === "rejected")
      return prefix + "Danh sách tài liệu bị từ chối";
    return prefix + "Danh sách tài liệu";
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pending"
                    checked={statusFilter === "pending"}
                    onCheckedChange={() => setStatusFilter("pending")}
                  />
                  <Label
                    htmlFor="pending"
                    className="text-sm cursor-pointer font-normal"
                  >
                    Chờ phê duyệt
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="approved"
                    checked={statusFilter === "approved"}
                    onCheckedChange={() => setStatusFilter("approved")}
                  />
                  <Label
                    htmlFor="approved"
                    className="text-sm cursor-pointer font-normal"
                  >
                    Đã phê duyệt
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rejected"
                    checked={statusFilter === "rejected"}
                    onCheckedChange={() => setStatusFilter("rejected")}
                  />
                  <Label
                    htmlFor="rejected"
                    className="text-sm cursor-pointer font-normal"
                  >
                    Bị từ chối
                  </Label>
                </div>
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
                      checked={selectedSubjects.includes(subject.name)}
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
                {[...Array(12)].map((_, i) => (
                  <div key={i + 1} className="flex items-center space-x-2">
                    <Checkbox
                      id={`grade-${i + 1}`}
                      checked={selectedGrades.includes((i + 1).toString())}
                      onCheckedChange={() => toggleGrade((i + 1).toString())}
                    />
                    <Label
                      htmlFor={`grade-${i + 1}`}
                      className="text-sm cursor-pointer font-normal"
                    >
                      Lớp {i + 1}
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
                      checked={selectedCategories.includes(
                        category.id.toString()
                      )}
                      onCheckedChange={() =>
                        toggleCategory(category.id.toString())
                      }
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
            onClick={handleClearFilters}
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
          {isLoading ? (
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
                  <TableHead className="text-center font-semibold text-gray-700 w-48">
                    TÁC GIẢ
                  </TableHead>
                  <TableHead className="text-center font-semibold text-gray-700 w-32">
                    MÔN HỌC
                  </TableHead>
                  <TableHead
                    className="text-center font-semibold text-gray-700 w-36 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("createdAt")}
                  >
                    NGÀY TẠO {getSortIcon("createdAt")}
                  </TableHead>
                  {statusFilter === "approved" && (
                    <TableHead
                      className="text-center font-semibold text-gray-700 w-36 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("updatedAt")}
                    >
                      NGÀY DUYỆT {getSortIcon("updatedAt")}
                    </TableHead>
                  )}
                  <TableHead className="text-center font-semibold text-gray-700 w-24">
                    THAO TÁC
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDocuments.map((doc, index) => (
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
                      <div className="overflow-x-auto scrollbar-custom">
                        <div className="text-xs text-center min-w-max px-2">
                          <div className="font-medium">
                            {doc.uploaderName || "N/A"}
                          </div>
                          <div className="text-gray-500 text-[11px] mt-1">
                            {doc.schoolName || "N/A"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-xs">
                        <div>{doc.subjectName}</div>
                        <div className="text-gray-500 text-[11px] mt-1">
                          Lớp {doc.grade}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    {statusFilter === "approved" && (
                      <TableCell className="text-center text-xs">
                        {doc.updatedAt
                          ? new Date(doc.updatedAt).toLocaleDateString("vi-VN")
                          : "-"}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {renderDropdownMenu(statusFilter, doc)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="p-3 border-t">
          <div className="flex items-center justify-between">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      currentPage > 1 && setCurrentPage(currentPage - 1)
                    }
                    className={`${
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:bg-gray-100"
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Trước
                  </PaginationPrevious>
                </PaginationItem>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNumber: number;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer hover:bg-gray-100"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      currentPage < totalPages &&
                      setCurrentPage(currentPage + 1)
                    }
                    className={`${
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:bg-gray-100"
                    }`}
                  >
                    Sau
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </PaginationNext>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
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
