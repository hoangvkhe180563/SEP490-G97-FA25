import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
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

const CourseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const courseId = Number(id || 0);

  const selectedCourse = useCourseStore(
    (s) => s.selectedCourse as CourseListDto | undefined
  );
  const fetchCourseById = useCourseStore((s) => s.fetchCourseById);

  const fetchChapters = useLectureStore((s) => s.fetchChapters);
  const chaptersFromStore = useLectureStore((s) => s.chapters);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const filterAppUsers = useAppUserStore((s) => s.filterAppUsers);

  // === Load subjects for category label ===
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { documentService } = await import(
          "@/documentManagement/services/documentService"
        );
        const res = await documentService.getSubjects();
        if (mounted && Array.isArray(res)) {
          setSubjects(res.map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const categoryLabel = (id?: number | null) => {
    if (id === undefined || id === null) return "-";
    const found = subjects.find((s) => s.id === Number(id));
    return found ? found.name : String(id);
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseById(courseId);
      fetchChapters(courseId);
      (async () => {
        try {
          const r = await filterAppUsers("role=Teacher&page=1&limit=200");
          setTeachers(r?.users ?? []);
        } catch (err) {
          // ignore
        }
      })();
    }
  }, [courseId, fetchCourseById, fetchChapters, filterAppUsers]);

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        {/* === Breadcrumb + back button === */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/course/teacher/courses")}
            className="w-8 h-8 mb-4 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 text-[#525252]" />
          </button>
          <div className="text-sm text-[#525252] mb-3">
            Khóa học / Chi tiết khóa học
          </div>
        </div>

        {/* === Course Header === */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
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
                  onClick={() =>
                    navigate(`/course/teacher/edit-course/${courseId}`)
                  }
                >
                  <Edit2 className="mr-2" /> Chỉnh sửa khóa học
                </Button>
                <Button
                  onClick={() =>
                    navigate(`/course/teacher/preview/${courseId}`)
                  }
                >
                  Xem trước
                </Button>
              </div>
            </div>

            {/* === Course Overview === */}
            <div className="grid grid-cols-12 gap-4">
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
                      {(chaptersFromStore && chaptersFromStore.length > 0) ||
                      (selectedCourse?.chapters &&
                        selectedCourse.chapters.length > 0) ? (
                        (chaptersFromStore && chaptersFromStore.length > 0
                          ? chaptersFromStore
                          : selectedCourse?.chapters ?? []
                        ).map((ch: ChapterListDto, idx: number) => (
                          <details
                            className="border rounded p-3"
                            key={ch.id ?? idx}
                          >
                            <summary className="cursor-pointer font-medium">
                              {ch.name}
                            </summary>
                            <div className="mt-2">
                              <ul className="list-disc pl-5 text-sm">
                                {ch.lessons?.map(
                                  (l: LessonListDto, liIdx: number) => (
                                    <li key={l.id ?? liIdx} className="py-1">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-medium">
                                            {l.name}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {l.type ?? ""}
                                            {l.videoUrl ? " • Video" : ""}
                                            {l.readingContent
                                              ? " • Reading"
                                              : ""}
                                          </div>
                                        </div>
                                        {l.isPreview && (
                                          <span className="text-xs px-2 py-1 border rounded">
                                            Preview
                                          </span>
                                        )}
                                      </div>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          </details>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">
                          Không có chương trình học nào.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* === Right Sidebar === */}
              <aside className="col-span-12 lg:col-span-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trạng thái khóa học</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-[#404040] space-y-1">
                        <div className="flex justify-between">
                          <span>Trạng thái</span>
                          <span>
                            {selectedCourse?.status ? "Đã xuất bản" : "Nháp"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Giá</span>
                          <span>
                            {selectedCourse?.price
                              ? `${selectedCourse.price}`
                              : "Miễn phí"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Chủ đề</span>
                          <span>{categoryLabel(selectedCourse?.category)}</span>
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
                        {/* Avatar giảng viên */}
                        <div className="w-12 h-12 rounded-full bg-[#171717] text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                          {(() => {
                            const teacher = teachers.find(
                              (t) =>
                                String(t.id) ===
                                String(selectedCourse?.instructorName)
                            );
                            const name =
                              teacher?.fullname ||
                              selectedCourse?.instructorName ||
                              "GV";
                            return name
                              .split(" ")
                              .slice(-2)
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase();
                          })()}
                        </div>

                        {/* Thông tin chi tiết */}
                        <div className="flex-1 text-sm text-[#404040]">
                          {/* Giảng viên chính */}
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-[#171717]">
                              Giảng viên:
                            </span>
                            <span>
                              {
                                teachers.find(
                                  (t) =>
                                    String(t.id) ===
                                    String(selectedCourse?.instructorName)
                                )?.fullname
                              }
                            </span>
                          </div>

                          {/* Người cập nhật */}
                          {selectedCourse?.updatedAt && (
                            <>
                              <div className="flex justify-between mb-1">
                                <span className="font-medium text-[#171717]">
                                  Cập nhật bởi:
                                </span>
                                <span>
                                  {
                                    teachers.find(
                                      (t) =>
                                        String(t.id) ===
                                        String(selectedCourse?.updatedBy)
                                    )?.fullname
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="font-medium text-[#171717]">
                                  Cập nhật ngày:
                                </span>
                                <span>
                                  {new Date(
                                    selectedCourse.updatedAt
                                  ).toLocaleString("vi-VN", {
                                    hour12: false,
                                  })}
                                </span>
                              </div>
                            </>
                          )}

                          {/* Ngày tạo */}
                          {selectedCourse?.createdAt && (
                            <div className="flex justify-between mb-1">
                              <span className="font-medium text-[#171717]">
                                Tạo ngày:
                              </span>
                              <span>
                                {new Date(
                                  selectedCourse.createdAt
                                ).toLocaleString("vi-VN", {
                                  hour12: false,
                                })}
                              </span>
                            </div>
                          )}

                          {/* Nút hành động */}
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
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
