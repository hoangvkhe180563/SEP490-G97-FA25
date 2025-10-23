import React, { useEffect, useRef, useState } from "react";
import LectureResources from "@/courseManagement/components/LectureResources";
import LectureDiscussion from "@/courseManagement/components/LectureDiscussion";
import LectureNextUp from "@/courseManagement/components/LectureNextUp";
import { Button } from "@/common/components/ui/button";
import LectureFilters from "@/courseManagement/components/LectureFilters";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { useNavigate, useParams } from "react-router-dom";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";

const LecturePlayer: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const lid = Number(
    (params as any).lectureId ?? (params as any).lessonId ?? 0
  );
  const cid = Number((params as any).courseId ?? 0);

  const selectedLesson = useLectureStore((s: any) => s.selectedLesson);
  const fetchChapters = useLectureStore((s: any) => s.fetchChapters);
  const fetchLesson = useLectureStore((s: any) => s.fetchLesson);
  const updateLesson = useLectureStore((s: any) => s.updateLesson);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [localProgress, setLocalProgress] = useState<number>(
    (selectedLesson?.progress as number) ?? 0
  );
  const currentUser = useAppUserStore((s: any) => s.appUser);
  const fetchEnrollmentsByUser = useEnrollmentStore((s: any) => s.fetchByUser);
  const getEnrollmentForCourse = useEnrollmentStore(
    (s: any) => s.getEnrollmentForCourse
  );
  const recordProgress = useEnrollmentStore((s: any) => s.recordProgress);
  const fetchProgresses = useEnrollmentStore((s: any) => s.fetchProgresses);
  const enrollment = getEnrollmentForCourse(cid);
  const [enrollmentId, setEnrollmentId] = useState<number | null>(
    enrollment?.id ?? null
  );

  // persist progress helper
  const saveProgress = React.useCallback(
    async (value: number) => {
      if (!selectedLesson?.id || !updateLesson) return;
      try {
        await updateLesson(selectedLesson.id, {
          ...(selectedLesson as any),
          progress: value,
        });
      } catch (err) {
        // ignore
      }
    },
    [selectedLesson, updateLesson]
  );

  useEffect(() => {
    if (cid) fetchChapters(cid);
    if (lid) fetchLesson(lid);
    // ensure enrollments are loaded in store for current user and find enrollment id
    (async () => {
      if (!currentUser) return;
      try {
        await fetchEnrollmentsByUser(String(currentUser.id));
      } catch (err) {
        // ignore
      }
      const found = getEnrollmentForCourse(cid);
      if (found) {
        setEnrollmentId(found.id);
        try {
          // populate per-lesson progresses for UI
          await fetchProgresses(found.id);
        } catch (err) {
          // ignore
        }
      }
    })();
  }, [
    cid,
    lid,
    fetchChapters,
    fetchLesson,
    fetchEnrollmentsByUser,
    getEnrollmentForCourse,
    currentUser,
    fetchProgresses,
  ]);

  // keep localProgress in sync when selectedLesson changes
  useEffect(() => {
    setLocalProgress((selectedLesson?.progress as number) ?? 0);
  }, [selectedLesson]);

  // attach video events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoaded = () => {
      const prog = (selectedLesson?.progress as number) ?? 0;
      if (prog > 0 && v.duration && isFinite(v.duration)) {
        try {
          v.currentTime = (prog / 100) * v.duration;
        } catch (err) {
          // ignore seek errors on some browsers
          console.debug("seek error", err);
        }
      }
    };

    const onTime = () => {
      if (!v.duration || !isFinite(v.duration)) return;
      const pct = Math.round((v.currentTime / v.duration) * 100);
      setLocalProgress(pct);
    };

    const onPauseOrEnd = async () => {
      const pct = Math.round((v.currentTime / (v.duration || 1)) * 100);
      setLocalProgress(pct);
      await saveProgress(pct);
      if (enrollmentId && selectedLesson?.id) {
        try {
          await recordProgress(enrollmentId, {
            lessonId: selectedLesson.id,
            completionDate: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }
    };

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("pause", onPauseOrEnd);
    v.addEventListener("ended", onPauseOrEnd);

    const onBefore = async () => {
      const pct = Math.round((v.currentTime / (v.duration || 1)) * 100);
      await saveProgress(pct);
      if (enrollmentId && selectedLesson?.id) {
        try {
          await recordProgress(enrollmentId, {
            lessonId: selectedLesson.id,
            completionDate: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("beforeunload", onBefore);

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("pause", onPauseOrEnd);
      v.removeEventListener("ended", onPauseOrEnd);
      window.removeEventListener("beforeunload", onBefore);
    };
  }, [
    videoRef,
    selectedLesson,
    updateLesson,
    saveProgress,
    enrollmentId,
    recordProgress,
  ]);

  return (
    <div className="w-full bg-white">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-3">
            <LectureFilters />
          </aside>

          <main className="col-span-12 lg:col-span-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <button
                  onClick={() => navigate(`/course/student/courses/${cid}`)}
                  className="w-8 h-8 mb-4 border rounded"
                  aria-label="Go back"
                >
                  ←
                </button>
                <div className="text-sm text-gray-500 mb-2">
                  Khóa học của tôi / Khóa học
                </div>
                <div className="text-lg font-medium">
                  {selectedLesson?.name ?? "Lecture"}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {selectedLesson?.type ?? ""}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="border rounded px-3 py-1 text-sm">
                  Lưu
                </button>
                <button className="border rounded px-3 py-1 text-sm">
                  Chia sẻ
                </button>
              </div>
            </div>

            <div className="bg-black h-[420px] rounded mb-4 flex items-center justify-center text-white">
              {selectedLesson?.videoUrl ? (
                (() => {
                  const src = String(selectedLesson.videoUrl || "");
                  const lower = src.toLowerCase();
                  const isMp4 = lower.endsWith(".mp4");
                  const isEmbed =
                    /youtube|vimeo|embed/.test(lower) || src.includes("iframe");

                  if (isEmbed || (!isMp4 && src.startsWith("http"))) {
                    return (
                      <iframe
                        src={src}
                        title={selectedLesson?.name || "embed-player"}
                        className="w-full h-full"
                        frameBorder={0}
                        allowFullScreen
                      />
                    );
                  }

                  return (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-contain"
                      controls
                      src={src}
                    />
                  );
                })()
              ) : (
                <div className="text-3xl">▶</div>
              )}
            </div>
            <div className="bg-white border rounded p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Tiến độ</h4>
                <div className="text-sm text-gray-600">{localProgress}%</div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={localProgress}
                onChange={(e) => setLocalProgress(Number(e.target.value))}
                onMouseUp={async () => {
                  if (!selectedLesson?.id || !updateLesson) return;
                  try {
                    await updateLesson(selectedLesson.id, {
                      ...(selectedLesson as any),
                      progress: localProgress,
                    });
                  } catch {
                    // ignore
                  }
                }}
                className="w-full mt-2"
              />
              <div className="flex items-center justify-end gap-2 mt-3">
                <Button
                  onClick={async () => {
                    if (!selectedLesson?.id || !updateLesson) return;
                    try {
                      await updateLesson(selectedLesson.id, {
                        ...(selectedLesson as any),
                        progress: 100,
                      });
                      setLocalProgress(100);
                      if (enrollmentId) {
                        try {
                          await recordProgress(enrollmentId, {
                            lessonId: selectedLesson.id,
                            completionDate: new Date().toISOString(),
                          });
                          // refresh local progresses map
                          await fetchProgresses(enrollmentId);
                        } catch {
                          // ignore
                        }
                      }
                    } catch {
                      // ignore
                    }
                  }}
                  disabled={Boolean((selectedLesson?.progress ?? 0) >= 100)}
                >
                  Đánh dấu hoàn thành
                </Button>
              </div>
            </div>

            <div className="bg-white border rounded p-4">
              <h4 className="font-medium mb-2">Bảng ghi chép bài giảng</h4>
              <div className="max-h-48 overflow-auto text-sm text-gray-700">
                <p>
                  {selectedLesson?.description ??
                    selectedLesson?.content ??
                    "Không có bảng ghi chép nào."}
                </p>
              </div>
            </div>
          </main>

          <aside className="col-span-12 lg:col-span-3 space-y-4">
            <LectureResources />
            <LectureDiscussion />
            <LectureNextUp />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default LecturePlayer;
