import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { documentService } from "@/documentManagement/services/documentService";
import { Button } from "@/common/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/common/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { ArrowLeft, File } from "lucide-react";
import type { AppUser } from "@/auth/interfaces/app-user";
import type { CourseListDto } from "@/courseManagement/types/api";

const LectureDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const lessonId = Number(id || 0);

  const selectedCourse = useCourseStore(
    (s) => s.selectedCourse as CourseListDto
  );
  const [teacherCreated, setTeacherCreated] = useState<Partial<AppUser> | null>(
    null
  );
  const [resources, setResources] = useState<{ id: number; url: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [interactiveQuestions, setInteractiveQuestions] = useState<any[]>([]);

  const getAppUserById = useAppUserStore((s) => s.getAppUserById);
  const getLessonById = useLectureStore((s) => s.fetchLesson);
  const getChapterById = useLectureStore((s) => s.fetchChapter);
  const fetchInteractiveQuestions = useLectureStore(
    (s: any) => s.fetchInteractiveQuestions
  );
  const getLessonResource = useCourseStore((s) => s.getLessonResource);
  const fetchCourseById = useCourseStore((s) => s.fetchCourseById);

  useEffect(() => {
    (async () => {
      if (!lessonId) return;

      try {
        const subs = await documentService.getSubjects();
        if (Array.isArray(subs))
          setSubjects(subs.map((s: any) => ({ id: s.id, name: s.name })));

        const lessonData = await getLessonById(lessonId);
        if (!lessonData) return;

        // load interactive questions for this lesson (teacher view)
        try {
          if (fetchInteractiveQuestions) {
            const qs = await fetchInteractiveQuestions(lessonId);
            if (Array.isArray(qs)) setInteractiveQuestions(qs);
          }
        } catch (err) {
          // ignore
        }

        const chapterData = await getChapterById(lessonData.chapterId);
        if (!chapterData) return;

        if (chapterData.courseId) {
          await fetchCourseById(chapterData.courseId);
          const courseData = useCourseStore.getState().selectedCourse;
          if (courseData?.createdBy) {
            const res = await getAppUserById(String(courseData.createdBy));
            if (res?.success && res.data) setTeacherCreated(res.data);
          }
        }

        const resourceId =
          (lessonData as any).ResourceId ??
          (lessonData as any).resourceId ??
          null;
        if (resourceId) {
          try {
            if (getLessonResource) {
              const resourceData = await getLessonResource(resourceId);
              if (resourceData) setResources([resourceData]);
            }
          } catch (err) {
            console.error("failed to load lesson resource", err);
          }
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu bài giảng:", err);
      }
    })();
  }, [
    lessonId,
    getLessonById,
    getChapterById,
    getAppUserById,
    fetchCourseById,
    getLessonResource,
    fetchInteractiveQuestions,
  ]);

  const { currentLesson, currentChapter } = useMemo(() => {
    const course = selectedCourse;
    if (!course) return { currentLesson: null, currentChapter: null };

    for (const ch of course.chapters || []) {
      const l = ch.lessons?.find((ls) => ls.id === lessonId);
      if (l) return { currentLesson: l, currentChapter: ch };
    }
    return { currentLesson: null, currentChapter: null };
  }, [selectedCourse, lessonId]);

  const categoryLabel = (id?: number | null) => {
    if (id === undefined || id === null) return "-";
    const found = subjects.find((s) => s.id === Number(id));
    return found ? found.name : String(id);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6 h-full overflow-y-auto scrollbar-hide">
      {/* === Header navigation === */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50 p-0"
        >
          <ArrowLeft className="w-4 h-4 text-[#525252]" />
        </Button>
        <div className="text-sm text-[#525252]">
          {selectedCourse?.name || "Khóa học"} /{" "}
          {currentChapter?.name || "Chương"} /{" "}
          {currentLesson?.name || "Bài học"}
        </div>
      </div>

      {/* === Title + Info === */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#171717]">
            {currentLesson?.name ?? "Bài học"}
          </h1>
          <p className="text-sm text-[#525252]">
            {teacherCreated?.fullname || "Giảng viên"} •{" "}
            {currentLesson?.postDate
              ? new Date(currentLesson.postDate).toLocaleDateString()
              : "Chưa cập nhật"}
          </p>
        </div>
      </div>

      {/* === Main Layout === */}
      <div className="grid grid-cols-12 gap-6">
        {/* === MAIN CONTENT === */}
        <div className="col-span-12 lg:col-span-8">
          <div
            className="bg-black rounded-lg overflow-hidden flex justify-center items-center"
            style={{ aspectRatio: "16/9" }}
          >
            {currentLesson?.type === "Video" && currentLesson.videoUrl ? (
              <iframe
                src={currentLesson.videoUrl}
                title={currentLesson.name}
                className="w-full h-full"
                allowFullScreen
              />
            ) : currentLesson?.type === "Reading" &&
              currentLesson.readingContent ? (
              <div className="bg-[#fafafa] w-full h-full overflow-y-auto p-8">
                <div
                  className="bg-white shadow-lg rounded-lg p-6 prose prose-slate max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: currentLesson.readingContent,
                  }}
                />
              </div>
            ) : (
              <div className="text-white text-lg">
                Không có nội dung cho bài học này.
              </div>
            )}
          </div>

          {currentLesson?.description && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Mô tả bài học</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#404040] whitespace-pre-line">
                  {currentLesson.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Interactive questions list */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Câu hỏi tương tác</CardTitle>
            </CardHeader>
            <CardContent>
              {interactiveQuestions && interactiveQuestions.length ? (
                <ul className="space-y-3">
                  {interactiveQuestions.map((q: any) => (
                    <li key={q.id} className="p-3 border rounded-md">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-[#171717]">
                            {q.question}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Thời điểm: {Math.floor((q.timeSec || 0) / 60)}:
                            {String((q.timeSec || 0) % 60).padStart(2, "0")} •
                            Loại: {q.type === "mc" ? "Trắc nghiệm" : "Tự luận"}
                          </div>
                          {q.type === "mc" && Array.isArray(q.options) && (
                            <div className="mt-2 space-y-1">
                              {q.options.map((opt: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`text-sm p-2 rounded ${
                                    idx === (q.correctIndex ?? -1)
                                      ? "bg-green-50 border border-green-200"
                                      : "bg-gray-50"
                                  }`}
                                >
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.type === "text" && q.correctAnswer && (
                            <div className="mt-2 text-sm text-gray-700">
                              Đáp án mong đợi:{" "}
                              <span className="font-medium">
                                {q.correctAnswer}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Không có câu hỏi tương tác cho bài học này.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* === SIDEBAR === */}
        <aside className="col-span-12 lg:col-span-4 space-y-4">
          {/* === Outline === */}
          <Card>
            <CardHeader>
              <CardTitle>Chương trình khóa học</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCourse?.chapters?.length ? (
                <div className="space-y-2">
                  {selectedCourse.chapters.map((ch: any) => (
                    <Collapsible
                      key={ch.id}
                      defaultOpen={ch.id === currentChapter?.id}
                    >
                      <CollapsibleTrigger className="w-full text-left cursor-pointer font-semibold text-sm text-[#171717] py-1">
                        {ch.name}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ul className="mt-1 pl-2 text-sm text-[#404040] space-y-1">
                          {ch.lessons?.map((l: any) => (
                            <li key={l.id}>
                              <Button
                                variant="ghost"
                                className={`w-full justify-start py-1 ${
                                  l.id === lessonId
                                    ? "font-semibold text-blue-600"
                                    : "hover:text-blue-600"
                                }`}
                                onClick={() =>
                                  navigate(`/course/teacher/lecture/${l.id}`)
                                }
                              >
                                {l.name}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Chưa có chương trình học
                </p>
              )}
            </CardContent>
          </Card>
          {/* === Resources === */}
          <Card>
            <CardHeader>
              <CardTitle>Tài nguyên</CardTitle>
            </CardHeader>
            <CardContent>
              {resources.length ? (
                <ul className="space-y-2 text-sm">
                  {resources.map((r) => (
                    <li key={r.id} className="flex items-center gap-2">
                      <File className="w-4 h-4 text-blue-600" />
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {r.url.split("/").pop()}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Không có tài nguyên
                </p>
              )}
            </CardContent>
          </Card>

          {/* === Course Info (sidebar similar to CourseDetail) === */}
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

          {/* === Instructor (created/updated) === */}
          <Card>
            <CardHeader>
              <CardTitle>Giảng viên</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-[#171717] text-white flex items-center justify-center font-semibold shadow-sm">
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
        </aside>
      </div>
    </div>
  );
};

export default LectureDetails;
