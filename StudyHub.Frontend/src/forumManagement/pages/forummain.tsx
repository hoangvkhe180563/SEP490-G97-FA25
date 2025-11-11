// .../pages/ForumMain.tsx
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
  ArrowUp,
  ExternalLink,
  Plus,
  Send,
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
  DialogDescription,
} from "@/common/components/ui/dialog";
import PostCard from "../components/PostCard";
import { CreatePostDialog } from "../components/CreatePostDialog";
import type { Post, Subject } from "../interfaces/forum";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { MessageSquare, Loader2 } from "lucide-react";
import { useForumStore } from "../stores/useForumStore";
import { documentService } from "@/documentManagement/services/documentService";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { getSubjectBadgeColor, getFlairColor } from "../utils/colorUtils";
import { CommentSection } from "../components/CommentSection";
import { ImageModal } from "../components/ImageModal";
import { ImageGrid } from "../components/ImageGrid";
import { formatTimestamp } from "../utils/dateUtils";
import { ForumSidebar } from "../components/ForumSidebar";

const ForumMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const observerTarget = useRef<HTMLDivElement>(null);
  const { topPosts, getTopPosts } = useForumStore();
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || 1;
  useEffect(() => {
    getTopPosts(schoolId, 5);
  }, [schoolId, getTopPosts]);
  const {
    posts,
    currentPost,
    isLoading,
    flairs,
    loadFlairs,
    startForum,
    stopForum,
    joinSchoolForum,
    leaveSchoolForum,
    joinPost,
    leavePost,
    getPosts,
    getPostById,
    getComments,
    sendTyping,
  } = useForumStore();

  const [modalVisibleComments, setModalVisibleComments] = useState(8);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [newCommentImages, setNewCommentImages] = useState<File[]>([]);

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
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);

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
      leaveSchoolForum(schoolId);
      stopForum();
    };
  }, [
    startForum,
    stopForum,
    joinSchoolForum,
    leaveSchoolForum,
    schoolId,
    loadFlairs,
  ]);

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

  useEffect(() => {
    const handleModalPost = async () => {
      if (modalPostId) {
        setModalVisibleComments(8);
        const postId = parseInt(modalPostId);

        const conn = (window as any).__forumConn;
        if (conn?.state === "Connected") {
          await joinPost(postId);
        } else {
          const retryJoin = setInterval(() => {
            const c = (window as any).__forumConn;
            if (c?.state === "Connected") {
              clearInterval(retryJoin);
              joinPost(postId);
            }
          }, 100);

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

  useEffect(() => {
    const currentTarget = observerTarget.current;

    if (visiblePosts >= filteredPosts.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          setVisiblePosts((prev: number) => {
            const next = prev + 5;
            return Math.min(next, filteredPosts.length);
          });
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [visiblePosts, filteredPosts.length, isLoading]);

  const handleImageClick = (images: string[], idx: number) => {
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

  const handleNewCommentImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length + newCommentImages.length > 4) {
      alert("Tối đa 4 ảnh");
      return;
    }
    setNewCommentImages((prev) => [...prev, ...files]);
  };

  const handleSubmitNewComment = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newCommentContent.trim() || !currentPost) return;

    const conn = (window as any).__forumConn;
    if (!conn || conn.state !== "Connected") {
      alert("Mất kết nối SignalR");
      return;
    }

    try {
      const result = await conn.invoke(
        "CreateComment",
        currentPost.post_id,
        null,
        newCommentContent
      );

      if (result?.success) {
        setNewCommentContent("");
        setNewCommentImages([]);
      } else {
        alert(result?.message || "Có lỗi xảy ra");
      }
    } catch (err: any) {
      alert(err.message);
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
                  {filteredPosts.slice(0, visiblePosts).map((post) => (
                    <div
                      key={post.post_id}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (
                          !target.closest("button") &&
                          !target.closest("input") &&
                          !target.closest("a") &&
                          !target.closest('[role="dialog"]') &&
                          !target.closest(".animate-in")
                        ) {
                          handleOpenModal(post.post_id);
                        }
                      }}
                      onDoubleClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (
                          !target.closest("button") &&
                          !target.closest("input") &&
                          !target.closest("a") &&
                          !target.closest(".animate-in")
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
                    {visiblePosts < filteredPosts.length ? (
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                        <span className="text-sm">Đang tải...</span>
                      </div>
                    ) : (
                      filteredPosts.length > 0 && (
                        <div className="text-sm text-gray-500">
                          Đã hiển thị tất cả {filteredPosts.length} bài viết
                        </div>
                      )
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
          <ForumSidebar totalPosts={posts.length} topPosts={topPosts} />
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

              <div className="flex-1 overflow-y-auto min-h-0">
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
                          <ImageGrid
                            images={images}
                            onImageClick={(idx) =>
                              handleImageClick(images, idx)
                            }
                            className="mb-6"
                          />
                        )
                      );
                    })()}

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{currentPost.comment_count} bình luận</span>
                    </div>
                  </div>

                  <CommentSection
                    post={currentPost}
                    comments={(currentPost.comments || []).slice(
                      0,
                      modalVisibleComments
                    )}
                    isExpanded={false}
                    showSort={true}
                    onRefreshComments={async () => {
                      if (modalPostId) {
                        await getComments(parseInt(modalPostId));
                      }
                    }}
                    maxVisibleReplies={2}
                  />
                  {(currentPost.comments || []).length >
                    modalVisibleComments && (
                    <button
                      onClick={() =>
                        setModalVisibleComments((prev) => prev + 8)
                      }
                      className="w-full py-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors mt-4"
                    >
                      Xem thêm bình luận...
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 border-t bg-white p-4">
                <form onSubmit={handleSubmitNewComment} className="flex gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold">
                      {user?.username?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Viết bình luận..."
                        className="rounded-full hover:border-purple-300 focus:border-purple-500 transition-colors"
                        value={newCommentContent}
                        onChange={(e) => setNewCommentContent(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => e.stopPropagation()}
                        onFocus={() => sendTyping(currentPost.post_id, true)}
                        onBlur={() => sendTyping(currentPost.post_id, false)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmitNewComment();
                          }
                        }}
                      />

                      <Button
                        type="submit"
                        className="rounded-full px-6 hover:scale-105 transition-transform flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => e.stopPropagation()}
                        disabled={isLoading || !newCommentContent.trim()}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Gửi
                      </Button>
                    </div>

                    {newCommentImages.length > 0 && (
                      <div className="flex gap-2 mb-2 flex-wrap">
                        {newCommentImages.map((img, idx) => (
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
                                setNewCommentImages((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                );
                              }}
                              onDoubleClick={(e) => e.stopPropagation()}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
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
                              `modal-comment-images-${currentPost.post_id}`
                            )
                            ?.click();
                        }}
                        onDoubleClick={(e) => e.stopPropagation()}
                        disabled={newCommentImages.length >= 4}
                      >
                        <ImagePlus className="w-4 h-4 mr-1" />
                        Thêm ảnh ({newCommentImages.length}/4)
                      </Button>
                      <input
                        id={`modal-comment-images-${currentPost.post_id}`}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleNewCommentImageSelect}
                      />
                    </div>
                  </div>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {showImageModal && (
        <ImageModal
          images={modalImages}
          selectedIndex={selectedImageIndex}
          zoom={imageZoom}
          onClose={handleCloseImageModal}
          onPrevious={(e) => {
            e.stopPropagation();
            setSelectedImageIndex((prev) =>
              prev === 0 ? modalImages.length - 1 : prev - 1
            );
          }}
          onNext={(e) => {
            e.stopPropagation();
            setSelectedImageIndex((prev) =>
              prev === modalImages.length - 1 ? 0 : prev + 1
            );
          }}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onIndexChange={(index) => setSelectedImageIndex(index)}
        />
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
