import React, { useState, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { Send, Loader2, ImagePlus, X } from "lucide-react";
import { useForumStore } from "../stores/useForumStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import type { Post } from "../interfaces/forum";
import type { Comment } from "../interfaces/comment";
import { formatTimestamp } from "../utils/dateUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/common/components/ui/dropdown-menu";
import { MoreVertical, Flag, Edit } from "lucide-react";
import { ReportModal } from "./ReportModal";

interface CommentSectionProps {
  post: Post;
  comments: Comment[];
  isExpanded: boolean;
  showSort?: boolean;
  onRefreshComments?: () => void;
  maxVisibleReplies?: number;
}

const flattenComments = (comments: Comment[]): Comment[] => {
  const result: Comment[] = [];

  const flatten = (commentList: Comment[], parentId: number | null = null) => {
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

export const CommentSection: React.FC<CommentSectionProps> = ({
  post,
  comments,
  isExpanded,
  showSort = true,
  onRefreshComments,
}) => {
  const { user } = useAuthStore();
  const { createComment, isLoading, sendTyping } = useForumStore();
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const canEdit = user?.id === post.created_by;
  const [visibleReplies, setVisibleReplies] = useState<{
    [key: number]: number;
  }>({});
  const [commentSort, setCommentSort] = useState("newest");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [commentImages, setCommentImages] = useState<File[]>([]);
  const [replyContents, setReplyContents] = useState<{ [key: number]: string }>(
    {}
  );
  const [replyImagesList, setReplyImagesList] = useState<{
    [key: number]: File[];
  }>({});

  const loadMoreReplies = (commentId: number) => {
    setVisibleReplies((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || 2) + 5,
    }));
  };

  const flatComments = useMemo(() => flattenComments(comments), [comments]);

  const groupedComments = useMemo(() => {
    const groups: { [key: number]: Comment[] } = {};

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

  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + commentImages.length > 4) {
      alert("Tối đa 4 ảnh");
      return;
    }
    setCommentImages((prev) => [...prev, ...files]);
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

  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!commentContent.trim()) return;

    const formData = new FormData();
    formData.append("postId", post.post_id.toString());
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
      onRefreshComments?.();
    }
  };

  const handleSubmitReply = async (parentCommentId: number) => {
    const content = replyContents[parentCommentId];
    if (!content?.trim()) return;

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
      onRefreshComments?.();
    }
  };

  const handleTyping = (isTyping: boolean) => {
    sendTyping(post.post_id, isTyping);
  };

  const topLevelComments = getSortedTopLevelComments();
  const actualCommentCount = flatComments.length;

  return (
    <div className="space-y-4">
      {showSort && (
        <div className="flex items-center justify-between pb-3 border-b">
          <h3 className="font-bold text-lg">
            Bình luận ({actualCommentCount})
          </h3>
          <Select value={commentSort} onValueChange={setCommentSort}>
            <SelectTrigger className="w-32 h-9 text-sm hover:border-purple-300 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {topLevelComments.map((comment) => {
        const isReplying = replyingTo === comment.comment_id;
        const replies = groupedComments[comment.comment_id] || [];

        return (
          <div key={comment.comment_id}>
            <div className="flex gap-3">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-orange-400 text-white text-sm font-bold">
                  {comment.author_initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="bg-gray-100 rounded-2xl px-4 py-3 hover:bg-gray-200 transition-colors">
                  <div className="font-semibold text-sm">
                    {comment.author_name}
                  </div>
                  <p className="text-sm mt-1 break-words whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  {comment.image_urls && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {comment.image_urls
                        .split(",")
                        .filter((url: string) => url.trim())
                        .map((img: string, idx: number) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Attachment ${idx + 1}`}
                            className="max-w-[200px] max-h-[200px] rounded object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
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
                      const isCurrentlyReplying =
                        replyingTo === comment.comment_id;
                      setReplyingTo(
                        isCurrentlyReplying ? null : comment.comment_id
                      );
                      if (!isCurrentlyReplying && !comment.parent_comment_id) {
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
                  <div className="flex gap-2 mt-3 ml-4 animate-in slide-in-from-top-2 duration-200">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                        {user?.username?.substring(0, 2).toUpperCase() || "U"}
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
                        onFocus={() => handleTyping(true)}
                        onBlur={() => handleTyping(false)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmitReply(comment.comment_id);
                          }
                        }}
                      />

                      {(replyImagesList[comment.comment_id]?.length || 0) >
                        0 && (
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {replyImagesList[comment.comment_id].map(
                            (img, idx) => (
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
                                      [comment.comment_id]: replyImagesList[
                                        comment.comment_id
                                      ].filter((_, i) => i !== idx),
                                    });
                                  }}
                                  onDoubleClick={(e) => e.stopPropagation()}
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
                                `reply-images-${comment.comment_id}`
                              )
                              ?.click();
                          }}
                          onDoubleClick={(e) => e.stopPropagation()}
                          disabled={
                            (replyImagesList[comment.comment_id]?.length ||
                              0) >= 4
                          }
                        >
                          <ImagePlus className="w-4 h-4 mr-1" />
                          Ảnh (
                          {replyImagesList[comment.comment_id]?.length || 0}/4)
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

                {replies
                  .slice(0, visibleReplies[comment.comment_id] || 2)
                  .map((reply: Comment) => (
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
                            {reply.parent_comment_id !== comment.comment_id && (
                              <span className="text-purple-600 font-semibold">
                                @
                                {
                                  flatComments.find(
                                    (c) =>
                                      c.comment_id === reply.parent_comment_id
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
                                .map((img: string, idx: number) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`Reply attachment ${idx + 1}`}
                                    className="max-w-[150px] max-h-[150px] rounded object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  />
                                ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-4 px-4 mt-1">
                          <button
                            className="text-xs text-gray-600 hover:text-purple-600 hover:underline font-semibold transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyingTo(reply.comment_id);
                              setReplyContents({
                                ...replyContents,
                                [reply.comment_id]: "",
                              });
                            }}
                            onDoubleClick={(e) => e.stopPropagation()}
                          >
                            Phản hồi
                          </button>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(reply.created_at)}
                          </span>
                        </div>
                        {/* <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user?.id === comment.created_by && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setEditingCommentId(comment.comment_id)
                                }
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                <span className="font-medium italic">
                                  Chỉnh sửa
                                </span>
                              </DropdownMenuItem>
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
                        </DropdownMenu> */}

                        {replyingTo === reply.comment_id && (
                          <div className="flex gap-2 mt-3 animate-in slide-in-from-top-2 duration-200">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                                {user?.username
                                  ?.substring(0, 2)
                                  .toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <Input
                                placeholder={`Phản hồi @${reply.author_name}...`}
                                className="rounded-full text-sm hover:border-purple-300 focus:border-purple-500 transition-colors mb-2"
                                value={replyContents[reply.comment_id] || ""}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setReplyContents({
                                    ...replyContents,
                                    [reply.comment_id]: e.target.value,
                                  });
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onDoubleClick={(e) => e.stopPropagation()}
                                onFocus={() => handleTyping(true)}
                                onBlur={() => handleTyping(false)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmitReply(reply.comment_id);
                                  }
                                }}
                              />
                              {(replyImagesList[reply.comment_id]?.length ||
                                0) > 0 && (
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
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setReplyImagesList({
                                              ...replyImagesList,
                                              [reply.comment_id]:
                                                replyImagesList[
                                                  reply.comment_id
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
                                        `reply-images-${reply.comment_id}`
                                      )
                                      ?.click();
                                  }}
                                  onDoubleClick={(e) => e.stopPropagation()}
                                  disabled={
                                    (replyImagesList[reply.comment_id]
                                      ?.length || 0) >= 4
                                  }
                                >
                                  <ImagePlus className="w-4 h-4 mr-1" />
                                  Ảnh (
                                  {replyImagesList[reply.comment_id]?.length ||
                                    0}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubmitReply(reply.comment_id);
                                  }}
                                  onDoubleClick={(e) => e.stopPropagation()}
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
                  ))}
                {replies.length > (visibleReplies[comment.comment_id] || 2) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      loadMoreReplies(comment.comment_id);
                    }}
                    className="ml-10 mt-2 text-sm text-purple-600 hover:text-purple-700 hover:underline"
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
      })}

      {isExpanded && (
        <form
          onSubmit={handleSubmitComment}
          className="flex gap-3 mt-4 border-t pt-4"
        >
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
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onFocus={() => handleTyping(true)}
                onBlur={() => handleTyping(false)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />

              <Button
                type="submit"
                className="rounded-full px-6 hover:scale-105 transition-transform flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
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
              <div className="flex gap-2 mb-2 flex-wrap">
                {commentImages.map((img, idx) => (
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
                        setCommentImages((prev) =>
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
                    .getElementById(`comment-images-${post.post_id}`)
                    ?.click();
                }}
                onDoubleClick={(e) => e.stopPropagation()}
                disabled={commentImages.length >= 4}
              >
                <ImagePlus className="w-4 h-4 mr-1" />
                Thêm ảnh ({commentImages.length}/4)
              </Button>
              <input
                id={`comment-images-${post.post_id}`}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleCommentImageSelect}
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
