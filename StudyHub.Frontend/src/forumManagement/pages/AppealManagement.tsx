// src/forumManagement/moderator/pages/AppealManagement.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
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
import { Search, MoreVertical, CheckCircle, XCircle, Eye } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import type { UserAppeal } from "../interfaces/moderator";
import type { PaginationInfo } from "@/documentManagement/interfaces/document";
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";
import { useAppealStore } from "@/forumManagement/stores/useAppealStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { toast } from "sonner";

const AppealManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [selectedAppeal, setSelectedAppeal] = useState<UserAppeal | null>(null);
  const [alertAction, setAlertAction] = useState<{
    type: "approve" | "reject";
    appealId: number;
  } | null>(null);

  const { appeals, isLoading, getAppeals, approveAppeal, rejectAppeal } =
    useAppealStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.schoolId) {
      getAppeals(user.schoolId);
    }
  }, [user?.schoolId, getAppeals]);

  const handleApprove = async (appealId: number) => {
    const result = await approveAppeal(appealId);
    if (result?.success) {
      toast.success("Đã chấp nhận kháng cáo");
      setSelectedAppeal(null);
      if (user?.schoolId) {
        getAppeals(user.schoolId);
      }
    } else {
      toast.error(result?.message || "Có lỗi xảy ra");
    }
    setAlertAction(null);
  };

  const handleReject = async (appealId: number) => {
    const result = await rejectAppeal(appealId);
    if (result?.success) {
      toast.success("Đã từ chối kháng cáo");
      setSelectedAppeal(null);
      if (user?.schoolId) {
        getAppeals(user.schoolId);
      }
    } else {
      toast.error(result?.message || "Có lỗi xảy ra");
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
    setSortBy("newest");
    setCurrentPage(1);
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
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "userName":
          return (a.user_name || "").localeCompare(b.user_name || "");
        default:
          return 0;
      }
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
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  return (
    <div className="w-full h-full overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý Kháng cáo</h1>
            <p className="text-gray-600 mt-1">
              Xem xét và phản hồi kháng cáo từ người dùng
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên người dùng hoặc lý do..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="pending">Đang chờ</SelectItem>
                    <SelectItem value="approved">Đã chấp nhận</SelectItem>
                    <SelectItem value="rejected">Đã từ chối</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="oldest">Cũ nhất</SelectItem>
                    <SelectItem value="userName">Theo tên</SelectItem>
                  </SelectContent>
                </Select>

                {(searchQuery ||
                  statusFilter !== "all" ||
                  sortBy !== "newest") && (
                  <Button variant="ghost" onClick={handleClearFilters}>
                    Xóa bộ lọc
                  </Button>
                )}
              </div>

              <div className="text-sm text-gray-600">
                Tìm thấy <strong>{totalCount}</strong> kháng cáo
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Đang tải...</p>
              </div>
            ) : paginatedAppeals.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">STT</TableHead>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Lý do kháng cáo</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAppeals.map((appeal, index) => (
                      <TableRow key={appeal.id}>
                        <TableCell className="text-center text-sm">
                          {startIndex + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                                {appeal.user_name
                                  ?.substring(0, 2)
                                  .toUpperCase() || "??"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium">
                              {appeal.user_name || "N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {appeal.reason || "-"}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(appeal.created_at)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={appeal.status} type="appeal" />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
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
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setSelectedAppeal(appeal)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Xem chi tiết
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
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Chấp nhận
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setAlertAction({
                                          type: "reject",
                                          appealId: appeal.id,
                                        })
                                      }
                                      className="text-red-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Từ chối
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
                <DocumentPagination
                  pagination={pagination}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Không tìm thấy kháng cáo nào
                </p>
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={handleClearFilters}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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
