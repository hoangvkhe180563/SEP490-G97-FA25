// forummain.tsx - Fixed
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import {
  Search,
  ChevronDown,
  X,
  Filter,
  Users,
  ArrowUp,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Plus,
  ImagePlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import PostCard from "../components/PostCard";
import { CreatePostDialog } from "../components/CreatePostDialog";
import type { Post, Subject } from "../interfaces/forum";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { MessageSquare, Send, ChevronUp, Loader2 } from "lucide-react";
import { useForumStore } from "../stores/useForumStore";
import { documentService } from "@/documentManagement/services/documentService";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { getSubjectBadgeColor, getFlairColor } from "../utils/colorUtils";
import { DialogDescription } from "@/common/components/ui/dialog";

const ForumMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const observerTarget = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuthStore();
  const schoolId = user?.schoolId || 1;

  const {
    posts,
    currentPost,
    isLoading,
    flairs,
    loadFlairs,
    startForum,
    stopForum,
    joinSchoolForum,
    joinPost,
    leavePost,
    getPosts,
    getPostById,
    getComments,
    createComment,
    sendTyping,
  } = useForumStore();

  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [imageZoom, setImageZoom] = useState(1);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const getInitialState = () => {
    const saved = sessionStorage.getItem("forumMainState");
    if (saved && location.state?.fromModal) {
      return JSON.parse(saved);
    }
    return {
      searchQuery: searchParams.get("q") || "",
      selectedSubjects: searchParams.get("subjects")
        ? searchParams.get("subjects")!.split(",").map(Number)
        : [],
      selectedFlairs: searchParams.get("flairs")
        ? searchParams.get("flairs")!.split(",").map(Number)
        : [],
      sortBy: searchParams.get("sort") || "newest",
      visiblePosts: 10,
      scrollPosition: 0,
    };
  };

  const initialState = getInitialState();

  const [searchQuery, setSearchQuery] = useState<string>(
    initialState.searchQuery
  );
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>(
    initialState.selectedSubjects
  );
  const [selectedFlairs, setSelectedFlairs] = useState<number[]>(
    initialState.selectedFlairs
  );
  const [sortBy, setSortBy] = useState<string>(initialState.sortBy);
  const [visiblePosts, setVisiblePosts] = useState(initialState.visiblePosts);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(
    new Set()
  );
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [commentSort, setCommentSort] = useState("newest");
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentImages, setCommentImages] = useState<File[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [replyContents, setReplyContents] = useState<{ [key: number]: string }>(
    {}
  );
  const [replyImagesList, setReplyImagesList] = useState<{
    [key: number]: File[];
  }>({});

  const modalPostId = searchParams.get("postId");
  const isModalOpen = !!modalPostId;

  useEffect(() => {
    const initForum = async () => {
      await startForum();
      await joinSchoolForum(schoolId);
    };

    initForum();
    documentService.getSubjects().then(setSubjects);
    loadFlairs(schoolId);

    return () => {
      stopForum();
    };
  }, [startForum, stopForum, joinSchoolForum, schoolId, loadFlairs]);

  const fetchPosts = useCallback(() => {
    const subjectId =
      selectedSubjects.length === 1 ? selectedSubjects[0] : undefined;
    const flairId = selectedFlairs.length === 1 ? selectedFlairs[0] : undefined;

    getPosts(schoolId, subjectId, flairId, searchQuery, sortBy, 1, 100);
  }, [
    schoolId,
    searchQuery,
    selectedSubjects,
    selectedFlairs,
    sortBy,
    getPosts,
  ]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Line 119-130 - useEffect cho modalPostId
  useEffect(() => {
    const handleModalPost = async () => {
      if (modalPostId) {
        const postId = parseInt(modalPostId);

        // Đợi connection ready trước khi join
        const conn = (window as any).__forumConn;
        if (conn?.state === "Connected") {
          await joinPost(postId);
        } else {
          // Retry sau 100ms nếu chưa connected
          const retryJoin = setInterval(() => {
            const c = (window as any).__forumConn;
            if (c?.state === "Connected") {
              clearInterval(retryJoin);
              joinPost(postId);
            }
          }, 100);

          // Timeout sau 3s
          setTimeout(() => clearInterval(retryJoin), 3000);
        }

        getPostById(postId);
        getComments(postId);
      }

      return () => {
        if (modalPostId) {
          leavePost(parseInt(modalPostId));
        }
      };
    };

    handleModalPost();
  }, [modalPostId, getPostById, joinPost, getComments, leavePost]);
  // Thêm sau Line 200
  const handleReplyImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    commentId: number
  ) => {
    const files = Array.from(e.target.files || []);
    const currentImages = replyImagesList[commentId] || [];

    if (files.length + currentImages.length > 4) {
      alert("Tối đa 4 ảnh");
      return;
    }

    setReplyImagesList({
      ...replyImagesList,
      [commentId]: [...currentImages, ...files],
    });
  };

  const handleSubmitReply = async (parentCommentId: number) => {
    const content = replyContents[parentCommentId];
    if (!content?.trim() || !modalPostId) return;

    const formData = new FormData();
    formData.append("postId", modalPostId);
    formData.append("parentCommentId", parentCommentId.toString());
    formData.append("content", content);

    const images = replyImagesList[parentCommentId] || [];
    images.forEach((img) => formData.append("attachments", img));

    const result = await createComment(formData);
    if (result?.success) {
      // Clear reply state cho comment này
      setReplyContents({
        ...replyContents,
        [parentCommentId]: "",
      });
      setReplyImagesList({
        ...replyImagesList,
        [parentCommentId]: [],
      });
      setReplyingTo(null);
    }
  };
  useEffect(() => {
    const state = {
      searchQuery,
      selectedSubjects,
      selectedFlairs,
      sortBy,
      visiblePosts,
      scrollPosition: window.scrollY,
    };
    sessionStorage.setItem("forumMainState", JSON.stringify(state));
  }, [searchQuery, selectedSubjects, selectedFlairs, sortBy, visiblePosts]);

  useEffect(() => {
    if (location.state?.fromModal && initialState.scrollPosition) {
      window.scrollTo(0, initialState.scrollPosition);
    }
  }, [location.state?.fromModal, initialState.scrollPosition]);

  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    if (searchQuery) newSearchParams.set("q", searchQuery);
    if (selectedSubjects.length > 0)
      newSearchParams.set("subjects", selectedSubjects.join(","));
    if (selectedFlairs.length > 0)
      newSearchParams.set("flairs", selectedFlairs.join(","));
    if (sortBy !== "newest") newSearchParams.set("sort", sortBy);
    if (modalPostId) newSearchParams.set("postId", modalPostId);

    setSearchParams(newSearchParams, { replace: true });
  }, [
    searchQuery,
    selectedSubjects,
    selectedFlairs,
    sortBy,
    modalPostId,
    setSearchParams,
  ]);

  useEffect(() => {
    const currentTarget = observerTarget.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visiblePosts < filteredPosts.length) {
          setVisiblePosts((prev: number) => prev + 5);
        }
      },
      { threshold: 0.1 }
    );

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePosts]);

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} ngày trước`;
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjects((prev: number[]) =>
      prev.includes(subjectId)
        ? prev.filter((s) => s !== subjectId)
        : [...prev, subjectId]
    );
  };

  const toggleFlair = (flairId: number) => {
    setSelectedFlairs((prev: number[]) =>
      prev.includes(flairId)
        ? prev.filter((f) => f !== flairId)
        : [...prev, flairId]
    );
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedSubjects([]);
    setSelectedFlairs([]);
    setSortBy("newest");
  };

  const sortPosts = (posts: Post[]) => {
    switch (sortBy) {
      case "newest":
        return [...posts].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return [...posts].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "mostCommented":
        return [...posts].sort((a, b) => b.comment_count - a.comment_count);
      default:
        return posts;
    }
  };

  const filteredPosts = sortPosts(posts);

  const handleOpenModal = (postId: number) => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set("postId", postId.toString());
    navigate(`?${currentParams.toString()}`, { replace: false });
  };

  const handleCloseModal = () => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.delete("postId");
    navigate(`?${currentParams.toString()}`, { replace: false });
  };

  const handleViewDetails = (postId: number) => {
    navigate(`/forum/student/forums/details/${postId}`);
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setHasNewPosts(false);
  };

  const toggleReplies = (commentId: number) => {
    setExpandedReplies((prev: Set<number>) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const getSortedComments = (comments: Post["comments"]) => {
    if (!comments) return [];
    const topLevelComments = comments.filter((c) => !c.parent_comment_id);
    switch (commentSort) {
      case "newest":
        return [...topLevelComments].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return [...topLevelComments].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      default:
        return topLevelComments;
    }
  };

  const handleImageClick = (
    e: React.MouseEvent,
    images: string[],
    idx: number
  ) => {
    e.stopPropagation();
    setModalImages(images);
    setSelectedImageIndex(idx);
    setImageZoom(1);
    setShowImageModal(true);
  };

  const handleCloseImageModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowImageModal(false);
    setImageZoom(1);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + commentImages.length > 4) {
      alert("Tối đa 4 ảnh");
      return;
    }
    setCommentImages((prev) => [...prev, ...files]);
  };

  const handleSubmitComment = async () => {
    if (!commentContent.trim() || !modalPostId) return;

    const formData = new FormData();
    formData.append("postId", modalPostId); // Đảm bảo key đúng
    formData.append("content", commentContent);

    if (replyingTo) {
      formData.append("parentCommentId", replyingTo.toString());
    }

    commentImages.forEach((img) => formData.append("attachments", img));

    const result = await createComment(formData);
    if (result?.success) {
      setCommentContent("");
      setCommentImages([]);
      setReplyingTo(null);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (modalPostId) {
      sendTyping(parseInt(modalPostId), isTyping);
    }
  };

  return (
    <div className="w-full h-full overflow-auto p-2">
      <div className="max-w mx-auto">
        <div className="bg-white rounded-2xl p-8 mb-8 border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                Forum Học Tập
              </h1>
              <p className="text-gray-600">
                Nơi học sinh chia sẻ và giải đáp thắc mắc
              </p>
            </div>
            <Button
              onClick={() => setShowCreatePost(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo bài viết
            </Button>
          </div>
        </div>

        {hasNewPosts && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-300">
            <Button
              onClick={handleScrollToTop}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Có bài viết mới
            </Button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-lg">Bộ lọc</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm">
                          Môn học{" "}
                          {selectedSubjects.length > 0 &&
                            `(${selectedSubjects.length})`}
                        </span>
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
                  {selectedSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedSubjects.map((subjectId) => {
                        const subject = subjects.find(
                          (s) => s.id === subjectId
                        );
                        return (
                          <Badge
                            key={subjectId}
                            className={`${getSubjectBadgeColor(
                              subject?.name || ""
                            )} text-white cursor-pointer hover:opacity-80 transition-opacity`}
                            onClick={() => toggleSubject(subjectId)}
                          >
                            {subject?.name}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm">
                          Loại bài viết{" "}
                          {selectedFlairs.length > 0 &&
                            `(${selectedFlairs.length})`}
                        </span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {Array.isArray(flairs) &&
                        flairs.map((flair) => (
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
                  {selectedFlairs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedFlairs.map((flairId) => {
                        const flair = flairs.find((f) => f.id === flairId);
                        return (
                          <Badge
                            key={flairId}
                            variant="outline"
                            className={`${getFlairColor(
                              flair?.name || ""
                            )} cursor-pointer hover:opacity-80 transition-opacity`}
                            onClick={() => toggleFlair(flairId)}
                          >
                            {flair?.name}
                            <X className="w-3 h-3 ml-1" />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                {(selectedSubjects.length > 0 || selectedFlairs.length > 0) && (
                  <Button
                    variant="ghost"
                    className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={handleClearFilters}
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          <main className="col-span-6">
            <div className="space-y-6">
              <div className="bg-white rounded-lg border p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm bài viết..."
                    className="pl-10 hover:border-purple-300 focus:border-purple-500 transition-colors"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Tìm thấy <strong>{filteredPosts.length}</strong> bài viết
                  </span>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-48 hover:border-purple-300 transition-colors">
                      <SelectValue placeholder="Sắp xếp theo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="oldest">Cũ nhất</SelectItem>
                      <SelectItem value="mostCommented">
                        Nhiều bình luận nhất
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading && filteredPosts.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </div>
              ) : (
                <>
                  // Line 394 - forummain.tsx
                  {filteredPosts.slice(0, visiblePosts).map((post) => (
                    <div
                      key={`post-wrapper-${post.post_id}`} // ← Unique key
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (
                          !target.closest("button") &&
                          !target.closest("input") &&
                          !target.closest("a") &&
                          !target.closest('[role="dialog"]')
                        ) {
                          handleOpenModal(post.post_id);
                        }
                      }}
                      onDoubleClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (
                          !target.closest("button") &&
                          !target.closest("input") &&
                          !target.closest("a")
                        ) {
                          handleViewDetails(post.post_id);
                        }
                      }}
                    >
                      <PostCard
                        post={post}
                        onOpenComments={() => handleOpenModal(post.post_id)}
                        onViewDetails={() => handleViewDetails(post.post_id)}
                      />
                    </div>
                  ))}
                  <div
                    ref={observerTarget}
                    className="h-10 flex items-center justify-center"
                  >
                    {visiblePosts < filteredPosts.length && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                        <span className="text-sm">Đang tải...</span>
                      </div>
                    )}
                  </div>
                  {filteredPosts.length === 0 && !isLoading && (
                    <div className="bg-white rounded-lg border p-12 text-center">
                      <p className="text-gray-500 text-lg">
                        Không tìm thấy bài viết nào phù hợp
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          <aside className="col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-500" />
                  <h3 className="font-bold text-lg">Thống kê</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors">
                  <span className="text-sm text-gray-600">Tổng bài viết</span>
                  <span className="font-bold text-lg text-purple-600">
                    {posts.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent className="!max-w-[95vw] !w-[60vw] h-[90vh] p-0 flex flex-col">
          {currentPost && (
            <>
              <DialogHeader className="p-4 border-b flex-shrink-0">
                <DialogTitle className="sr-only">
                  {currentPost.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Chi tiết bài viết và bình luận
                </DialogDescription>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => handleViewDetails(currentPost.post_id)}
                    className="w-fit hover:bg-gray-100 transition-colors gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Xem chi tiết
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                          {currentPost.author_initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-lg">
                          {currentPost.author_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTimestamp(currentPost.created_at)} •{" "}
                          {currentPost.author_class}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        className={`${getSubjectBadgeColor(
                          currentPost.subject_name
                        )} text-white`}
                      >
                        {currentPost.subject_name}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getFlairColor(currentPost.flair_name)}
                      >
                        {currentPost.flair_name}
                      </Badge>
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold mb-4">
                    {currentPost.title}
                  </h1>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    {currentPost.content}
                  </p>

                  {currentPost.image_urls &&
                    (() => {
                      const images = currentPost.image_urls
                        .split(",")
                        .filter((url) => url.trim());
                      return (
                        images.length > 0 && (
                          <div
                            className={`mb-6 ${
                              images.length === 1
                                ? ""
                                : "grid grid-cols-2 gap-3"
                            }`}
                          >
                            {images.map((img, idx) => (
                              <div
                                key={idx}
                                className={`rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity ${
                                  images.length === 1 ? "h-96" : "h-60"
                                }`}
                                onClick={(e) =>
                                  handleImageClick(e, images, idx)
                                }
                              >
                                <img
                                  src={img}
                                  alt={`${currentPost.title} ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )
                      );
                    })()}

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{currentPost.comment_count} bình luận</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b">
                      <h3 className="font-bold text-lg">
                        Bình luận ({currentPost.comment_count})
                      </h3>
                      <Select
                        value={commentSort}
                        onValueChange={setCommentSort}
                      >
                        <SelectTrigger className="w-32 h-9 text-sm hover:border-purple-300 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Mới nhất</SelectItem>
                          <SelectItem value="oldest">Cũ nhất</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    // Line 650-750 - Trong phần render comments
                    {getSortedComments(currentPost.comments || []).map(
                      (comment) => {
                        const isRepliesExpanded = expandedReplies.has(
                          comment.comment_id
                        );
                        const isReplying = replyingTo === comment.comment_id;
                        const replies = comment.replies || [];

                        return (
                          <div key={comment.comment_id}>
                            <div className="flex gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-orange-400 text-white text-sm font-bold">
                                  {comment.author_initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-gray-100 rounded-2xl px-4 py-3 hover:bg-gray-200 transition-colors">
                                  <div className="font-semibold text-sm">
                                    {comment.author_name}
                                  </div>
                                  <p className="text-sm mt-1">
                                    {comment.content}
                                  </p>
                                </div>

                                <div className="flex gap-4 px-4 mt-2">
                                  <button
                                    className="text-xs text-gray-600 hover:text-purple-600 hover:underline font-semibold transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReplyingTo(
                                        isReplying ? null : comment.comment_id
                                      );
                                    }}
                                    onDoubleClick={(e) => e.stopPropagation()}
                                  >
                                    Phản hồi
                                  </button>
                                  <span className="text-xs text-gray-500">
                                    {formatTimestamp(comment.created_at)}
                                  </span>
                                </div>

                                {/* Reply input CHỈ cho comment này */}
                                {isReplying && (
                                  <div className="flex gap-2 mt-3 ml-4 animate-in slide-in-from-top-2 duration-200">
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                                        {user?.username
                                          ?.substring(0, 2)
                                          .toUpperCase() || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <Input
                                        placeholder="Viết phản hồi..."
                                        className="rounded-full text-sm hover:border-purple-300 focus:border-purple-500 transition-colors mb-2"
                                        value={
                                          replyContents[comment.comment_id] ||
                                          ""
                                        }
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          setReplyContents({
                                            ...replyContents,
                                            [comment.comment_id]:
                                              e.target.value,
                                          });
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onDoubleClick={(e) =>
                                          e.stopPropagation()
                                        }
                                        onFocus={() => handleTyping(true)}
                                        onBlur={() => handleTyping(false)}
                                        onKeyPress={(e) => {
                                          if (
                                            e.key === "Enter" &&
                                            !e.shiftKey
                                          ) {
                                            e.preventDefault();
                                            handleSubmitReply(
                                              comment.comment_id
                                            );
                                          }
                                        }}
                                      />

                                      {/* Reply images preview */}
                                      {(replyImagesList[comment.comment_id]
                                        ?.length || 0) > 0 && (
                                        <div className="flex gap-2 mb-2">
                                          {replyImagesList[
                                            comment.comment_id
                                          ].map((img, idx) => (
                                            <div key={idx} className="relative">
                                              <img
                                                src={URL.createObjectURL(img)}
                                                alt={`Preview ${idx + 1}`}
                                                className="w-16 h-16 object-cover rounded"
                                              />
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setReplyImagesList({
                                                    ...replyImagesList,
                                                    [comment.comment_id]:
                                                      replyImagesList[
                                                        comment.comment_id
                                                      ].filter(
                                                        (_, i) => i !== idx
                                                      ),
                                                  });
                                                }}
                                                onDoubleClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            document
                                              .getElementById(
                                                `reply-images-${comment.comment_id}`
                                              )
                                              ?.click();
                                          }}
                                          onDoubleClick={(e) =>
                                            e.stopPropagation()
                                          }
                                          disabled={
                                            (replyImagesList[comment.comment_id]
                                              ?.length || 0) >= 4
                                          }
                                        >
                                          <ImagePlus className="w-4 h-4 mr-1" />
                                          Ảnh (
                                          {replyImagesList[comment.comment_id]
                                            ?.length || 0}
                                          /4)
                                        </Button>
                                        <input
                                          id={`reply-images-${comment.comment_id}`}
                                          type="file"
                                          accept="image/*"
                                          multiple
                                          className="hidden"
                                          onChange={(e) =>
                                            handleReplyImageSelect(
                                              e,
                                              comment.comment_id
                                            )
                                          }
                                        />

                                        <Button
                                          size="sm"
                                          className="rounded-full px-4 hover:scale-105 transition-transform ml-auto"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSubmitReply(
                                              comment.comment_id
                                            );
                                          }}
                                          onDoubleClick={(e) =>
                                            e.stopPropagation()
                                          }
                                          disabled={
                                            isLoading ||
                                            !replyContents[
                                              comment.comment_id
                                            ]?.trim()
                                          }
                                        >
                                          {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Send className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Show replies button */}
                                {replies.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleReplies(comment.comment_id);
                                    }}
                                    onDoubleClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-purple-600 hover:underline mt-3 ml-4 transition-colors"
                                  >
                                    {isRepliesExpanded ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                    {replies.length} phản hồi
                                  </button>
                                )}

                                {/* Replies list */}
                                {isRepliesExpanded &&
                                  replies.map((reply) => (
                                    <div
                                      key={reply.comment_id}
                                      className="flex gap-3 mt-3 ml-10 animate-in slide-in-from-top-2 duration-200"
                                    >
                                      <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-bold">
                                          {reply.author_initials}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="bg-gray-100 rounded-2xl px-4 py-2 hover:bg-gray-200 transition-colors">
                                          <div className="font-semibold text-xs">
                                            {reply.author_name}
                                          </div>
                                          <p className="text-xs mt-1">
                                            {reply.content}
                                          </p>
                                        </div>
                                        <div className="flex gap-4 px-4 mt-1">
                                          <span className="text-xs text-gray-500">
                                            {formatTimestamp(reply.created_at)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t p-4 bg-gray-50 flex-shrink-0">
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold">
                      {user?.username?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2">
                      <Input
                        ref={commentInputRef}
                        placeholder="Viết bình luận..."
                        className="rounded-full hover:border-purple-300 focus:border-purple-500 transition-colors"
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        onFocus={() => handleTyping(true)}
                        onBlur={() => handleTyping(false)}
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => e.stopPropagation()}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmitComment();
                          }
                        }}
                      />

                      <Button
                        className="rounded-full px-6 hover:scale-105 transition-transform"
                        onClick={handleSubmitComment}
                        onDoubleClick={(e) => e.stopPropagation()}
                        disabled={isLoading || !commentContent.trim()}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Gửi
                      </Button>
                    </div>

                    {commentImages.length > 0 && (
                      <div className="flex gap-2 mb-2">
                        {commentImages.map((img, idx) => (
                          <div key={idx} className="relative">
                            <img
                              src={URL.createObjectURL(img)}
                              alt={`Preview ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCommentImages((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                );
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          document.getElementById("comment-images")?.click()
                        }
                        disabled={commentImages.length >= 4}
                      >
                        <ImagePlus className="w-4 h-4 mr-1" />
                        Thêm ảnh ({commentImages.length}/4)
                      </Button>
                      <input
                        id="comment-images"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleCommentImageSelect}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {showImageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-[100] flex items-center justify-center p-4"
          onClick={handleCloseImageModal}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 w-12 h-12 flex items-center justify-center"
            onClick={handleCloseImageModal}
          >
            ×
          </button>

          <div className="absolute top-4 left-4 flex gap-2">
            <button
              className="text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
              onClick={handleZoomIn}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              className="text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
              onClick={handleZoomOut}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-white bg-black bg-opacity-50 rounded-full px-3 h-10 flex items-center">
              {Math.round(imageZoom * 100)}%
            </span>
          </div>

          {modalImages.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white text-4xl hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-black bg-opacity-50 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev === 0 ? modalImages.length - 1 : prev - 1
                  );
                }}
              >
                ‹
              </button>
              <button
                className="absolute right-4 text-white text-4xl hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-black bg-opacity-50 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev === modalImages.length - 1 ? 0 : prev + 1
                  );
                }}
              >
                ›
              </button>
              <div className="absolute bottom-4 text-white text-sm">
                {selectedImageIndex + 1} / {modalImages.length}
              </div>
            </>
          )}

          <img
            src={modalImages[selectedImageIndex]}
            alt="Full size"
            className="object-contain transition-transform duration-200"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              transform: `scale(${imageZoom})`,
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
              e.stopPropagation();
            }}
          />
        </div>
      )}

      <CreatePostDialog
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        schoolId={schoolId}
      />
    </div>
  );
};

export default ForumMain;
