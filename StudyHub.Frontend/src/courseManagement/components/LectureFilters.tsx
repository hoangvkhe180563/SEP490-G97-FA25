import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import type { ChapterListDto, LessonListDto } from "../types/api";
import RouteConfig from "@/common/constants/RouteConfig";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";

const LectureFilters: React.FC = () => {
  const { courseId } = useParams();
  const cid = Number(courseId || 0);

  const chapters = useLectureStore((s) => s.chapters as ChapterListDto[]);
  const fetchChapters = useLectureStore((s) => s.fetchChapters);
  const selectedLesson = useLectureStore(
    (s) => s.selectedLesson as LessonListDto | undefined
  );
  const [openChapters, setOpenChapters] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (cid) fetchChapters(cid);
  }, [cid, fetchChapters]);

  const authUser = useAuthStore((s) => s.user);
  const fetchEnrollmentsByUser = useEnrollmentStore((s) => s.fetchByUser);
  const fetchProgresses = useEnrollmentStore((s) => s.fetchProgresses);
  const getLessonCompleted = useEnrollmentStore((s) => s.getLessonCompleted);
  // subscribe to progresses map so component re-renders when progresses update
  const progresses = useEnrollmentStore((s) => s.progresses);

  const enrollment = useEnrollmentStore((s) => s.getEnrollmentForCourse(cid));
  const enroll = useEnrollmentStore((s) => s.enroll);

  const enrollmentsLoaded = useEnrollmentStore((s: any) =>
    Array.isArray(s.enrollments) ? s.enrollments.length > 0 : false
  );

  useEffect(() => {
    if (!authUser?.id) return;

    (async () => {
      try {
        // fetch enrollments if not already loaded globally
        if (!enrollmentsLoaded) {
          await fetchEnrollmentsByUser(String(authUser.id));
        }

        // if we already have an enrollment for this course, ensure progresses are loaded
        if (enrollment?.id) {
          try {
            await fetchProgresses(enrollment.id);
          } catch {
            // ignore
          }
        }
      } catch (err) {
        // ignore
      }
    })();
  }, [
    authUser?.id,
    fetchEnrollmentsByUser,
    enrollment,
    cid,
    enrollmentsLoaded,
    fetchProgresses,
  ]);

  const toggleChapter = (id: number) => {
    setOpenChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {!enrollment ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col items-center text-center">
          <h3 className="text-base font-semibold text-gray-900">
            Bạn chưa đăng ký khóa học này
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-4 leading-relaxed">
            Đăng ký ngay để xem đầy đủ nội dung và tài nguyên học tập.
          </p>

          <button
            onClick={async () => {
              try {
                if (!authUser?.id) {
                  navigate(`${RouteConfig.AUTH}/login`);
                  return;
                }

                // if already enrolled do nothing
                if (enrollment) return;

                // if course is free, enroll directly
                const priceNum = Number(
                  useCourseStore.getState().selectedCourse?.price ?? 0
                );
                if (!priceNum || priceNum <= 0) {
                  try {
                    await enroll({
                      appUserId: String(authUser.id),
                      courseId: cid,
                    });
                    // refresh enrollments so UI updates
                    await fetchEnrollmentsByUser(String(authUser.id));
                  } catch (err) {
                    // ignore enrollment errors for now
                  }
                  return;
                }

                // otherwise navigate to checkout with params
                const params = new URLSearchParams({
                  courseId: String(cid),
                  price: String(
                    useCourseStore.getState().selectedCourse?.price ?? 0
                  ),
                  name: String(
                    useCourseStore.getState().selectedCourse?.name ?? ""
                  ),
                  userId: String(authUser.id),
                  schoolId: String(
                    useCourseStore.getState().selectedCourse?.schoolId ?? ""
                  ),
                });

                navigate(`/payment/student/checkout?${params.toString()}`);
              } catch (err) {
                // ignore
              }
            }}
            className="mt-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all"
          >
            Đăng ký ngay
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 shadow border border-gray-100">
          <div className="text-sm font-medium text-gray-800">
            {useCourseStore.getState().selectedCourse?.name ?? "Khóa học"}
          </div>

          <div className="text-xs text-gray-500 mt-2">
            Tiến độ:{" "}
            {(() => {
              const allLessons: any[] = chapters.flatMap(
                (c) => c.lessons ?? []
              );
              const total = allLessons.length;
              const completed = allLessons.filter((l) =>
                Boolean(progresses?.[Number(l.id)])
              ).length;
              const pct =
                total === 0 ? 0 : Math.round((completed / total) * 100);
              return `${pct}%`;
            })()}
          </div>
          <div className="w-full bg-gray-100 h-2 rounded mt-3 overflow-hidden">
            <div
              className="bg-black h-2 rounded"
              style={{
                width: `${(() => {
                  const allLessons: any[] = chapters.flatMap(
                    (c) => c.lessons ?? []
                  );
                  const total = allLessons.length;
                  const completed = allLessons.filter((l) =>
                    Boolean(progresses?.[Number(l.id)])
                  ).length;
                  const pct =
                    total === 0 ? 0 : Math.round((completed / total) * 100);
                  return pct;
                })()}%`,
              }}
            />
          </div>
        </div>
      )}

      {chapters.map((ch) => {
        const isOpen = !!openChapters[ch.id];
        return (
          <div
            key={ch.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm transition-all"
          >
            <button
              aria-expanded={isOpen}
              onClick={() => toggleChapter(ch.id)}
              className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 rounded-t-2xl"
            >
              <div className="text-sm font-semibold text-gray-800">
                {ch.name}
              </div>
              <div className="text-gray-400">{isOpen ? "▾" : "▸"}</div>
            </button>

            {isOpen && ch.lessons?.length > 0 && (
              <div className="p-3 space-y-1 border-t border-gray-100">
                {ch.lessons.map((l) => {
                  const isActive = selectedLesson?.id === l.id;
                  const isLocked = !l.isPreview && !enrollment;
                  const isCompleted = getLessonCompleted(l.id);
                  return (
                    <div
                      key={l.id}
                      // navigation disabled on lesson name click per request
                      className={`flex items-center justify-between text-sm rounded-lg p-2 ${
                        isActive
                          ? "bg-black text-white shadow-sm"
                          : isLocked
                          ? "opacity-50 cursor-not-allowed"
                          : "text-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`flex-none w-5 h-5 rounded-full flex items-center justify-center text-xs border ${
                            isActive
                              ? "bg-white text-black border-black"
                              : l.isPreview && l.id !== ch.lessons?.[0]?.id
                              ? "bg-black text-white border-black"
                              : isCompleted
                              ? "bg-green-500 text-white border-green-500"
                              : "bg-white text-gray-400 border-gray-300"
                          }`}
                        >
                          {isCompleted ? "✓" : "●"}
                        </div>

                        <div
                          className={`flex-1 min-w-0 ${
                            isActive ? "font-semibold" : ""
                          }`}
                        >
                          <div className="truncate">{l.name}</div>
                        </div>
                      </div>
                      <div
                        className={`text-xs ${
                          isActive ? "text-gray-200" : "text-gray-500"
                        }`}
                      >
                        {l.type}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LectureFilters;
