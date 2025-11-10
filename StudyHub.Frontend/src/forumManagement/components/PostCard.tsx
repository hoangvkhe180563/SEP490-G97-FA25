//PostCard.tsx
import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import {
  MessageSquare,
  ImageIcon,
  ExternalLink,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { Post } from "../interfaces/forum";
import { useForumStore } from "../stores/useForumStore";
import { getSubjectBadgeColor, getFlairColor } from "../utils/colorUtils";
import { CommentSection } from "./CommentSection";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Send, Loader2, ImagePlus, X } from "lucide-react";

interface PostCardProps {
  post: Post;
  onOpenComments: () => void;
  onViewDetails: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onViewDetails }) => {
  const { joinPost, leavePost, getComments, createComment, isLoading } =
    useForumStore();
  const { user } = useAuthStore();

  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [cardImages, setCardImages] = useState<string[]>([]);
  const [imageZoom, setImageZoom] = useState(1);
  const [showAllComments, setShowAllComments] = useState(false);
  const [loadedComments, setLoadedComments] = useState<any[]>([]);

  const [replyingToComments, setReplyingToComments] = useState<Set<number>>(
    new Set()
  );
  const [replyContents, setReplyContents] = useState<{ [key: number]: string }>(
    {}
  );
  const [replyImagesList, setReplyImagesList] = useState<{
    [key: number]: File[];
  }>({});

  const images = post.image_urls
    ? post.image_urls.split(",").filter((url) => url.trim())
    : [];

  const handleShowAllComments = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showAllComments) {
      await joinPost(post.post_id);
      const result = await getComments(post.post_id);
      if (result?.success && result.data?.items) {
        setLoadedComments(result.data.items);
      }
    } else {
      await leavePost(post.post_id);
      setLoadedComments([]);
    }
    setShowAllComments(!showAllComments);
  };

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

  const handleImageClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setCardImages(images);
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

  const handleSubmitReply = async (commentId: number) => {
    const content = replyContents[commentId];
    if (!content?.trim()) return;

    const formData = new FormData();
    formData.append("postId", post.post_id.toString());
    formData.append("parentCommentId", commentId.toString());
    formData.append("content", content);

    const images = replyImagesList[commentId] || [];
    images.forEach((img) => formData.append("attachments", img));

    const result = await createComment(formData);
    if (result?.success) {
      setReplyContents((prev) => {
        const newState = { ...prev };
        delete newState[commentId];
        return newState;
      });
      setReplyImagesList((prev) => {
        const newState = { ...prev };
        delete newState[commentId];
        return newState;
      });
      setReplyingToComments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

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

  const flatComments = flattenComments(post.comments || []);
  const topLevelComments = flatComments.filter((c) => !c.parent_comment_id);
  const previewComments = topLevelComments.slice(0, 2);

  const groupedReplies = (parentId: number) => {
    const replies: any[] = [];

    flatComments.forEach((comment) => {
      if (comment.parent_comment_id) {
        let currentParent = comment.parent_comment_id;
        while (currentParent) {
          const parent = flatComments.find(
            (c) => c.comment_id === currentParent
          );
          if (!parent?.parent_comment_id) {
            if (currentParent === parentId) {
              replies.push(comment);
            }
            break;
          }
          currentParent = parent.parent_comment_id;
        }
      }
    });

    return replies;
  };

  return (
    <>
      <Card className="mb-4 hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                  {post.author_initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">{post.author_name}</div>
                <div className="text-xs text-gray-500">
                  {formatTimestamp(post.created_at)} • {post.author_class}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge
                className={`${getSubjectBadgeColor(
                  post.subject_name || ""
                )} text-white`}
              >
                {post.subject_name || "N/A"}
              </Badge>
              <Badge
                variant="outline"
                className={getFlairColor(post.flair_name || "")}
              >
                {post.flair_name}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="hover:opacity-80 transition-opacity">
            <h2 className="text-xl font-bold mb-2">{post.title}</h2>
            <p className="text-gray-700 mb-4">{post.content}</p>
          </div>
          {images.length > 0 && (
            <div
              className={`mb-4 ${
                images.length === 1
                  ? ""
                  : images.length === 2
                  ? "grid grid-cols-2 gap-2"
                  : "grid grid-cols-2 gap-2"
              }`}
            >
              {images.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${
                    images.length === 1 ? "h-64" : "h-40"
                  }`}
                  onClick={(e) => handleImageClick(e, idx)}
                >
                  <img
                    src={img || "/placeholder.svg"}
                    alt={`${post.title} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {idx === 3 && images.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        +{images.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3 pt-2 border-t">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShowAllComments(e);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
              }}
              className="flex items-center gap-1 hover:text-purple-600 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{topLevelComments.length} bình luận</span>
            </button>
            {images.length > 0 && (
              <div className="flex items-center gap-1 text-gray-500">
                <ImageIcon className="w-4 h-4" />
                <span>{images.length} ảnh</span>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
              }}
              className="flex items-center gap-1 hover:text-purple-600 transition-colors ml-auto"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Xem chi tiết</span>
            </button>
          </div>
          {!showAllComments && topLevelComments.length > 0 && (
            <div className="space-y-3 mb-3">
              {previewComments.map((comment) => {
                const isReplying = replyingToComments.has(comment.comment_id);
                const commentReplies = groupedReplies(comment.comment_id);
                const totalRepliesCount = commentReplies.length;
                const previewReplies = commentReplies.slice(0, 1);

                return (
                  <div key={comment.comment_id} className="space-y-2">
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-orange-400 text-white text-xs font-bold">
                          {comment.author_initials ||
                            comment.author_name
                              ?.substring(0, 2)
                              .toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-100 rounded-2xl px-4 py-2 hover:bg-gray-200 transition-colors">
                          <div className="font-semibold text-sm">
                            {comment.author_name || "Unknown User"}
                          </div>
                          <p className="text-sm mt-1 break-words whitespace-pre-wrap">
                            {comment.content}
                          </p>
                          {comment.image_urls && (
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {comment.image_urls
                                .split(",")
                                .filter((url: string) => url.trim())
                                .slice(0, 3)
                                .map((img: string, idx: number) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`Comment attachment ${idx + 1}`}
                                    className="max-w-[100px] max-h-[100px] rounded object-cover cursor-pointer hover:opacity-90"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const allImages = comment.image_urls
                                        .split(",")
                                        .filter((url: string) => url.trim());
                                      setCardImages(allImages);
                                      setSelectedImageIndex(idx);
                                      setImageZoom(1);
                                      setShowImageModal(true);
                                    }}
                                  />
                                ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-4 px-4 mt-2">
                          <button
                            className="text-xs text-gray-600 hover:text-purple-600 hover:underline font-semibold transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyingToComments((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(comment.comment_id)) {
                                  newSet.delete(comment.comment_id);
                                } else {
                                  newSet.add(comment.comment_id);
                                }
                                return newSet;
                              });
                              if (!replyingToComments.has(comment.comment_id)) {
                                setReplyContents({
                                  ...replyContents,
                                  [comment.comment_id]: `@${comment.author_name} `,
                                });
                              }
                            }}
                            onDoubleClick={(e) => e.stopPropagation()}
                          >
                            Phản hồi
                          </button>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(comment.created_at)}
                          </span>
                        </div>

                        {isReplying && (
                          <div
                            className="flex gap-2 mt-3 ml-0 animate-in slide-in-from-top-2 duration-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                                {user?.username
                                  ?.substring(0, 2)
                                  .toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <Input
                                placeholder={`Phản hồi @${comment.author_name}...`}
                                className="rounded-full text-sm hover:border-purple-300 focus:border-purple-500 transition-colors mb-2"
                                value={replyContents[comment.comment_id] || ""}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setReplyContents({
                                    ...replyContents,
                                    [comment.comment_id]: e.target.value,
                                  });
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => e.stopPropagation()}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSubmitReply(comment.comment_id);
                                  }
                                }}
                              />

                              {(replyImagesList[comment.comment_id]?.length ||
                                0) > 0 && (
                                <div className="flex gap-2 mb-2 flex-wrap">
                                  {replyImagesList[comment.comment_id].map(
                                    (img, idx) => (
                                      <div key={idx} className="relative">
                                        <img
                                          src={
                                            URL.createObjectURL(img) ||
                                            "/placeholder.svg"
                                          }
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
                                                ].filter((_, i) => i !== idx),
                                            });
                                          }}
                                          onDoubleClick={(e) =>
                                            e.stopPropagation()
                                          }
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    document
                                      .getElementById(
                                        `reply-preview-images-${comment.comment_id}`
                                      )
                                      ?.click();
                                  }}
                                  onDoubleClick={(e) => e.stopPropagation()}
                                  disabled={
                                    (replyImagesList[comment.comment_id]
                                      ?.length || 0) >= 4
                                  }
                                >
                                  <ImagePlus className="w-4 h-4 mr-1" />(
                                  {replyImagesList[comment.comment_id]
                                    ?.length || 0}
                                  /4)
                                </Button>
                                <input
                                  id={`reply-preview-images-${comment.comment_id}`}
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
                                    handleSubmitReply(comment.comment_id);
                                  }}
                                  onDoubleClick={(e) => e.stopPropagation()}
                                  disabled={
                                    isLoading ||
                                    !replyContents[comment.comment_id]?.trim()
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

                        {previewReplies.map((reply) => (
                          <div
                            key={reply.comment_id}
                            className="flex gap-3 mt-3 ml-10 animate-in slide-in-from-top-2 duration-200"
                          >
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-bold">
                                {reply.author_initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="bg-gray-100 rounded-2xl px-4 py-2 hover:bg-gray-200 transition-colors">
                                <div className="font-semibold text-xs">
                                  {reply.author_name}
                                </div>
                                <p className="text-xs mt-1 break-words whitespace-pre-wrap">
                                  {reply.parent_comment_id !==
                                    comment.comment_id && (
                                    <span className="text-purple-600 font-semibold">
                                      @
                                      {
                                        flatComments.find(
                                          (c) =>
                                            c.comment_id ===
                                            reply.parent_comment_id
                                        )?.author_name
                                      }{" "}
                                    </span>
                                  )}
                                  {reply.content}
                                </p>
                                {reply.image_urls && (
                                  <div className="mt-2 flex gap-2 flex-wrap">
                                    {reply.image_urls
                                      .split(",")
                                      .filter((url: string) => url.trim())
                                      .slice(0, 2)
                                      .map((img: string, idx: number) => (
                                        <img
                                          key={idx}
                                          src={img || "/placeholder.svg"}
                                          alt={`Reply attachment ${idx + 1}`}
                                          className="max-w-[60px] max-h-[60px] rounded object-cover cursor-pointer hover:opacity-90"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const allImages = reply.image_urls
                                              .split(",")
                                              .filter((url: string) =>
                                                url.trim()
                                              );
                                            setCardImages(allImages);
                                            setSelectedImageIndex(idx);
                                            setImageZoom(1);
                                            setShowImageModal(true);
                                          }}
                                        />
                                      ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-4 px-4 mt-1">
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(reply.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {totalRepliesCount > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowAllComments(e);
                            }}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium ml-12 hover:underline mt-2"
                          >
                            Xem thêm {totalRepliesCount - 1} phản hồi
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {topLevelComments.length > 2 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowAllComments(e);
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 ml-2 hover:underline transition-all"
                >
                  Xem thêm {topLevelComments.length - 2} bình luận
                </button>
              )}
            </div>
          )}

          {showAllComments && (
            <div
              className="mt-4 border-t pt-4"
              onClick={(e) => e.stopPropagation()}
            >
              <CommentSection
                post={post}
                comments={loadedComments}
                isExpanded={true}
                showSort={true}
                onRefreshComments={async () => {
                  const result = await getComments(post.post_id);
                  if (result?.success && result.data?.items) {
                    setLoadedComments(result.data.items);
                  }
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

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

          {cardImages.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white text-4xl hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-black bg-opacity-50 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev === 0 ? cardImages.length - 1 : prev - 1
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
                    prev === cardImages.length - 1 ? 0 : prev + 1
                  );
                }}
              >
                ›
              </button>
              <div className="absolute bottom-4 text-white text-sm">
                {selectedImageIndex + 1} / {cardImages.length}
              </div>
            </>
          )}

          <img
            src={cardImages[selectedImageIndex] || "/placeholder.svg"}
            alt="Full size"
            className="object-contain transition-transform duration-200"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              transform: `scale(${imageZoom})`,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default PostCard;
