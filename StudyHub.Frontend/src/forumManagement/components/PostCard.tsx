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
interface PostCardProps {
  post: Post;
  onOpenComments: () => void;
  onViewDetails: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onViewDetails }) => {
  const { joinPost, leavePost, getComments } = useForumStore();

  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [cardImages, setCardImages] = useState<string[]>([]);
  const [imageZoom, setImageZoom] = useState(1);
  const [showComments, setShowComments] = useState(false);
  const [loadedComments, setLoadedComments] = useState<any[]>([]);
  const [visibleComments] = useState(3);
  const images = post.image_urls
    ? post.image_urls.split(",").filter((url) => url.trim())
    : [];

  const handleToggleComments = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showComments) {
      await joinPost(post.post_id);
      const result = await getComments(post.post_id);
      if (result?.success && result.data?.items) {
        const mapCommentWithReplies = (comment: any): any => {
          return {
            comment_id: comment.commentId || comment.comment_id,
            post_id: comment.postId || comment.post_id,
            parent_comment_id:
              comment.parentCommentId || comment.parent_comment_id,
            content: comment.content,
            created_at: comment.createdAt || comment.created_at,
            created_by: comment.createdBy || comment.created_by,
            author_name: comment.creatorName || comment.authorName || "Unknown",
            author_initials: (comment.creatorName || comment.authorName || "U")
              .substring(0, 2)
              .toUpperCase(),
            author_class: comment.creatorClass || "",
            replies: (comment.replies || []).map(mapCommentWithReplies),
            image_urls:
              comment.attachments?.map((a: any) => a.fileUrl).join(",") || "",
          };
        };

        setLoadedComments(result.data.items.map(mapCommentWithReplies));
      }
    } else {
      await leavePost(post.post_id);
      setLoadedComments([]);
    }
    setShowComments(!showComments);
  };

  const handleRefreshComments = async () => {
    const result = await getComments(post.post_id);
    if (result?.success && result.data?.items) {
      const mapCommentWithReplies = (comment: any): any => {
        return {
          comment_id: comment.commentId || comment.comment_id,
          post_id: comment.postId || comment.post_id,
          parent_comment_id:
            comment.parentCommentId || comment.parent_comment_id,
          content: comment.content,
          created_at: comment.createdAt || comment.created_at,
          created_by: comment.createdBy || comment.created_by,
          author_name: comment.creatorName || comment.authorName || "Unknown",
          author_initials: (comment.creatorName || comment.authorName || "U")
            .substring(0, 2)
            .toUpperCase(),
          author_class: comment.creatorClass || "",
          replies: (comment.replies || []).map(mapCommentWithReplies),
          image_urls:
            comment.attachments?.map((a: any) => a.fileUrl).join(",") || "",
        };
      };

      setLoadedComments(result.data.items.map(mapCommentWithReplies));
    }
  };

  const formatTimestamp = (dateString: string) => {
    if (!dateString) return "";
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
              onClick={handleToggleComments}
              onDoubleClick={(e) => {
                e.stopPropagation();
              }}
              className="flex items-center gap-1 hover:text-purple-600 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{post.comment_count} bình luận</span>
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

          {showComments && (
            <div className="mt-4 pt-4 border-t">
              <CommentSection
                post={post}
                comments={loadedComments.slice(0, visibleComments)}
                isExpanded={true}
                showSort={false}
                onRefreshComments={handleRefreshComments}
                maxVisibleReplies={2}
              />
              {loadedComments.length > visibleComments && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails();
                  }}
                  className="w-full py-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors mt-2"
                >
                  Xem thêm bình luận...
                </button>
              )}
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
