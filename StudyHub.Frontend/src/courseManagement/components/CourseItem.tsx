import React, { useEffect, useState } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import type {
  CourseListDto as Course,
  CourseStatus,
} from "@/courseManagement/interfaces/types";
import { documentService } from "@/documentManagement/services/documentService";
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

export type Status = CourseStatus;

type Props = {
  course: Course;
};

const statusColor: Partial<Record<Status, string>> = {
  Open: "bg-emerald-100 text-emerald-800",
  Closed: "bg-rose-100 text-rose-800",
  Draft: "bg-yellow-100 text-yellow-800",
};

const CourseItem: React.FC<Props> = ({ course }) => {
  const deleteCourse = useCourseStore((s) => s.deleteCourse);
  const [subjectList, setSubjectList] = useState<
    { id: number; name: string }[]
  >([]);

  const fetchSubjects = async () => {
    const res = await documentService.getSubjects();
    if (Array.isArray(res)) {
      setSubjectList(res.map((s: any) => ({ id: s.id, name: s.name })));
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const statusLabel: Status =
    course.status === "Open"
      ? "Open"
      : course.status === "Closed"
      ? "Closed"
      : "Draft";

  const formatDate = (date?: string | null) =>
    date ? new Date(date).toLocaleDateString("vi-VN") : "-";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* --- Khóa học --- */}s{" "}
      <td className="px-6 py-4 text-sm text-left align-middle">
        <Link
          to={`/course/teacher/courses/${course.id}`}
          className="flex items-center gap-4 group"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0 text-xs text-gray-500 overflow-hidden group-hover:opacity-90 transition">
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
          <div className="min-w-[10rem]">
            <div className="text-sm font-medium text-[#171717] group-hover:text-blue-600 transition">
              {course.name}
            </div>
            {course.information && (
              <div className="text-xs text-[#737373] mt-0.5 line-clamp-2">
                {course.information}
              </div>
            )}
          </div>
        </Link>
      </td>
      {/* --- Giảng viên --- */}
      <td className="px-6 py-4 text-sm text-left align-middle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            <span className="text-sm text-[#525252]">
              {(course.updatedBy || course.createdBy || "")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
          </div>
          <span className="text-sm text-[#171717]">
            {course.updatedBy ?? course.createdBy ?? "-"}
          </span>
        </div>
      </td>
      {/* --- Chủ đề --- */}
      <td className="px-6 py-4 text-sm text-left align-middle">
        {course.subjectId
          ? `Môn ${subjectList.find((s) => s.id === course.subjectId)?.name}`
          : "-"}
      </td>
      {/* --- Khối lớp --- */}
      <td className="px-6 py-4 text-sm text-left align-middle">
        {typeof course.grade === "number" ? `Khối ${course.grade}` : "-"}
      </td>
      {/* --- Trường --- */}
      <td className="px-6 py-4 text-sm text-left align-middle">
        {course.schoolId ? `Trường ${course.schoolId}` : "-"}
      </td>
      {/* --- Trạng thái --- */}
      <td className="px-6 py-4 text-sm text-left align-middle">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-normal ${
            statusColor[statusLabel] ?? "bg-gray-100 text-gray-800"
          }`}
        >
          {statusLabel}
        </span>
      </td>
      {/* --- Ngày tạo --- */}
      <td className="px-6 py-4 text-sm text-left align-middle">
        {formatDate(course.createdAt)}
      </td>
      {/* --- Ngày bắt đầu --- */}
      <td className="px-6 py-4 text-sm text-left align-middle">
        {formatDate(course.startAt)}
      </td>
      {/* --- Ngày kết thúc --- */}
      <td className="px-6 py-4 text-sm text-left align-middle">
        {formatDate(course.endAt)}
      </td>
      {/* --- Hành động --- */}
      <td className="w-36 px-6 py-4 text-center text-sm align-middle">
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Link
            to={`/course/teacher/courses/${course.id}`}
            title="Xem"
            className="p-2 hover:bg-gray-100 rounded"
          >
            <Eye className="w-4 h-4" />
          </Link>

          <Link
            to={`/course/teacher/edit-course/${course.id}`}
            title="Chỉnh sửa"
            className="p-2 hover:bg-gray-100 rounded"
          >
            <Edit className="w-4 h-4" />
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                title="Xóa"
                className="p-2 hover:bg-gray-100 rounded text-rose-600"
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
                  ?
                  <br />
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
