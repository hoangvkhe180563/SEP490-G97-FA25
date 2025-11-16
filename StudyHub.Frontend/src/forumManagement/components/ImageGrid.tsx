import React, { useState } from "react";
import { EyeOff, AlertTriangle } from "lucide-react";

interface ImageGridProps {
  images: string[];
  onImageClick: (index: number) => void;
  className?: string;
  isNsfwContent?: boolean;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  onImageClick,
  className = "",
  isNsfwContent = false,
}) => {
  const [revealedImages, setRevealedImages] = useState<Set<number>>(new Set());

  if (images.length === 0) return null;

  const handleRevealImage = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedImages((prev) => new Set([...prev, idx]));
  };

  return (
    <div
      className={`${
        images.length === 1
          ? ""
          : images.length === 2
          ? "grid grid-cols-2 gap-2"
          : "grid grid-cols-2 gap-2"
      } ${className}`}
    >
      {images.slice(0, 4).map((img, idx) => {
        const isRevealed = revealedImages.has(idx);
        const shouldBlur = isNsfwContent && !isRevealed;

        return (
          <div
            key={idx}
            className={`relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${
              images.length === 1 ? "h-128" : "h-40"
            }`}
            onClick={(e) => {
              if (shouldBlur) return;
              e.stopPropagation();
              onImageClick(idx);
            }}
          >
            <img
              src={img}
              alt={`Image ${idx + 1}`}
              className={`w-full h-full object-cover ${
                shouldBlur ? "blur-2xl" : ""
              }`}
            />

            {shouldBlur && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center gap-2">
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
                <EyeOff className="w-12 h-12 text-white" />
                <p className="text-white text-sm font-medium text-center px-4">
                  Nội dung có thể gây phản cảm
                </p>
                <button
                  onClick={(e) => handleRevealImage(idx, e)}
                  className="mt-2 px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
                >
                  Nhấn để xem
                </button>
              </div>
            )}

            {idx === 3 && images.length > 4 && !shouldBlur && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  +{images.length - 4}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
