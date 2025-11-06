// StudyHub.Frontend/src/forumManagement/moderator/pages/PostManagement.tsx
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Filter,
  ChevronDown,
} from "lucide-react";
import type { Post, Subject, Flair } from "../interfaces/forum";
import type { PaginationInfo } from "../interfaces/pagination";
import ForumPagination from "@/documentManagement/components/documents/DocumentPagination";

const PostManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [selectedFlairs, setSelectedFlairs] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const posts: Post[] = useMemo(
    () => [
      {
        post_id: 1,
        subject_id: 1,
        subject_name: "Toán",
        flair_id: 1,
        flair_name: "Câu hỏi",
        title: "Cách giải phương trình bậc hai",
        content:
          "Mình đang học về phương trình bậc hai nhưng vẫn chưa hiểu rõ cách tính delta...",
        created_at: "2024-10-23T10:00:00",
        created_by: "user-001",
        author_name: "Nguyễn Minh An",
        author_initials: "AN",
        author_class: "10A1",
        comment_count: 3,
        image_urls: "",
        comments: [],
      },
      {
        post_id: 2,
        subject_id: 2,
        subject_name: "Vật Lý",
        flair_id: 1,
        flair_name: "Câu hỏi",
        title: "Định luật Newton thứ ba",
        content: "Ai giải thích định luật Newton thứ ba giúp mình với!",
        created_at: "2024-10-23T09:00:00",
        created_by: "user-002",
        author_name: "Trần Văn B",
        author_initials: "VB",
        author_class: "11A2",
        comment_count: 5,
        image_urls: "",
        comments: [],
      },
      {
        post_id: 3,
        subject_id: 1,
        subject_name: "Toán",
        flair_id: 2,
        flair_name: "Kiến thức",
        title: "Tổng hợp công thức đạo hàm",
        content:
          "Mình tổng hợp các công thức đạo hàm cơ bản cho các bạn tham khảo",
        created_at: "2024-10-22T15:30:00",
        created_by: "user-003",
        author_name: "Lê Thị C",
        author_initials: "TC",
        author_class: "12A1",
        comment_count: 8,
        image_urls: "",
        comments: [],
      },
    ],
    []
  );

  const subjects: Subject[] = [
    { id: 1, name: "Toán" },
    { id: 2, name: "Vật Lý" },
    { id: 3, name: "Hóa học" },
    { id: 4, name: "Văn" },
    { id: 5, name: "Tiếng Anh" },
  ];

  const flairs: Flair[] = [
    { id: 1, name: "Câu hỏi" },
    { id: 2, name: "Kiến thức" },
    { id: 3, name: "Thảo luận" },
  ];

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((s) => s !== subjectId)
        : [...prev, subjectId]
    );
    setCurrentPage(1);
  };

  const toggleFlair = (flairId: number) => {
    setSelectedFlairs((prev) =>
      prev.includes(flairId)
        ? prev.filter((f) => f !== flairId)
        : [...prev, flairId]
    );
    setCurrentPage(1);
  };

  const filteredAndSortedPosts = useMemo(() => {
    const filtered = posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject =
        selectedSubjects.length === 0 ||
        selectedSubjects.includes(post.subject_id);

      const matchesFlair =
        selectedFlairs.length === 0 || selectedFlairs.includes(post.flair_id);

      const matchesStatus = statusFilter === "all" || true; // Add status logic here

      return matchesSearch && matchesSubject && matchesFlair && matchesStatus;
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
        case "mostCommented":
          return b.comment_count - a.comment_count;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    posts,
    searchQuery,
    selectedSubjects,
    selectedFlairs,
    statusFilter,
    sortBy,
  ]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedPosts.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedPosts, currentPage]);

  const pagination: PaginationInfo = {
    currentPage,
    totalPages: Math.ceil(filteredAndSortedPosts.length / pageSize),
    totalCount: filteredAndSortedPosts.length,
    pageSize,
  };

  const getStatusBadge = (status: boolean | null) => {
    if (status === null)
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
          Chờ duyệt
        </Badge>
      );
    if (status === true)
      return <Badge className="bg-green-500 text-white">Đã duyệt</Badge>;
    return <Badge className="bg-red-500 text-white">Bị từ chối</Badge>;
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
    setSelectedSubjects([]);
    setSelectedFlairs([]);
    setStatusFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  return (
    <div className="w-full h-full overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý Bài viết</h1>
            <p className="text-gray-600 mt-1">
              Xem và điều hành các bài viết trong forum
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Duyệt hàng loạt
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm theo tiêu đề, nội dung, tác giả..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="w-4 h-4" />
                      Môn học{" "}
                      {selectedSubjects.length > 0 &&
                        `(${selectedSubjects.length})`}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {subjects.map((subject) => (
                      <DropdownMenuCheckboxItem
                        key={subject.id}
                        checked={selectedSubjects.includes(subject.id)}
                        onCheckedChange={() => toggleSubject(subject.id)}
                      >
                        {subject.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Filter className="w-4 h-4" />
                      Flair{" "}
                      {selectedFlairs.length > 0 &&
                        `(${selectedFlairs.length})`}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {flairs.map((flair) => (
                      <DropdownMenuCheckboxItem
                        key={flair.id}
                        checked={selectedFlairs.includes(flair.id)}
                        onCheckedChange={() => toggleFlair(flair.id)}
                      >
                        {flair.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

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
                    <SelectItem value="pending">Chờ duyệt</SelectItem>
                    <SelectItem value="approved">Đã duyệt</SelectItem>
                    <SelectItem value="rejected">Đã từ chối</SelectItem>
                    <SelectItem value="hidden">Bị ẩn</SelectItem>
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
                    <SelectItem value="mostCommented">
                      Nhiều bình luận
                    </SelectItem>
                  </SelectContent>
                </Select>

                {(searchQuery ||
                  selectedSubjects.length > 0 ||
                  selectedFlairs.length > 0 ||
                  statusFilter !== "all" ||
                  sortBy !== "newest") && (
                  <Button variant="ghost" onClick={handleClearFilters}>
                    Xóa bộ lọc
                  </Button>
                )}
              </div>

              <div className="text-sm text-gray-600">
                Tìm thấy <strong>{filteredAndSortedPosts.length}</strong> bài
                viết
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedPosts.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tác giả</TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Môn học</TableHead>
                      <TableHead>Flair</TableHead>
                      <TableHead>Bình luận</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPosts.map((post) => (
                      <TableRow key={post.post_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-purple-500 text-white text-xs">
                                {post.author_initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {post.author_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {post.author_class}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="font-medium truncate">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {post.content}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{post.subject_name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{post.flair_name}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {post.comment_count}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(post.created_at)}
                        </TableCell>
                        <TableCell>{getStatusBadge(null)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1 text-green-600 hover:text-green-700"
                              title="Duyệt"
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
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1 text-orange-600 hover:text-orange-700"
                              title="Ẩn bài"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ForumPagination
                  pagination={pagination}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  Không tìm thấy bài viết nào
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

export default PostManagement;
