import React from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Course, CourseStatus } from "@/courseManagement/interfaces/types";

export type Status = CourseStatus;

type Props = {
  course: Course;
};

const statusColor: Partial<Record<Status, string>> = {
  Published: "bg-emerald-100 text-emerald-800",
  Draft: "bg-yellow-100 text-yellow-800",
  Archived: "bg-rose-100 text-rose-800",
};

const CourseItem: React.FC<Props> = ({ course }) => {
  return (
    <tr>
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 text-sm text-gray-500">
            {course.image ? (
              <img
                src={course.image}
                alt=""
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <span>Course Image</span>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-[#171717]">
              {course.title}
            </div>
            {course.description && (
              <div className="text-sm text-[#737373] mt-0.5">
                {course.description}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {/* If instructor is a string we don't have avatar here; show initials placeholder */}
            <span className="text-sm text-[#525252]">
              {(course.instructor || "")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
          </div>
          <span className="text-sm text-[#171717]">{course.instructor}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">{course.category}</td>
      <td className="px-6 py-4 text-sm">{course.students}</td>
      <td className="px-6 py-4 text-sm">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-normal ${
            statusColor[course.status ?? "Draft"] ?? "bg-gray-100 text-gray-800"
          }`}
        >
          {course.status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm">{course.createdAt}</td>
      <td className="w-36 px-6 py-4 text-center text-sm">
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <button title="View" className="p-2 hover:bg-gray-100 rounded">
            <Link to="/teacher/courses/:id">
              <Eye className="w-4 h-4" />
            </Link>
          </button>
          <button title="Edit" className="p-2 hover:bg-gray-100 rounded">
            <Link to="/teacher/edit-course">
              <Edit className="w-4 h-4" />
            </Link>
          </button>
          <button
            title="Delete"
            className="p-2 hover:bg-gray-100 rounded text-rose-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default CourseItem;
