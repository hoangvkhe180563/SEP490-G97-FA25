import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import CourseNavSidebar from "@/courseManagement/components/CourseDetailFiltersStudent";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { Calendar, ChevronDown, Check } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/common/components/ui/breadcrumb";
import CourseContentItem from "@/courseManagement/components/CourseContentItem";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";
import type {
  ChapterListDto,
  LessonListDto,
} from "@/courseManagement/types/api";
import { Clock } from "lucide-react";
import { formatDate } from "@/courseManagement/utils/formatDate";
import { Progress } from "@/common/components/ui/progress";
import { useAuthStore } from "@/auth/stores/useAuthStore";

const CourseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const courseId = Number(id || 0);

  // Use separate selectors to avoid returning a new object each render
  const selectedCourse = useCourseStore((s) => s.selectedCourse);
  const fetchCourseById = useCourseStore((s) => s.fetchCourseById);

  const chapters = useLectureStore((s) => s.chapters);
  const fetchChapters = useLectureStore((s) => s.fetchChapters);
  const fetchLessons = useLectureStore((s) => s.fetchLessons);
  const fetchLesson = useLectureStore((s) => s.fetchLesson);
  // allow multiple chapters to be expanded at once
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(
    new Set()
  );
  // when there are many chapters, show only the first 10 by default
  const [showAllChapters, setShowAllChapters] = useState<boolean>(false);
  const [lessonsByChapter, setLessonsByChapter] = useState<
    Record<number, LessonListDto[]>
  >({});

  // load subjects (for label lookups)
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
    exam: false,
  });
  const [durationFilter, setDurationFilter] = useState<string>("all");

  const authUser = useAuthStore((s) => s.user);

  const fetchEnrollmentsByUser = useEnrollmentStore((s) => s.fetchByUser);
  // subscribe directly to the enrollment for this course so the component re-renders
  const enrollment = useEnrollmentStore((s) =>
    s.getEnrollmentForCourse(courseId)
  );
  const enroll = useEnrollmentStore((s) => s.enroll);
  const consumeWallet = useEnrollmentStore((s) => s.consumeWallet);
  const fetchProgresses = useEnrollmentStore((s) => s.fetchProgresses);

  const getLessonCompleted = useEnrollmentStore((s) => s.getLessonCompleted);

  useEffect(() => {
    if (!authUser?.id || !courseId) return;
    (async () => {
      try {
        await fetchEnrollmentsByUser(String(authUser.id));
        const newEnrollment = useEnrollmentStore
          .getState()
          .getEnrollmentForCourse(courseId);
        if (newEnrollment?.id) {
          await fetchProgresses(newEnrollment.id);
        }
      } catch (err) {
        console.error("Load enrollment progress failed", err);
      }
    })();
  }, [authUser?.id, courseId, fetchEnrollmentsByUser, fetchProgresses]);

  useEffect(() => {
    if (enrollment?.id) {
      fetchProgresses(enrollment.id).catch(() => {});
    }
  }, [enrollment?.id, fetchProgresses]);

  useEffect(() => {
    if (courseId) {
      (async () => {
        fetchCourseById(courseId);
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
    // compute whether we're opening (true) or closing (false)
    const willOpen = !expandedChapters.has(ch.id);

    // update the expanded set
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(ch.id)) next.delete(ch.id);
      else next.add(ch.id);
      return next;
    });

    // only fetch lessons when opening and not already cached
    if (!willOpen) return;
    if (lessonsByChapter[ch.id]) return;
    try {
      const lessons = await fetchLessons(ch.id);
      if (Array.isArray(lessons)) {
        setLessonsByChapter((prev) => ({ ...prev, [ch.id]: lessons }));
      }
    } catch (err) {
      // ignore
    }

    // ensure enrollment and progresses are up-to-date when opening a chapter
    if (!authUser?.id) return;
    (async () => {
      try {
        await fetchEnrollmentsByUser(String(authUser.id));
        const found = useEnrollmentStore
          .getState()
          .getEnrollmentForCourse(courseId);
        if (found?.id) {
          try {
            await fetchProgresses(found.id);
          } catch {
            // ignore
          }
        }
      } catch (err) {
        // ignore
      }
    })();
  };

  const sortLessons = (lessons: LessonListDto[] = []) => {
    const arr = [...lessons];
    switch (contentSort) {
      case "name":
        arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "duration": {
        // sort by parsed duration (in minutes)
        const parseDurationToMinutes = (d: string | null | undefined) => {
          if (!d) return 0;
          const s = String(d).toLowerCase();
          // hours with unit
          const hr = s.match(/(\d+(?:\.\d+)?)\s*(h|giờ|hour|hours|hr)\b/);
          if (hr) return Number(hr[1]) * 60;
          // minutes with unit
          const mn = s.match(/(\d+(?:\.\d+)?)\s*(m|phút|min|minutes)\b/);
          if (mn) return Number(mn[1]);
          // fallback: numeric value
          const num = s.match(/(\d+(?:\.\d+)?)/);
          if (num) {
            const n = Number(num[1]);
            // heuristic: if small number (<=5) treat as hours, else minutes
            return n <= 5 ? n * 60 : n;
          }
          return 0;
        };
        arr.sort(
          (a, b) =>
            parseDurationToMinutes(a.duration) -
            parseDurationToMinutes(b.duration)
        );
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
    // Use enrollment store for completed status (server-side completion)
    const isCompleted = getLessonCompleted(ls.id);
    // Fall back to lesson.progress (client-side) for inProgress / notStarted
    const prog = (ls as any).progress ?? 0;
    const isInProgress = !isCompleted && prog > 0 && prog < 100;
    const isNotStarted =
      !isCompleted && (prog === 0 || prog === null || prog === undefined);

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
    const anyContentTypeSelected = ct.video || ct.reading || ct.exam;
    if (anyContentTypeSelected) {
      const t = (ls.type || "").toLowerCase();
      if (ct.video && t === "video") {
        // ok
      } else if (ct.reading && (t === "reading" || ls.readingContent)) {
        // ok
      } else if (ct.exam && t === "exam") {
        // ok
      } else {
        return false;
      }
    }

    // duration filter (values are minute-based ranges)
    if (durationFilter && durationFilter !== "all") {
      const parseDurationToMinutes = (d: string | null | undefined) => {
        if (!d) return 0;
        const s = String(d).toLowerCase();
        const hr = s.match(/(\d+(?:\.\d+)?)\s*(h|giờ|hour|hours|hr)\b/);
        if (hr) return Number(hr[1]) * 60;
        const mn = s.match(/(\d+(?:\.\d+)?)\s*(m|phút|min|minutes)\b/);
        if (mn) return Number(mn[1]);
        const num = s.match(/(\d+(?:\.\d+)?)/);
        if (num) {
          const n = Number(num[1]);
          return n <= 5 ? n * 60 : n;
        }
        return 0;
      };
      const minutes = parseDurationToMinutes(ls.duration);
      if (durationFilter === "0-15m" && !(minutes >= 0 && minutes <= 15))
        return false;
      if (durationFilter === "15-60m" && !(minutes > 15 && minutes <= 60))
        return false;
      if (durationFilter === "60m+" && !(minutes > 60)) return false;
    }

    return true;
  };

  const fmtPrice = (p: number | undefined) => {
    // Treat null/undefined/0 as free
    if (
      p === undefined ||
      p === null ||
      Number(p) === 0 ||
      Number.isNaN(Number(p))
    )
      return "Miễn phí";
    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
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
        // use enrollment store's progresses map (getLessonCompleted) when available
        const isCompleted = getLessonCompleted(l.id);
        if (isCompleted) completed++;
        else remaining++;
      }
    }
    return { completed, remaining };
  })();

  const completionPercent = (() => {
    const totalLessons = stats.completed + stats.remaining;
    return totalLessons === 0
      ? 0
      : Math.round((stats.completed / totalLessons) * 100);
  })();

  const [expandedDesc, setExpandedDesc] = useState<boolean>(false);
  const courseDescription =
    (selectedCourse as any)?.information ||
    (selectedCourse as any)?.description ||
    (selectedCourse as any)?.content ||
    null;

  return (
    <div className="w-full bg-gray-50 min-h-screen py-8 h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-screen-xl mx-auto px-4">
        <Breadcrumb>
          <BreadcrumbList className="text-sm text-gray-500 mb-4">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/course/student/courses">Khóa học</Link>
              </BreadcrumbLink>
              <BreadcrumbSeparator />
            </BreadcrumbItem>

            <BreadcrumbItem>
              <BreadcrumbPage>
                {selectedCourse?.name ?? "Chi tiết khóa học"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/course/student/courses")}
            className="w-9 h-9 flex items-center justify-center border rounded-md bg-white shadow-sm"
            aria-label="Go back"
          >
            ←
          </button>
          <div className="flex-1">
            <div className="text-2xl font-semibold text-gray-900">
              {selectedCourse?.name ?? "Course Detail"}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {selectedCourse?.information}
            </div>
          </div>
        </div>
        <main className="mb-6">
          <div className="bg-white rounded-lg border p-6 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start gap-6">
              <div className="flex-1">
                <div className="inline-block bg-blue-100 text-blue-800 text-lg font-semibold px-4 py-2 rounded-full shadow-sm">
                  {selectedCourse?.subject?.name ?? "Chưa xác định"}
                </div>

                <div className="flex items-center gap-4 mt-4 text-base text-gray-800">
                  <div className="flex items-center gap-4">
                    {/* Avatar chữ cái */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-lg font-bold text-blue-700 shadow-sm border border-blue-50">
                      {selectedCourse?.teacherCreatedName
                        ? selectedCourse.teacherCreatedName
                            .charAt(0)
                            .toUpperCase()
                        : "G"}
                    </div>

                    {/* Thông tin giáo viên */}
                    <div>
                      <div className="font-semibold text-gray-900 text-lg leading-snug">
                        {selectedCourse?.teacherCreatedName ?? "Giáo viên"}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium shadow-sm">
                          Khối {selectedCourse?.grade ?? "-"}
                        </span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-500">
                          {selectedCourse?.teacherCreatedName
                            ? "Giáo viên"
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-sm text-gray-500">Thời gian</div>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedCourse?.startAt && selectedCourse?.endAt ? (
                        <>
                          <Calendar
                            className="inline-block w-4 h-4 mr-1 text-gray-500"
                            aria-hidden
                          />
                          {`${formatDate(
                            selectedCourse.startAt
                          )} - ${formatDate(selectedCourse.endAt)}`}
                        </>
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                </div>

                {enrollment ? (
                  <div className="mt-6 p-5 border border-gray-100 rounded-xl bg-white shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-md bg-sky-100 text-sky-600">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-base font-semibold text-gray-800">
                          Tiến độ khóa học
                        </span>
                      </div>

                      <span className="text-sm font-medium text-sky-700">
                        {completionPercent}% hoàn thành
                      </span>
                    </div>

                    <Progress
                      value={completionPercent}
                      className="h-3 bg-gray-100 [&>div]:bg-sky-500"
                    />

                    {/* Thông tin chi tiết */}
                    <div className="flex justify-between mt-3 text-sm text-gray-600">
                      <span className="font-medium text-gray-700">
                        {stats.completed} bài hoàn thành
                      </span>
                      <span>{stats.remaining} bài còn lại</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="w-full lg:w-44 flex-shrink-0">
                <div className="w-full rounded-md overflow-hidden bg-gray-100 shadow-sm">
                  {selectedCourse?.imageUrl ? (
                    <img
                      src={selectedCourse.imageUrl}
                      alt="Course image"
                      className="w-full h-36 object-cover"
                      onError={(e) =>
                        (e.currentTarget.src =
                          "https://placehold.co/300x200?text=No+Image")
                      }
                    />
                  ) : (
                    <div className="w-full h-36 flex items-center justify-center text-sm text-gray-400">
                      Không có hình ảnh
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <div className="text-sm text-gray-500">Giá</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {fmtPrice(selectedCourse?.price)}
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    onClick={async () => {
                      try {
                        // ensure user is logged in
                        if (!authUser?.id) {
                          navigate(`/auth/login`);
                          return;
                        }

                        // if already enrolled, do nothing
                        if (enrollment) return;

                        const priceNum = Number(
                          (selectedCourse as any)?.price ?? 0
                        );

                        // free course -> enroll directly
                        if (!priceNum || priceNum <= 0) {
                          try {
                            await enroll({
                              appUserId: String(authUser.id),
                              courseId,
                            });
                            await fetchEnrollmentsByUser(String(authUser.id));
                          } catch (err) {
                            // ignore
                          }
                          return;
                        }

                        // check wallet balance
                        const wallet = Number(authUser?.wallet ?? 0);
                        if (wallet >= priceNum) {
                          // enough balance: enroll directly (backend will debit wallet)
                          try {
                            await enroll({
                              appUserId: String(authUser.id),
                              courseId,
                            });
                            await fetchEnrollmentsByUser(String(authUser.id));
                          } catch (err) {
                            // fallback: navigate to checkout for full price
                            const params = new URLSearchParams({
                              courseId: String(courseId),
                              price: String(priceNum),
                              name: String((selectedCourse as any)?.name ?? ""),
                              userId: String(authUser.id),
                              schoolId: String(
                                (selectedCourse as any)?.schoolId ?? ""
                              ),
                            });
                            navigate(
                              `/payment/student/checkout?${params.toString()}`
                            );
                          }
                          return;
                        }

                        // partial wallet -> go to checkout for remaining amount
                        try {
                          const resp = await consumeWallet({
                            appUserId: String(authUser.id),
                            courseId,
                          });
                          if (resp?.created) {
                            await fetchEnrollmentsByUser(String(authUser.id));
                            const newEnrollment = useEnrollmentStore
                              .getState()
                              .getEnrollmentForCourse(courseId);
                            if (newEnrollment?.id) {
                              try {
                                await fetchProgresses(newEnrollment.id);
                              } catch {
                                // ignore
                              }
                            }
                            return;
                          }
                          const info = resp?.info ?? resp;
                          const remaining = Number(
                            info?.remaining ?? Math.max(0, priceNum - wallet)
                          );
                          const params = new URLSearchParams({
                            courseId: String(courseId),
                            price: String(remaining),
                            name: String((selectedCourse as any)?.name ?? ""),
                            userId: String(authUser.id),
                            schoolId: String(
                              (selectedCourse as any)?.schoolId ?? ""
                            ),
                          });
                          navigate(
                            `/payment/student/checkout?${params.toString()}`
                          );
                        } catch (err) {
                          const remaining = Math.max(0, priceNum - wallet);
                          const params = new URLSearchParams({
                            courseId: String(courseId),
                            price: String(remaining),
                            name: String((selectedCourse as any)?.name ?? ""),
                            userId: String(authUser.id),
                            schoolId: String(
                              (selectedCourse as any)?.schoolId ?? ""
                            ),
                          });
                          navigate(
                            `/payment/student/checkout?${params.toString()}`
                          );
                        }
                      } catch (err) {
                        // ignore
                      }
                    }}
                    className={`w-full py-2 text-white rounded-md ${
                      enrollment
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-sky-600 hover:bg-sky-700"
                    }`}
                  >
                    {enrollment ? "Đã đăng ký" : "Đăng ký ngay"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {courseDescription && (
            <div className="bg-white rounded-lg border p-6 mb-6">
              <div className="text-lg font-medium mb-3">Mô tả khóa học</div>
              <div className="text-sm text-gray-700 leading-relaxed">
                {expandedDesc || courseDescription.length <= 600
                  ? courseDescription
                  : `${courseDescription.slice(0, 600)}...`}
              </div>
              {courseDescription.length > 600 && (
                <div className="mt-3">
                  <button
                    onClick={() => setExpandedDesc((s) => !s)}
                    className="text-sm text-sky-600 hover:underline"
                  >
                    {expandedDesc ? "Thu gọn" : "Xem thêm"}
                  </button>
                </div>
              )}
            </div>
          )}
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
                    exam: false,
                  });
                  setDurationFilter("all");
                }}
                stats={enrollment ? stats : undefined}
              />
            </aside>
            <div className="col-span-12 lg:col-span-9">
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-medium">Nội dung khóa học</div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={contentSort}
                      onValueChange={(v) => setContentSort(v)}
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Sắp xếp theo: Mặc định" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Mặc định</SelectItem>
                        <SelectItem value="name">Tên</SelectItem>
                        <SelectItem value="duration">Thời gian</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={contentView === "list" ? undefined : "ghost"}
                        onClick={() => setContentView("list")}
                        className="px-3 py-2 rounded-md text-sm"
                      >
                        Danh sách
                      </Button>
                      <Button
                        variant={contentView === "grid" ? undefined : "ghost"}
                        onClick={() => setContentView("grid")}
                        className="px-3 py-2 rounded-md text-sm"
                      >
                        Lưới
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/** show only first 10 chapters by default, allow expanding to view all */}
                  {(() => {
                    const visibleChapters = showAllChapters
                      ? chapters
                      : chapters.slice(0, 10);
                    return visibleChapters.map((ch: ChapterListDto) => {
                      const allLessons =
                        lessonsByChapter[ch.id] ?? ch.lessons ?? [];
                      const lessons = sortLessons(allLessons).filter((l) =>
                        filterLesson(l)
                      );
                      const chapterCompleted =
                        Array.isArray(allLessons) && allLessons.length > 0
                          ? allLessons.every((l) => getLessonCompleted(l.id))
                          : false;
                      return (
                        <div key={ch.id} className="mb-4">
                          <div
                            className={`bg-white rounded-lg border p-3 shadow-sm`}
                          >
                            <Button
                              onClick={() => toggleChapter(ch)}
                              variant="ghost"
                              className="w-full flex items-center justify-between text-left p-3"
                            >
                              <div className="font-medium text-base truncate flex items-center gap-2">
                                {chapterCompleted && (
                                  <Check className="w-4 h-4 text-green-600" />
                                )}
                                <span className="truncate">{ch.name}</span>
                              </div>
                              <ChevronDown
                                className={`w-5 h-5 text-gray-400 transform transition-transform ${
                                  expandedChapters.has(ch.id)
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </Button>

                            {expandedChapters.has(ch.id) && (
                              <div className="mt-3">
                                {lessons.length === 0 ? (
                                  <div className="text-sm text-gray-400">
                                    Không có bài học nào phù hợp với bộ lọc hiện
                                    tại.
                                  </div>
                                ) : contentView === "list" ? (
                                  <div className="space-y-2">
                                    {lessons.map((ls: LessonListDto) => {
                                      const isPreview = Boolean(ls.isPreview);
                                      return (
                                        <CourseContentItem
                                          key={ls.id}
                                          title={ls.name}
                                          subtitle={ls.description ?? ""}
                                          duration={ls.duration ?? ""}
                                          isPreview={isPreview}
                                          isCompleted={getLessonCompleted(
                                            ls.id
                                          )}
                                          variant="list"
                                          onClick={() => {
                                            if (!isPreview && !enrollment)
                                              return;
                                            fetchLesson(ls.id).then(() => {
                                              navigate(
                                                `/course/student/courses/${courseId}/lecture/${ls.id}`
                                              );
                                            })
                                          }}
                                        />
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {lessons.map((ls: LessonListDto) => {
                                      const isPreview = Boolean(ls.isPreview);
                                      return (
                                        <CourseContentItem
                                          key={ls.id}
                                          title={ls.name}
                                          subtitle={ls.description ?? ""}
                                          duration={ls.duration ?? ""}
                                          isPreview={isPreview}
                                          isCompleted={getLessonCompleted(
                                            ls.id
                                          )}
                                          variant="grid"
                                          onClick={() => {
                                            if (!isPreview && !enrollment)
                                              return;
                                            fetchLesson(ls.id).then(() => {
                                              navigate(
                                                `/course/student/courses/${courseId}/lecture/${ls.id}`
                                              );
                                            })
                                          }}
                                        />
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* show/hide more chapters control when there are many chapters */}
                  {chapters.length > 10 && (
                    <div className="mt-2 text-center">
                      <Button
                        onClick={() => setShowAllChapters((s) => !s)}
                        className="px-4 py-2 rounded-md text-sm"
                      >
                        {showAllChapters
                          ? "Ẩn bớt chương"
                          : `Hiện thêm chương (${chapters.length - 10})`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CourseDetail;
