import React, { useState } from "react";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Send, Loader2, ImagePlus, X } from "lucide-react";

interface CommentInputProps {
  postId: number;
  placeholder?: string;
  userInitials: string;
  isLoading?: boolean;
  onSubmit: (content: string, images: File[]) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  autoFocus?: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  postId,
  placeholder = "Viết bình luận...",
  userInitials,
  isLoading = false,
  onSubmit,
  onTyping,
  autoFocus = false,
}) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 4) {
      alert("Tối đa 4 ảnh");
      return;
    }
    setImages((prev) => [...prev, ...files]);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!content.trim()) return;

    await onSubmit(content, images);
    setContent("");
    setImages([]);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-sky-500 to-sky-600 text-white text-sm font-bold">
          {userInitials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex gap-2 mb-2">
          <Input
            placeholder={placeholder}
            className="rounded-full hover:border-sky-300 focus:border-sky-500 transition-colors"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onFocus={() => onTyping?.(true)}
            onBlur={() => onTyping?.(false)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            autoFocus={autoFocus}
          />

          <Button
            type="submit"
            className="rounded-full px-6 hover:scale-105 transition-transform flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            disabled={isLoading || !content.trim()}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Gửi
          </Button>
        </div>

        {images.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {images.map((img, idx) => (
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
                    setImages((prev) => prev.filter((_, i) => i !== idx));
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
              document.getElementById(`comment-images-${postId}`)?.click();
            }}
            onDoubleClick={(e) => e.stopPropagation()}
            disabled={images.length >= 4}
          >
            <ImagePlus className="w-4 h-4 mr-1" />
            Thêm ảnh ({images.length}/4)
          </Button>
          <input
            id={`comment-images-${postId}`}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>
      </div>
    </form>
  );
};
