import React, { useEffect } from "react";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { Button } from "@/common/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import type { CourseListDto as Course } from "@/courseManagement/interfaces/types";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";
import { CalendarDays } from "lucide-react";

// module-level cache to avoid repeated fetches when many CourseCard components mount
const _enrollFetchRequested = new Set<string>();

const CourseCard: React.FC<{ course: Course; categoryLabel?: string }> = ({
  course,
  categoryLabel,
}) => {
  const navigate = useNavigate();
  const selectCourse = useCourseStore((s: any) => s.selectCourse);
  const selectedCourseId = useCourseStore((s: any) => s.selectedCourseId);
  const isSelected = selectedCourseId === course.id;
  const currentUser = useAppUserStore((s: any) => s.appUser);
  const enrollAction = useEnrollmentStore((s: any) => s.enroll);
  const fetchProgresses = useEnrollmentStore((s: any) => s.fetchProgresses);
  const fetchEnrollmentsByUser = useEnrollmentStore((s: any) => s.fetchByUser);
  const enrollment = useEnrollmentStore((s) =>
    s.getEnrollmentForCourse(course.id)
  );

  const enrollmentsLoaded = useEnrollmentStore((s: any) =>
    Array.isArray(s.enrollments) ? s.enrollments.length > 0 : false
  );

  useEffect(() => {
    if (!currentUser?.id) return;
    const userId = String(currentUser.id);
    if (enrollment) return;
    if (enrollmentsLoaded) return;

    (async () => {
      try {
        await fetchEnrollmentsByUser(userId);
      } catch {
        // ignore
      }
    })();
  }, [
    fetchEnrollmentsByUser,
    currentUser?.id,
    enrollment,
    course.id,
    enrollmentsLoaded,
  ]);

  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    try {
      const date = new Date(d);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return String(d);
    }
  };

  const priceLabel = (() => {
    if (!course.price || course.price === 0) return "Miễn phí";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(course.price);
  })();

  return (
    <article
      onClick={() => {
        if (selectCourse) selectCourse(course.id);
        try {
          navigate(`/course/student/courses/${course.id}`);
        } catch {
          /* ignore */
        }
      }}
      className={`group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 ${
        isSelected ? "ring-2 ring-black" : ""
      }`}
    >
      {/* Ảnh */}
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) =>
              (e.currentTarget.src =
                "https://placehold.co/600x400?text=No+Image")
            }
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">
            Không có hình ảnh
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="absolute left-4 bottom-3 text-white">
          <div className="text-lg font-semibold leading-snug line-clamp-1 drop-shadow">
            {course.name}
          </div>
          <div className="text-sm text-gray-200 leading-tight">
            {categoryLabel ?? (course as any).subjectName ?? ""}
          </div>
        </div>
      </div>

      {/* Nội dung */}
      <div className="p-5 flex flex-col gap-4">
        {/* Mô tả */}
        <p className="text-gray-700 text-sm leading-relaxed line-clamp-2 min-h-[44px]">
          {course.information ?? "Không có mô tả"}
        </p>

        {/* Giảng viên + ngày + giá */}
        <div className="flex flex-col gap-2 pl-12 relative">
          {/* Avatar nhỏ */}
          <div className="absolute left-0 top-0 w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
            {((course as any).createdBy || "")
              .split(" ")
              .map((n: string) => n[0])
              .slice(0, 2)
              .join("") || "G"}
          </div>
          {/* Thông tin giảng viên */}
          <div>
            <div className="text-xs text-gray-500">Giảng viên</div>
            <div className="text-sm font-medium text-gray-900 truncate">
              {(course as any).createdBy ?? "Giáo viên"}
            </div>
          </div>
          {/* Ngày học */}
          <div className="flex items-center text-sm text-gray-600">
            <CalendarDays className="w-4 h-4 mr-1 text-gray-500" />
            <span>
              {formatDate((course as any).startAt)} —{" "}
              {formatDate((course as any).endAt)}
            </span>
          </div>
          {/* Giá tiền */}
          <div className="flex items-center justify-between mt-2 px-1">
            {/* Grade tag */}
            {course.grade ? (
              <span className="text-sm px-3 py-1 rounded-full bg-sky-100 text-sky-600 font-semibold shadow-sm">
                Khối {course.grade}
              </span>
            ) : (
              <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-medium shadow-sm">
                Không xác định
              </span>
            )}

            {/* Giá tiền */}
            <div className="font-bold text-lg text-sky-700 tracking-wide">
              {priceLabel}
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex gap-3 pt-2">
          <Link
            to={`/course/student/courses/${course.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1"
          >
            <Button
              variant="outline"
              className="w-full rounded-lg py-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all text-sm"
            >
              Xem chi tiết
            </Button>
          </Link>

          {enrollment ? (
            <Button
              className="flex-[1.1] bg-sky-600 text-white hover:bg-sky-700 rounded-lg py-2 text-sm shadow-md transition-all"
              onClick={(e) => {
                e.stopPropagation();
                if (selectCourse) selectCourse(course.id);
                try {
                  navigate(`/course/student/courses/${course.id}`);
                } catch {
                  /* ignore */
                }
              }}
            >
              Vào học
            </Button>
          ) : (
            <Button
              className="flex-[1.1] bg-black text-white hover:bg-gray-900 rounded-lg py-2 text-sm shadow-md transition-all"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  if (!currentUser?.id) return;
                  const created = await enrollAction({
                    appUserId: String(currentUser.id),
                    courseId: course.id,
                  });
                  if (created?.id) {
                    useEnrollmentStore.setState((s) => ({
                      enrollments: [...(s.enrollments || []), created],
                    }));
                    await fetchProgresses(created.id);
                    if (selectCourse) selectCourse(course.id);
                    navigate(`/course/student/courses/${course.id}`);
                  }
                } catch {
                  /* ignore */
                }
              }}
            >
              Đăng ký
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

export default CourseCard;
