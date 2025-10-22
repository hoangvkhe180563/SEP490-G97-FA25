import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { Button } from "@/common/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { ArrowLeft, Download, Bookmark } from "lucide-react";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import courseApi from "@/courseManagement/services/courseService";

const LectureDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const lid = Number(id || 0);
  const selectedLesson = useLectureStore((s: any) => s.selectedLesson);
  const fetchLesson = useLectureStore((s: any) => s.fetchLesson);
  const chapters = useLectureStore((s: any) => s.chapters);
  const fetchChapters = useLectureStore((s: any) => s.fetchChapters);

  const selectedCourse = useCourseStore((s: any) => s.selectedCourse);
  const fetchCourseById = useCourseStore((s: any) => s.fetchCourseById);
  const getAppUserById = useAppUserStore((s) => s.getAppUserById);

  const [instructor, setInstructor] = React.useState<any | null>(null);

  useEffect(() => {
    if (lid) fetchLesson(lid);
  }, [lid, fetchLesson]);

  // If we know the course from selectedLesson, fetch course and chapters
  useEffect(() => {
    const courseId = selectedLesson?.courseId;
    if (courseId) {
      fetchCourseById(courseId);
      fetchChapters(courseId);
    }
  }, [selectedLesson, fetchCourseById, fetchChapters]);

  // Resolve instructor by following lessonId -> chapter -> course chain
  useEffect(() => {
    const loadInstructorFromLesson = async () => {
      const lessonId = selectedLesson?.id ?? lid;
      if (!lessonId) return;

      try {
        // get lesson to read chapterId
        const lesson = await courseApi.getLesson(lessonId);
        const chapterId = lesson?.chapterId;
        if (!chapterId) return;

        // get chapter to read courseId
        const chapter = await courseApi.getChapter(chapterId);
        const courseId = chapter?.courseId;
        if (!courseId) return;

        // get course to read instructorName
        const course = await courseApi.getCourseById(courseId);
        const instructorId = course?.instructorName ?? null;
        if (!instructorId) {
          setInstructor(null);
          return;
        }

        // fetch instructor user
        try {
          const res: any = await getAppUserById(String(instructorId));
          setInstructor(res?.user ?? null);
        } catch (err) {
          console.error("Failed to fetch instructor user", err);
          setInstructor(null);
        }
      } catch (err) {
        console.error(
          "Failed to resolve instructor from lesson -> chapter -> course",
          err
        );
      }
    };

    loadInstructorFromLesson();
  }, [selectedLesson?.id, lid, getAppUserById]);

  const l = selectedLesson;

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1100px] mx-auto px-6 py-6">
        {/* === Breadcrumb === */}
        <div className="text-sm text-[#525252] mb-3">
          Khóa học / Bài giảng / {l?.name ?? "Đang tải..."}
        </div>

        {/* === Header === */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 text-[#525252]" />
            </button>

            <div>
              <h1 className="text-2xl font-semibold text-[#171717]">
                {l?.name ?? "Lecture"}
              </h1>
              <p className="text-sm text-[#525252]">
                {l?.type ?? ""} •{" "}
                {instructor?.fullname ?? l?.teacherName ?? "Unknown Teacher"} •{" "}
                {l?.postDate
                  ? new Date(l.postDate).toLocaleDateString()
                  : "No post date"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {l?.fileUrl && (
              <Button variant="outline" asChild>
                <a href={l.fileUrl} download>
                  <Download className="w-4 h-4 mr-2" /> Tải xuống tệp
                </a>
              </Button>
            )}
            <Button variant="outline">
              <Bookmark className="w-4 h-4 mr-2" /> Đánh dấu
            </Button>
          </div>
        </div>

        {/* === MAIN & SIDEBAR === */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div
              className="bg-black rounded-lg overflow-hidden flex justify-center items-center"
              style={{ aspectRatio: "16/9" }}
            >
              {l?.type === "Video" && l?.videoUrl ? (
                <iframe
                  src={l.videoUrl}
                  title={l.name}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : l?.type === "Đọc" && l?.readingContent ? (
                <div className="bg-[#fafafa] w-full h-full flex justify-center items-start overflow-y-auto p-8">
                  <div className="bg-white shadow-lg rounded-lg w-full max-w-[800px] p-8 leading-relaxed text-[#1f1f1f] text-[15px] tracking-[0.015em] font-[400] prose prose-sm prose-slate overflow-y-auto max-h-full">
                    <div className="whitespace-pre-wrap">
                      {l.readingContent}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl">
                  Không có nội dung nào cho bài giảng này.
                </div>
              )}
            </div>
            {/* Description */}
            {l?.description && (
              <div className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mô tả</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#404040] leading-relaxed whitespace-pre-line">
                      {l.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right column */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="space-y-4">
              {/* Course Outline */}
              <Card>
                <CardHeader>
                  <CardTitle>Điều hướng khóa học</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {chapters && chapters.length > 0 ? (
                      chapters.map((ch: any) => (
                        <div key={ch.id} className="mb-2">
                          <div className="text-sm font-medium">{ch.name}</div>
                          <div className="pl-3 mt-1">
                            {(ch.lessons || []).map((ls: any) => (
                              <div
                                key={ls.id}
                                className={`flex items-center gap-2 text-sm py-1 ${
                                  ls.id === l?.id ? "font-semibold" : ""
                                }`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    ls.id === l?.id
                                      ? "bg-slate-700"
                                      : "bg-gray-300"
                                  }`}
                                />
                                <div>{ls.name}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No outline</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resources */}
              <Card>
                <CardHeader>
                  <CardTitle>Tài nguyên</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {l?.readingContent ? (
                      <a
                        href={l.readingContent}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-[#171717]"
                      >
                        Lecture Notes
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Không có tài nguyên nào
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Instructor card */}
              <Card>
                <CardHeader>
                  <CardTitle>Giảng viên</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-base font-medium text-gray-700">
                      {instructor?.avatarUrl ? (
                        <img
                          src={instructor.avatarUrl}
                          alt={instructor.fullname ?? "Instructor"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">
                          {(
                            instructor?.fullname ??
                            selectedCourse?.instructorName ??
                            "T"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">
                        {instructor?.fullname ??
                          selectedCourse?.instructorName ??
                          "Instructor Name"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {instructor?.bio ??
                          selectedCourse?.instructorBio ??
                          "Professor Bio"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default LectureDetails;
