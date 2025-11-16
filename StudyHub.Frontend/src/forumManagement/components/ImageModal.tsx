// ../components/ImageModal.tsx
import React, { useEffect, useState, useRef } from "react";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageModalProps {
  images: string[];
  selectedIndex: number;
  zoom: number;
  onClose: (e: React.MouseEvent) => void;
  onPrevious: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onZoomIn: (e: React.MouseEvent) => void;
  onZoomOut: (e: React.MouseEvent) => void;
  onIndexChange?: (index: number) => void;
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
  onIndexChange,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (zoom === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [zoom, selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose(e as any);
      } else if (e.key === "ArrowLeft" && images.length > 1) {
        onPrevious(e as any);
      } else if (e.key === "ArrowRight" && images.length > 1) {
        onNext(e as any);
      } else if (e.key === "+" || e.key === "=") {
        onZoomIn(e as any);
      } else if (e.key === "-" || e.key === "_") {
        onZoomOut(e as any);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, onClose, onPrevious, onNext, onZoomIn, onZoomOut]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 z-[100] flex items-center justify-center"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 w-12 h-12 flex items-center justify-center z-50 bg-black bg-opacity-50 rounded-full transition-all hover:bg-opacity-70"
        onClick={onClose}
        title="Đóng (Esc)"
      >
        ×
      </button>

      <div className="absolute top-4 left-4 flex gap-2 z-50">
        <button
          className="text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onZoomIn}
          disabled={zoom >= 3}
          title="Phóng to (+)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          className="text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onZoomOut}
          disabled={zoom <= 0.5}
          title="Thu nhỏ (-)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-white bg-black bg-opacity-50 rounded-full px-3 h-10 flex items-center font-medium">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-black bg-opacity-50 rounded-full z-50 transition-all hover:bg-opacity-70 hover:scale-110"
            onClick={onPrevious}
            title="Ảnh trước (←)"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 w-12 h-12 flex items-center justify-center bg-black bg-opacity-50 rounded-full z-50 transition-all hover:bg-opacity-70 hover:scale-110"
            onClick={onNext}
            title="Ảnh tiếp (→)"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full z-50">
            {selectedIndex + 1} / {images.length}
          </div>

          {images.length <= 10 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-50 max-w-[90vw] overflow-x-auto px-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onIndexChange) {
                      onIndexChange(idx);
                    }
                  }}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    idx === selectedIndex
                      ? "border-sky-500 scale-110"
                      : "border-white/30 opacity-60 hover:opacity-100 hover:border-white/60"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div
        ref={imageRef}
        className="relative w-full h-full flex items-center justify-center z-10"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        style={{
          cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        }}
      >
        <img
          src={images[selectedIndex]}
          alt="Full size"
          className="max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-200 select-none"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${
              position.y / zoom
            }px)`,
            transformOrigin: "center center",
          }}
          draggable={false}
        />
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
