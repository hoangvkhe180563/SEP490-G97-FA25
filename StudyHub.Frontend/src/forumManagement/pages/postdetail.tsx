// .../PostDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { Card, CardContent } from "@/common/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import {
  ArrowLeft,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  Share2,
  Bookmark,
  MoreVertical,
  Flag,
  Edit,
  Loader2,
  Save,
  X,
  ImagePlus,
} from "lucide-react";
import { useForumStore } from "../stores/useForumStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { getSubjectBadgeColor, getFlairColor } from "../utils/colorUtils";
import { formatTimestamp } from "../utils/dateUtils";
import { ImageGrid } from "../components/ImageGrid";
import { ImageModal } from "../components/ImageModal";
import { ReportModal } from "../components/ReportModal";
import { ForumSidebar } from "../components/ForumSidebar";

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { getPosts } = useForumStore();

  const {
    currentPost,
    getPostById,
    getComments,
    updatePost,
    updateComment,
    deleteComment,
    createComment,
    isLoading,
    joinPost,
    leavePost,
    flairs,
    // loadFlairs,
  } = useForumStore();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editFlairId, setEditFlairId] = useState<number | null>(null);

  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(
    new Set()
  );
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [commentSort, setCommentSort] = useState("newest");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [imageZoom, setImageZoom] = useState(1);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    id: number;
    type: "post" | "comment";
  } | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [newCommentContent, setNewCommentContent] = useState("");
  const [newCommentImages, setNewCommentImages] = useState<File[]>([]);
  const post = currentPost;

  useEffect(() => {
    if (postId) {
      const id = parseInt(postId);
      getPostById(id);
      getComments(id);

      const joinPostWhenReady = async () => {
        const maxRetries = 30;
        let retries = 0;

        const tryJoin = async () => {
          const conn = (window as any).__forumConn;
          if (conn?.state === "Connected") {
            await joinPost(id);
            return true;
          }
          return false;
        };

        while (retries < maxRetries) {
          if (await tryJoin()) break;
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }
      };

      joinPostWhenReady();
    }

    return () => {
      if (postId) {
        leavePost(parseInt(postId));
      }
    };
  }, [postId, getPostById, getComments, joinPost, leavePost]);

  useEffect(() => {
    if (currentPost) {
      setEditTitle(currentPost.title);
      setEditContent(currentPost.content);
      setEditFlairId(currentPost.flair_id);
    }
  }, [currentPost]);
  useEffect(() => {
    if (currentPost?.subject_id) {
      getPosts(
        currentPost.school_id,
        currentPost.subject_id,
        undefined,
        "",
        "newest",
        1,
        10
      );
    }
  }, [currentPost?.subject_id, currentPost?.school_id, getPosts]);
  const handleBack = () => {
    if (location.state?.fromModal) {
      navigate("/forum/student/forums", { state: { fromModal: true } });
    } else {
      navigate("/forum/student/forums");
    }
  };

  const handleImageClick = (images: string[], idx: number) => {
    setDetailImages(images);
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

  const toggleReplies = (commentId: number) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const getSortedComments = (comments: any[]) => {
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

  const handleEditComment = (commentId: number, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditCommentContent(currentContent);
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editCommentContent.trim()) return;

    const formData = new FormData();
    formData.append("commentId", commentId.toString());
    formData.append("content", editCommentContent);

    const result = await updateComment(commentId, formData);
    if (result?.success) {
      setEditingCommentId(null);
      setEditCommentContent("");
      if (postId) {
        await getComments(parseInt(postId));
      }
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    const result = await deleteComment(commentId);
    if (result?.success && postId) {
      await getComments(parseInt(postId));
    }
  };

  const handleSubmitReply = async (parentCommentId: number) => {
    if (!replyContent.trim() || !post) return;

    const formData = new FormData();
    formData.append("postId", post.post_id.toString());
    formData.append("parentCommentId", parentCommentId.toString());
    formData.append("content", replyContent);

    const result = await createComment(formData);
    if (result?.success) {
      setReplyContent("");
      setReplyingTo(null);
      await getComments(post.post_id);
    }
  };

  const handleSubmitNewComment = async () => {
    if (!newCommentContent.trim() || !post) return;

    const formData = new FormData();
    formData.append("postId", post.post_id.toString());
    formData.append("content", newCommentContent);
    newCommentImages.forEach((img) => formData.append("attachments", img));

    const result = await createComment(formData);
    if (result?.success) {
      setNewCommentContent("");
      setNewCommentImages([]);
      await getComments(post.post_id);
    }
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

  const handleSavePost = async () => {
    if (!post || !editTitle.trim() || !editContent.trim() || !editFlairId)
      return;

    const formData = new FormData();
    formData.append("postId", post.post_id.toString());
    formData.append("title", editTitle);
    formData.append("content", editContent);
    formData.append("flairId", editFlairId.toString());

    const result = await updatePost(post.post_id, formData);
    if (result?.success) {
      setIsEditMode(false);
      await getPostById(post.post_id);
    }
  };

  const handleCancelEdit = () => {
    if (post) {
      setEditTitle(post.title);
      setEditContent(post.content);
      setEditFlairId(post.flair_id);
    }
    setIsEditMode(false);
  };

  const renderComment = (comment: any, depth: number = 0) => {
    const isRepliesExpanded = expandedReplies.has(comment.comment_id);
    const replies = comment.replies || [];
    const canEdit = user?.id === comment.created_by;

    return (
      <div
        key={comment.comment_id}
        className={`${depth > 0 ? "pl-6 border-l-2 border-gray-200" : ""}`}
      >
        <div className="flex gap-3 mb-4">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-orange-400 text-white font-bold">
              {comment.author_initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{comment.author_name}</span>
              <span className="text-xs text-gray-500">
                {formatTimestamp(comment.created_at)}
              </span>
            </div>

            {editingCommentId === comment.comment_id ? (
              <div className="space-y-2">
                <Textarea
                  value={editCommentContent}
                  onChange={(e) => setEditCommentContent(e.target.value)}
                  className="w-full"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(comment.comment_id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : null}
                    Lưu
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                    Hủy
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-700 mb-2">{comment.content}</p>
                <div className="flex gap-3 items-center">
                  <button
                    className="text-sm text-gray-600 hover:text-sky-600 font-bold"
                    onClick={() =>
                      setReplyingTo(
                        replyingTo === comment.comment_id
                          ? null
                          : comment.comment_id
                      )
                    }
                  >
                    Phản hồi
                  </button>
                  {replies.length > 0 && (
                    <button
                      onClick={() => toggleReplies(comment.comment_id)}
                      className="text-sm text-gray-600 hover:text-sky-600 font-bold flex items-center gap-1"
                    >
                      {isRepliesExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      {replies.length} phản hồi
                    </button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-auto"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canEdit && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              handleEditComment(
                                comment.comment_id,
                                comment.content
                              )
                            }
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            <span className="italic">Chỉnh sửa</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteComment(comment.comment_id)
                            }
                            className="text-red-600"
                          >
                            <span className="font-bold">Xóa</span>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          setReportTarget({
                            id: comment.comment_id,
                            type: "comment",
                          });
                          setShowReportModal(true);
                        }}
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        <span className="font-bold">Báo cáo</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}

            {replyingTo === comment.comment_id && (
              <div className="flex gap-2 mt-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-sky-500 to-sky-600 text-white text-xs font-bold">
                    {user?.username?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Viết phản hồi..."
                    className="rounded-lg text-sm"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitReply(comment.comment_id);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="rounded-lg"
                    onClick={() => handleSubmitReply(comment.comment_id)}
                    disabled={isLoading || !replyContent.trim()}
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {isRepliesExpanded && replies.length > 0 && (
              <div className="mt-4 space-y-4">
                {replies.map((reply: any) => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!post) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="bg-white rounded-lg p-8 text-center border">
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-sky-600" />
          ) : (
            <>
              <p className="text-lg mb-4">Không tìm thấy bài viết</p>
              <Button onClick={handleBack}>Quay lại</Button>
            </>
          )}
        </div>
      </div>
    );
  }

  const images = post.image_urls
    ? post.image_urls.split(",").filter((url) => url.trim())
    : [];

  const canEditPost = user?.id === post.created_by;

  return (
    <>
      <div className="w-full h-full overflow-auto bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10 px-6 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại Forum
            </Button>
            {canEditPost && (
              <div className="flex gap-2">
                {isEditMode ? (
                  <>
                    <Button
                      onClick={handleSavePost}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Lưu
                    </Button>
                    <Button variant="ghost" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 mr-2" />
                      Hủy
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditMode(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8">
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-sky-500 to-sky-600 text-white font-bold">
                          {post.author_initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-lg">
                          {post.author_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {post.author_class} •{" "}
                          {formatTimestamp(post.created_at)}
                        </div>
                      </div>
                    </div>
                    {!isEditMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditPost && (
                            <DropdownMenuItem
                              onClick={() => setIsEditMode(true)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              <span className="italic">Chỉnh sửa</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setReportTarget({
                                id: post.post_id,
                                type: "post",
                              });
                              setShowReportModal(true);
                            }}
                          >
                            <Flag className="w-4 h-4 mr-2" />
                            <span className="font-bold">Báo cáo</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="flex gap-2 mb-4">
                    <Badge
                      className={`${getSubjectBadgeColor(
                        post.subject_name
                      )} text-white`}
                    >
                      {post.subject_name}
                    </Badge>
                    {isEditMode ? (
                      <Select
                        value={editFlairId?.toString()}
                        onValueChange={(value) =>
                          setEditFlairId(parseInt(value))
                        }
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Chọn loại bài viết" />
                        </SelectTrigger>
                        <SelectContent>
                          {flairs.map((flair) => (
                            <SelectItem
                              key={flair.id}
                              value={flair.id.toString()}
                            >
                              {flair.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className={getFlairColor(post.flair_name)}
                      >
                        {post.flair_name}
                      </Badge>
                    )}
                  </div>

                  {isEditMode ? (
                    <div className="space-y-4">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-3xl font-bold"
                        placeholder="Tiêu đề bài viết"
                      />
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="text-lg min-h-[200px]"
                        placeholder="Nội dung bài viết"
                      />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
                      <p className="text-gray-700 text-lg leading-relaxed mb-6">
                        {post.content}
                      </p>
                    </>
                  )}

                  {images.length > 0 && (
                    <ImageGrid
                      images={images}
                      onImageClick={(idx) => handleImageClick(images, idx)}
                      className="mb-6 [&_img]:max-h-[400px]"
                      isNsfwContent={
                        post.flair_name?.toLowerCase().includes("nhạy cảm") ||
                        false
                      }
                    />
                  )}

                  {!isEditMode && (
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {post.comment_count}
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Share2 className="w-4 h-4" />
                        Chia sẻ
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Bookmark className="w-4 h-4" />
                        Lưu
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {!isEditMode && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-xl">
                        Bình luận ({post.comment_count})
                      </h3>
                      <Select
                        value={commentSort}
                        onValueChange={setCommentSort}
                      >
                        <SelectTrigger className="w-36 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Mới nhất</SelectItem>
                          <SelectItem value="oldest">Cũ nhất</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-3 mb-6 pb-6 border-b">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-sky-500 to-sky-600 text-white font-bold">
                          {user?.username?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex gap-2 mb-2">
                          <Input
                            placeholder="Viết bình luận của bạn..."
                            className="rounded-lg"
                            value={newCommentContent}
                            onChange={(e) =>
                              setNewCommentContent(e.target.value)
                            }
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitNewComment();
                              }
                            }}
                          />
                          <Button
                            className="rounded-lg px-6"
                            onClick={handleSubmitNewComment}
                            disabled={isLoading || !newCommentContent.trim()}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
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
                                  onClick={() => {
                                    setNewCommentImages((prev) =>
                                      prev.filter((_, i) => i !== idx)
                                    );
                                  }}
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
                            onClick={() => {
                              document
                                .getElementById(`new-comment-images`)
                                ?.click();
                            }}
                            disabled={newCommentImages.length >= 4}
                          >
                            <ImagePlus className="w-4 h-4 mr-1" />
                            Thêm ảnh ({newCommentImages.length}/4)
                          </Button>
                          <input
                            id={`new-comment-images`}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleNewCommentImageSelect}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {getSortedComments(post.comments || []).map((comment) =>
                        renderComment(comment)
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="col-span-4">
              <Card className="mt-6">
                <CardContent className="p-4">
                  <h3 className="font-bold mb-4">Thông tin chi tiết</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tác giả</span>
                      <span className="font-medium">{post.author_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thời gian</span>
                      <span className="font-medium">
                        {formatTimestamp(post.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Môn học</span>
                      <Badge
                        className={`${getSubjectBadgeColor(
                          post.subject_name
                        )} text-white`}
                      >
                        {post.subject_name}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loại bài viết</span>
                      <Badge
                        variant="outline"
                        className={getFlairColor(post.flair_name)}
                      >
                        {post.flair_name}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <ForumSidebar
                topPosts={[]}
                currentSubjectId={post.subject_id}
                currentPostId={post.post_id}
                showStats={false}
                showRules={true}
                showRelatedPosts={true}
              />
            </div>
          </div>
        </div>
      </div>

      {showImageModal && (
        <ImageModal
          images={detailImages}
          selectedIndex={selectedImageIndex}
          zoom={imageZoom}
          onClose={handleCloseImageModal}
          onPrevious={(e) => {
            e.stopPropagation();
            setSelectedImageIndex((prev) =>
              prev === 0 ? detailImages.length - 1 : prev - 1
            );
          }}
          onNext={(e) => {
            e.stopPropagation();
            setSelectedImageIndex((prev) =>
              prev === detailImages.length - 1 ? 0 : prev + 1
            );
          }}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onIndexChange={(index) => setSelectedImageIndex(index)}
        />
      )}

      {showReportModal && reportTarget && (
        <ReportModal
          open={showReportModal}
          onOpenChange={setShowReportModal}
          targetId={reportTarget.id}
          targetType={reportTarget.type}
        />
      )}
    </>
  );
};

export default PostDetail;
