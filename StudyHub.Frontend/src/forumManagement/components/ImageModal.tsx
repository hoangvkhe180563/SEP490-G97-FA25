import React from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

interface ImageModalProps {
  images: string[];
  selectedIndex: number;
  zoom: number;
  onClose: (e: React.MouseEvent) => void;
  onPrevious: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onZoomIn: (e: React.MouseEvent) => void;
  onZoomOut: (e: React.MouseEvent) => void;
  onIndexChange: (index: number) => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  images,
  selectedIndex,
  zoom,
  onClose,
  onPrevious,
  onNext,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 w-12 h-12 flex items-center justify-center"
        onClick={onClose}
      >
        ×
      </button>

      <div className="absolute top-4 left-4 flex gap-2">
        <button
          className="text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
          onClick={onZoomIn}
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          className="text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
          onClick={onZoomOut}
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-white bg-black bg-opacity-50 rounded-full px-3 h-10 flex items-center">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 text-white text-4xl hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-black bg-opacity-50 rounded-full"
            onClick={onPrevious}
          >
            ‹
          </button>
          <button
            className="absolute right-4 text-white text-4xl hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-black bg-opacity-50 rounded-full"
            onClick={onNext}
          >
            ›
          </button>
          <div className="absolute bottom-4 text-white text-sm">
            {selectedIndex + 1} / {images.length}
          </div>
        </>
      )}

      <img
        src={images[selectedIndex]}
        alt="Full size"
        className="object-contain transition-transform duration-200"
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          transform: `scale(${zoom})`,
        }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
