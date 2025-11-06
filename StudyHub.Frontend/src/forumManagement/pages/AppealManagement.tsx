// StudyHub.Frontend/src/forumManagement/moderator/pages/AppealManagement.tsx
import { useState, useMemo } from "react";
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
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import type { UserAppeal } from "../interfaces/moderator";
import type { PaginationInfo } from "@/documentManagement/interfaces/document";
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";

const AppealManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAppeal, setSelectedAppeal] = useState<UserAppeal | null>(null);
  const pageSize = 10;

  const appeals: UserAppeal[] = useMemo(
    () => [
      {
        id: 1,
        user_id: "user-001",
        user_name: "Nguyễn Văn A",
        school_id: 1,
        reason:
          "Tôi nghĩ bài viết của tôi không vi phạm quy định. Xin được xem xét lại vì nội dung hoàn toàn mang tính học thuật và không có ý xúc phạm ai.",
        status: null,
        created_at: "2024-10-23T10:00:00",
      },
      {
        id: 2,
        user_id: "user-002",
        user_name: "Trần Thị B",
        school_id: 1,
        reason:
          "Tôi xin lỗi về vi phạm trước đó. Tôi hứa sẽ tuân thủ quy định diễn đàn trong tương lai.",
        status: true,
        created_at: "2024-10-22T15:30:00",
        updated_at: "2024-10-23T09:00:00",
        updated_by: "admin-001",
      },
      {
        id: 3,
        user_id: "user-003",
        user_name: "Lê Văn C",
        school_id: 1,
        reason:
          "Bài viết bị xóa nhầm. Tôi chỉ đang thảo luận về kiến thức môn học.",
        status: false,
        created_at: "2024-10-21T11:20:00",
        updated_at: "2024-10-22T14:30:00",
        updated_by: "admin-002",
      },
      {
        id: 4,
        user_id: "user-004",
        user_name: "Phạm Thị D",
        school_id: 1,
        reason: "Tôi bị mute không đúng. Xin được giải trình rõ hơn về lý do.",
        status: null,
        created_at: "2024-10-23T08:45:00",
      },
      {
        id: 5,
        user_id: "user-005",
        user_name: "Hoàng Văn E",
        school_id: 1,
        reason:
          "Tôi nhận thấy có sự nhầm lẫn trong việc đánh giá vi phạm của tôi. Mong được xem xét lại.",
        status: null,
        created_at: "2024-10-22T16:00:00",
      },
    ],
    []
  );
  const filteredAndSortedAppeals = useMemo(() => {
    const filtered = appeals.filter((appeal) => {
      const matchesSearch =
        appeal.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appeal.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appeal.reason.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && appeal.status === null) ||
        (statusFilter === "approved" && appeal.status === true) ||
        (statusFilter === "rejected" && appeal.status === false);

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [appeals, searchQuery, statusFilter, sortBy]);

  const paginatedAppeals = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedAppeals.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedAppeals, currentPage]);

  const pagination: PaginationInfo = {
    currentPage,
    totalPages: Math.ceil(filteredAndSortedAppeals.length / pageSize),
    totalCount: filteredAndSortedAppeals.length,
    pageSize,
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

  return (
    <div className="w-full h-full overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý Kháng cáo</h1>
            <p className="text-gray-600 mt-1">
              Xem xét các yêu cầu kháng cáo từ người dùng
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên, ID hoặc lý do kháng cáo..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Đang chờ</SelectItem>
                    <SelectItem value="approved">Chấp nhận</SelectItem>
                    <SelectItem value="rejected">Từ chối</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    setSortBy(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="oldest">Cũ nhất</SelectItem>
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
                Tìm thấy <strong>{filteredAndSortedAppeals.length}</strong>{" "}
                kháng cáo
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedAppeals.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Lý do kháng cáo</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAppeals.map((appeal) => (
                      <TableRow key={appeal.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                                {appeal.user_name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {appeal.user_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {appeal.user_id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm line-clamp-2">
                            {appeal.reason}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(appeal.created_at)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={appeal.status} type="appeal" />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1"
                              onClick={() => setSelectedAppeal(appeal)}
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {appeal.status === null && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1 text-green-600 hover:text-green-700"
                                  title="Chấp nhận"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1 text-red-600 hover:text-red-700"
                                  title="Từ chối"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
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
                      {selectedAppeal.user_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-lg">
                      {selectedAppeal.user_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {selectedAppeal.user_id}
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
                    <Button className="flex-1 gap-2" variant="default">
                      <CheckCircle className="w-4 h-4" />
                      Chấp nhận kháng cáo
                    </Button>
                    <Button className="flex-1 gap-2" variant="destructive">
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
    </div>
  );
};

export default AppealManagement;
