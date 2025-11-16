// StudyHub.Frontend/src/forumManagement/moderator/pages/ViolationAccounts.tsx
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
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
import { Search, Ban, UserX } from "lucide-react";
import type { UserForumStatus } from "../interfaces/moderator";
import type { PaginationInfo } from "@/documentManagement/interfaces/document";
import DocumentPagination from "@/documentManagement/components/documents/DocumentPagination";

const ViolationAccounts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [muteFilter, setMuteFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const users: UserForumStatus[] = useMemo(
    () => [
      {
        user_id: "user-001",
        user_name: "Nguyễn Văn A",
        school_id: 1,
        total_violation_score: 65,
        is_mute: false,
        created_at: "2024-10-20T10:00:00",
      },
      {
        user_id: "user-002",
        user_name: "Trần Thị B",
        school_id: 1,
        total_violation_score: 85,
        is_mute: true,
        mute_until: "2024-11-10T10:00:00",
        created_at: "2024-10-15T10:00:00",
      },
      {
        user_id: "user-003",
        user_name: "Lê Văn C",
        school_id: 1,
        total_violation_score: 30,
        is_mute: false,
        created_at: "2024-10-18T14:30:00",
      },
      {
        user_id: "user-004",
        user_name: "Phạm Thị D",
        school_id: 1,
        total_violation_score: 50,
        is_mute: false,
        created_at: "2024-10-19T09:15:00",
      },
      {
        user_id: "user-005",
        user_name: "Hoàng Văn E",
        school_id: 1,
        total_violation_score: 95,
        is_mute: true,
        mute_until: "2024-12-01T10:00:00",
        created_at: "2024-10-10T11:20:00",
      },
    ],
    []
  );

  const filteredAndSortedUsers = useMemo(() => {
    const filtered = users.filter((user) => {
      const matchesSearch =
        user.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.user_id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMute =
        muteFilter === "all" ||
        (muteFilter === "muted" && user.is_mute) ||
        (muteFilter === "active" && !user.is_mute);

      const matchesScore =
        scoreFilter === "all" ||
        (scoreFilter === "critical" && user.total_violation_score >= 70) ||
        (scoreFilter === "warning" &&
          user.total_violation_score >= 40 &&
          user.total_violation_score < 70) ||
        (scoreFilter === "minor" && user.total_violation_score < 40);

      return matchesSearch && matchesMute && matchesScore;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score-desc":
          return b.total_violation_score - a.total_violation_score;
        case "score-asc":
          return a.total_violation_score - b.total_violation_score;
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
  }, [users, searchQuery, muteFilter, scoreFilter, sortBy]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedUsers, currentPage]);

  const pagination: PaginationInfo = {
    currentPage,
    totalPages: Math.ceil(filteredAndSortedUsers.length / pageSize),
    totalCount: filteredAndSortedUsers.length,
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Select
                  value={muteFilter}
                  onValueChange={(value) => {
                    setMuteFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Trạng thái Mute" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="muted">Đang bị mute</SelectItem>
                    <SelectItem value="active">
                      Hoạt động bình thường
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={scoreFilter}
                  onValueChange={(value) => {
                    setScoreFilter(value);
                    setCurrentPage(1);
                  }}
                >
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
                Tìm thấy <strong>{filteredAndSortedUsers.length}</strong> tài
                khoản
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedUsers.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Điểm vi phạm</TableHead>
                      <TableHead>Mức độ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Mute đến</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                                {user.user_name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.user_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {user.user_id}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-lg">
                            {user.total_violation_score}
                          </span>
                          <span className="text-gray-500 text-sm">/100</span>
                        </TableCell>
                        <TableCell>
                          {getScoreBadge(user.total_violation_score)}
                        </TableCell>
                        <TableCell>
                          {user.is_mute ? (
                            <Badge className="bg-red-500 text-white">
                              Đang bị mute
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500 text-white">
                              Bình thường
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {user.mute_until ? formatDate(user.mute_until) : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              title="Mute người dùng"
                            >
                              <Ban className="w-4 h-4" />
                              Mute
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              title="Ban người dùng"
                            >
                              <UserX className="w-4 h-4" />
                              Ban
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
    </div>
  );
};

export default ViolationAccounts;
