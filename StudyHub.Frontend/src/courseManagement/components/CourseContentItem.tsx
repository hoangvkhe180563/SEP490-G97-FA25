import React from "react";
import { Play } from "lucide-react";

const CourseContentItem: React.FC<{
  title: string;
  subtitle?: string;
  duration?: string;
  variant?: "list" | "grid";
}> = ({ title, subtitle, duration, variant = "list" }) => {
  if (variant === "grid") {
    return (
      <div className="bg-white border rounded p-3 shadow-sm h-full flex flex-col">
        <div className="flex-1">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Play className="w-5 h-5 text-gray-600" />
          </div>
          <div className="font-medium mb-1">{title}</div>
          {subtitle && (
            <div className="text-sm text-gray-500 line-clamp-3">{subtitle}</div>
          )}
        </div>
        <div className="text-sm text-gray-500 mt-3">{duration}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-white border rounded p-3 mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <Play className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <div className="font-medium">{title}</div>
          {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
        </div>
      </div>

      <div className="text-sm text-gray-500">{duration}</div>
    </div>
  );
};

export default CourseContentItem;
