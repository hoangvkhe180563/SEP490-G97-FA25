import React from "react";
import { Play } from "lucide-react";

const CourseContentItem: React.FC<{
  title: string;
  subtitle?: string;
  duration?: string;
}> = ({ title, subtitle, duration }) => {
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
