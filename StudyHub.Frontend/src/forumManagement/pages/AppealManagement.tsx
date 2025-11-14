// src/forumManagement/moderator/pages/AppealManagement.tsx
import { useState, useEffect } from "react";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/common/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/common/components/ui/collapsible";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Label } from "@/common/components/ui/label";
import {
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import type { UserAppeal } from "../interfaces/moderator";
import type { PaginationInfo } from "@/documentManagement/interfaces/document";
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";
import { useAppealStore } from "@/forumManagement/stores/useAppealStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";

const AppealManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "userName">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedAppeal, setSelectedAppeal] = useState<UserAppeal | null>(null);
  const [alertAction, setAlertAction] = useState<{
    type: "approve" | "reject";
    appealId: number;
  } | null>(null);
  const [openSections, setOpenSections] = useState({
    status: true,
    sort: true,
  });

  const { appeals, isLoading, getAppeals, approveAppeal, rejectAppeal } =
    useAppealStore();
  const { user } = useAuthStore();

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (user?.schoolId) {
      getAppeals(user.schoolId);
    }
  }, [user?.schoolId, getAppeals]);

  const handleApprove = async (appealId: number) => {
    const result = await approveAppeal(appealId);
    if (result?.success) {
      setSuccessMessage("Đã chấp nhận kháng cáo");
      setTimeout(() => setSuccessMessage(""), 3000);
      setSelectedAppeal(null);
      if (user?.schoolId) {
        getAppeals(user.schoolId);
      }
    } else {
      setErrorMessage(result?.message || "Có lỗi xảy ra");
      setTimeout(() => setErrorMessage(""), 3000);
    }
    setAlertAction(null);
  };

  const handleReject = async (appealId: number) => {
    const result = await rejectAppeal(appealId);
    if (result?.success) {
      setSuccessMessage("Đã từ chối kháng cáo");
      setTimeout(() => setSuccessMessage(""), 3000);
      setSelectedAppeal(null);
      if (user?.schoolId) {
        getAppeals(user.schoolId);
      }
    } else {
      setErrorMessage(result?.message || "Có lỗi xảy ra");
      setTimeout(() => setErrorMessage(""), 3000);
    }
    setAlertAction(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
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

  const filteredAndSortedAppeals = appeals
    .filter((appeal) => {
      const matchesSearch =
        appeal.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appeal.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appeal.reason?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && appeal.status === null) ||
        (statusFilter === "approved" && appeal.status === true) ||
        (statusFilter === "rejected" && appeal.status === false);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortBy === "createdAt") {
        comparison =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "userName") {
        comparison = (a.user_name || "").localeCompare(b.user_name || "");
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  const totalCount = filteredAndSortedAppeals.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAppeals = filteredAndSortedAppeals.slice(startIndex, endIndex);

  const pagination: PaginationInfo = {
    currentPage,
    totalPages,
    totalCount,
    pageSize,
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

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
            placeholder="Tìm kiếm kháng cáo..."
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
                {[
                  { value: "all", label: "Tất cả" },
                  { value: "pending", label: "Đang chờ" },
                  { value: "approved", label: "Chấp nhận" },
                  { value: "rejected", label: "Từ chối" },
                ].map((status) => (
                  <div
                    key={status.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={status.value}
                      checked={statusFilter === status.value}
                      onCheckedChange={() => setStatusFilter(status.value)}
                    />
                    <Label
                      htmlFor={status.value}
                      className="text-sm cursor-pointer font-normal"
                    >
                      {status.label}
                    </Label>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="pb-4">
            <Collapsible
              open={openSections.sort}
              onOpenChange={() => toggleSection("sort")}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <span className="text-sm font-medium">Sắp xếp theo</span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    openSections.sort ? "rotate-90" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2.5">
                {[
                  { value: "createdAt", label: "Thời gian" },
                  { value: "userName", label: "Tên người dùng" },
                ].map((sort) => (
                  <div key={sort.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={sort.value}
                      checked={sortBy === sort.value}
                      onCheckedChange={() =>
                        handleSort(sort.value as typeof sortBy)
                      }
                    />
                    <Label
                      htmlFor={sort.value}
                      className="text-sm cursor-pointer font-normal"
                    >
                      {sort.label}
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
            <h2 className="text-xl font-semibold">Quản lý Kháng cáo</h2>
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
          ) : paginatedAppeals.length > 0 ? (
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50 z-10">
                <TableRow>
                  <TableHead className="text-center font-semibold text-gray-700 w-16">
                    STT
                  </TableHead>
                  <TableHead
                    className="text-center font-semibold text-gray-700 w-40 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("userName")}
                  >
                    NGƯỜI DÙNG {getSortIcon("userName")}
                  </TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">
                    LÝ DO KHÁNG CÁO
                  </TableHead>
                  <TableHead
                    className="text-center font-semibold text-gray-700 w-40 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("createdAt")}
                  >
                    THỜI GIAN {getSortIcon("createdAt")}
                  </TableHead>
                  <TableHead className="text-center font-semibold text-gray-700 w-32">
                    TRẠNG THÁI
                  </TableHead>
                  <TableHead className="text-center font-semibold text-gray-700 w-24">
                    THAO TÁC
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAppeals.map((appeal, index) => (
                  <TableRow key={appeal.id} className="hover:bg-gray-50">
                    <TableCell className="text-center text-sm">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                            {appeal.user_name?.substring(0, 2).toUpperCase() ||
                              "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-xs">
                          <div className="font-medium">
                            {appeal.user_name || "N/A"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs h-20 overflow-y-auto scrollbar-custom text-left px-2 whitespace-normal break-words">
                        {appeal.reason || "-"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {formatDate(appeal.created_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={appeal.status} type="appeal" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => setSelectedAppeal(appeal)}
                              className="cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Xem chi tiết</span>
                            </DropdownMenuItem>
                            {appeal.status === null && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setAlertAction({
                                      type: "approve",
                                      appealId: appeal.id,
                                    })
                                  }
                                  className="cursor-pointer bg-green-50 hover:bg-green-100"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  <span className="font-medium text-green-600">
                                    Chấp nhận
                                  </span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setAlertAction({
                                      type: "reject",
                                      appealId: appeal.id,
                                    })
                                  }
                                  className="cursor-pointer bg-red-50 hover:bg-red-100"
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                  <span className="font-medium text-red-600">
                                    Từ chối
                                  </span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-4">
                  Không tìm thấy kháng cáo nào
                </p>
                <Button variant="ghost" onClick={handleClearFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t">
          <DocumentPagination
            pagination={pagination}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <Dialog
        open={!!selectedAppeal}
        onOpenChange={() => setSelectedAppeal(null)}
      >
        <DialogContent className="max-w-2xl">
          {selectedAppeal && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Chi tiết Kháng cáo #{selectedAppeal.id}
                </DialogTitle>
                <DialogDescription>
                  Xem xét và phản hồi kháng cáo từ người dùng
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {selectedAppeal.user_name
                        ?.substring(0, 2)
                        .toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-lg">
                      {selectedAppeal.user_name || "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">
                      Gửi lúc: {formatDate(selectedAppeal.created_at)}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Lý do kháng cáo:</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {selectedAppeal.reason}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold">Trạng thái:</span>
                  <StatusBadge status={selectedAppeal.status} type="appeal" />
                </div>

                {selectedAppeal.updated_at && (
                  <div className="text-sm text-gray-600">
                    Đã xử lý lúc: {formatDate(selectedAppeal.updated_at)}
                  </div>
                )}

                {selectedAppeal.status === null && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      className="flex-1 gap-2"
                      variant="default"
                      onClick={() =>
                        setAlertAction({
                          type: "approve",
                          appealId: selectedAppeal.id,
                        })
                      }
                    >
                      <CheckCircle className="w-4 h-4" />
                      Chấp nhận kháng cáo
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      variant="destructive"
                      onClick={() =>
                        setAlertAction({
                          type: "reject",
                          appealId: selectedAppeal.id,
                        })
                      }
                    >
                      <XCircle className="w-4 h-4" />
                      Từ chối kháng cáo
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!alertAction}
        onOpenChange={() => setAlertAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alertAction?.type === "approve"
                ? "Chấp nhận kháng cáo?"
                : "Từ chối kháng cáo?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {alertAction?.type === "approve"
                ? "Hành động này sẽ chấp nhận kháng cáo và khôi phục quyền của người dùng. Bạn có chắc chắn muốn tiếp tục?"
                : "Hành động này sẽ từ chối kháng cáo. Bạn có chắc chắn muốn tiếp tục?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (alertAction?.type === "approve") {
                  handleApprove(alertAction.appealId);
                } else if (alertAction?.type === "reject") {
                  handleReject(alertAction.appealId);
                }
              }}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppealManagement;
