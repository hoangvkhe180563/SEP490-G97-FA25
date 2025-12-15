import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";

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
import { axiosInstance } from "@/lib/axios";

const ViolationAccounts = () => {
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || 1;

  const {
    userStatuses,
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
    minutes: number;
  }>({ open: false, action: "mute", userId: "", userName: "", minutes: 5 });

  const handleMuteClick = (userId: string, userName: string) => {
    setConfirmDialog({
      open: true,
      action: "mute",
      userId,
      userName,
      minutes: 5,
    });
  };

  const handleConfirmAction = async () => {
    const { action, userId, minutes } = confirmDialog;

    const success =
      action === "mute"
        ? await muteUser(userId, schoolId, minutes)
        : await unmuteUser(userId, schoolId);

    if (success) {
      toast.success(
        action === "mute"
          ? `Đã cấm người dùng trong ${minutes} phút`
          : "Đã bỏ cấm người dùng"
      );
    } else {
      toast.error("Có lỗi xảy ra");
    }

    setConfirmDialog({
      open: false,
      action: "mute",
      userId: "",
      userName: "",
      minutes: 5,
    });
  };

  useEffect(() => {
    if (schoolId) {
      setUserFilters({
        schoolId,
        pageNumber: 1,
        pageSize: 1000,
      });
      fetchUserStatuses();
    }
  }, [schoolId, setUserFilters, fetchUserStatuses]);

  const filteredUsers = userStatuses.filter((user) => {
    const matchesSearch =
      user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMute =
      muteFilter === "all" ||
      (muteFilter === "muted" && user.isMute) ||
      (muteFilter === "active" && !user.isMute);

    const matchesScore =
      scoreFilter === "all" ||
      (scoreFilter === "critical" && user.totalViolationScore < 40) ||
      (scoreFilter === "warning" &&
        user.totalViolationScore >= 40 &&
        user.totalViolationScore < 80) ||
      (scoreFilter === "minor" && user.totalViolationScore >= 80);

    return matchesSearch && matchesMute && matchesScore;
  });

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

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + pageSize);

  const pagination: PaginationInfo = {
    currentPage,
    totalPages: Math.ceil(sortedUsers.length / pageSize),
    totalCount: sortedUsers.length,
    pageSize,
  };

  const getScoreBadge = (score: number) => {
    if (score < 40)
      return <Badge className="bg-red-500 text-white">Nghiêm trọng</Badge>;
    if (score < 80)
      return <Badge className="bg-orange-500 text-white">Cảnh báo</Badge>;
    return <Badge className="bg-green-400 text-white">Nhẹ</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // ❌ XÓA: const localDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    // ✅ THÊM: Trình duyệt tự động chuyển UTC sang local time
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh", // Đảm bảo dùng múi giờ VN
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

  const handleUnmuteClick = (userId: string, userName: string) => {
    setConfirmDialog({
      open: true,
      action: "unmute",
      userId,
      userName,
      minutes: 5,
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, muteFilter, scoreFilter, sortBy]);
  const handleCheckUnmute = async (userId: string) => {
    try {
      const response = await axiosInstance.post(
        `/Forum/check-unmute/${userId}?schoolId=${schoolId}`
      );
      console.log("Check unmute result:", response.data);
      toast.info(JSON.stringify(response.data.data, null, 2));
    } catch (error) {
      console.error("Error checking unmute:", error);
    }
  };
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
                  placeholder="Tìm kiếm theo tên người dùng..."
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
                    <SelectItem value="critical">
                      Nghiêm trọng (&lt;40)
                    </SelectItem>
                    <SelectItem value="warning">Cảnh báo (40-79)</SelectItem>
                    <SelectItem value="minor">Nhẹ (≥80)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score-desc">Uy tín cao nhất</SelectItem>
                    <SelectItem value="score-asc">Uy tín thấp nhất</SelectItem>
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
                      <TableHead>Điểm uy tín</TableHead>
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
                            <div className="font-medium">{user.userName}</div>
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
                            <Badge className="bg-green-400 text-white">
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
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleUnmuteClick(
                                          user.userId,
                                          user.userName
                                        )
                                      }
                                      className="text-green-400"
                                    >
                                      <Unlock className="w-4 h-4 mr-2" />
                                      Bỏ cấm
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleCheckUnmute(user.userId)
                                      }
                                      className="text-blue-400"
                                    >
                                      Check Unmute
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
            <AlertDialogDescription asChild>
              {confirmDialog.action === "mute" ? (
                <div className="space-y-4">
                  <p>Bạn có muốn cấm người dùng "{confirmDialog.userName}"?</p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Số ngày cấm:</label>
                    <Select
                      value={confirmDialog.minutes.toString()}
                      onValueChange={(value) =>
                        setConfirmDialog({
                          ...confirmDialog,
                          minutes: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 phút</SelectItem>
                        <SelectItem value="1440">1 ngày</SelectItem>
                        <SelectItem value="4320">3 ngày</SelectItem>
                        <SelectItem value="10080">7 ngày</SelectItem>
                        <SelectItem value="20160">14 ngày</SelectItem>
                        <SelectItem value="43200">30 ngày</SelectItem>
                        <SelectItem value="129600">90 ngày</SelectItem>
                        <SelectItem value="525600">1 năm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <p>Bạn có muốn bỏ cấm người dùng "{confirmDialog.userName}"?</p>
              )}
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
