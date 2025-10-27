import React from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import type {
  CourseListDto as Course,
  CourseStatus,
} from "@/courseManagement/interfaces/types";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/common/components/ui/alert-dialog";

type Props = {
  course: Course;
};

const STATUS_MAP: Record<CourseStatus, { label: string; className: string }> = {
  Mở: { label: "Mở", className: "bg-green-100 text-green-800" },
  Đóng: { label: "Đóng", className: "bg-red-100 text-red-800" },
  Nháp: { label: "Nháp", className: "bg-yellow-100 text-yellow-800" },
};

const CourseItem: React.FC<Props> = ({ course }) => {
  const deleteCourse = useCourseStore((s) => s.deleteCourse);

  const statusKey =
    course.status === "Mở" ? "Mở" : course.status === "Đóng" ? "Đóng" : "Nháp";

  const status = STATUS_MAP[statusKey];

  const formatDate = (date?: string | null) =>
    date ? new Date(date).toLocaleDateString("vi-VN") : "-";

  return (
    <tr className="hover:bg-gray-50 transition-colors border-b">
      {/* --- Tên khóa học --- */}
      <td className="px-3 py-2 text-sm align-middle">
        <Link
          to={`/course/teacher/courses/${course.id}`}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] text-gray-500 overflow-hidden group-hover:opacity-90 transition">
            {course.imageUrl ? (
              <img
                src={course.imageUrl}
                alt={course.name}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <span>Không có ảnh</span>
            )}
          </div>
          <div className="min-w-[8rem]">
            <div className="font-medium text-gray-900 group-hover:text-blue-600 transition line-clamp-1">
              {course.name}
            </div>
            {course.information && (
              <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                {course.information}
              </div>
            )}
          </div>
        </Link>
      </td>

      {/* --- Giảng viên --- */}
      <td className="px-3 py-2 text-sm align-middle">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            <span className="text-xs font-medium text-gray-600">
              {(course.updatedBy || course.createdBy || "")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
          </div>
          <span className="text-sm text-gray-800 truncate max-w-[8rem]">
            {course.updatedBy ?? course.createdBy ?? "-"}
          </span>
        </div>
      </td>

      {/* --- Chủ đề --- */}
      <td className="px-3 py-2 text-sm text-gray-800 align-middle">
        {course.subjectName || "-"}
      </td>

      {/* --- Khối lớp --- */}
      <td className="px-3 py-2 text-sm text-gray-800 align-middle">
        {typeof course.grade === "number" ? `Khối ${course.grade}` : "-"}
      </td>

      {/* --- Trạng thái --- */}
      <td className="px-3 py-2 text-sm align-middle">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </td>

      {/* --- Ngày tạo --- */}
      <td className="px-3 py-2 text-sm text-gray-700 align-middle">
        {formatDate(course.createdAt)}
      </td>

      {/* --- Ngày bắt đầu --- */}
      <td className="px-3 py-2 text-sm text-gray-700 align-middle">
        {formatDate(course.startAt)}
      </td>

      {/* --- Ngày kết thúc --- */}
      <td className="px-3 py-2 text-sm text-gray-700 align-middle">
        {formatDate(course.endAt)}
      </td>

      {/* --- Hành động --- */}
      <td className="px-3 py-2 text-center align-middle">
        <div className="flex items-center justify-center gap-1 text-gray-600">
          <Link
            to={`/course/teacher/courses/${course.id}`}
            title="Xem"
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <Eye className="w-4 h-4" />
          </Link>

          <Link
            to={`/course/teacher/edit-course/${course.id}`}
            title="Chỉnh sửa"
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <Edit className="w-4 h-4" />
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                title="Xóa"
                className="p-1.5 hover:bg-gray-100 rounded text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa khóa học{" "}
                  <span className="font-medium text-rose-600">
                    "{course.name}"
                  </span>
                  ?<br />
                  Hành động này <strong>không thể hoàn tác</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={async () => {
                    const ok = await deleteCourse?.(Number(course.id));
                    if (!ok) alert("Xóa khóa học thất bại.");
                  }}
                >
                  Xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
};

export default CourseItem;
