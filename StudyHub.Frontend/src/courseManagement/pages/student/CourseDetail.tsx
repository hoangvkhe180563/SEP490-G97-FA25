import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import CourseNavSidebar from "@/courseManagement/components/CourseDetailFiltersStudent";
import CourseContentItem from "@/courseManagement/components/CourseContentItem";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";
import type {
  ChapterListDto,
  LessonListDto,
} from "@/courseManagement/types/api";

const CourseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const courseId = Number(id || 0);

  // Use separate selectors to avoid returning a new object each render
  const selectedCourse = useCourseStore((s: any) => s.selectedCourse);
  const fetchCourseById = useCourseStore((s: any) => s.fetchCourseById);

  const chapters = useLectureStore((s: any) => s.chapters);
  const fetchChapters = useLectureStore((s: any) => s.fetchChapters);
  const fetchLessons = useLectureStore((s: any) => s.fetchLessons);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [lessonsByChapter, setLessonsByChapter] = useState<
    Record<number, LessonListDto[]>
  >({});

  // load subjects (for label lookups)
  const [_subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [contentView, setContentView] = useState<"list" | "grid">("list");
  const [contentSort, setContentSort] = useState<string>("default");
  const [progressFilters, setProgressFilters] = useState({
    completed: false,
    inProgress: false,
    notStarted: false,
  });
  const [contentTypes, setContentTypes] = useState({
    video: false,
    reading: false,
    assignment: false,
    quiz: false,
  });
  const [teachers, setTeachers] = useState<any[]>([]);
  const filterAppUsers = useAppUserStore((s) => s.filterAppUsers);
  const [durationFilter, setDurationFilter] = useState<string>("all");

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
      } catch (err) {
        // ignore
      }
    })();
    (async () => {
      try {
        const r = await filterAppUsers("role=Teacher&page=1&limit=200");
        if (mounted) setTeachers(r?.users ?? []);
      } catch (err) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [filterAppUsers]);

  // enrollment state for current user via store
  const currentUser = useAppUserStore((s: any) => s.appUser);
  const fetchEnrollmentsByUser = useEnrollmentStore((s: any) => s.fetchByUser);
  const getEnrollmentForCourse = useEnrollmentStore(
    (s: any) => s.getEnrollmentForCourse
  );
  const enrollAction = useEnrollmentStore((s: any) => s.enroll);
  const enrollment = getEnrollmentForCourse(courseId);

  useEffect(() => {
    (async () => {
      if (!currentUser) return;
      try {
        await fetchEnrollmentsByUser(String(currentUser.id));
      } catch (err) {
        // ignore
      }
    })();
  }, [currentUser, fetchEnrollmentsByUser]);

  useEffect(() => {
    if (courseId) {
      (async () => {
        // load course meta
        fetchCourseById(courseId);
        // fetch chapters and then fetch lessons for each so UI shows items
        try {
          const chs = await fetchChapters(courseId);
          if (Array.isArray(chs) && chs.length > 0) {
            const map: Record<number, LessonListDto[]> = {};
            await Promise.all(
              chs.map(async (ch: ChapterListDto) => {
                try {
                  const ls = await fetchLessons(ch.id);
                  if (Array.isArray(ls)) map[ch.id] = ls;
                } catch (e) {
                  // ignore per-chapter error
                }
              })
            );
            setLessonsByChapter((prev) => ({ ...prev, ...map }));
          }
        } catch (e) {
          // ignore
        }
      })();
    }
  }, [courseId, fetchCourseById, fetchChapters, fetchLessons]);

  const toggleChapter = async (ch: ChapterListDto) => {
    if (expandedChapter === ch.id) {
      setExpandedChapter(null);
      return;
    }
    setExpandedChapter(ch.id);
    // if cached, no need to fetch
    if (lessonsByChapter[ch.id]) return;
    try {
      const lessons = await fetchLessons(ch.id);
      if (Array.isArray(lessons)) {
        setLessonsByChapter((prev) => ({ ...prev, [ch.id]: lessons }));
      }
    } catch (err) {
      // ignore
    }
    // fetch teachers (small one-time list) so we can resolve instructor id -> name
    try {
      const r = await filterAppUsers("role=Teacher&page=1&limit=200");
      setTeachers(r?.users ?? []);
    } catch (err) {
      // ignore
    }
  };

  // helper: map course.category (id) -> subject name
  const subjectLabel = (() => {
    const id = (selectedCourse as any)?.category;
    if (id === undefined || id === null) return undefined;
    const found = _subjects.find((s) => s.id === Number(id));
    return found ? found.name : String(id);
  })();

  // helper: sort lessons according to contentSort
  const sortLessons = (lessons: LessonListDto[] = []) => {
    const arr = [...lessons];
    switch (contentSort) {
      case "name":
        arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "duration": {
        // parse numeric duration (extract digits) and compare; fallback to 0
        const parseDur = (d: string | null | undefined) => {
          if (!d) return 0;
          const m = d.match(/(\d+(?:\.\d+)?)/);
          return m ? Number(m[0]) : 0;
        };
        arr.sort((a, b) => parseDur(a.duration) - parseDur(b.duration));
        break;
      }
      default:
        break;
    }
    return arr;
  };

  // helper: filter lessons according to sidebar controls
  const filterLesson = (ls: LessonListDto) => {
    // progress filter
    const prog = (ls as any).progress ?? 0;
    const isCompleted = prog >= 100;
    const isInProgress = prog > 0 && prog < 100;
    const isNotStarted = prog === 0;

    const pf = progressFilters;
    // if any progress filters are enabled, the lesson must match at least one
    if (pf.completed || pf.inProgress || pf.notStarted) {
      if (pf.completed && isCompleted) {
        // ok
      } else if (pf.inProgress && isInProgress) {
        // ok
      } else if (pf.notStarted && isNotStarted) {
        // ok
      } else {
        return false;
      }
    }

    // content type filter
    const ct = contentTypes;
    const anyContentTypeSelected =
      ct.video || ct.reading || ct.assignment || ct.quiz;
    if (anyContentTypeSelected) {
      const t = (ls.type || "").toLowerCase();
      if (ct.video && t === "video") {
        // ok
      } else if (ct.reading && (t === "reading" || ls.readingContent)) {
        // ok
      } else if (ct.assignment && t === "assignment") {
        // ok
      } else if (ct.quiz && t === "quiz") {
        // ok
      } else {
        return false;
      }
    }

    // duration filter
    if (durationFilter && durationFilter !== "all") {
      const parseDur = (d: string | null | undefined) => {
        if (!d) return 0;
        const m = d.match(/(\d+(?:\.\d+)?)/);
        return m ? Number(m[0]) : 0;
      };
      const hours = parseDur(ls.duration);
      if (durationFilter === "0-5" && !(hours >= 0 && hours <= 5)) return false;
      if (durationFilter === "5-20" && !(hours > 5 && hours <= 20))
        return false;
      if (durationFilter === "20+" && !(hours > 20)) return false;
    }

    return true;
  };

  const fmtPrice = (p: number | undefined) => {
    if (p === undefined || p === null) return "Free";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "VND",
      }).format(p);
    } catch {
      return String(p);
    }
  };

  // compute stats from available lessons (simple example)
  const stats = (() => {
    let completed = 0;
    let remaining = 0;
    for (const ch of chapters) {
      const lessons = lessonsByChapter[ch.id] ?? ch.lessons ?? [];
      for (const l of lessons) {
        // naive: treat lessons with progress === 100 as completed
        const prog = (l as any).progress ?? 0;
        if (prog >= 100) completed++;
        else remaining++;
      }
    }
    return { completed, remaining };
  })();

  return (
    <div className="w-full bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="text-sm text-gray-500 mb-4">
          Khóa học của tôi / Khóa học
        </div>

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/course/student/courses")}
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
            <CourseNavSidebar
              filters={progressFilters}
              setFilters={setProgressFilters}
              contentTypes={contentTypes}
              setContentTypes={setContentTypes}
              duration={durationFilter}
              setDuration={setDurationFilter}
              onClear={() => {
                setProgressFilters({
                  completed: false,
                  inProgress: false,
                  notStarted: false,
                });
                setContentTypes({
                  video: false,
                  reading: false,
                  assignment: false,
                  quiz: false,
                });
                setDurationFilter("all");
              }}
              stats={stats}
            />
          </aside>

          <main className="col-span-12 lg:col-span-9">
            <div className="bg-white rounded-md border p-4 mb-6 flex items-start justify-between">
              <div>
                <div className="text-lg font-medium">
                  {selectedCourse?.name}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedCourse?.information}
                </div>
                <div className="text-sm text-gray-500 mt-1">{subjectLabel}</div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                      {(selectedCourse?.instructorName &&
                        (
                          teachers.find(
                            (t) =>
                              String(t.id) ===
                              String(selectedCourse.instructorName)
                          )?.fullname || String(selectedCourse.instructorName)
                        ).slice(0, 1)) ||
                        "G"}
                    </div>
                    <span>
                      {selectedCourse?.instructorName &&
                      teachers.find(
                        (t) =>
                          String(t.id) === String(selectedCourse.instructorName)
                      )
                        ? teachers.find(
                            (t) =>
                              String(t.id) ===
                              String(selectedCourse.instructorName)
                          )?.fullname
                        : selectedCourse?.instructorName ?? "Giáo viên"}
                    </span>
                  </div>

                  <div>Khối Lớp: {selectedCourse?.grade ?? "-"}</div>
                  <div>Giá: {fmtPrice(selectedCourse?.price)}</div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 w-40">
                {/* Ảnh khóa học */}
                <div className="w-36 h-24 rounded-md overflow-hidden bg-gray-100 shadow-sm flex items-center justify-center">
                  {selectedCourse?.imageUrl ? (
                    <img
                      src={selectedCourse.imageUrl}
                      alt="Course image"
                      className="w-full h-full object-cover"
                      onError={(e) =>
                        (e.currentTarget.src =
                          "https://placehold.co/150x100?text=No+Image")
                      }
                    />
                  ) : (
                    <span className="text-sm text-gray-400">
                      Không có hình ảnh
                    </span>
                  )}
                </div>

                {/* Nút Enroll */}
                <Button
                  onClick={async () => {
                    if (!currentUser) {
                      navigate(`/login`);
                      return;
                    }
                    try {
                      const payload = {
                        appUserId: String(currentUser.id),
                        courseId,
                      };
                      await enrollAction(payload);
                    } catch (err) {
                      // ignore
                    }
                  }}
                  className="w-28 bg-[#111827] text-white hover:bg-[#1f2937] transition-colors duration-200"
                >
                  {enrollment ? "Enrolled" : "Enroll"}
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-md border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-medium">Nội dung khóa học</div>
                <div className="flex items-center gap-3">
                  <select
                    className="border rounded px-3 py-1 text-sm"
                    value={contentSort}
                    onChange={(e) => setContentSort(e.target.value)}
                  >
                    <option value="default">Sắp xếp theo: Mặc định</option>
                    <option value="name">Tên</option>
                    <option value="duration">Thời gian</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setContentView("list")}
                      className={`px-3 py-2 rounded-md text-sm border transition-all ${
                        contentView === "list"
                          ? "bg-white border-gray-800 text-gray-900"
                          : "bg-transparent border-gray-200 text-gray-500"
                      }`}
                    >
                      Danh sách
                    </button>
                    <button
                      onClick={() => setContentView("grid")}
                      className={`px-3 py-2 rounded-md text-sm border transition-all ${
                        contentView === "grid"
                          ? "bg-white border-gray-800 text-gray-900 shadow"
                          : "bg-transparent border-gray-200 text-gray-500"
                      }`}
                    >
                      Lưới
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {chapters.map((ch: ChapterListDto) => {
                  const lessons = sortLessons(
                    lessonsByChapter[ch.id] ?? ch.lessons ?? []
                  ).filter((l) => filterLesson(l));
                  console.log("Chapter:", ch.name, "Lessons:", lessons);
                  return (
                    <div key={ch.id}>
                      <div className="flex items-center justify-between">
                        <button
                          className="w-full text-left font-medium text-base"
                          onClick={() => toggleChapter(ch)}
                        >
                          {ch.name}
                        </button>
                      </div>

                      {contentView === "list" ? (
                        <div className="pl-4 mt-2 space-y-1">
                          {lessons.map((ls: LessonListDto) => (
                            <div
                              key={ls.id}
                              className="cursor-pointer"
                              onClick={() => {
                                const isPreview = Boolean(ls.isPreview);
                                if (!isPreview && !enrollment) return;
                                navigate(
                                  `/course/student/courses/${courseId}/lecture/${ls.id}`
                                );
                              }}
                            >
                              <div className="flex items-center justify-between rounded-lg hover:bg-gray-50 transition">
                                <div className="flex-1">
                                  <CourseContentItem
                                    title={ls.name}
                                    subtitle={ls.description ?? ""}
                                    duration={ls.duration ?? ""}
                                    isPreview={Boolean(ls.isPreview)}
                                    variant="list"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          {lessons.length === 0 && (
                            <div className="text-sm text-gray-400 mt-2">
                              Không có bài học nào phù hợp với bộ lọc hiện tại.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="pl-0 mt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {lessons.map((ls: LessonListDto) => (
                              <div
                                key={ls.id}
                                className="cursor-pointer"
                                onClick={() => {
                                  const isPreview = Boolean(ls.isPreview);
                                  if (!isPreview && !enrollment) return;
                                  navigate(
                                    `/course/student/courses/${courseId}/lecture/${ls.id}`
                                  );
                                }}
                              >
                                <div className="relative group rounded-lg border hover:shadow-sm transition">
                                  <CourseContentItem
                                    title={ls.name}
                                    subtitle={ls.description ?? ""}
                                    duration={ls.duration ?? ""}
                                    variant="grid"
                                  />

                                  {ls.isPreview && (
                                    <div className="absolute bottom-2 right-2 text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-300 px-2 py-0.5 rounded">
                                      Preview
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            {lessons.length === 0 && (
                              <div className="text-sm text-gray-400 mt-2 col-span-full">
                                Không có bài học nào phù hợp với bộ lọc hiện
                                tại.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
