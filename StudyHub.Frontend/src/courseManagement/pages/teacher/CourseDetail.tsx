import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
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
    }
  }, [courseId, fetchCourseById, fetchChapters]);

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        {/* === Breadcrumb + back button === */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 mb-4 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 text-[#525252]" />
          </button>
          <div className="text-sm text-[#525252] mb-3">
            Courses / Course Details
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
                      No Image
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

                  <div className="flex items-center gap-4 text-sm text-[#525252] mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#171717]" />
                      <span>
                        {selectedCourse?.instructorName ?? "Instructor"}
                      </span>
                    </div>
                    <div>
                      Created:{" "}
                      {selectedCourse?.createdAt
                        ? new Date(selectedCourse.createdAt).toLocaleString()
                        : "-"}
                    </div>
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
                  <Edit2 className="mr-2" /> Edit Course
                </Button>
                <Button
                  onClick={() =>
                    navigate(`/course/teacher/preview/${courseId}`)
                  }
                >
                  Preview
                </Button>
              </div>
            </div>

            {/* === Course Overview === */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Description</CardTitle>
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
                    <CardTitle>Curriculum</CardTitle>
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
                          No curriculum available.
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
                      <CardTitle>Course Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-[#404040] space-y-1">
                        <div className="flex justify-between">
                          <span>Status</span>
                          <span>
                            {selectedCourse?.status ? "Published" : "Draft"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price</span>
                          <span>
                            {selectedCourse?.price
                              ? `${selectedCourse.price}`
                              : "Free"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subject</span>
                          <span>{categoryLabel(selectedCourse?.category)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Grade</span>
                          <span>{selectedCourse?.grade ?? "-"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Instructor</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#D9D9D9]" />
                        <div>
                          <div className="text-sm text-[#737373]">
                            {selectedCourse?.instructorName ? "Instructor" : ""}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button variant="outline">View Profile</Button>
                            <Button>Message</Button>
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
