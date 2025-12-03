import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
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
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/common/components/ui/collapsible";
import { Button } from "@/common/components/ui/button";
import { Edit2, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/auth/stores/useAuthStore";

import { formatDateTime } from "@/courseManagement/utils/formatDate";

const CourseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const courseId = Number(id || 0);

  const selectedCourse = useCourseStore(
    (s) => s.selectedCourse as CourseListDto
  );
  const fetchCourseById = useCourseStore((s) => s.fetchCourseById);

  const authUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (courseId) {
      fetchCourseById(courseId);
    }
  }, [fetchCourseById, courseId]);

  // Only the course owner (creator) may edit the course. Use auth user id.
  const isOwner = Boolean(
    authUser?.id &&
      selectedCourse?.createdBy &&
      String(authUser.id) === String(selectedCourse.createdBy)
  );

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-6 h-full flex flex-col">
      {/* === Breadcrumb === */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="w-8 h-8 mb-4 p-0 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4 text-[#525252]" />
        </Button>
        <div className="text-sm text-[#525252] mb-3">
          Khóa học / Chi tiết khóa học
        </div>
      </div>

      {/* === Course Header === */}
      <div className="flex items-center justify-between bg-white border rounded p-4 mb-4">
        <div className="flex items-center gap-4 mr-4">
          {/* === Course Image === */}
          {selectedCourse?.imageUrl ? (
            <img
              src={selectedCourse.imageUrl}
              alt="Course image"
              className="w-24 h-24 mr-4 object-cover float-left rounded-md"
            />
          ) : (
            <div className="w-24 h-24 mr-4 flex items-center float-left justify-center text-center text-sm rounded-md text-gray-500 bg-gray-200">
              Không có hình ảnh
            </div>
          )}

          {/* === Course Info === */}
          <div>
            <div className="text-lg font-medium">
              {selectedCourse?.name ?? "Course"}
            </div>
            <div className="text-sm text-[#737373] mt-1 line-clamp-3">
              {selectedCourse?.information ?? ""}
            </div>
          </div>
        </div>

        {/* === Buttons === */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() =>
              isOwner && navigate(`/course/teacher/edit-course/${courseId}`)
            }
            disabled={!isOwner}
            aria-disabled={!isOwner}
          >
            <Edit2 className="mr-2" /> Chỉnh sửa
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
                      <Collapsible key={ch.id ?? idx} defaultOpen>
                        <div className="border rounded p-3 bg-gray-50">
                          <CollapsibleTrigger className="w-full text-left font-semibold flex items-center justify-between">
                            <span>{ch.name}</span>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="mt-2">
                            {ch.lessons?.length ? (
                              <div className="space-y-2">
                                {ch.lessons.map(
                                  (l: LessonListDto, liIdx: number) => (
                                    <Button
                                      key={l.id ?? liIdx}
                                      variant="ghost"
                                      onClick={() =>
                                        navigate(
                                          `/course/teacher/lecture/${l.id}`
                                        )
                                      }
                                      className="w-full text-left p-2 rounded-lg flex items-start justify-between"
                                    >
                                      <div>
                                        <div className="font-medium text-[#171717] hover:text-blue-500 transition-colors">
                                          {l.name}
                                        </div>
                                      </div>

                                      {l.isPreview && (
                                        <span className="text-xs px-2 py-1 border rounded text-gray-700 bg-white">
                                          Preview
                                        </span>
                                      )}
                                    </Button>
                                  )
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                Chưa có bài học nào trong chương này.
                              </div>
                            )}
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
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
                    <span>{selectedCourse?.subject?.name ?? "-"}</span>
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
                <CardTitle>Giáo viên</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#171717] text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                    {(() => {
                      const name = selectedCourse?.teacherCreatedName || "GV";

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
                        Giáo viên:
                      </span>
                      <span>
                        {selectedCourse?.teacherCreatedName || "GV - Chính"}
                      </span>
                    </div>
                    {selectedCourse?.teacherUpdatedName && (
                      <>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-[#171717]">
                            Cập nhật bởi:
                          </span>
                          <span>
                            {selectedCourse?.teacherUpdatedName ||
                              "GV - Cập nhật"}
                          </span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-[#171717]">
                            Cập nhật ngày:
                          </span>
                          <span>
                            {formatDateTime(selectedCourse.updatedAt)}
                          </span>
                        </div>
                      </>
                    )}
                    {selectedCourse?.createdAt && (
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-[#171717]">
                          Tạo ngày:
                        </span>
                        <span>{formatDateTime(selectedCourse.createdAt)}</span>
                      </div>
                    )}
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
