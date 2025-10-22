import React from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import type {
  CourseListDto as Course,
  CourseStatus,
} from "@/courseManagement/interfaces/types";

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
  const deleteCourse = useCourseStore((s) => s.deleteCourse);
  // backend exposes status as boolean|null; map to UI labels
  const statusLabel: Status = course.status ? "Published" : "Draft";
  return (
    <tr>
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 text-sm text-gray-500">
            {course.imageUrl ? (
              <img
                src={course.imageUrl}
                alt=""
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <span>Hình ảnh khóa học</span>
            )}
          </div>
          <div>
            <div className="text-sm font-medium text-[#171717]">
              {course.name}
            </div>
            {course.information && (
              <div className="text-sm text-[#737373] mt-0.5">
                {course.information}
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
              {(course.instructorName || "")
                .split(" ")
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
          </div>
          <span className="text-sm text-[#171717]">
            {course.updatedBy ?? course.instructorName ?? "-"}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">{course.category ?? "-"}</td>
      <td className="px-6 py-4 text-sm">
        {typeof course.grade === "number"
          ? `Khối ${course.grade}`
          : course.grade ?? "-"}
      </td>
      <td className="px-6 py-4 text-sm">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-normal ${
            statusColor[statusLabel] ?? "bg-gray-100 text-gray-800"
          }`}
        >
          {statusLabel}
        </span>
      </td>
      <td className="px-6 py-4 text-sm">
        {course.createdAt ? String(course.createdAt).slice(0, 10) : "-"}
      </td>
      <td className="w-36 px-6 py-4 text-center text-sm">
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <button title="View" className="p-2 hover:bg-gray-100 rounded">
            <Link to={`/course/teacher/courses/${course.id}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </button>
          <button title="Edit" className="p-2 hover:bg-gray-100 rounded">
            <Link to={`/course/teacher/edit-course/${course.id}`}>
              <Edit className="w-4 h-4" />
            </Link>
          </button>
          <button
            title="Delete"
            onClick={async () => {
              const confirmDelete = window.confirm(
                `Are you sure you want to delete the course "${course.name}"?`
              );
              if (!confirmDelete) return;

              const ok = await deleteCourse?.(Number(course.id));
              if (!ok) {
                alert("Xóa khóa học thất bại.");
              }
            }}
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
