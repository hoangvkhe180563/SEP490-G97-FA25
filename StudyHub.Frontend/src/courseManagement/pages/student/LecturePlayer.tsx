import React, { useEffect, useRef, useState } from "react";
import LectureResources from "@/courseManagement/components/LectureResources";
import LectureDiscussion from "@/courseManagement/components/LectureDiscussion";
import LectureNextUp from "@/courseManagement/components/LectureNextUp";
import { Button } from "@/common/components/ui/button";
import LectureFilters from "@/courseManagement/components/LectureFilters";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { useParams } from "react-router-dom";

const LecturePlayer: React.FC = () => {
  const { lessonId, courseId } = useParams();
  const lid = Number(lessonId || 0);
  const cid = Number(courseId || 0);

  const selectedLesson = useLectureStore((s: any) => s.selectedLesson);
  const fetchChapters = useLectureStore((s: any) => s.fetchChapters);
  const fetchLesson = useLectureStore((s: any) => s.fetchLesson);
  const updateLesson = useLectureStore((s: any) => s.updateLesson);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [localProgress, setLocalProgress] = useState<number>(
    (selectedLesson?.progress as number) ?? 0
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
  }, [cid, lid, fetchChapters, fetchLesson]);

  // keep localProgress in sync when selectedLesson changes
  useEffect(() => {
    setLocalProgress((selectedLesson?.progress as number) ?? 0);
    // restore bookmark from localStorage
    if (selectedLesson?.id) {
      const key = `bookmark_lesson_${selectedLesson.id}`;
      setBookmarked(Boolean(localStorage.getItem(key)));
    }
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
    };

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("pause", onPauseOrEnd);
    v.addEventListener("ended", onPauseOrEnd);

    const onBefore = async () => {
      const pct = Math.round((v.currentTime / (v.duration || 1)) * 100);
      await saveProgress(pct);
    };
    window.addEventListener("beforeunload", onBefore);

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("pause", onPauseOrEnd);
      v.removeEventListener("ended", onPauseOrEnd);
      window.removeEventListener("beforeunload", onBefore);
    };
  }, [videoRef, selectedLesson, updateLesson, saveProgress]);

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
                <div className="text-sm text-gray-500 mb-2">
                  My Courses / Course
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
                  Save
                </button>
                <button className="border rounded px-3 py-1 text-sm">
                  Share
                </button>
              </div>
            </div>

            <div className="bg-black h-[420px] rounded mb-4 flex items-center justify-center text-white">
              {selectedLesson?.videoUrl ? (
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  controls
                  src={selectedLesson.videoUrl as string}
                />
              ) : (
                <div className="text-3xl">▶</div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <Button
                className="bg-black text-white"
                onClick={() => videoRef.current?.play()}
              >
                Play
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const url =
                    selectedLesson?.fileUrl || selectedLesson?.videoUrl;
                  if (!url) return;
                  const a = document.createElement("a");
                  a.href = url as string;
                  a.target = "_blank";
                  a.rel = "noopener noreferrer";
                  // trigger download if fileUrl available
                  if (selectedLesson?.fileUrl) a.download = "";
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
              >
                Download
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (!selectedLesson?.id) return;
                  const key = `bookmark_lesson_${selectedLesson.id}`;
                  if (bookmarked) {
                    localStorage.removeItem(key);
                    setBookmarked(false);
                  } else {
                    localStorage.setItem(key, "1");
                    setBookmarked(true);
                  }
                }}
              >
                {bookmarked ? "Bookmarked" : "Bookmark"}
              </Button>
            </div>

            <div className="bg-white border rounded p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Progress</h4>
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
                    } catch {
                      // ignore
                    }
                  }}
                  disabled={Boolean((selectedLesson?.progress ?? 0) >= 100)}
                >
                  Mark complete
                </Button>
              </div>
            </div>

            <div className="bg-white border rounded p-4">
              <h4 className="font-medium mb-2">Lecture Transcript</h4>
              <div className="max-h-48 overflow-auto text-sm text-gray-700">
                <p>
                  {selectedLesson?.description ??
                    selectedLesson?.content ??
                    "No transcript available."}
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
