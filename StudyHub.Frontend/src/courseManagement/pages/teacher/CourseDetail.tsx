import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import type {
  ChapterListDto,
  LessonListDto,
  CourseListDto,
} from "@/courseManagement/types/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Edit2, ArrowLeft } from "lucide-react";
import { documentService } from "@/documentManagement/services/documentService";
import type { AppUser } from "@/auth/interfaces/app-user";

const CourseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const courseId = Number(id || 0);

  const selectedCourse = useCourseStore(
    (s) => s.selectedCourse as CourseListDto
  );
  const fetchCourseById = useCourseStore((s) => s.fetchCourseById);

  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [teacherCreated, setTeacherCreated] = useState<Partial<AppUser> | null>(
    null
  );
  const [teacherUpdated, setTeacherUpdated] = useState<Partial<AppUser> | null>(
    null
  );
  const getAppUserById = useAppUserStore((s) => s.getAppUserById);

  // === Load subjects ===
  useEffect(() => {
    (async () => {
      const res = await documentService.getSubjects();
      if (Array.isArray(res)) {
        setSubjects(res.map((s: any) => ({ id: s.id, name: s.name })));
      }
    })();
    if (courseId) {
      fetchCourseById(courseId);
    }
  }, [fetchCourseById, courseId]);

  // when selectedCourse is loaded, fetch creator/updater info
  useEffect(() => {
    if (!selectedCourse) return;
    if (selectedCourse.createdBy) {
      getAppUserById(selectedCourse.createdBy).then((res) => {
        if (res?.success && res.data) setTeacherCreated(res.data);
      });
    }
    if (selectedCourse.updatedBy) {
      getAppUserById(selectedCourse.updatedBy).then((res) => {
        if (res?.success && res.data) setTeacherUpdated(res.data);
      });
    }
  }, [selectedCourse, getAppUserById]);

  const categoryLabel = (id?: number | null) => {
    if (id === undefined || id === null) return "-";
    const found = subjects.find((s) => s.id === Number(id));
    return found ? found.name : String(id);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-6 h-full flex flex-col">
      {/* === Breadcrumb === */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 mb-4 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 text-[#525252]" />
        </button>
        <div className="text-sm text-[#525252] mb-3">
          Khóa học / Chi tiết khóa học
        </div>
      </div>

      {/* === Course Header === */}
      <div className="flex items-center justify-between bg-white border rounded p-4 mb-4">
        <div className="flex items-center gap-4">
          {/* === Course Image === */}
          <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden">
            {selectedCourse?.imageUrl ? (
              <img
                src={selectedCourse.imageUrl}
                alt="Course image"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                Không có hình ảnh
              </div>
            )}
          </div>

          {/* === Course Info === */}
          <div>
            <div className="text-lg font-medium">
              {selectedCourse?.name ?? "Course"}
            </div>
            <div className="text-sm text-[#737373] mt-1">
              {selectedCourse?.information ?? ""}
            </div>
          </div>
        </div>

        {/* === Buttons === */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/course/teacher/edit-course/${courseId}`)}
          >
            <Edit2 className="mr-2" /> Chỉnh sửa
          </Button>
          <Button
            onClick={() => navigate(`/course/teacher/preview/${courseId}`)}
          >
            Xem trước
          </Button>
        </div>
      </div>

      {/* === Course Overview === */}
      <div className="grid grid-cols-12 gap-4 overflow-y-auto flex-1 scrollbar-hide">
        <div className="col-span-12 lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Mô tả khóa học</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#404040]">
                {selectedCourse?.information ?? ""}
              </p>
            </CardContent>
          </Card>

          {/* === Curriculum === */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Chương trình học</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedCourse?.chapters?.length ? (
                  selectedCourse.chapters.map(
                    (ch: ChapterListDto, idx: number) => (
                      <details
                        key={ch.id ?? idx}
                        className="border rounded p-3 bg-gray-50"
                        open
                      >
                        <summary className="cursor-pointer font-semibold">
                          {ch.name}
                        </summary>
                        <div className="mt-2">
                          {ch.lessons?.length ? (
                            <ul className="list-disc pl-5 text-sm">
                              {ch.lessons.map(
                                (l: LessonListDto, liIdx: number) => (
                                  <li
                                    key={l.id ?? liIdx}
                                    className="py-1 cursor-pointer group"
                                    onClick={() =>
                                      navigate(
                                        `/course/teacher/lecture/${l.id}`
                                      )
                                    }
                                  >
                                    <div className="flex items-start justify-between transition-colors group-hover:bg-gray-50 p-2 rounded-lg">
                                      <div>
                                        <div className="font-medium text-[#171717] group-hover:text-[#2563EB] transition-colors">
                                          {l.name}
                                        </div>
                                        {l.description && (
                                          <p className="text-xs text-gray-600 mt-1">
                                            {l.description}
                                          </p>
                                        )}
                                      </div>

                                      {l.isPreview && (
                                        <span className="text-xs px-2 py-1 border rounded text-gray-700 bg-white">
                                          Preview
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                )
                              )}
                            </ul>
                          ) : (
                            <div className="text-sm text-gray-500">
                              Chưa có bài học nào trong chương này.
                            </div>
                          )}
                        </div>
                      </details>
                    )
                  )
                ) : (
                  <div className="text-sm text-gray-500">
                    Không có chương trình học nào.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* === Sidebar === */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin khóa học</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-[#404040] space-y-1">
                  <div className="flex justify-between">
                    <span>Trạng thái</span>
                    <span>{selectedCourse?.status ?? "Không xác định"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Giá</span>
                    <span>
                      {selectedCourse?.price
                        ? `${selectedCourse.price.toLocaleString()}₫`
                        : "Miễn phí"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Môn học</span>
                    <span>{categoryLabel(selectedCourse?.subjectId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Khối lớp</span>
                    <span>{selectedCourse?.grade ?? "-"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Giảng viên</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#171717] text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                    {(() => {
                      const name = teacherCreated?.fullname || "GV";

                      return name
                        .split(" ")
                        .slice(-2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase();
                    })()}
                  </div>
                  <div className="flex-1 text-sm text-[#404040]">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-[#171717]">
                        Giảng viên:
                      </span>
                      <span>{teacherCreated?.fullname || "GV - Chính"}</span>
                    </div>
                    {teacherUpdated?.fullname && (
                      <>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-[#171717]">
                            Cập nhật bởi:
                          </span>
                          <span>
                            {teacherUpdated?.fullname || "GV - Cập nhật"}
                          </span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-[#171717]">
                            Cập nhật ngày:
                          </span>
                          <span>
                            {new Date(
                              selectedCourse.updatedAt || ""
                            ).toLocaleString("vi-VN", {
                              hour12: false,
                            })}
                          </span>
                        </div>
                      </>
                    )}
                    {selectedCourse?.createdAt && (
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-[#171717]">
                          Tạo ngày:
                        </span>
                        <span>
                          {new Date(selectedCourse.createdAt).toLocaleString(
                            "vi-VN",
                            {
                              hour12: false,
                            }
                          )}
                        </span>
                      </div>
                    )}
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        className="w-1/2 border-[#D1D5DB] hover:bg-gray-100 text-[#171717]"
                      >
                        Xem hồ sơ
                      </Button>
                      <Button className="w-1/2 bg-[#171717] hover:bg-[#2D2D2D] text-white">
                        Nhắn tin
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CourseDetail;
