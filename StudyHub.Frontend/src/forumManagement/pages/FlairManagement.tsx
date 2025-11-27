// StudyHub.Frontend/src/forumManagement/moderator/pages/FlairManagement.tsx
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { Switch } from "@/common/components/ui/switch";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Power,
  Shield,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { StatusBadge } from "../components/StatusBadge";
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";
import { useFlairStore } from "../stores/useFlairStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { toast } from "sonner";

const FlairManagement = () => {
  const { user } = useAuthStore();
  const {
    flairs,
    isLoading,
    getFlairs,
    createFlair,
    updateFlair,
    deleteFlair,
    toggleFlairStatus,
  } = useFlairStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [protectedFilter, setProtectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedFlair, setSelectedFlair] = useState<any | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const pageSize = 10;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isProtected: false,
  });

  useEffect(() => {
    if (user?.schoolId) {
      loadFlairs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  const loadFlairs = async () => {
    if (!user?.schoolId) return;
    await getFlairs(user.schoolId);
  };

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

      const matchesProtected =
        protectedFilter === "all" ||
        (protectedFilter === "protected" && flair.is_protected) ||
        (protectedFilter === "unprotected" && !flair.is_protected);

      return matchesSearch && matchesStatus && matchesProtected;
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
  }, [flairs, searchQuery, statusFilter, protectedFilter, sortBy]);

  const paginatedFlairs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedFlairs.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedFlairs, currentPage]);

  const pagination = {
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
    setProtectedFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  const handleEdit = (flair: any) => {
    setSelectedFlair(flair);
    setFormData({
      name: flair.name,
      description: flair.description || "",
      isProtected: flair.is_protected,
    });
    setShowEditDialog(true);
  };

  const handleCreate = async () => {
    if (!user?.schoolId) return;
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên flair");
      return;
    }

    setActionLoading(true);
    const result = await createFlair({
      schoolId: user.schoolId,
      flairName: formData.name,
      description: formData.description || undefined,
      isProtected: formData.isProtected,
    });
    setActionLoading(false);

    if (result?.success) {
      toast.success("Tạo flair thành công");
      setShowCreateDialog(false);
      setFormData({ name: "", description: "", isProtected: false });
      loadFlairs();
    } else {
      toast.error(result?.message || "Có lỗi xảy ra");
    }
  };

  const handleUpdate = async () => {
    if (!selectedFlair) return;
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên flair");
      return;
    }

    setActionLoading(true);
    const result = await updateFlair(selectedFlair.id, {
      flairName: formData.name,
      description: formData.description || undefined,
      isProtected: formData.isProtected,
    });
    setActionLoading(false);

    if (result?.success) {
      toast.success("Cập nhật flair thành công");
      setShowEditDialog(false);
      setSelectedFlair(null);
      setFormData({ name: "", description: "", isProtected: false });
      loadFlairs();
    } else {
      toast.error(result?.message || "Có lỗi xảy ra");
    }
  };

  const handleToggleStatus = async (flair: any) => {
    setActionLoading(true);
    const result = await toggleFlairStatus(flair.id);
    setActionLoading(false);

    if (result?.success) {
      toast.success(
        flair.status ? "Đã vô hiệu hóa flair" : "Đã kích hoạt flair"
      );
      loadFlairs();
    } else {
      toast.error(result?.message || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async () => {
    if (!selectedFlair) return;

    setActionLoading(true);
    const result = await deleteFlair(selectedFlair.id);
    setActionLoading(false);

    if (result?.success) {
      toast.success("Xóa flair thành công");
      setShowDeleteDialog(false);
      setSelectedFlair(null);
      loadFlairs();
    } else {
      toast.error(result?.message || "Có lỗi xảy ra");
    }
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
          <Button
            className="gap-2"
            onClick={() => {
              setFormData({ name: "", description: "", isProtected: false });
              setShowCreateDialog(true);
            }}
          >
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
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Vô hiệu</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={protectedFilter}
                  onValueChange={(value) => {
                    setProtectedFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Chế độ kiểm duyệt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="protected">
                      Kiểm duyệt vi phạm
                    </SelectItem>
                    <SelectItem value="unprotected">
                      Không kiểm duyệt
                    </SelectItem>
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
                  protectedFilter !== "all" ||
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
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : paginatedFlairs.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên Flair</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Kiểm duyệt vi phạm</TableHead>
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
                              Bật
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">Tắt</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={flair.status} />
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(flair.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={actionLoading}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEdit(flair)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(flair)}
                                >
                                  <Power className="w-4 h-4 mr-2" />
                                  {flair.status ? "Vô hiệu hóa" : "Kích hoạt"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedFlair(flair);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Xóa
                                </DropdownMenuItem>
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
              <label className="text-sm font-medium">Tên Flair *</label>
              <Input
                placeholder="Nhập tên flair..."
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Input
                placeholder="Nhập mô tả..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium">
                  Kiểm duyệt vi phạm
                </label>
                <p className="text-sm text-gray-500">
                  Bài viết với flair này sẽ bị pending nếu vi phạm quy tắc
                </p>
              </div>
              <Switch
                checked={formData.isProtected}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isProtected: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={actionLoading}
            >
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={actionLoading}>
              {actionLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Tạo Flair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <label className="text-sm font-medium">Tên Flair *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mô tả</label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-sm font-medium">
                      Kiểm duyệt tự động
                    </label>
                    <p className="text-sm text-gray-500">
                      Bài viết với flair này sẽ bị pending nếu vi phạm quy tắc
                    </p>
                  </div>
                  <Switch
                    checked={formData.isProtected}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isProtected: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  disabled={actionLoading}
                >
                  Hủy
                </Button>
                <Button onClick={handleUpdate} disabled={actionLoading}>
                  {actionLoading && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Lưu thay đổi
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa flair "{selectedFlair?.name}"? Hành động
              này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={actionLoading}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlairManagement;
