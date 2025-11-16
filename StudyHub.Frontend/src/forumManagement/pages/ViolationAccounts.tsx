import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/common/components/ui/avatar";
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
import { Search, Ban, Unlock, MoreVertical } from "lucide-react";
import type { PaginationInfo } from "@/documentManagement/interfaces/document";
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";
import { useViolationStore } from "../stores/useViolationStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { toast } from "sonner";

const ViolationAccounts = () => {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || 1;

  const {
    userStatuses,
    // totalUserCount,
    isLoading,
    fetchUserStatuses,
    setUserFilters,
    muteUser,
    unmuteUser,
  } = useViolationStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [muteFilter, setMuteFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "mute" | "unmute";
    userId: string;
    userName: string;
  }>({ open: false, action: "mute", userId: "", userName: "" });

  // Fetch tất cả data 1 lần
  useEffect(() => {
    if (schoolId) {
      setUserFilters({
        schoolId,
        pageNumber: 1,
        pageSize: 1000, // Lấy hết để filter ở FE
      });
      fetchUserStatuses();
    }
  }, [schoolId, setUserFilters, fetchUserStatuses]);

  // Filter ở Frontend
  const filteredUsers = userStatuses.filter((user) => {
    // Search filter
    const matchesSearch =
      user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchQuery.toLowerCase());

    // Mute filter
    const matchesMute =
      muteFilter === "all" ||
      (muteFilter === "muted" && user.isMute) ||
      (muteFilter === "active" && !user.isMute);

    // Score filter
    const matchesScore =
      scoreFilter === "all" ||
      (scoreFilter === "critical" && user.totalViolationScore >= 70) ||
      (scoreFilter === "warning" &&
        user.totalViolationScore >= 40 &&
        user.totalViolationScore < 70) ||
      (scoreFilter === "minor" && user.totalViolationScore < 40);

    return matchesSearch && matchesMute && matchesScore;
  });

  // Sort ở Frontend
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case "score-desc":
        return b.totalViolationScore - a.totalViolationScore;
      case "score-asc":
        return a.totalViolationScore - b.totalViolationScore;
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      default:
        return 0;
    }
  });

  // Pagination ở Frontend
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + pageSize);

  const pagination: PaginationInfo = {
    currentPage,
    totalPages: Math.ceil(sortedUsers.length / pageSize),
    totalCount: sortedUsers.length,
    pageSize,
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70)
      return <Badge className="bg-red-500 text-white">Nghiêm trọng</Badge>;
    if (score >= 40)
      return <Badge className="bg-orange-500 text-white">Cảnh báo</Badge>;
    return <Badge className="bg-yellow-500 text-white">Nhẹ</Badge>;
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
    setMuteFilter("all");
    setScoreFilter("all");
    setSortBy("score-desc");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleMuteClick = (userId: string, userName: string) => {
    setConfirmDialog({ open: true, action: "mute", userId, userName });
  };

  const handleUnmuteClick = (userId: string, userName: string) => {
    setConfirmDialog({ open: true, action: "unmute", userId, userName });
  };

  const handleConfirmAction = async () => {
    const { action, userId } = confirmDialog;

    const success =
      action === "mute"
        ? await muteUser(userId, schoolId)
        : await unmuteUser(userId, schoolId);

    if (success) {
      toast.success(
        action === "mute"
          ? "Đã cấm người dùng trong 7 ngày"
          : "Đã bỏ cấm người dùng"
      );
    } else {
      toast.error("Có lỗi xảy ra");
    }

    setConfirmDialog({ open: false, action: "mute", userId: "", userName: "" });
  };

  // Reset page khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, muteFilter, scoreFilter, sortBy]);

  return (
    <div className="w-full h-full overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tài khoản Vi phạm</h1>
            <p className="text-gray-600 mt-1">Quản lý người dùng có vi phạm</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên hoặc ID người dùng..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Select value={muteFilter} onValueChange={setMuteFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Trạng thái Mute" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="muted">Đang bị cấm</SelectItem>
                    <SelectItem value="active">
                      Hoạt động bình thường
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Mức độ vi phạm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="critical">Nghiêm trọng (≥70)</SelectItem>
                    <SelectItem value="warning">Cảnh báo (40-69)</SelectItem>
                    <SelectItem value="minor">Nhẹ (&lt;40)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score-desc">Điểm cao nhất</SelectItem>
                    <SelectItem value="score-asc">Điểm thấp nhất</SelectItem>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="oldest">Cũ nhất</SelectItem>
                  </SelectContent>
                </Select>

                {(searchQuery ||
                  muteFilter !== "all" ||
                  scoreFilter !== "all" ||
                  sortBy !== "score-desc") && (
                  <Button variant="ghost" onClick={handleClearFilters}>
                    Xóa bộ lọc
                  </Button>
                )}
              </div>

              <div className="text-sm text-gray-600">
                Tìm thấy <strong>{sortedUsers.length}</strong> tài khoản
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Đang tải...</p>
              </div>
            ) : paginatedUsers.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Điểm vi phạm</TableHead>
                      <TableHead>Mức độ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Cấm đến</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              {user.userAvatar ? (
                                <AvatarImage src={user.userAvatar} />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                                {user.userName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.userName}</div>
                              <div className="text-xs text-gray-500">
                                ID: {user.userId}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-lg">
                            {user.totalViolationScore}
                          </span>
                          <span className="text-gray-500 text-sm">/100</span>
                        </TableCell>
                        <TableCell>
                          {getScoreBadge(user.totalViolationScore)}
                        </TableCell>
                        <TableCell>
                          {user.isMute ? (
                            <Badge className="bg-red-500 text-white">
                              Đang bị cấm
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500 text-white">
                              Bình thường
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {user.muteUntil ? formatDate(user.muteUntil) : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!user.isMute ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMuteClick(
                                        user.userId,
                                        user.userName
                                      )
                                    }
                                    className="text-orange-600"
                                  >
                                    <Ban className="w-4 h-4 mr-2" />
                                    Cấm người dùng
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUnmuteClick(
                                        user.userId,
                                        user.userName
                                      )
                                    }
                                    className="text-green-600"
                                  >
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Bỏ cấm
                                  </DropdownMenuItem>
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
                  onPageChange={handlePageChange}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Không tìm thấy tài khoản nào
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

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "mute"
                ? "Xác nhận cấm người dùng"
                : "Xác nhận bỏ cấm người dùng"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "mute"
                ? `Bạn có muốn cấm người dùng "${confirmDialog.userName}" trong vòng 7 ngày?`
                : `Bạn có muốn bỏ cấm người dùng "${confirmDialog.userName}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ViolationAccounts;
