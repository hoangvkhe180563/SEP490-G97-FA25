import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import CourseNavSidebar from "@/courseManagement/components/CourseDetailFiltersStudent";
import CourseContentItem from "@/courseManagement/components/CourseContentItem";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import type { ChapterDto, LessonDto } from "@/courseManagement/types/api";

const CourseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const courseId = Number(id || 0);

  const { selectedCourse, fetchCourseById } = useCourseStore((s: any) => ({
    selectedCourse: s.selectedCourse,
    fetchCourseById: s.fetchCourseById,
  }));

  const { chapters, fetchChapters } = useLectureStore((s: any) => ({
    chapters: s.chapters,
    fetchChapters: s.fetchChapters,
  }));

  useEffect(() => {
    if (courseId) {
      fetchCourseById(courseId);
      fetchChapters(courseId);
    }
  }, [courseId, fetchCourseById, fetchChapters]);

  return (
    <div className="w-full bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-sm text-gray-500 mb-4">My Courses / Course</div>

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center border rounded"
            aria-label="Go back"
          >
            ←
          </button>
          <div className="text-lg font-medium">
            {selectedCourse?.name ?? "Course Detail"}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-3">
            <CourseNavSidebar />
          </aside>

          <main className="col-span-12 lg:col-span-9">
            <div className="bg-white rounded-md border p-4 mb-6 flex items-start justify-between">
              <div>
                <div className="text-lg font-medium">
                  {selectedCourse?.name}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedCourse?.description}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                      C
                    </div>
                    <span>{selectedCourse?.ownerName ?? "Instructor"}</span>
                  </div>
                  <div>{selectedCourse?.duration ?? "-"}</div>
                  <div>★ {selectedCourse?.rating ?? "-"}</div>
                </div>
              </div>

              <div>
                <Button>Course Image</Button>
              </div>
            </div>

            <div className="bg-white rounded-md border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-medium">Course Content</div>
                <div className="flex items-center gap-3">
                  <select className="border rounded px-3 py-1 text-sm">
                    <option>Sort by: Default</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <button className="border rounded p-2">List</button>
                    <button className="border rounded p-2">Grid</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {chapters.map((ch: ChapterDto) => (
                  <div key={ch.id}>
                    <div className="font-medium">{ch.name}</div>
                    <div className="pl-4 mt-2 space-y-1">
                      {ch.lessons?.map((ls: LessonDto) => (
                        <CourseContentItem
                          key={ls.id}
                          title={ls.name}
                          subtitle={ls.content ?? ""}
                          duration={""}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
