import React from "react";
import { Button } from "@/common/components/ui/button";
import { Link } from "react-router-dom";
import type { Course } from "@/courseManagement/interfaces/types";

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  return (
    <div className="bg-white rounded-md shadow-sm overflow-hidden">
      <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400">
        Course Thumbnail
      </div>
      <div className="p-4">
        <div className="inline-block bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded mb-2">
          Computer Science
        </div>
        <h3 className="text-sm font-medium text-[#171717]">
          <Link to={`/student/course/${course.id}`}>{course.title}</Link>
        </h3>
        {course.description && (
          <p className="text-sm text-[#737373] mt-2">{course.description}</p>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden text-xs">
              {(course.instructor || "")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="text-xs text-gray-600">{course.instructor}</div>
          </div>
          <div className="text-xs text-gray-600">{course.duration}</div>
        </div>

        <div className="mt-4">
          <Button className="w-full bg-black text-white">Enroll Now</Button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
