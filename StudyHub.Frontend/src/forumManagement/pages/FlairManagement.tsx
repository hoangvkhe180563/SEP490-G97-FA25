// StudyHub.Frontend/src/forumManagement/moderator/pages/FlairManagement.tsx
import { useState, useMemo } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/common/components/ui/dialog";
import { Search, Plus, Edit, Trash2, Power, Shield } from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import type { ForumFlair } from "../interfaces/moderator";
import type { PaginationInfo } from "@/documentManagement/interfaces/document";
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";

const FlairManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedFlair, setSelectedFlair] = useState<ForumFlair | null>(null);
  const pageSize = 10;

  const flairs: ForumFlair[] = useMemo(
    () => [
      {
        id: 1,
        school_id: 1,
        name: "Câu hỏi",
        description: "Dùng cho các bài viết hỏi đáp",
        is_protected: true,
        status: true,
        created_at: "2024-10-01T10:00:00",
        created_by: "admin-001",
      },
      {
        id: 2,
        school_id: 1,
        name: "Kiến thức",
        description: "Chia sẻ kiến thức, tài liệu học tập",
        is_protected: true,
        status: true,
        created_at: "2024-10-01T10:00:00",
        created_by: "admin-001",
      },
      {
        id: 3,
        school_id: 1,
        name: "Thảo luận",
        description: "Thảo luận chung về học tập",
        is_protected: true,
        status: true,
        created_at: "2024-10-01T10:00:00",
        created_by: "admin-001",
      },
      {
        id: 4,
        school_id: 1,
        name: "Giải trí",
        description: "Nội dung giải trí phù hợp",
        is_protected: false,
        status: true,
        created_at: "2024-10-15T14:30:00",
        created_by: "moderator-001",
      },
      {
        id: 5,
        school_id: 1,
        name: "Thông báo",
        description: "Thông báo quan trọng",
        is_protected: false,
        status: false,
        created_at: "2024-10-20T09:15:00",
        created_by: "moderator-002",
      },
    ],
    []
  );

  const filteredAndSortedFlairs = useMemo(() => {
    const filtered = flairs.filter((flair) => {
      const matchesSearch =
        flair.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flair.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && flair.status) ||
        (statusFilter === "inactive" && !flair.status);

      return matchesSearch && matchesStatus;
    });

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
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [flairs, searchQuery, statusFilter, sortBy]);

  const paginatedFlairs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedFlairs.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedFlairs, currentPage]);

  const pagination: PaginationInfo = {
    currentPage,
    totalPages: Math.ceil(filteredAndSortedFlairs.length / pageSize),
    totalCount: filteredAndSortedFlairs.length,
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

  const handleEdit = (flair: ForumFlair) => {
    setSelectedFlair(flair);
    setShowEditDialog(true);
  };

  return (
    <div className="w-full h-full overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý Flair</h1>
            <p className="text-gray-600 mt-1">
              Quản lý các loại bài viết trong forum
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4" />
            Tạo Flair mới
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên hoặc mô tả..."
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
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Vô hiệu</SelectItem>
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
                    <SelectItem value="name">Theo tên</SelectItem>
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
                Tìm thấy <strong>{filteredAndSortedFlairs.length}</strong> flair
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedFlairs.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên Flair</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Bảo vệ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFlairs.map((flair) => (
                      <TableRow key={flair.id}>
                        <TableCell>
                          <div className="font-medium">{flair.name}</div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-gray-600 truncate">
                            {flair.description || "-"}
                          </p>
                        </TableCell>
                        <TableCell>
                          {flair.is_protected ? (
                            <Badge variant="outline" className="gap-1">
                              <Shield className="w-3 h-3" />
                              Protected
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={flair.status} />
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(flair.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1"
                              onClick={() => handleEdit(flair)}
                              disabled={flair.is_protected}
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1"
                              disabled={flair.is_protected}
                              title={flair.status ? "Vô hiệu hóa" : "Kích hoạt"}
                            >
                              <Power className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1 text-red-600 hover:text-red-700"
                              disabled={flair.is_protected}
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
                  Không tìm thấy flair nào
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo Flair mới</DialogTitle>
            <DialogDescription>
              Tạo loại bài viết mới cho forum
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên Flair</label>
              <Input placeholder="Nhập tên flair..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Input placeholder="Nhập mô tả..." />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Hủy
            </Button>
            <Button>Tạo Flair</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          {selectedFlair && (
            <>
              <DialogHeader>
                <DialogTitle>Chỉnh sửa Flair</DialogTitle>
                <DialogDescription>Cập nhật thông tin flair</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tên Flair</label>
                  <Input defaultValue={selectedFlair.name} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mô tả</label>
                  <Input defaultValue={selectedFlair.description} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  Hủy
                </Button>
                <Button>Lưu thay đổi</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlairManagement;
