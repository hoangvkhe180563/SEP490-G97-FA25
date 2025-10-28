import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import type { ChapterListDto, LessonListDto } from "../types/api";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";

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

  const currentUser = useAppUserStore((s) => s.appUser);
  const effectiveUser = currentUser ?? {
    id: "b2c3d4e5-f6a7-8901-2345-67890abcdef0",
    fullname: "Demo Student",
  };
  const fetchEnrollmentsByUser = useEnrollmentStore((s) => s.fetchByUser);
  const getEnrollmentForCourse = useEnrollmentStore(
    (s) => s.getEnrollmentForCourse
  );
  const enrollAction = useEnrollmentStore((s) => s.enroll);
  const fetchProgresses = useEnrollmentStore((s) => s.fetchProgresses);
  const getLessonCompleted = useEnrollmentStore((s) => s.getLessonCompleted);
  // subscribe to progresses map so component re-renders when progresses update
  const progresses = useEnrollmentStore((s) => s.progresses);
  const [enrollment, setEnrollment] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await fetchEnrollmentsByUser(String(effectiveUser.id));
        const found = getEnrollmentForCourse(cid);
        setEnrollment(found);
        // if already enrolled, fetch progresses to populate completion map
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
  }, [
    effectiveUser.id,
    fetchEnrollmentsByUser,
    getEnrollmentForCourse,
    cid,
    fetchProgresses,
  ]);

  const toggleChapter = (id: number) => {
    setOpenChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {/* Enroll CTA when logged in but not enrolled */}
      {currentUser && !enrollment && (
        <div className="bg-white rounded-2xl p-4 shadow border border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-800">
              Bạn chưa đăng ký khóa học này
            </div>
            <div className="text-xs text-gray-500">
              Đăng ký để xem đầy đủ nội dung
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                await enrollAction({
                  appUserId: String(effectiveUser.id),
                  courseId: cid,
                });
                const found = getEnrollmentForCourse(cid);
                setEnrollment(found);
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
            }}
            className="bg-black text-white px-3 py-2 rounded"
          >
            Đăng ký
          </button>
        </div>
      )}
      <div className="bg-white rounded-2xl p-4 shadow border border-gray-100">
        <div className="text-sm font-medium text-gray-800">
          {useCourseStore.getState().selectedCourse?.name ?? "Khóa học"}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Tiến độ:{" "}
          {(() => {
            const allLessons: any[] = chapters.flatMap((c) => c.lessons ?? []);
            const total = allLessons.length;
            const completed = allLessons.filter((l) =>
              Boolean(progresses?.[Number(l.id)])
            ).length;
            const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
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
