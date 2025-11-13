// src/forumManagement/components/PostDetailModal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/common/components/ui/dialog";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { Badge } from "@/common/components/ui/badge";
import {
  ExternalLink,
  MessageSquare,
  Send,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { CommentSection } from "./CommentSection";
import { ImageGrid } from "./ImageGrid";
import type { Post } from "../interfaces/forum";
import { getSubjectBadgeColor, getFlairColor } from "../utils/colorUtils";
import { formatTimestamp } from "../utils/dateUtils";
import { useAuthStore } from "@/auth/stores/useAuthStore";

interface PostDetailModalProps {
  isOpen: boolean;
  post: Post | null;
  visibleComments: number;
  isLoading: boolean;
  onClose: () => void;
  onViewDetails: (postId: number) => void;
  onRefreshComments: () => Promise<void>;
  onLoadMoreComments: () => void;
  onSubmitComment: (content: string, images: File[]) => Promise<void>;
  onImageClick: (images: string[], index: number) => void;
  onTyping: (postId: number, isTyping: boolean) => void;
}

export const PostDetailModal = ({
  isOpen,
  post,
  visibleComments,
  isLoading,
  onClose,
  onViewDetails,
  onRefreshComments,
  onLoadMoreComments,
  onSubmitComment,
  onImageClick,
  onTyping,
}: PostDetailModalProps) => {
  const { user } = useAuthStore();
  const [commentContent, setCommentContent] = useState("");
  const [commentImages, setCommentImages] = useState<File[]>([]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + commentImages.length > 4) {
      alert("Tối đa 4 ảnh");
      return;
    }
    setCommentImages((prev) => [...prev, ...files]);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!commentContent.trim()) return;

    await onSubmitComment(commentContent, commentImages);
    setCommentContent("");
    setCommentImages([]);
  };

  if (!post) return null;

  const images = post.image_urls?.split(",").filter((url) => url.trim()) || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogTitle></DialogTitle>
      <DialogContent className="!max-w-[95vw] !w-[60vw] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle className="sr-only">{post.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Chi tiết bài viết và bình luận
          </DialogDescription>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => onViewDetails(post.post_id)}
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
                  <AvatarFallback className="bg-gradient-to-br from-sky-500 to-sky-700 text-white font-bold">
                    {post.author_initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-lg">
                    {post.author_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatTimestamp(post.created_at)} • {post.author_class}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge
                  className={`${getSubjectBadgeColor(
                    post.subject_name
                  )} text-white`}
                >
                  {post.subject_name}
                </Badge>
                <Badge
                  variant="outline"
                  className={getFlairColor(post.flair_name)}
                >
                  {post.flair_name}
                </Badge>
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
            <p className="text-gray-700 mb-6 leading-relaxed">{post.content}</p>

            {images.length > 0 && (
              <ImageGrid
                images={images}
                onImageClick={(idx) => onImageClick(images, idx)}
                className="mb-4"
                isNsfwContent={
                  post.flair_name?.toLowerCase().includes("nhạy cảm") || false
                }
              />
            )}

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 pt-4 border-t">
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                <span>{post.comment_count} bình luận</span>
              </div>
            </div>

            <CommentSection
              post={post}
              comments={(post.comments || []).slice(0, visibleComments)}
              isExpanded={false}
              showSort={true}
              onRefreshComments={onRefreshComments}
              maxVisibleReplies={2}
            />
            {(post.comments || []).length > visibleComments && (
              <button
                onClick={onLoadMoreComments}
                className="w-full py-3 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors mt-4"
              >
                Xem thêm bình luận...
              </button>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 border-t bg-white p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-sky-500 to-sky-600 text-white text-sm font-bold">
                {user?.username?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Viết bình luận..."
                  className="rounded-full hover:border-sky-300 focus:border-sky-500 transition-colors"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onFocus={() => onTyping(post.post_id, true)}
                  onBlur={() => onTyping(post.post_id, false)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
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
                      .getElementById(`modal-comment-images-${post.post_id}`)
                      ?.click();
                  }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  disabled={commentImages.length >= 4}
                >
                  <ImagePlus className="w-4 h-4 mr-1" />
                  Thêm ảnh ({commentImages.length}/4)
                </Button>
                <input
                  id={`modal-comment-images-${post.post_id}`}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
