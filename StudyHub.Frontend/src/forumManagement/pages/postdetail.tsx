// PostDetails
import { useState, useEffect, useMemo } from "react";
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
  Send,
  Share2,
  Bookmark,
  MoreVertical,
  Flag,
  Edit,
  Loader2,
  Trash2,
  Save,
  X,
  ImagePlus,
} from "lucide-react";
import { useForumStore } from "../stores/useForumStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { useForumSignalRStore } from "../stores/useForumSignalRStore";
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
    flairs,
  } = useForumStore();

  const { joinPost, leavePost, sendTyping, isForumConnected } =
    useForumSignalRStore();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editFlairId, setEditFlairId] = useState<number | null>(null);
  const [replyToUsernames, setReplyToUsernames] = useState<{
    [key: number]: string;
  }>({});
  const [visibleReplies, setVisibleReplies] = useState<{
    [key: number]: number;
  }>({});
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
  const [replyContents, setReplyContents] = useState<{ [key: number]: string }>(
    {}
  );
  const [newCommentContent, setNewCommentContent] = useState("");
  const [newCommentImages, setNewCommentImages] = useState<File[]>([]);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [newEditImages, setNewEditImages] = useState<File[]>([]);
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);
  const [editCommentImages, setEditCommentImages] = useState<string[]>([]);
  const [newEditCommentImages, setNewEditCommentImages] = useState<File[]>([]);
  const [deletedCommentImageUrls, setDeletedCommentImageUrls] = useState<
    string[]
  >([]);
  const [replyImagesList, setReplyImagesList] = useState<{
    [key: number]: File[];
  }>({});

  const post = currentPost;

  const flattenComments = (comments: any[]): any[] => {
    const result: any[] = [];

    const flatten = (commentList: any[], parentId: number | null = null) => {
      commentList.forEach((comment) => {
        result.push({ ...comment, parent_comment_id: parentId });
        if (comment.replies && comment.replies.length > 0) {
          flatten(comment.replies, comment.comment_id);
        }
      });
    };

    const topLevel = comments.filter((c) => !c.parent_comment_id);
    flatten(topLevel);

    return result;
  };

  const flatComments = useMemo(
    () => flattenComments(post?.comments || []),
    [post?.comments]
  );

  const groupedComments = useMemo(() => {
    const groups: { [key: number]: any[] } = {};

    flatComments.forEach((comment) => {
      if (!comment.parent_comment_id) {
        if (!groups[comment.comment_id]) {
          groups[comment.comment_id] = [];
        }
      } else {
        let currentParent = comment.parent_comment_id;
        while (currentParent) {
          const parent = flatComments.find(
            (c) => c.comment_id === currentParent
          );
          if (!parent?.parent_comment_id) {
            if (!groups[currentParent]) {
              groups[currentParent] = [];
            }
            groups[currentParent].push(comment);
            break;
          }
          currentParent = parent.parent_comment_id;
        }
      }
    });

    return groups;
  }, [flatComments]);

  useEffect(() => {
    useForumSignalRStore.setState({
      onPostUpdated: (dto: any) => {
        console.log("Post updated via SignalR in PostDetail:", dto);

        if (post?.post_id === dto.postId) {
          getPostById(dto.postId);
        }
      },
    });

    return () => {
      useForumSignalRStore.setState({ onPostUpdated: undefined });
    };
  }, [post?.post_id, getPostById]);

  useEffect(() => {
    if (!postId) return;

    let mounted = true;
    const id = parseInt(postId);

    const initPostDetail = async () => {
      await getPostById(id);
      if (!mounted) return;

      if (!isForumConnected) {
        const maxWait = 3000;
        const startTime = Date.now();
        while (!isForumConnected && Date.now() - startTime < maxWait) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (mounted && isForumConnected) {
        await joinPost(id);
        await getComments(id);
      }
    };

    initPostDetail();

    return () => {
      mounted = false;
      if (isForumConnected) {
        leavePost(id);
      }
    };
  }, [postId, isForumConnected, getPostById, joinPost, leavePost, getComments]);

  useEffect(() => {
    if (currentPost) {
      setEditTitle(currentPost.title);
      setEditContent(currentPost.content);
      setEditFlairId(currentPost.flair_id);

      const imgs = currentPost.image_urls
        ? currentPost.image_urls.split(",").filter((url) => url.trim())
        : [];
      setEditImages(imgs);
      setNewEditImages([]);
      setDeletedImageUrls([]);
    }
  }, [currentPost]);

  useEffect(() => {
    if (currentPost?.subject_id) {
      getPosts(
        currentPost.school_id,
        [currentPost.subject_id],
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
      navigate("/forum/forums", { state: { fromModal: true } });
    } else {
      navigate("/forum/forums");
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (post) {
      sendTyping(post.post_id, isTyping);
    }
  };

  const handleRemoveEditImage = (imageUrl: string) => {
    setEditImages((prev) => prev.filter((url) => url !== imageUrl));
    setDeletedImageUrls((prev) => [...prev, imageUrl]);
  };

  const handleAddNewEditImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + editImages.length + newEditImages.length > 4) {
      alert("Tối đa 4 ảnh");
      return;
    }
    setNewEditImages((prev) => [...prev, ...files]);
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

  const loadMoreReplies = (commentId: number) => {
    setVisibleReplies((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || 2) + 5,
    }));
  };

  const getSortedTopLevelComments = () => {
    const topLevel = flatComments.filter((c) => !c.parent_comment_id);

    switch (commentSort) {
      case "newest":
        return [...topLevel].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return [...topLevel].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      default:
        return topLevel;
    }
  };

  const handleEditComment = (
    commentId: number,
    currentContent: string,
    imageUrls?: string
  ) => {
    setEditingCommentId(commentId);
    setEditCommentContent(currentContent);

    const imgs = imageUrls
      ? imageUrls.split(",").filter((url) => url.trim())
      : [];
    setEditCommentImages(imgs);
    setNewEditCommentImages([]);
    setDeletedCommentImageUrls([]);
  };

  const handleRemoveEditCommentImage = (imageUrl: string) => {
    setEditCommentImages((prev: string[]) =>
      prev.filter((url: string) => url !== imageUrl)
    );
    setDeletedCommentImageUrls((prev: string[]) => [...prev, imageUrl]);
  };

  const handleAddNewEditCommentImage = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (
      files.length + editCommentImages.length + newEditCommentImages.length >
      4
    ) {
      alert("Tối đa 4 ảnh");
      return;
    }
    setNewEditCommentImages((prev) => [...prev, ...files]);
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editCommentContent.trim()) return;

    const formData = new FormData();
    formData.append("commentId", commentId.toString());
    formData.append("content", editCommentContent);

    deletedCommentImageUrls.forEach((url) => {
      formData.append("deletedAttachmentUrls", url);
    });

    newEditCommentImages.forEach((file) => {
      formData.append("newAttachments", file);
    });

    const result = await updateComment(commentId, formData);
    if (result?.success) {
      setEditingCommentId(null);
      setEditCommentContent("");
      setEditCommentImages([]);
      setNewEditCommentImages([]);
      setDeletedCommentImageUrls([]);
      if (postId) {
        await getComments(parseInt(postId));
      }
    }
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent("");
    setEditCommentImages([]);
    setNewEditCommentImages([]);
    setDeletedCommentImageUrls([]);
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    const result = await deleteComment(commentId);
    if (result?.success && postId) {
      await getComments(parseInt(postId));
    }
  };

  const handleSubmitReply = async (parentCommentId: number) => {
    let content = replyContents[parentCommentId];
    if (!content?.trim() || !post) return;

    if (replyToUsernames[parentCommentId]) {
      content = `@${replyToUsernames[parentCommentId]} ${content}`;
    }
    const formData = new FormData();
    formData.append("postId", post.post_id.toString());
    formData.append("parentCommentId", parentCommentId.toString());
    formData.append("content", content);

    const images = replyImagesList[parentCommentId] || [];
    images.forEach((img) => formData.append("attachments", img));

    const result = await createComment(formData);
    if (result?.success) {
      setReplyContents((prev) => {
        const newState = { ...prev };
        delete newState[parentCommentId];
        return newState;
      });
      setReplyImagesList((prev) => {
        const newState = { ...prev };
        delete newState[parentCommentId];
        return newState;
      });
      setReplyingTo(null);
      if (postId) {
        const postIdNum = parseInt(postId);
        await getComments(postIdNum);
      }
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
      if (postId) {
        await getPostById(parseInt(postId));
        await getComments(parseInt(postId));
      }
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

  const handleSavePost = async () => {
    if (!post || !editTitle.trim() || !editContent.trim() || !editFlairId)
      return;

    const formData = new FormData();
    formData.append("postId", post.post_id.toString());
    formData.append("title", editTitle);
    formData.append("content", editContent);
    formData.append("flairId", editFlairId.toString());

    deletedImageUrls.forEach((url) => {
      formData.append("deletedAttachmentUrls", url);
    });

    newEditImages.forEach((file) => {
      formData.append("newAttachments", file);
    });

    const result = await updatePost(post.post_id, formData);
    if (result?.success) {
      setIsEditMode(false);
      setDeletedImageUrls([]);
      setNewEditImages([]);
      await getPostById(post.post_id);
    }
  };

  const handleCancelEdit = () => {
    if (post) {
      setEditTitle(post.title);
      setEditContent(post.content);
      setEditFlairId(post.flair_id);

      const imgs = post.image_urls
        ? post.image_urls.split(",").filter((url) => url.trim())
        : [];
      setEditImages(imgs);
      setNewEditImages([]);
      setDeletedImageUrls([]);
    }
    setIsEditMode(false);
  };

  const renderComment = (comment: any) => {
    const replies = groupedComments[comment.comment_id] || [];
    const canEdit = user?.id === comment.created_by;
    const isReplying = replyingTo === comment.comment_id;
    const isEditing = editingCommentId === comment.comment_id;

    return (
      <div key={comment.comment_id} id={`comment-${comment.comment_id}`}>
        <div className="flex gap-3">
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-sky-500 to-sky-700 text-white font-bold">
              {comment.author_initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                <Textarea
                  value={editCommentContent}
                  onChange={(e) => setEditCommentContent(e.target.value)}
                  className="w-full min-h-[100px]"
                  placeholder="Nội dung bình luận..."
                  autoFocus
                />

                {(editCommentImages.length > 0 ||
                  newEditCommentImages.length > 0) && (
                  <div className="grid grid-cols-4 gap-2">
                    {editCommentImages.map((url, idx) => (
                      <div key={`existing-${idx}`} className="relative group">
                        <img
                          src={url}
                          alt={`Ảnh ${idx + 1}`}
                          className="w-full h-24 object-cover rounded border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEditCommentImage(url)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {newEditCommentImages.map((file, idx) => (
                      <div key={`new-${idx}`} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Ảnh mới ${idx + 1}`}
                          className="w-full h-24 object-cover rounded border-2 border-green-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewEditCommentImages((prev) =>
                              prev.filter((_, i) => i !== idx)
                            );
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        document
                          .getElementById(
                            `edit-comment-images-${comment.comment_id}`
                          )
                          ?.click()
                      }
                      disabled={
                        editCommentImages.length +
                          newEditCommentImages.length >=
                        4
                      }
                      className="gap-2"
                    >
                      <ImagePlus className="w-4 h-4" />
                      Thêm ảnh (
                      {editCommentImages.length + newEditCommentImages.length}
                      /4)
                    </Button>
                    <input
                      id={`edit-comment-images-${comment.comment_id}`}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAddNewEditCommentImage}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(comment.comment_id)}
                      disabled={isLoading || !editCommentContent.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Lưu
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEditComment}
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Hủy
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-gray-100 rounded-2xl px-4 py-3 hover:bg-gray-200 transition-colors">
                  <div className="font-semibold text-sm">
                    {comment.author_name}
                  </div>
                  <p className="text-sm mt-1 break-words whitespace-pre-wrap">
                    {(() => {
                      const parts = comment.content.split(/(@\w+)/g);
                      return parts.map((part: string, idx: number) => {
                        if (part.startsWith("@")) {
                          return (
                            <span
                              key={idx}
                              className="font-bold italic text-sky-600"
                            >
                              {part}{" "}
                            </span>
                          );
                        }
                        return part;
                      });
                    })()}
                  </p>
                </div>

                {comment.image_urls &&
                  comment.image_urls
                    .split(",")
                    .filter((url: string) => url.trim()).length > 0 && (
                    <ImageGrid
                      images={comment.image_urls
                        .split(",")
                        .filter((url: string) => url.trim())}
                      onImageClick={(idx) =>
                        handleImageClick(
                          comment.image_urls
                            .split(",")
                            .filter((url: string) => url.trim()),
                          idx
                        )
                      }
                      className="mt-2 mb-2"
                      isNsfwContent={false}
                    />
                  )}
              </>
            )}

            <div className="flex gap-4 px-4 mt-2">
              <button
                className="text-xs text-gray-600 hover:text-sky-600 hover:underline font-semibold transition-colors"
                onClick={() => {
                  const isCurrentlyReplying = replyingTo === comment.comment_id;
                  setReplyingTo(
                    isCurrentlyReplying ? null : comment.comment_id
                  );
                  if (!isCurrentlyReplying) {
                    setReplyContents({
                      ...replyContents,
                      [comment.comment_id]: "",
                    });
                    setReplyToUsernames({
                      ...replyToUsernames,
                      [comment.comment_id]: comment.author_name,
                    });
                  }
                }}
              >
                Phản hồi
              </button>
              <span className="text-xs text-gray-500">
                {formatTimestamp(comment.created_at)}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
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
                            comment.content,
                            comment.image_urls
                          )
                        }
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        <span className="font-medium">Chỉnh sửa</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteComment(comment.comment_id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
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
            {isReplying && (
              <div className="flex gap-2 mt-3 ml-4 animate-in slide-in-from-top-2 duration-200">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-sky-500 to-sky-600 text-white text-xs font-bold">
                    {user?.username?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="mb-2">
                    {replyToUsernames[comment.comment_id] && (
                      <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                        <span className="font-bold italic">
                          @{replyToUsernames[comment.comment_id]}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplyToUsernames((prev) => {
                              const newState = { ...prev };
                              delete newState[comment.comment_id];
                              return newState;
                            });
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <Input
                      placeholder="Viết phản hồi của bạn..."
                      className="rounded-full text-sm hover:border-sky-300 focus:border-sky-500 transition-colors"
                      value={replyContents[comment.comment_id] || ""}
                      onChange={(e) => {
                        setReplyContents({
                          ...replyContents,
                          [comment.comment_id]: e.target.value,
                        });
                      }}
                      onFocus={() => handleTyping(true)}
                      onBlur={() => handleTyping(false)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitReply(comment.comment_id);
                        }
                      }}
                    />
                  </div>

                  {(replyImagesList[comment.comment_id]?.length || 0) > 0 && (
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {replyImagesList[comment.comment_id].map((img, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`Preview ${idx + 1}`}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setReplyImagesList({
                                ...replyImagesList,
                                [comment.comment_id]: replyImagesList[
                                  comment.comment_id
                                ].filter((_, i) => i !== idx),
                              });
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
                          .getElementById(`reply-images-${comment.comment_id}`)
                          ?.click();
                      }}
                      disabled={
                        (replyImagesList[comment.comment_id]?.length || 0) >= 4
                      }
                    >
                      <ImagePlus className="w-4 h-4 mr-1" />
                      Ảnh ({replyImagesList[comment.comment_id]?.length || 0}/4)
                    </Button>
                    <input
                      id={`reply-images-${comment.comment_id}`}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) =>
                        handleReplyImageSelect(e, comment.comment_id)
                      }
                    />

                    <Button
                      size="sm"
                      className="rounded-full px-4 hover:scale-105 transition-transform ml-auto"
                      onClick={() => handleSubmitReply(comment.comment_id)}
                      disabled={
                        isLoading || !replyContents[comment.comment_id]?.trim()
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

            {replies
              .slice(0, visibleReplies[comment.comment_id] || 2)
              .map((reply: any) => {
                const isReplyEditing = editingCommentId === reply.comment_id;
                const canEditReply = user?.id === reply.created_by;

                return (
                  <div
                    key={reply.comment_id}
                    id={`comment-${reply.comment_id}`}
                    className="flex gap-3 mt-3 ml-10 animate-in slide-in-from-top-2 duration-200"
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-sky-400 text-white text-xs font-bold">
                        {reply.author_initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {isReplyEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editCommentContent}
                            onChange={(e) =>
                              setEditCommentContent(e.target.value)
                            }
                            className="w-full text-sm"
                          />
                          {(editCommentImages.length > 0 ||
                            newEditCommentImages.length > 0) && (
                            <div className="flex gap-2 flex-wrap">
                              {editCommentImages.map((url, idx) => (
                                <div
                                  key={`existing-${idx}`}
                                  className="relative"
                                >
                                  <img
                                    src={url}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                  <button
                                    onClick={() =>
                                      handleRemoveEditCommentImage(url)
                                    }
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {newEditCommentImages.map((file, idx) => (
                                <div key={`new-${idx}`} className="relative">
                                  <img
                                    src={URL.createObjectURL(file)}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                  <button
                                    onClick={() => {
                                      setNewEditCommentImages((prev) =>
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
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                document
                                  .getElementById(
                                    `edit-comment-images-${reply.comment_id}`
                                  )
                                  ?.click()
                              }
                              disabled={
                                editCommentImages.length +
                                  newEditCommentImages.length >=
                                4
                              }
                            >
                              <ImagePlus className="w-4 h-4 mr-1" />
                              Ảnh (
                              {editCommentImages.length +
                                newEditCommentImages.length}
                              /4)
                            </Button>
                            <input
                              id={`edit-comment-images-${reply.comment_id}`}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleAddNewEditCommentImage}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(reply.comment_id)}
                              disabled={!editCommentContent.trim()}
                            >
                              Lưu
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEditComment}
                            >
                              Hủy
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="bg-gray-100 rounded-2xl px-4 py-2 hover:bg-gray-200 transition-colors">
                            <div className="font-semibold text-xs">
                              {reply.author_name}
                            </div>
                            <p className="text-xs mt-1 break-words whitespace-pre-wrap">
                              {(() => {
                                const parts = reply.content.split(/(@\w+)/g);
                                return parts.map(
                                  (part: string, idx: number) => {
                                    if (part.startsWith("@")) {
                                      return (
                                        <span
                                          key={idx}
                                          className="font-bold italic text-sky-600"
                                        >
                                          {part}{" "}
                                        </span>
                                      );
                                    }
                                    return part;
                                  }
                                );
                              })()}
                            </p>
                          </div>
                          {reply.image_urls &&
                            reply.image_urls
                              .split(",")
                              .filter((url: string) => url.trim()).length >
                              0 && (
                              <div className="mt-2 flex gap-2 flex-wrap">
                                {reply.image_urls
                                  .split(",")
                                  .filter((url: string) => url.trim())
                                  .map((img: string, idx: number) => (
                                    <img
                                      key={idx}
                                      src={img}
                                      alt={`Reply attachment ${idx + 1}`}
                                      className="max-w-[150px] max-h-[150px] rounded object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() =>
                                        handleImageClick(
                                          reply.image_urls
                                            .split(",")
                                            .filter((url: string) =>
                                              url.trim()
                                            ),
                                          idx
                                        )
                                      }
                                    />
                                  ))}
                              </div>
                            )}
                        </>
                      )}
                      <div className="flex gap-4 px-4 mt-1">
                        <button
                          className="text-xs text-gray-600 hover:text-sky-600 hover:underline font-semibold transition-colors"
                          onClick={() => {
                            setReplyingTo(reply.comment_id);
                            setReplyContents({
                              ...replyContents,
                              [reply.comment_id]: "",
                            });
                            setReplyToUsernames({
                              ...replyToUsernames,
                              [reply.comment_id]: reply.author_name,
                            });
                          }}
                        >
                          Phản hồi
                        </button>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(reply.created_at)}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEditReply && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleEditComment(
                                      reply.comment_id,
                                      reply.content,
                                      reply.image_urls
                                    )
                                  }
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  <span className="font-medium">Chỉnh sửa</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteComment(reply.comment_id)
                                  }
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  <span className="font-bold">Xóa</span>
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setReportTarget({
                                  id: reply.comment_id,
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

                      {replyingTo === reply.comment_id && (
                        <div className="flex gap-2 mt-3 animate-in slide-in-from-top-2 duration-200">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-sky-500 to-sky-600 text-white text-xs font-bold">
                              {user?.username?.substring(0, 2).toUpperCase() ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="mb-2">
                              {replyToUsernames[reply.comment_id] && (
                                <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                  <span className="font-bold italic">
                                    @{replyToUsernames[reply.comment_id]}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReplyToUsernames((prev) => {
                                        const newState = { ...prev };
                                        delete newState[reply.comment_id];
                                        return newState;
                                      });
                                    }}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              <Input
                                placeholder="Viết phản hồi của bạn..."
                                className="rounded-full text-sm hover:border-sky-300 focus:border-sky-500 transition-colors"
                                value={replyContents[reply.comment_id] || ""}
                                onChange={(e) => {
                                  setReplyContents({
                                    ...replyContents,
                                    [reply.comment_id]: e.target.value,
                                  });
                                }}
                                onFocus={() => handleTyping(true)}
                                onBlur={() => handleTyping(false)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmitReply(reply.comment_id);
                                  }
                                }}
                              />
                            </div>
                            {(replyImagesList[reply.comment_id]?.length || 0) >
                              0 && (
                              <div className="flex gap-2 mb-2 flex-wrap">
                                {replyImagesList[reply.comment_id].map(
                                  (img, idx) => (
                                    <div key={idx} className="relative">
                                      <img
                                        src={URL.createObjectURL(img)}
                                        alt={`Preview ${idx + 1}`}
                                        className="w-16 h-16 object-cover rounded"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReplyImagesList({
                                            ...replyImagesList,
                                            [reply.comment_id]: replyImagesList[
                                              reply.comment_id
                                            ].filter((_, i) => i !== idx),
                                          });
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  document
                                    .getElementById(
                                      `reply-images-${reply.comment_id}`
                                    )
                                    ?.click();
                                }}
                                disabled={
                                  (replyImagesList[reply.comment_id]?.length ||
                                    0) >= 4
                                }
                              >
                                <ImagePlus className="w-4 h-4 mr-1" />
                                Ảnh (
                                {replyImagesList[reply.comment_id]?.length || 0}
                                /4)
                              </Button>
                              <input
                                id={`reply-images-${reply.comment_id}`}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) =>
                                  handleReplyImageSelect(e, reply.comment_id)
                                }
                              />

                              <Button
                                size="sm"
                                className="rounded-full px-4 hover:scale-105 transition-transform ml-auto"
                                onClick={() =>
                                  handleSubmitReply(reply.comment_id)
                                }
                                disabled={
                                  isLoading ||
                                  !replyContents[reply.comment_id]?.trim()
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
                    </div>
                  </div>
                );
              })}
            {replies.length > (visibleReplies[comment.comment_id] || 2) && (
              <button
                onClick={() => loadMoreReplies(comment.comment_id)}
                className="ml-10 mt-2 text-sm text-sky-600 hover:text-sky-600 hover:underline"
              >
                Xem thêm{" "}
                {Math.min(
                  5,
                  replies.length - (visibleReplies[comment.comment_id] || 2)
                )}{" "}
                phản hồi...
              </button>
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
                              <span className="font-medium">Chỉnh sửa</span>
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
                            <span className="font-medium">Báo cáo</span>
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

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Ảnh đính kèm
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document
                                .getElementById("edit-post-images")
                                ?.click()
                            }
                            disabled={
                              editImages.length + newEditImages.length >= 4
                            }
                          >
                            <ImagePlus className="w-4 h-4 mr-1" />
                            Thêm ảnh ({editImages.length + newEditImages.length}
                            /4)
                          </Button>
                          <input
                            id="edit-post-images"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleAddNewEditImage}
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {editImages.map((url, idx) => (
                            <div
                              key={`existing-${idx}`}
                              className="relative group"
                            >
                              <img
                                src={url}
                                alt={`Existing ${idx + 1}`}
                                className="w-full h-32 object-cover rounded"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveEditImage(url)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}

                          {newEditImages.map((file, idx) => (
                            <div key={`new-${idx}`} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`New ${idx + 1}`}
                                className="w-full h-32 object-cover rounded border-2 border-green-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setNewEditImages((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  );
                                }}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-xs py-1 text-center">
                                Mới
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
                      <p className="text-gray-700 text-lg leading-relaxed mb-6">
                        {post.content}
                      </p>
                    </>
                  )}

                  {!isEditMode && images.length > 0 && (
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
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-sky-500 to-sky-700 text-white font-bold">
                          {user?.username?.substring(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex gap-2 mb-2">
                          <Input
                            placeholder="Viết bình luận của bạn..."
                            className="rounded-full hover:border-sky-300 focus:border-sky-500 transition-colors"
                            value={newCommentContent}
                            onChange={(e) =>
                              setNewCommentContent(e.target.value)
                            }
                            onFocus={() => handleTyping(true)}
                            onBlur={() => handleTyping(false)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitNewComment();
                              }
                            }}
                          />
                          <Button
                            className="rounded-full px-6 hover:scale-105 transition-transform"
                            onClick={handleSubmitNewComment}
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
                      {getSortedTopLevelComments().map((comment) =>
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
              <div className="mt-4">
                <ForumSidebar
                  topPosts={[]}
                  currentSubjectId={post.subject_id}
                  currentPostId={post.post_id}
                  showStats={true}
                  showRules={true}
                  showRelatedPosts={true}
                />
              </div>
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
