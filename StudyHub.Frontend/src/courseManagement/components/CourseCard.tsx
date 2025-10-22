import React from "react";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { Button } from "@/common/components/ui/button";
import { Link } from "react-router-dom";
import type { CourseListDto as Course } from "@/courseManagement/interfaces/types";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";

const CourseCard: React.FC<{ course: Course; categoryLabel?: string }> = ({
  course,
  categoryLabel,
}) => {
  const selectCourse = useCourseStore((s: any) => s.selectCourse);
  const selectedCourseId = useCourseStore((s: any) => s.selectedCourseId);
  const isSelected = selectedCourseId === course.id;
  const currentUser = useAppUserStore((s: any) => s.appUser);
  const enrollAction = useEnrollmentStore((s: any) => s.enroll);
  const fetchProgresses = useEnrollmentStore((s: any) => s.fetchProgresses);
  return (
    <div
      onClick={() => selectCourse && selectCourse(course.id)}
      className={`bg-white rounded-md shadow-sm overflow-hidden cursor-pointer transition-shadow ${
        isSelected ? "ring-2 ring-black" : ""
      }`}
    >
      <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt={course.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // fallback nếu ảnh lỗi
              e.currentTarget.src =
                "https://placehold.co/600x400?text=No+Image";
            }}
          />
        ) : (
          <div className="text-gray-400 text-sm">Không có hình ảnh</div>
        )}
      </div>
      <div className="p-4">
        <div className="inline-block bg-gray-100 text-xs text-gray-600 px-2 py-1 rounded mb-2">
          {categoryLabel ?? ((course as any).category as string) ?? "Unknown"}
        </div>
        <h3 className="text-sm font-medium text-[#171717]">
          <Link to={`/student/course/${course.id}`}>{course.name}</Link>
        </h3>
        {course.information && (
          <p className="text-sm text-[#737373] mt-2">{course.information}</p>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden text-xs">
              {(course.instructorName || "")
                .split(" ")
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="text-xs text-gray-600">{course.instructorName}</div>
          </div>
          <div className="text-xs text-gray-600">
            {(course as any).duration}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex gap-3">
            <Link
              to={`/course/student/courses/${course.id}`}
              className="flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200 rounded-lg py-2"
              >
                Xem chi tiết
              </Button>
            </Link>
            <Button
              className="flex-[1.5] bg-black text-white hover:bg-gray-900 transition-colors duration-200 rounded-lg py-2 shadow-md"
              onClick={async (e) => {
                e.stopPropagation();
                if (!currentUser) {
                  alert("Vui lòng đăng nhập");
                  return;
                }
                try {
                  const created = await enrollAction({
                    appUserId: String(currentUser.id),
                    courseId: course.id,
                  });
                  if (created?.id) {
                    try {
                      await fetchProgresses(created.id);
                    } catch {
                      // ignore
                    }
                  }
                } catch (err) {
                  // ignore
                }
              }}
            >
              Đăng ký ngay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
