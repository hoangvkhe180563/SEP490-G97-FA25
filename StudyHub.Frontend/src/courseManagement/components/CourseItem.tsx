import React, { useState } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
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
import { Button } from "@/common/components/ui/button";
import { formatISO } from "date-fns";
import { AppDialog } from "@/courseManagement/components/AppDialog";
import type { DialogProps } from "@/courseManagement/components/AppDialog";

type Props = {
  course: Course;
};

const STATUS_MAP: Record<CourseStatus, { label: string; className: string }> = {
  Open: { label: "Mở", className: "bg-green-100 text-green-800" },
  Closed: { label: "Đóng", className: "bg-red-100 text-red-800" },
  Draft: { label: "Nháp", className: "bg-yellow-100 text-yellow-800" },
  Requested: { label: "Đợi duyệt", className: "bg-blue-100 text-blue-800" },
  Edited: {
    label: "Chỉnh sửa",
    className: "bg-purple-100 text-purple-800",
  },
};

const CourseItem: React.FC<Props> = ({ course }) => {
  const deleteCourse = useCourseStore((s) => s.deleteCourse);
  const updateCourse = useCourseStore((s) => s.updateCourse);
  const fetchCourseById = useCourseStore((s) => s.fetchCourseById);
  const authUser = useAuthStore((s) => s.user);
  const [requestedSent, setRequestedSent] = useState(false);
  const [dialog, setDialog] = useState<DialogProps>({
    open: false,
    title: "",
    message: "",
  });

  const courseCreator = (course as any).createdBy ?? "";
  const isOwner = (() => {
    try {
      if (!courseCreator) return false;
      if (authUser?.id && String(authUser?.id) === String(courseCreator))
        return true;
      return false;
    } catch {
      return false;
    }
  })();

  const statusKey =
    course.status === "Mở" && course.isApproved
      ? "Open"
      : course.status === "Mở" && !course.isApproved
      ? "Requested"
      : course.status === "Đóng" && course.isApproved
      ? "Closed"
      : course.status === "Chỉnh sửa"
      ? "Edited"
      : "Draft";

  const status = STATUS_MAP[statusKey];

  const handleDeleteOrClose = async () => {
    try {
      if (course.status === "Nháp") {
        const ok = await deleteCourse?.(Number(course.id));
        if (!ok) alert("Xóa khóa học thất bại.");
      } else if (course.status === "Mở") {
        await fetchCourseById(Number(course.id));
        const selected = useCourseStore.getState().selectedCourse;
        if (!selected) {
          alert("Không tìm thấy khóa học để cập nhật.");
          return;
        }

        const dto: any = {
          ...selected,
          // ensure updatedAt/updatedBy are set
          updatedAt: formatISO(new Date()),
          updatedBy: authUser?.id ?? selected.updatedBy,
          // close the course
          status: "Đóng",
          isApproved: selected.isApproved,
        };

        await updateCourse(Number(course.id), dto);

        alert("Khóa học đã được chuyển sang trạng thái 'Đóng'.");
      }
    } catch (err) {
      console.error("Xóa hoặc cập nhật thất bại:", err);
      alert("Thao tác thất bại!");
    }
  };

  return (
    <>
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
            <div className="max-w-[15rem]">
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

        <td className="px-3 py-2 text-sm align-middle">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              <span className="text-xs font-medium text-gray-600">
                {(course.teacherUpdatedName || course.teacherCreatedName || "")
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
            </div>
            <span className="text-sm text-gray-800 truncate max-w-[8rem]">
              {course.teacherUpdatedName || course.teacherCreatedName || ""}
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
          {course.createdAt}
        </td>

        {/* --- Ngày bắt đầu --- */}
        <td className="px-3 py-2 text-sm text-gray-700 align-middle">
          {course.startAt}
        </td>

        {/* --- Ngày kết thúc --- */}
        <td className="px-3 py-2 text-sm text-gray-700 align-middle">
          {course.endAt}
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

            {isOwner &&
              !(
                (course as any).status === "Mở" &&
                (course as any).isApproved === false
              ) &&
              !((course as any).status === "Chỉnh sửa") &&
              ((course as any).status === "Mở" &&
              (course as any).isApproved === true &&
              !requestedSent ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="p-1.5 hover:bg-sky-400 rounded"
                      title="Gửi yêu cầu chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Gửi yêu cầu chỉnh sửa</AlertDialogTitle>
                      <AlertDialogDescription>
                        Khóa học đang ở trạng thái "Mở". Bạn có muốn gửi yêu cầu
                        chỉnh sửa tới trưởng bộ môn không? Sau khi gửi, khóa học
                        sẽ được đánh dấu là{" "}
                        <strong> "Yêu cầu chỉnh sửa" </strong> và biểu tượng
                        chỉnh sửa sẽ bị ẩn.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={async () => {
                          try {
                            // Fetch full course to ensure required fields are present
                            await fetchCourseById(Number(course.id));
                            const selected =
                              useCourseStore.getState().selectedCourse;
                            if (!selected) {
                              setDialog({
                                open: true,
                                title: "Lỗi",
                                message:
                                  "Không tìm thấy khóa học. Vui lòng thử lại.",
                                showCancel: false,
                              });
                              return;
                            }

                            const dto: any = {
                              ...selected,
                              status: "Chỉnh sửa",
                              updatedAt: formatISO(new Date()),
                              updatedBy: authUser?.id ?? selected.updatedBy,
                              isApproved: false,
                            };

                            await updateCourse(Number(course.id), dto);
                            setRequestedSent(true);
                            setDialog({
                              open: true,
                              title: "Yêu cầu đã gửi",
                              message: "Yêu cầu chỉnh sửa đã được gửi.",
                              showCancel: false,
                            });
                          } catch (err) {
                            console.error("Gửi yêu cầu thất bại:", err);
                            setDialog({
                              open: true,
                              title: "Lỗi",
                              message:
                                "Gửi yêu cầu thất bại! Vui lòng thử lại.",
                              showCancel: false,
                            });
                          }
                        }}
                      >
                        Gửi yêu cầu
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Link
                  to={`/course/teacher/edit-course/${course.id}`}
                  title="Chỉnh sửa"
                  className="p-1.5 hover:bg-gray-100 rounded"
                >
                  <Edit className="w-4 h-4" />
                </Link>
              ))}

            {course.status !== "Đóng" &&
              isOwner &&
              !(
                (course as any).status === "Mở" &&
                (course as any).isApproved === false
              ) && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`p-1.5 rounded ${
                        course.status === "Mở"
                          ? "text-amber-600"
                          : "text-rose-600"
                      }`}
                      title={course.status === "Mở" ? "Đóng khóa học" : "Xóa"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {course.status === "Mở"
                          ? "Đóng khóa học"
                          : "Xác nhận xóa"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {course.status === "Mở" ? (
                          <>
                            Khóa học{" "}
                            <span className="font-medium text-amber-600">
                              "{course.name}"
                            </span>{" "}
                            hiện đang mở. Bạn có muốn{" "}
                            <b>chuyển sang trạng thái "Đóng"</b> không?
                          </>
                        ) : (
                          <>
                            Bạn có chắc chắn muốn xóa khóa học{" "}
                            <span className="font-medium text-rose-600">
                              "{course.name}"
                            </span>
                            ?<br />
                            Hành động này <strong>không thể hoàn tác</strong>.
                          </>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        className={`${
                          course.status === "Mở"
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-rose-600 hover:bg-rose-700"
                        } text-white`}
                        onClick={handleDeleteOrClose}
                      >
                        {course.status === "Mở" ? "Đóng khóa học" : "Xóa"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
          </div>
        </td>
      </tr>
      <AppDialog dialog={dialog} setDialog={setDialog} />
    </>
  );
};

export default CourseItem;
