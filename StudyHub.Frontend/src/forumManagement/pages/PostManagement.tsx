// StudyHub.Frontend/src/forumManagement/moderator/pages/PostManagement.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  DropdownMenuItem,
} from "@/common/components/ui/dropdown-menu";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Filter,
  ChevronDown,
  MoreVertical,
} from "lucide-react";
import type { Post } from "../interfaces/forum";
import type { PaginationInfo } from "../interfaces/pagination";
import ForumPagination from "@/documentManagement/components/documents/DocumentPagination";
import { useForumStore } from "../stores/useForumStore";
import { documentService } from "@/documentManagement/services/documentService";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { PostDetailModal } from "@/forumManagement/components/PostDetailModal";
import { HidePostModal } from "@/forumManagement/components/HidePostModal";

interface ModeratorPost extends Post {
  status: boolean | null;
  violation_score?: number;
}

const PostManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || 1;
  const {
    flairs,
    loadFlairs,
    getModeratorPosts,
    approvePost,
    rejectPost,
    hidePost,
    currentPost,
    getPostById,
    getComments,
    joinPost,
    leavePost,
    isLoading,
  } = useForumStore();

  const [posts, setPosts] = useState<ModeratorPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [selectedFlairs, setSelectedFlairs] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [modalVisibleComments, setModalVisibleComments] = useState(8);
  const [hideModalOpen, setHideModalOpen] = useState(false);
  const [postToHide, setPostToHide] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string }>>(
    []
  );

  useEffect(() => {
    if (selectedPostId) {
      getPostById(selectedPostId);
      getComments(selectedPostId);
      joinPost(selectedPostId);
    }
    return () => {
      if (selectedPostId) leavePost(selectedPostId);
    };
  }, [selectedPostId, getPostById, getComments, joinPost, leavePost]);

  useEffect(() => {
    documentService.getSubjects().then(setSubjects);
    loadFlairs(schoolId);
  }, [schoolId, loadFlairs]);

  const fetchModeratorPosts = useCallback(async () => {
    const sortByParam =
      sortBy === "oldest"
        ? "date_asc"
        : sortBy === "mostCommented"
        ? "comment_count"
        : undefined;

    const postStatusParam =
      statusFilter === "pending"
        ? "Pending"
        : statusFilter === "approved"
        ? "Approved"
        : statusFilter === "rejected"
        ? "Rejected"
        : undefined;

    const result = await getModeratorPosts(
      schoolId,
      selectedSubjects.length > 0 ? selectedSubjects : undefined,
      selectedFlairs.length > 0 ? selectedFlairs : undefined,
      searchQuery || undefined,
      postStatusParam,
      undefined,
      undefined,
      undefined,
      undefined,
      sortByParam,
      currentPage,
      pageSize
    );

    if (result?.data) {
      setTotalCount(result.data.total || 0);
      const mappedPosts = (result.data.items || []).map((item: any) => ({
        post_id: item.postId || item.post_id,
        school_id: item.schoolId || item.school_id,
        subject_id: item.subjectId || item.subject_id,
        subject_name: item.subjectName || item.subject_name || "N/A",
        flair_id: item.flairId || item.flair_id,
        flair_name: item.flairName || item.flair_name || "N/A",
        title: item.title || "",
        content: item.content || "",
        created_at: item.createdAt || item.created_at,
        created_by: item.createdBy || item.created_by,
        author_name: item.creatorFullname || item.creatorName || "Unknown",
        author_initials: (item.creatorFullname || item.creatorName || "U")
          .substring(0, 2)
          .toUpperCase(),
        author_class: item.creatorClass || "",
        comment_count: item.commentCount || item.comment_count || 0,
        status: item.status ?? null,
        violation_score: item.violationScore ?? 0,
        image_urls: "",
        comments: [],
      }));
      setPosts(mappedPosts);
    }
  }, [
    schoolId,
    searchQuery,
    selectedSubjects,
    selectedFlairs,
    sortBy,
    statusFilter,
    currentPage,
    getModeratorPosts,
  ]);

  const displayPosts = posts;

  useEffect(() => {
    fetchModeratorPosts();
  }, [fetchModeratorPosts]);

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

  const pagination: PaginationInfo = {
    currentPage,
    totalPages: Math.ceil(totalCount / pageSize),
    totalCount,
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

  const handleApprove = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    const result = await approvePost(postId);
    if (result?.success) {
      fetchModeratorPosts();
    }
  };

  const handleReject = async (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    const result = await rejectPost(postId);
    if (result?.success) {
      fetchModeratorPosts();
    }
  };

  const handleOpenHideModal = (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    setPostToHide(postId);
    setHideModalOpen(true);
  };

  const handleHideSubmit = async (postId: number, violationScore: number) => {
    const result = await hidePost(postId, violationScore);
    return result;
  };
  const handleViewModal = (e: React.MouseEvent, postId: number) => {
    e.stopPropagation();
    setSelectedPostId(postId);
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
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    console.log("SortBy changed to:", value);
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
                Tìm thấy <strong>{totalCount}</strong> bài viết
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Đang tải...</p>
              </div>
            ) : displayPosts.length > 0 ? (
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
                    {displayPosts.map((post) => (
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
                        <TableCell>{getStatusBadge(post.status)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) =>
                                    handleViewModal(e, post.post_id)
                                  }
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Xem nhanh
                                </DropdownMenuItem>
                                {post.status === null && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={(e) =>
                                        handleApprove(e, post.post_id)
                                      }
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Duyệt
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) =>
                                        handleReject(e, post.post_id)
                                      }
                                      className="text-red-600"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Từ chối
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {post.status === true && (
                                  <DropdownMenuItem
                                    onClick={(e) =>
                                      handleOpenHideModal(e, post.post_id)
                                    }
                                    className="text-orange-600"
                                  >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Ẩn bài
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

      <PostDetailModal
        isOpen={!!selectedPostId}
        post={currentPost}
        visibleComments={modalVisibleComments}
        isLoading={isLoading}
        onClose={() => setSelectedPostId(null)}
        onViewDetails={(postId) => navigate(`/forum/moderator/posts/${postId}`)}
        onRefreshComments={async () => {
          if (selectedPostId) await getComments(selectedPostId);
        }}
        onLoadMoreComments={() => setModalVisibleComments((prev) => prev + 8)}
        onSubmitComment={async () => {}}
        onImageClick={() => {}}
        onTyping={() => {}}
      />

      <HidePostModal
        open={hideModalOpen}
        onOpenChange={setHideModalOpen}
        postId={postToHide || 0}
        onSuccess={fetchModeratorPosts}
        onHide={handleHideSubmit}
      />
    </div>
  );
};

export default PostManagement;
