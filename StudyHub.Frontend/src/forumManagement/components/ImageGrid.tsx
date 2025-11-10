import React from "react";

interface ImageGridProps {
  images: string[];
  onImageClick: (index: number) => void;
  className?: string;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  onImageClick,
  className = "",
}) => {
  if (images.length === 0) return null;

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
      {images.slice(0, 4).map((img, idx) => (
        <div
          key={idx}
          className={`relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${
            images.length === 1 ? "h-64" : "h-40"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onImageClick(idx);
          }}
        >
          <img
            src={img}
            alt={`Image ${idx + 1}`}
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
  );
};
