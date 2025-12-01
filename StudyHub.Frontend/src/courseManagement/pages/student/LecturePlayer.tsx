import React, { useEffect, useRef, useState } from "react";
import LectureResources from "@/courseManagement/components/LectureResources";
import LectureDiscussion from "@/courseManagement/components/LectureDiscussion";
import LectureNextUp from "@/courseManagement/components/LectureNextUp";
import { Button } from "@/common/components/ui/button";
import LectureFilters from "@/courseManagement/components/LectureFilters";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import type { LessonExamStatus, LessonListDto } from "@/courseManagement/interfaces/types";
import { useNavigate, useParams } from "react-router-dom";
import { useEnrollmentStore } from "@/courseManagement/stores/useEnrollmentStore";
import { Check, HelpCircle, NotebookPen, X } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/common/components/ui/popover";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { formatISO } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/common/components/ui/alert-dialog";
import courseApi from "@/courseManagement/services/courseService";
import toast from "react-hot-toast";
// Progress UI removed for Video lessons; keep setters used by auto-complete logic

const LecturePlayer: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const lid = Number(
    (params as any).lectureId ?? (params as any).lessonId ?? 0
  );
  const cid = Number((params as any).courseId ?? 0);

  const selectedLesson = useLectureStore(
    (s: any) => s.selectedLesson
  ) as LessonListDto | null;
  const fetchChapters = useLectureStore((s: any) => s.fetchChapters);
  const fetchLesson = useLectureStore((s: any) => s.fetchLesson);
  const fetchInteractiveQuestions = useLectureStore(
    (s: any) => s.fetchInteractiveQuestions
  );
  const submitInteractiveResponse = useLectureStore(
    (s: any) => s.submitInteractiveResponse
  );

  const [interactiveQuestions, setInteractiveQuestions] = useState<any[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<any | null>(null);
  const activeQuestionRef = useRef<any | null>(null);
  const answeredQuestionIdsRef = useRef<Set<any>>(new Set());
  const [interactiveAnswerText, setInteractiveAnswerText] =
    useState<string>("");

  // submit handler: use store method if available
  const handleSubmitAnswer = async (answer: any) => {
    const q = activeQuestionRef.current ?? activeQuestion;
    if (!q) return;
    setIsSubmitting(true);
    if (typeof answer === "object" && answer.selectedIndex !== undefined) {
      setSelectedOptionIndex(answer.selectedIndex);
    }

    let serverResp: any = null;
    let isCorrect = false;
    try {
      if (submitInteractiveResponse) {
        serverResp = await submitInteractiveResponse(lid, {
          questionId: q.id,
          answer,
        });
      }
    } catch (err) {
      console.warn("submitInteractiveResponse failed", err);
    }

    // determine correctness: prefer server response, otherwise local check
    try {
      if (serverResp && typeof serverResp.isCorrect === "boolean") {
        isCorrect = serverResp.isCorrect;
      } else if (q.type === "mc") {
        isCorrect =
          (answer && answer.selectedIndex) === (q.correctIndex ?? null);
      } else if (q.type === "text") {
        if (q.correctAnswer) {
          const given = String(answer ?? "")
            .trim()
            .toLowerCase();
          const expect = String(q.correctAnswer ?? "")
            .trim()
            .toLowerCase();
          isCorrect = given === expect;
        } else {
          // unknown: treat as incorrect by default
          isCorrect = false;
        }
      }
    } catch {
      isCorrect = false;
    }

    setSubmissionResult(isCorrect);
    setIsSubmitting(false);

    // show feedback briefly then mark answered and resume playback
    window.setTimeout(() => {
      try {
        answeredQuestionIdsRef.current.add(q.id);
      } catch {
        // ignore
      }
      setActiveQuestion(null);
      activeQuestionRef.current = null;
      setInteractiveAnswerText("");
      setSubmissionResult(null);
      setSelectedOptionIndex(null);

      // resume playback
      try {
        if (ytPlayerRef.current && (ytPlayerRef.current.playVideo as any)) {
          try {
            ytPlayerRef.current.playVideo();
          } catch {
            // ignore
          }
        }
        if (videoRef.current) {
          try {
            void videoRef.current.play();
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    }, 1100);
  };

  // nicer UI state for overlay
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<boolean | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [_localProgress, setLocalProgress] = useState<number>(0);
  const [_currentTime, setCurrentTime] = useState<number>(0);
  const [_durationSec, setDurationSec] = useState<number>(0);
  const ytPlayerRef = useRef<any | null>(null);
  const authUser = useAuthStore((s) => s.user);
  const fetchEnrollmentsByUser = useEnrollmentStore((s: any) => s.fetchByUser);
  const recordProgress = useEnrollmentStore((s: any) => s.recordProgress);
  const fetchProgresses = useEnrollmentStore((s: any) => s.fetchProgresses);
  const _enrollAction = useEnrollmentStore((s: any) => s.enroll);
  const enrollment = useEnrollmentStore((s: any) => s.getEnrollmentForCourse(cid));
  const enrollmentId = enrollment?.id ?? null;
  const [examDialogOpen, setExamDialogOpen] = useState<boolean>(false);
  const [examStatus, setExamStatus] = useState<LessonExamStatus | null>(null);
  const [examResultId, setExamResultId] = useState<string>('');

  const localKey = React.useCallback(
    (lessonId: number) => `studyhub_local_progress_${lessonId}`,
    []
  );

  const readLocalData = React.useCallback(
    (lessonId: number) => {
      try {
        const raw = localStorage.getItem(localKey(lessonId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return (
          (parsed as {
            progress?: number;
            completed?: boolean;
            ts?: number;
          } | null) ?? null
        );
      } catch {
        return null;
      }
    },
    [localKey]
  );

  const writeLocalData = React.useCallback(
    (lessonId: number, progress: number, completed?: boolean) => {
      try {
        const obj = { progress, completed: Boolean(completed), ts: Date.now() };
        localStorage.setItem(localKey(lessonId), JSON.stringify(obj));
      } catch {
        // ignore
      }
    },
    [localKey]
  );

  const saveProgress = React.useCallback(
    async (percent: number) => {
      if (selectedLesson?.id) {
        try {
          writeLocalData(selectedLesson.id, percent, percent >= 100);
        } catch {
          // ignore
        }
      }

      if (!enrollmentId || !selectedLesson?.id) return;
      if (percent >= 100) {
        try {
          await recordProgress(enrollmentId, {
            lessonId: selectedLesson.id,
            completionDate: formatISO(new Date()),
          });
          await fetchProgresses(enrollmentId); // refresh local store
        } catch (err) {
          console.error("saveProgress error", err);
        }
      }
    },
    [
      enrollmentId,
      selectedLesson,
      recordProgress,
      fetchProgresses,
      writeLocalData,
    ]
  );

  useEffect(() => {
    if (cid) fetchChapters(cid);
    if (lid) {
      fetchLesson(lid);
      (async () => {
        try {
          if (fetchInteractiveQuestions) {
            const qs = await fetchInteractiveQuestions(lid);
            if (Array.isArray(qs)) setInteractiveQuestions(qs);
          }
        } catch (err) {
          console.warn("failed to fetch interactive questions", err);
        }
      })();
    }
    void _enrollAction;
    (async () => {
      try {
        if (!authUser?.id) return;
        await fetchEnrollmentsByUser(String(authUser.id));
      } catch (err) {
        // ignore
      }
      // if the enrollment for this course is already present (or becomes present
      // via the reactive selector), ensure we have progresses loaded
      if (enrollment?.id) {
        try {
          await fetchProgresses(enrollment.id);
        } catch (err) {
          // ignore
        }
      }
    })();
  }, [
    cid,
    lid,
    authUser?.id,
    fetchChapters,
    fetchLesson,
    fetchInteractiveQuestions,
    fetchEnrollmentsByUser,
    fetchProgresses,
    _enrollAction,
    enrollment?.id,
  ]);

  useEffect(() => {
    if (!lid || !authUser || selectedLesson?.type !== 'Exam') return;
    const fetchExamStatus = async () => {
      const status = await courseApi.checkExamStatus(lid, String(authUser?.id));
      if (status === null) {
        toast.error("Không thể lấy trạng thái bài kiểm tra!");
        return;
      }
      setExamStatus(status);

      const resultId = await courseApi.getResultIdByLessonId(lessonId, authUser.id ?? '');
      setExamResultId(resultId);
    }

    fetchExamStatus();

  }, [lid, selectedLesson, authUser])

  useEffect(() => {
    if (!lid) return;
    try {
      const local = readLocalData(lid);
      if (local) setLocalProgress(local.progress ?? 0);
    } catch {
      // ignore
    }
  }, [lid, readLocalData]);

  useEffect(() => {
    const local = selectedLesson?.id ? readLocalData(selectedLesson.id) : null;
    if (local) {
      setLocalProgress(local.progress ?? 0);
    } else {
      setLocalProgress(0);
    }
  }, [selectedLesson, readLocalData]);

  // derive lessonId and subscribe to its completed status reactively
  const lessonId = selectedLesson?.id ?? lid;
  const isLessonCompleted = useEnrollmentStore((s: any) =>
    lessonId ? s.getLessonCompleted(lessonId) : false
  );

  // attach video events (handles both HTML5 <video> and YouTube iframe via IFrame API)
  useEffect(() => {
    const src = String(selectedLesson?.videoUrl || "").toLowerCase();
    const isYouTube = /youtube|youtu\.be/.test(src);

    // If this is a video lesson and the user is not enrolled, do not track progress or auto-complete.
    // The player/iframe will still render so guests can watch, but we won't record progress.
    if (selectedLesson?.type === "Video" && !enrollmentId) {
      return;
    }

    // helper to merge intervals
    const mergeIntervals = (arr: Array<[number, number]>) => {
      if (!arr.length) return 0;
      const sorted = arr.slice().sort((a, b) => a[0] - b[0]);
      const merged: Array<[number, number]> = [];
      let [s, e] = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        const [cs, ce] = sorted[i];
        if (cs <= e + 0.5) {
          e = Math.max(e, ce);
        } else {
          merged.push([s, e]);
          s = cs;
          e = ce;
        }
      }
      merged.push([s, e]);
      return merged.reduce((sum, [a, b]) => sum + Math.max(0, b - a), 0);
    };

    // YouTube handling using IFrame API
    if (isYouTube) {
      // extract video id
      const getYouTubeId = (url: string) => {
        const m = url.match(/(?:v=|\/embed\/|\.be\/)([A-Za-z0-9_-]{6,11})/);
        return m ? m[1] : null;
      };

      const videoId = getYouTubeId(String(selectedLesson?.videoUrl || ""));
      const elId = `yt-player-${selectedLesson?.id ?? "unknown"}`;

      // cleanup existing player
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
        ytPlayerRef.current = null;
      }

      if (!videoId) return;

      const ensureApi = () =>
        new Promise<void>((resolve) => {
          if ((window as any).YT && (window as any).YT.Player) return resolve();
          const existing = document.querySelector(
            'script[src="https://www.youtube.com/iframe_api"]'
          );
          if (!existing) {
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
          }
          const check = () => {
            if ((window as any).YT && (window as any).YT.Player)
              return resolve();
            setTimeout(check, 250);
          };
          check();
        });

      const watchedIntervals: Array<[number, number]> = [];
      let lastTick = 0;
      let isPlaying = false;
      let autoCompleted = false;
      const WATCHED_THRESHOLD = 0.9;

      const checkAutoComplete = async (duration: number) => {
        if (!duration || autoCompleted) return;
        const watched = mergeIntervals(watchedIntervals);
        const pctWatched = watched / duration;
        if (pctWatched >= WATCHED_THRESHOLD) {
          autoCompleted = true;
          try {
            setLocalProgress(100);
            await saveProgress(100);
            if (enrollmentId && selectedLesson?.id) {
              await recordProgress(enrollmentId, {
                lessonId: selectedLesson.id,
                completionDate: formatISO(new Date()),
              });
              await fetchProgresses(enrollmentId);
            }
          } catch (err) {
            console.warn("auto-complete failed", err);
          }
        }
      };

      let pollId: number | null = null;

      (async () => {
        await ensureApi();
        try {
          ytPlayerRef.current = new (window as any).YT.Player(elId, {
            videoId,
            playerVars: {
              controls: 0,
              modestbranding: 1,
              rel: 0,
              origin: window.location.origin,
            },
            events: {
              onReady: (e: any) => {
                try {
                  const duration = e.target.getDuration() || 0;
                  if (duration && isFinite(duration))
                    setDurationSec(Math.round(duration));
                  // prefer locally saved progress for seeking (server progress is not part of Lesson DTO)
                  const prog = selectedLesson?.id
                    ? readLocalData(selectedLesson.id)?.progress ?? 0
                    : 0;
                  if (prog > 0 && duration) {
                    try {
                      e.target.seekTo((prog / 100) * duration, true);
                    } catch (err) {
                      // ignore
                    }
                  }
                } catch {
                  // ignore
                }
              },
              onStateChange: async (ev: any) => {
                const state = ev.data;
                if (state === 1) {
                  isPlaying = true;
                  try {
                    lastTick = ytPlayerRef.current.getCurrentTime() || 0;
                  } catch {
                    // ignore
                  }
                  if (!pollId) {
                    pollId = window.setInterval(async () => {
                      try {
                        let now = ytPlayerRef.current.getCurrentTime() || 0;
                        const duration = ytPlayerRef.current.getDuration() || 0;

                        // prevent seeking forward
                        if (Math.abs(now - lastTick) > 2) {
                          ytPlayerRef.current.seekTo(lastTick, true);
                          now = lastTick;
                        }

                        // update watched
                        if (isPlaying) {
                          const start = Math.min(lastTick, now);
                          const end = Math.max(lastTick, now);
                          if (end - start >= 0.2)
                            watchedIntervals.push([start, end]);
                        }
                        lastTick = now;
                        if (duration && isFinite(duration)) {
                          const pct = Math.round((now / duration) * 100);
                          setLocalProgress(pct);
                          setCurrentTime(Math.round(now));
                        }

                        // 🔥 CHECK INTERACTIVE QUESTION NGAY Ở ĐÂY
                        if (
                          interactiveQuestions &&
                          interactiveQuestions.length > 0 &&
                          !activeQuestionRef.current
                        ) {
                          const q = interactiveQuestions.find(
                            (x: any) =>
                              !answeredQuestionIdsRef.current.has(x.id) &&
                              Math.abs(now - (x.timeSec || 0)) <= 1.5
                          );
                          if (q) {
                            try {
                              ytPlayerRef.current.pauseVideo();
                            } catch {
                              // ignore
                            }
                            activeQuestionRef.current = q;
                            setActiveQuestion(q);
                          }
                        }

                        // check auto-complete
                        await checkAutoComplete(duration);
                      } catch {
                        // ignore
                      }
                    }, 500) as unknown as number;
                  }
                } else if (state === 2 || state === 0) {
                  const now = ytPlayerRef.current.getCurrentTime() || 0;
                  if (isPlaying) {
                    watchedIntervals.push([
                      Math.min(lastTick, now),
                      Math.max(lastTick, now),
                    ]);
                  }
                  isPlaying = false;

                  try {
                    const duration = ytPlayerRef.current.getDuration() || 0;
                    const pct = Math.round((now / (duration || 1)) * 100);
                    setLocalProgress(pct);
                    await saveProgress(pct);
                    await checkAutoComplete(duration);
                    // only record completion to server when we've reached 100% (or autoCompleted was triggered)
                    if (
                      enrollmentId &&
                      selectedLesson?.id &&
                      (pct >= 100 || autoCompleted)
                    ) {
                      try {
                        await recordProgress(enrollmentId, {
                          lessonId: selectedLesson.id,
                          completionDate: formatISO(new Date()),
                        });
                        await fetchProgresses(enrollmentId);
                      } catch {
                        // ignore
                      }
                    }
                  } catch {
                    // ignore
                  }

                  if (pollId) {
                    window.clearInterval(pollId as any);
                    pollId = null;
                  }
                }
              },
            },
          });
        } catch (err) {
          // ignore player creation errors
        }
      })();

      return () => {
        if (ytPlayerRef.current) {
          try {
            ytPlayerRef.current.destroy();
          } catch {
            // ignore
          }
          ytPlayerRef.current = null;
        }
        if (pollId) {
          window.clearInterval(pollId as any);
          pollId = null;
        }
      };
    }

    // HTML5 video handling (existing behavior)
    const v = videoRef.current;
    if (!v) return;

    const onLoaded = () => {
      const prog = selectedLesson?.id
        ? readLocalData(selectedLesson.id)?.progress ?? 0
        : 0;
      if (prog > 0 && v.duration && isFinite(v.duration)) {
        try {
          v.currentTime = (prog / 100) * v.duration;
        } catch (err) {
          // ignore seek errors on some browsers
          console.debug("seek error", err);
        }
      }
      if (v.duration && isFinite(v.duration))
        setDurationSec(Math.round(v.duration));
    };

    // interval-tracking for watched seconds to avoid false-complete via seeking
    const watchedIntervals: Array<[number, number]> = [];
    let lastTick = v.currentTime || 0;
    let isPlaying = false;
    let autoCompleted = false;
    const WATCHED_THRESHOLD = 0.9; // 90%

    const checkAutoComplete = async () => {
      if (!v.duration || !isFinite(v.duration) || autoCompleted) return;
      const watched = mergeIntervals(watchedIntervals);
      const pctWatched = watched / v.duration;
      if (pctWatched >= WATCHED_THRESHOLD) {
        autoCompleted = true;
        try {
          setLocalProgress(100);
          await saveProgress(100);
          if (enrollmentId && selectedLesson?.id) {
            await recordProgress(enrollmentId, {
              lessonId: selectedLesson.id,
              completionDate: formatISO(new Date()),
            });
            // refresh local progresses
            await fetchProgresses(enrollmentId);
          }
        } catch (err) {
          console.warn("auto-complete failed", err);
        }
      }
    };

    const onTime = () => {
      if (!v.duration || !isFinite(v.duration)) return;
      // update UI percent/time
      const pct = Math.round((v.currentTime / v.duration) * 100);
      setLocalProgress(pct);
      setCurrentTime(Math.round(v.currentTime));

      // accumulate watched intervals while playing
      const now = v.currentTime || 0;
      if (isPlaying) {
        const start = Math.min(lastTick, now);
        const end = Math.max(lastTick, now);
        if (end - start >= 0.2) {
          watchedIntervals.push([start, end]);
        }
      }
      lastTick = now;

      // periodically check if we've watched enough
      try {
        void checkAutoComplete();
      } catch {
        // ignore
      }
      // check interactive questions (HTML5 video)
      try {
        if (
          interactiveQuestions &&
          interactiveQuestions.length > 0 &&
          !activeQuestionRef.current
        ) {
          const q = interactiveQuestions.find(
            (x: any) =>
              !answeredQuestionIdsRef.current.has(x.id) &&
              Math.abs((v.currentTime || 0) - (x.timeSec || 0)) <= 1.5
          );
          if (q) {
            try {
              v.pause();
            } catch {
              // ignore
            }
            activeQuestionRef.current = q;
            setActiveQuestion(q);
          }
        }
      } catch {
        // ignore
      }
    };

    // prevent the user from seeking by reverting any seeking attempts
    const onSeeking = () => {
      try {
        // restore to last known tick to disallow user seek
        v.currentTime = lastTick;
      } catch {
        // ignore
      }
    };

    const onPlay = () => {
      isPlaying = true;
      lastTick = v.currentTime || 0;
    };

    const onPauseOrEnd = async () => {
      // record final fragment when pausing/ending
      const now = v.currentTime || 0;
      if (isPlaying) {
        watchedIntervals.push([
          Math.min(lastTick, now),
          Math.max(lastTick, now),
        ]);
      }
      isPlaying = false;

      const pct = Math.round((v.currentTime / (v.duration || 1)) * 100);
      setLocalProgress(pct);
      await saveProgress(pct);
      // attempt auto-complete as a last resort
      try {
        await checkAutoComplete();
      } catch {
        // ignore
      }

      // Only record to server if fully completed (avoid writing partial progress as completion)
      if (enrollmentId && selectedLesson?.id && (pct >= 100 || autoCompleted)) {
        try {
          await recordProgress(enrollmentId, {
            lessonId: selectedLesson.id,
            completionDate: formatISO(new Date()),
          });
          await fetchProgresses(enrollmentId);
        } catch {
          // ignore
        }
      }
    };

    const onSeeked = () => {
      // when seeking, close current play segment
      if (isPlaying) {
        const now = v.currentTime || 0;
        watchedIntervals.push([
          Math.min(lastTick, now),
          Math.max(lastTick, now),
        ]);
        lastTick = now;
      }
    };

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("playing", onPlay);
    v.addEventListener("seeking", onSeeking);
    v.addEventListener("pause", onPauseOrEnd);
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("ended", onPauseOrEnd);

    const onBefore = async () => {
      const pct = Math.round((v.currentTime / (v.duration || 1)) * 100);
      await saveProgress(pct);
      try {
        await checkAutoComplete();
      } catch {
        // ignore
      }
      // Only write completion event when actually completed
      if (enrollmentId && selectedLesson?.id && (pct >= 100 || autoCompleted)) {
        try {
          await recordProgress(enrollmentId, {
            lessonId: selectedLesson.id,
            completionDate: formatISO(new Date()),
          });
          await fetchProgresses(enrollmentId);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("beforeunload", onBefore);

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("playing", onPlay);
      v.removeEventListener("pause", onPauseOrEnd);
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("seeking", onSeeking);
      v.removeEventListener("ended", onPauseOrEnd);
      window.removeEventListener("beforeunload", onBefore);
    };
  }, [
    videoRef,
    selectedLesson,
    readLocalData,
    saveProgress,
    fetchProgresses,
    enrollmentId,
    recordProgress,
    interactiveQuestions,
    submitInteractiveResponse,
  ]);

  const handleStartExam = async () => {
    const exam = await courseApi.getExamByLessonId(lessonId);
    if (exam) {
      location.href = `/exam/student/take-exam/${exam.id}`;
    } else {
      toast.error("Không có bài kiểm tra!");
    }
  };

  const handleViewExamResult = async () => {
    if (!authUser) {
      toast.error("Chưa đăng nhập vui lòng thử lại!");
      return;
    }

    if (examResultId == '') {
      toast.error("Không lấy được dữ liệu bài làm!");
      return;
    }

    navigate(`/exam/results/${examResultId}`);
  }

  const calculateExamEnableTime = () => {
    const now = new Date();
    if (!examStatus?.isDisabled) return 0;
    const remainingTime = examStatus.latestTime.getTime() + (8 * 60 * 60 * 1000) - now.getTime();
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor(
      (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
    );
    return `${hours} giờ ${minutes} phút`;
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen p-4 h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-3">
            <LectureFilters />
          </aside>
          <main className="col-span-12 lg:col-span-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/course/student/courses/${cid}`)}
                  className="w-9 h-9 mb-3 p-0 flex items-center justify-center"
                  aria-label="Go back"
                >
                  ←
                </Button>
                <div className="text-sm text-gray-500 mb-2">
                  Khóa học của tôi / Khóa học
                </div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
                    {selectedLesson?.name ?? "Lecture"}
                  </h1>
                  {isLessonCompleted && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}

                  {/* Help / rules popover (shadcn style) - show only for Video lessons */}
                  {selectedLesson?.type === "Video" && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-sm transition-all">
                          <HelpCircle className="w-5 h-5" />
                        </button>
                      </PopoverTrigger>

                      <PopoverContent
                        align="start"
                        sideOffset={8}
                        className="w-[30rem] p-5 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl space-y-5"
                      >
                        {/* Header */}
                        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
                          <HelpCircle className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                            Hướng dẫn xem video
                          </h3>
                        </div>

                        {/* Nội dung hướng dẫn */}
                        <div className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                          <ol className="list-decimal list-inside space-y-2">
                            <li>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                Không tua:
                              </span>{" "}
                              Hệ thống sẽ tự động phục hồi vị trí nếu phát hiện
                              bạn tua bằng tay.
                            </li>
                            <li>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                Lưu tiến độ:
                              </span>{" "}
                              Tiến độ được lưu tạm thời và sẽ tự động khôi phục
                              khi tải lại trang.
                            </li>
                            <li>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                Hoàn thành:
                              </span>{" "}
                              Hệ thống sẽ tự động{" "}
                              <span className="px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded-md font-medium">
                                Đánh dấu hoàn thành
                              </span>{" "}
                              khi đã xem trên 90% thời lượng bài học.
                            </li>
                          </ol>

                          {/* Mẹo */}
                          <div className="pt-3 text-gray-500 dark:text-gray-400 text-xs border-t border-gray-100 dark:border-zinc-800">
                            💡 <span className="font-medium">Mẹo:</span> Bật{" "}
                            <span className="text-sky-600 dark:text-sky-400 font-medium">
                              Toàn màn hình (Double-click vào video)
                            </span>{" "}
                            để học tốt hơn — một số phím tua nhanh sẽ bị vô hiệu
                            trong chế độ này.
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            </div>

            {selectedLesson?.type === "Video" ? (
              <div className="bg-black w-full aspect-video rounded-lg mb-4 flex items-center justify-center text-white overflow-hidden shadow-lg">
                {selectedLesson?.videoUrl ? (
                  (() => {
                    const src = String(selectedLesson.videoUrl || "");
                    const lower = src.toLowerCase();
                    const isMp4 = lower.endsWith(".mp4");
                    const isEmbed =
                      /youtube|vimeo|embed/.test(lower) ||
                      src.includes("iframe");

                    if (isEmbed || (!isMp4 && src.startsWith("http"))) {
                      const isYouTubeEmbed = /youtube|youtu\.be/.test(lower);
                      if (isYouTubeEmbed) {
                        const elId = `yt-player-${selectedLesson?.id ?? "unknown"
                          }`;
                        return <div id={elId} className="w-full h-full" />;
                      }

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
                        className="w-full h-full object-cover"
                        src={src}
                        controls={false}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    );
                  })()
                ) : (
                  <div className="text-5xl">▶</div>
                )}
              </div>
            ) : selectedLesson?.type === "Reading" ? (
              <div className="bg-white w-full rounded-lg mb-4 overflow-hidden shadow-lg">
                <div className="p-4 max-h-[320px] overflow-auto prose prose-slate">
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        (selectedLesson as any)?.readingContent ??
                        (selectedLesson as any)?.content ??
                        "",
                    }}
                  />
                </div>
                <div className="p-4 flex justify-end">
                  {enrollment ? (
                    <Button
                      disabled={isLessonCompleted}
                      onClick={async () => {
                        if (!selectedLesson?.id) return;
                        // prevent double-action when already completed
                        if (isLessonCompleted) return;
                        try {
                          await saveProgress(100);
                          setLocalProgress(100);
                          if (enrollmentId) await fetchProgresses(enrollmentId);
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      {isLessonCompleted
                        ? "Đã hoàn thành"
                        : "Đánh dấu hoàn thành"}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : selectedLesson?.type === "Exam" ? (
              <div className="space-x-3">
                <Button
                  variant="outline"
                  className="mb-2"
                  onClick={() => setExamDialogOpen(true)}
                >
                  Bắt đầu làm bài
                </Button>
                <Button disabled={examResultId === ''} onClick={handleViewExamResult}>
                  <NotebookPen /> Xem kết quả
                </Button>
              </div>
            ) : (
              <div className="bg-black w-full aspect-video rounded-lg mb-4 flex items-center justify-center text-white overflow-hidden shadow-lg">
                <div className="text-white text-lg">
                  Không có nội dung cho bài học này.
                </div>
              </div>
            )}

            {/* Interactive question overlay */}
            {activeQuestion && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-2xl w-full mx-4">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                    {activeQuestion.question}
                  </h3>
                  {activeQuestion.type === "mc" ? (
                    <div className="space-y-3">
                      {(activeQuestion.options || []).map(
                        (opt: any, idx: number) => {
                          const disabled =
                            isSubmitting || submissionResult !== null;
                          const isCorrectOpt =
                            submissionResult !== null &&
                            idx === (activeQuestion.correctIndex ?? -1);
                          const isChosenWrong =
                            submissionResult !== null &&
                            selectedOptionIndex === idx &&
                            !submissionResult;
                          const baseCls = `w-full text-left p-3 rounded-md flex items-center justify-between transition-all`;
                          const bgCls = isCorrectOpt
                            ? "bg-green-50 border border-green-200"
                            : isChosenWrong
                              ? "bg-red-50 border border-red-200"
                              : "bg-gray-100 hover:bg-gray-200";
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (disabled) return;
                                handleSubmitAnswer({ selectedIndex: idx });
                              }}
                              disabled={disabled}
                              className={`${baseCls} ${bgCls}`}
                            >
                              <span className="flex-1">{opt}</span>
                              <span className="ml-3">
                                {isCorrectOpt && (
                                  <Check className="w-5 h-5 text-green-600" />
                                )}
                                {isChosenWrong && (
                                  <X className="w-5 h-5 text-red-600" />
                                )}
                              </span>
                            </button>
                          );
                        }
                      )}
                      {submissionResult !== null && (
                        <div className="mt-3 text-sm flex items-center gap-2">
                          {submissionResult ? (
                            <span className="text-green-700 font-semibold">
                              Đúng — tiếp tục phát
                            </span>
                          ) : (
                            <span className="text-red-700 font-semibold">
                              Sai — đáp án đúng đã được đánh dấu
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={interactiveAnswerText}
                        onChange={(e) =>
                          setInteractiveAnswerText(e.target.value)
                        }
                        className="w-full border rounded p-2 min-h-[80px] text-gray-900 dark:text-gray-100"
                        disabled={isSubmitting || submissionResult !== null}
                      />
                      <div className="flex items-center justify-between">
                        <div>
                          {submissionResult !== null && (
                            <div className="text-sm">
                              {submissionResult ? (
                                <span className="text-green-700 font-semibold">
                                  Đúng
                                </span>
                              ) : (
                                <span className="text-red-700 font-semibold">
                                  Sai
                                </span>
                              )}
                              {!submissionResult &&
                                activeQuestion.correctAnswer && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    Đáp án: {activeQuestion.correctAnswer}
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end">
                          <Button
                            onClick={() =>
                              handleSubmitAnswer(interactiveAnswerText)
                            }
                            disabled={isSubmitting || submissionResult !== null}
                          >
                            Gửi
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white border rounded p-4 mb-10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Nội dung bài giảng</h4>
                </div>
                <div className="max-h-48 overflow-auto text-sm text-gray-700">
                  <p>
                    {selectedLesson?.description ??
                      (selectedLesson as any)?.readingContent ??
                      "Không có bảng ghi chép nào."}
                  </p>
                </div>
              </div>
            </div>
          </main>
          <aside className="col-span-12 lg:col-span-3 space-y-4 lg:sticky lg:top-24 mb-10">
            <LectureResources />
            <LectureDiscussion
              key={selectedLesson?.id ?? lid}
              lessonId={selectedLesson?.id ?? lid}
              courseId={cid}
            />
            <LectureNextUp />
          </aside>
        </div>
      </div>

      <AlertDialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">
              Bắt đầu làm bài
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {examStatus?.isDisabled ? `Bạn đã làm bài 3 lần liên tiếp. Lần tiếp theo sẽ mở trong ${calculateExamEnableTime()}` : "Bạn có muốn bắt đầu làm bài?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mx-auto">
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction disabled={examStatus?.isDisabled} onClick={handleStartExam}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LecturePlayer;
