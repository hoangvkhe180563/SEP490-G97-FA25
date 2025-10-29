import React from "react";
import { Play, Eye, Check } from "lucide-react";
import { Button } from "@/common/components/ui/button";

const CourseContentItem: React.FC<{
  title: string;
  subtitle?: string;
  duration?: string;
  isPreview?: boolean;
  isCompleted?: boolean;
  variant?: "list" | "grid";
  onClick?: () => void;
}> = ({
  title,
  subtitle,
  duration,
  isPreview,
  isCompleted,
  variant = "list",
  onClick,
}) => {
  if (variant === "grid") {
    return (
      <div
        onClick={onClick}
        className={`bg-white border rounded-xl p-4 shadow-sm h-full flex flex-col transition hover:shadow-md ${
          isPreview ? "border-blue-200 bg-blue-50/50" : ""
        }`}
      >
        <div className="flex-1">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            {isCompleted ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Play className="w-5 h-5 text-gray-600" />
            )}
          </div>
          <div className="font-semibold text-gray-800 mb-1 line-clamp-2">
            {title}
          </div>
          {subtitle && (
            <div className="text-sm text-gray-500 line-clamp-3">{subtitle}</div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">{duration} Phút</div>

          {isPreview && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 transition"
            >
              <Eye className="w-4 h-4" /> Preview
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between bg-white border rounded-xl p-3 mb-3 transition hover:shadow-md ${
        isPreview ? "border-blue-200 bg-blue-50/50" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          {isCompleted ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Play className="w-4 h-4 text-gray-600" />
          )}
        </div>
        <div>
          <div className="font-medium text-gray-800">{title}</div>
          {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isPreview && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 transition"
          >
            <Eye className="w-4 h-4 mr-1" /> Preview
          </Button>
        )}
        <div className="text-sm text-gray-500">{duration} Phút</div>
      </div>
    </div>
  );
};

export default CourseContentItem;
