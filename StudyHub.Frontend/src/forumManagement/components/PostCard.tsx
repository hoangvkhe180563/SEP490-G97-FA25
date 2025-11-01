import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
// import { Input } from "@/common/components/ui/input";
import { Badge } from "@/common/components/ui/badge";
// import { Button } from "@/common/components/ui/button";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import {
  MessageSquare,
  // Send,
  Image as ImageIcon,
  ExternalLink,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { Post } from "../interfaces/forum";

interface PostCardProps {
  post: Post;
  onOpenComments: () => void;
  onViewDetails: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onOpenComments,
  onViewDetails,
}) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [cardImages, setCardImages] = useState<string[]>([]);
  const [imageZoom, setImageZoom] = useState(1);
  const images = post.image_urls
    ? post.image_urls.split(",").filter((url) => url.trim())
    : [];

  const getSubjectColor = (subjectName: string) => {
    const colors: Record<string, string> = {
      Toán: "bg-blue-500",
      "Vật Lý": "bg-purple-500",
      "Tiếng Anh": "bg-green-500",
      "Hóa học": "bg-orange-500",
      Văn: "bg-pink-500",
      "Sinh học": "bg-teal-500",
      "Lịch sử": "bg-yellow-600",
    };
    return colors[subjectName] || "bg-gray-500";
  };

  const getFlairColor = (flairName: string) => {
    const colors: Record<string, string> = {
      "Câu hỏi": "bg-red-100 text-red-700 border-red-300",
      "Kiến thức": "bg-blue-100 text-blue-700 border-blue-300",
      "Thảo luận": "bg-green-100 text-green-700 border-green-300",
    };
    return colors[flairName] || "bg-gray-100 text-gray-700 border-gray-300";
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

  const topLevelComments = post.comments.filter((c) => !c.parent_comment_id);
  const previewComments = topLevelComments.slice(0, 2);

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
                className={`${getSubjectColor(post.subject_name)} text-white`}
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
                    src={img}
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
                onOpenComments();
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
              className="flex items-center gap-1 hover:text-purple-600 transition-colors ml-auto"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Xem chi tiết</span>
            </button>
          </div>

          {topLevelComments.length > 0 && (
            <div className="space-y-2 mb-3">
              {previewComments.map((comment) => (
                <div
                  key={comment.comment_id}
                  className="flex gap-2 pl-2 border-l-2 border-gray-200"
                >
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-orange-400 text-white text-xs font-bold">
                      {comment.author_initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-xs">
                      <span className="font-semibold">
                        {comment.author_name}
                      </span>
                      <span className="text-gray-600 ml-2">
                        {comment.content}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {topLevelComments.length > 2 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenComments();
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 ml-2 hover:underline transition-all"
                >
                  Xem thêm {topLevelComments.length - 2} bình luận
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
            src={cardImages[selectedImageIndex]}
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
