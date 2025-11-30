/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import type {
  ClassMemberDto,
  ClassworkSubmission,
  ClassworkSubmissionFile,
} from "@/classManagement/interfaces/class";
import { mapToCoarseRole } from "@/classManagement/utils/roleutil";

import { Button } from "@/common/components/ui/button";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { ScrollArea } from "@/common/components/ui/scroll-area";
import { Separator } from "@/common/components/ui/separator";
import { Card } from "@/common/components/ui/card";
import { Label } from "@/common/components/ui/label";

const ClassworkSubmissionsPage: React.FC = () => {
  const params = useParams<{
    id?: string;
    role?: string;
    classworkId?: string;
  }>();
  const classId = Number(params.id ?? 0);
  const workId = Number(params.classworkId ?? 0);

  // use react-router's useLocation to read navigation state safely
  const location = useLocation() as unknown as {
    state?: { maxScore?: number };
  };
  const navigate = useNavigate();

  const {
    getClassworkSubmissions,
    getClassMembers,
    currentClass,
    getSubmissionByUserAndClasswork,
    gradeSubmission,
    getClassworkDetail,
  } = useClassStore();
  const { user } = useAuthStore();

  const coarseRole = mapToCoarseRole(user?.roles);
  const role = coarseRole === "student" ? "student" : "teacher";
  const isTeacher = coarseRole === "teacher";

  const [submissions, setSubmissions] = useState<ClassworkSubmission[] | null>(
    null
  );
  const [members, setMembers] = useState<ClassMemberDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMember, setSelectedMember] = useState<ClassMemberDto | null>(
    null
  );
  const [selectedSubmission, setSelectedSubmission] =
    useState<ClassworkSubmission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [gradeValue, setGradeValue] = useState<number | "">("");
  const [gradeFeedback, setGradeFeedback] = useState<string>("");

  const [showNotSubmitted, setShowNotSubmitted] = useState(true);
  const [showSubmittedNotGraded, setShowSubmittedNotGraded] = useState(true);
  const [showGraded, setShowGraded] = useState(true);

  // read possible maxScore passed via navigation state (detailed-class-teacher sends it)
  const incomingState = (location.state as any) ?? {};
  const incomingMaxRaw = incomingState?.maxScore;
  const incomingMax =
    incomingMaxRaw !== undefined && incomingMaxRaw !== null
      ? Number(incomingMaxRaw)
      : NaN;

  // store classwork detail (server)
  const [cwDetail, setCwDetail] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        let students = currentClass?.data?.students ?? [];
        if (!students || students.length === 0) {
          const mem = await getClassMembers(classId);
          students = mem ?? [];
        }
        if (!mounted) return;
        setMembers(students);

        const subs = await getClassworkSubmissions(workId);
        if (!mounted) return;
        const normSubs = (subs ?? []).map((s) => {
          s.files = s.files ?? (s as any).submissionFiles ?? [];
          return s;
        });
        setSubmissions(normSubs);

        const existKeys = new Set(
          (normSubs ?? []).map((s) =>
            String(s.appUserId ?? (s as any).userId ?? "").trim()
          )
        );
        const missingMembers = (students ?? []).filter((m) => {
          const key = String(m.userId ?? m.id ?? "").trim();
          return !existKeys.has(key);
        });

        if (missingMembers.length > 0) {
          const promises = missingMembers.map((m) =>
            getSubmissionByUserAndClasswork(
              workId,
              String(m.userId ?? m.id ?? "").trim()
            )
          );
          const results = await Promise.all(promises);
          const found = results
            .filter((r): r is ClassworkSubmission => !!r)
            .map((s) => {
              s.files = s.files ?? (s as any).submissionFiles ?? [];
              return s;
            });

          if (found.length > 0) {
            const merged = [...(normSubs ?? [])];
            const existingIds = new Set(merged.map((x) => x.id));
            for (const f of found) {
              if (!existingIds.has(f.id)) merged.push(f);
            }
            if (mounted) setSubmissions(merged);
          }
        }

        // Fetch classwork detail to get accurate maxScore and other fields
        if (typeof getClassworkDetail === "function" && workId) {
          try {
            const det = await getClassworkDetail(workId);
            if (!mounted) return;
            const payload = det ?? null;
            setCwDetail(payload);
          } catch (err) {
            console.warn("getClassworkDetail failed", err);
            setCwDetail(null);
          }
        }
      } catch (err) {
        console.error("load submissions page error", err);
        if (mounted) setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (classId && workId) load();
    else {
      setError("Thiếu classId hoặc workId");
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [
    classId,
    workId,
    getClassworkSubmissions,
    getClassMembers,
    getSubmissionByUserAndClasswork,
    getClassworkDetail,
    currentClass?.data?.students,
  ]);

  if (loading) return <div className="p-8 text-slate-500">Đang tải...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  const normalizeUserId = (id: any) => String(id ?? "").trim();

  const isGraded = (s?: ClassworkSubmission | null): boolean => {
    if (!s) return false;
    const score = s.score ?? (s as any).raw?.score;
    if (score !== undefined && score !== null && String(score).trim() !== "")
      return true;
    return false;
  };
  const hasSubmissionContent = (s?: ClassworkSubmission | null): boolean => {
    if (!s) return false;
    const filesOk = Array.isArray(s.files) && s.files.length > 0;
    const timeOk = !!(s.latestSubmissionTime || s.firstSubmissionTime);
    const rawFiles = Array.isArray(
      (s as any).submissionFiles ?? (s as any).raw?.submissionFiles
    )
      ? (s as any).submissionFiles ?? (s as any).raw?.submissionFiles
      : [];
    return filesOk || timeOk || rawFiles.length > 0;
  };
  const getScoreText = (s?: ClassworkSubmission | null) => {
    if (!s) return null;
    const cand = s.score ?? (s as any).raw?.score ?? null;
    if (cand !== null && cand !== undefined && String(cand).trim() !== "")
      return `${cand}`;
    return null;
  };

  const inferMaxScore = (): number => {
    if (Number.isFinite(incomingMax) && incomingMax > 0) return incomingMax;

    if (!submissions || submissions.length === 0) return 100;
    for (const s of submissions) {
      const candidates = [
        (s as any).maxScore,
        (s as any).total,
        (s as any).max,
        (s as any).max_points,
      ];
      for (const c of candidates) {
        const n = Number(c);
        if (Number.isFinite(n) && n > 0) return n;
      }
    }
    if (selectedSubmission) {
      const candidates = [
        (selectedSubmission as any).maxScore,
        (selectedSubmission as any).total,
        (selectedSubmission as any).max,
        (selectedSubmission as any).max_points,
      ];
      for (const c of candidates) {
        const n = Number(c);
        if (Number.isFinite(n) && n > 0) return n;
      }
    }
    return 100;
  };
  const globalMaxScore = inferMaxScore();

  // Try to find the specific classwork's maxScore from cwDetail first, then from currentClass store
  const detailMaxScore = (() => {
    try {
      if (!cwDetail) return null;
      const candList = [
        cwDetail.maxScore,
        cwDetail.MaxScore,
        cwDetail.data?.maxScore,
        cwDetail.data?.MaxScore,
        cwDetail.data?.max_points,
        cwDetail.max_points,
        cwDetail.data?.total,
        cwDetail.data?.max,
      ];
      for (const c of candList) {
        const n = Number(c);
        if (Number.isFinite(n) && n > 0) return n;
      }
    } catch {
      // ignore
    }
    return null;
  })();

  const workMaxScore = (() => {
    try {
      const works = currentClass?.data?.works ?? [];
      const w = works.find((x: any) => Number(x.id) === Number(workId));
      if (!w) return null;
      const candidates = [
        w.maxScore,
        (w as any).max_points,
        (w as any).total,
        (w as any).max,
      ];
      for (const c of candidates) {
        const n = Number(c);
        if (Number.isFinite(n) && n > 0) return n;
      }
      return null;
    } catch {
      return null;
    }
  })();

  const maxAllowedForThisWork =
    detailMaxScore !== null &&
    Number.isFinite(Number(detailMaxScore)) &&
    detailMaxScore > 0
      ? Number(detailMaxScore)
      : workMaxScore !== null &&
        Number.isFinite(Number(workMaxScore)) &&
        workMaxScore > 0
      ? Number(workMaxScore)
      : globalMaxScore;

  const scoreColorClass = (
    score: number | null | undefined,
    max = globalMaxScore
  ) => {
    if (
      score === null ||
      score === undefined ||
      !Number.isFinite(Number(score)) ||
      !Number.isFinite(Number(max)) ||
      Number(max) <= 0
    )
      return "text-slate-500";
    const p = Math.max(0, Math.min(100, (Number(score) / Number(max)) * 100));
    if (p >= 90) return "text-emerald-600";
    if (p >= 75) return "text-lime-600";
    if (p >= 50) return "text-amber-600";
    if (p >= 25) return "text-orange-600";
    return "text-red-600";
  };

  const submissionMap = new Map<string, ClassworkSubmission>();
  (submissions ?? []).forEach((s) => {
    const key = normalizeUserId(s.appUserId ?? (s as any).userId ?? "");
    if (key) submissionMap.set(key, s);
  });

  type GroupKey = "notSubmitted" | "submittedNotGraded" | "graded";
  const groups: Record<GroupKey, ClassMemberDto[]> = {
    notSubmitted: [],
    submittedNotGraded: [],
    graded: [],
  };
  const mems = members ?? [];
  for (const m of mems) {
    const id = normalizeUserId(m.userId ?? m.id ?? "");
    const s = submissionMap.get(id) ?? null;
    const submitted = hasSubmissionContent(s);
    const graded = isGraded(s);
    if (!submitted) groups.notSubmitted.push(m);
    else if (submitted && !graded) groups.submittedNotGraded.push(m);
    else groups.graded.push(m);
  }

  const pickMember = async (m: ClassMemberDto) => {
    setSelectedMember(m);
    setSelectedSubmission(null);
    setDetailLoading(true);
    setGradeValue("");
    setGradeFeedback("");
    try {
      const userId = normalizeUserId(m.userId ?? m.id ?? "");
      const s = await getSubmissionByUserAndClasswork(workId, userId);
      if (s) {
        s.files = s.files ?? (s as any).submissionFiles ?? [];
        setSelectedSubmission(s);
        const scoreVal = s.score ?? (s as any).raw?.score ?? null;
        if (
          scoreVal !== undefined &&
          scoreVal !== null &&
          String(scoreVal).trim() !== ""
        ) {
          const n = Number(scoreVal);
          setGradeValue(Number.isFinite(n) ? n : (String(scoreVal) as any));
        }

        // set feedback if present (support multiple field names)
        const fb =
          s.feedback ??
          (s as any).gradeFeedback ??
          (s as any).graderFeedback ??
          (s as any).teacherFeedback ??
          (s as any).feedbackText ??
          "";
        setGradeFeedback(typeof fb === "string" ? fb : String(fb ?? ""));
      } else {
        const fallback = submissionMap.get(userId) ?? null;
        setSelectedSubmission(fallback);
        if (fallback) {
          const scoreVal =
            fallback.score ?? (fallback as any).raw?.score ?? null;
          if (
            scoreVal !== undefined &&
            scoreVal !== null &&
            String(scoreVal).trim() !== ""
          ) {
            const n = Number(scoreVal);
            setGradeValue(Number.isFinite(n) ? n : (String(scoreVal) as any));
          }

          const fb =
            (fallback as any).feedback ??
            (fallback as any).gradeFeedback ??
            (fallback as any).graderFeedback ??
            (fallback as any).teacherFeedback ??
            (fallback as any).feedbackText ??
            "";
          setGradeFeedback(typeof fb === "string" ? fb : String(fb ?? ""));
        }
      }
    } catch (err) {
      console.error("Failed to load individual submission", err);
      setSelectedSubmission(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleGradeSubmit = async () => {
    if (!isTeacher) {
      alert("Bạn không có quyền chấm điểm.");
      return;
    }
    if (!selectedSubmission && !selectedMember) {
      alert("Chưa chọn nộp bài để chấm.");
      return;
    }
    if (gradeValue === "" || gradeValue === null) {
      alert("Nhập điểm trước khi lưu.");
      return;
    }
    const numeric = Number(gradeValue);
    if (!Number.isFinite(numeric)) {
      alert("Điểm không hợp lệ (phải là số).");
      return;
    }

    // Use the per-work max if available, otherwise fall back to globalMaxScore
    const maxAllowed = maxAllowedForThisWork;
    if (Number.isFinite(maxAllowed) && numeric > maxAllowed) {
      alert(`Điểm không hợp lệ: không được vượt quá ${maxAllowed}.`);
      return;
    }

    const candidateNotif =
      Number(
        selectedSubmission?.classworkId ??
          (selectedSubmission as any)?.notificationId ??
          (selectedSubmission as any)?.raw?.notificationId ??
          0
      ) || 0;
    const notificationId =
      candidateNotif > 0 ? candidateNotif : Number(workId ?? 0);
    const submissionId = Number(selectedSubmission?.id ?? 0);
    const grader = user?.id ?? localStorage.getItem("currentUserId") ?? "";

    if (!notificationId || notificationId <= 0) {
      alert(
        `Không thể chấm: notificationId không hợp lệ (${notificationId}). Kiểm tra selectedSubmission.raw để biết tên trường.`
      );
      return;
    }
    if (!submissionId && !selectedMember) {
      alert(`Không thể chấm: submissionId không hợp lệ (${submissionId}).`);
      return;
    }

    const prevSubmissions = submissions ?? [];

    const optimisticSubmission: ClassworkSubmission = {
      ...(selectedSubmission ?? ({} as ClassworkSubmission)),
      id: submissionId || (selectedSubmission?.id ?? 0),
      appUserId: selectedSubmission?.appUserId ?? selectedMember?.userId ?? "",
      score: numeric,
      files:
        selectedSubmission?.files ??
        (selectedSubmission as any)?.submissionFiles ??
        [],
      classworkId: notificationId,
    };

    try {
      setSubmissions((prev) => {
        const copy = prev ? [...prev] : [];
        const idxById = copy.findIndex(
          (s) => s.id === optimisticSubmission.id && optimisticSubmission.id
        );
        let idx = idxById;
        if (idxById === -1) {
          idx = copy.findIndex(
            (s) =>
              normalizeUserId(s.appUserId ?? (s as any).userId) ===
              normalizeUserId(optimisticSubmission.appUserId)
          );
        }
        if (idx !== -1) {
          copy[idx] = { ...copy[idx], ...optimisticSubmission };
        } else {
          copy.push(optimisticSubmission);
        }
        return copy;
      });

      setSelectedSubmission((prev) =>
        prev &&
        (prev.id === optimisticSubmission.id ||
          normalizeUserId(prev.appUserId) ===
            normalizeUserId(optimisticSubmission.appUserId))
          ? { ...prev, score: numeric }
          : optimisticSubmission
      );

      const res = await gradeSubmission(
        notificationId,
        submissionId,
        numeric,
        gradeFeedback ?? "",
        grader
      );

      if (!res) {
        const reloaded = await getClassworkSubmissions(notificationId);
        setSubmissions(reloaded ?? prevSubmissions);
        alert(
          "Lưu điểm thất bại: không có phản hồi từ server. Kiểm tra console/network."
        );
        return;
      }
      if (!res.success) {
        const reloaded = await getClassworkSubmissions(notificationId);
        setSubmissions(reloaded ?? prevSubmissions);
        const msg = res.message ?? JSON.stringify(res.raw ?? res);
        alert(`Lưu điểm thất bại: ${msg}`);
        return;
      }

      const serverSubmission =
        (res as any).submission ||
        (res as any).data ||
        (res as any).updatedSubmission ||
        null;

      let finalSubmission: ClassworkSubmission = optimisticSubmission;
      if (serverSubmission) {
        serverSubmission.files =
          serverSubmission.files ?? serverSubmission.submissionFiles ?? [];
        finalSubmission = { ...optimisticSubmission, ...serverSubmission };
      }

      // update gradeFeedback from server response if present
      const serverFb =
        (finalSubmission as any).feedback ??
        (finalSubmission as any).gradeFeedback ??
        (finalSubmission as any).graderFeedback ??
        (finalSubmission as any).teacherFeedback ??
        (finalSubmission as any).feedbackText ??
        null;
      setGradeFeedback(
        typeof serverFb === "string" ? serverFb : String(serverFb ?? "")
      );

      setSubmissions((prev) => {
        const copy = prev ? [...prev] : [];
        const idxById = copy.findIndex(
          (s) => s.id === finalSubmission.id && finalSubmission.id
        );
        let idx = idxById;
        if (idxById === -1) {
          idx = copy.findIndex(
            (s) =>
              normalizeUserId(s.appUserId ?? (s as any).userId) ===
              normalizeUserId(finalSubmission.appUserId)
          );
        }
        if (idx !== -1) {
          copy[idx] = { ...copy[idx], ...finalSubmission };
        } else {
          copy.push(finalSubmission);
        }
        return copy;
      });

      setSelectedSubmission(finalSubmission);

      alert((res as any).message ?? "Đã lưu điểm");

      try {
        const refreshed =
          (await getSubmissionByUserAndClasswork(
            notificationId,
            normalizeUserId(selectedMember?.userId ?? finalSubmission.appUserId)
          )) ?? null;
        if (refreshed) {
          refreshed.files =
            refreshed.files ?? (refreshed as any).submissionFiles ?? [];
          setSelectedSubmission(refreshed);
          // also update grade value & feedback from refreshed
          const refreshedScore =
            refreshed.score ?? (refreshed as any).raw?.score ?? null;
          if (
            refreshedScore !== undefined &&
            refreshedScore !== null &&
            String(refreshedScore).trim() !== ""
          ) {
            const n = Number(refreshedScore);
            setGradeValue(
              Number.isFinite(n) ? n : (String(refreshedScore) as any)
            );
          }
          const refreshedFb =
            (refreshed as any).feedback ??
            (refreshed as any).gradeFeedback ??
            (refreshed as any).graderFeedback ??
            (refreshed as any).teacherFeedback ??
            (refreshed as any).feedbackText ??
            "";
          setGradeFeedback(
            typeof refreshedFb === "string"
              ? refreshedFb
              : String(refreshedFb ?? "")
          );
          setSubmissions((prev) => {
            const copy = prev ? [...prev] : [];
            const idxById = copy.findIndex(
              (s) => s.id === refreshed.id && refreshed.id
            );
            let idx = idxById;
            if (idxById === -1) {
              idx = copy.findIndex(
                (s) =>
                  normalizeUserId(s.appUserId ?? (s as any).userId) ===
                  normalizeUserId(refreshed.appUserId)
              );
            }
            if (idx !== -1) {
              copy[idx] = { ...copy[idx], ...refreshed };
            } else {
              copy.push(refreshed);
            }
            return copy;
          });
        }
      } catch (e) {
        console.warn("Không thể cập nhật chi tiết sau khi chấm:", e);
      }
    } catch (err) {
      console.error("grade submit error", err);
      try {
        const updated = await getClassworkSubmissions(notificationId);
        setSubmissions(updated ?? prevSubmissions);
      } catch (_) {
        setSubmissions(prevSubmissions);
      }
      alert("Lỗi khi lưu điểm. Xem console/network để biết chi tiết.");
    }
  };

  const MemberRow: React.FC<{
    member: ClassMemberDto;
    submission?: ClassworkSubmission | null;
  }> = ({ member, submission }) => {
    const submitted = hasSubmissionContent(submission);
    const graded = isGraded(submission);
    const isSelected =
      selectedMember &&
      normalizeUserId(selectedMember.userId) === normalizeUserId(member.userId);
    const scoreText = getScoreText(submission) ?? (submitted ? "__" : "—");

    const initial = member.fullname
      ? member.fullname.charAt(0).toUpperCase()
      : String(member.userId).charAt(0).toUpperCase();

    const scoreVal = submission
      ? Number(submission.score ?? (submission as any).raw?.score ?? null)
      : null;
    const colorClass = scoreColorClass(
      Number.isFinite(Number(scoreVal)) ? scoreVal : null,
      maxAllowedForThisWork
    );

    return (
      <Card
        onClick={() => pickMember(member)}
        className={`relative flex  justify-between cursor-pointer w-full h-full overflow-y-auto px-4 py-3 transition-colors ${
          isSelected ? "bg-slate-100 shadow-sm" : "hover:bg-slate-50"
        }`}
      >
        {/* LEFT: avatar + name (force left alignment) */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex-shrink-0">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="text-lg">{initial}</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-left">
              <div className="font-medium text-base leading-[1.1] truncate">
                {member.fullname ?? member.userId}
              </div>
              {member.email && (
                <div className="text-sm text-slate-500 mt-1 truncate">
                  {member.email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: score inline */}
        <div className="flex items-center gap-3 ml-4 whitespace-nowrap">
          <div className="text-xs text-slate-400">Điểm</div>
          <div className={`font-semibold text-lg ${colorClass}`}>
            {scoreText}
          </div>
          <div className="text-sm text-slate-400">
            / {maxAllowedForThisWork}
          </div>
        </div>
      </Card>
    );
  };

  const visibleNotSubmitted = showNotSubmitted ? groups.notSubmitted : [];
  const visibleSubmittedNotGraded = showSubmittedNotGraded
    ? groups.submittedNotGraded
    : [];
  const visibleGraded = showGraded ? groups.graded : [];

  return (
    <div className="flex h-full p-8 gap-8 bg-slate-50">
      <aside
        className="w-[380px] rounded-xl bg-white shadow-sm flex flex-col overflow-hidden min-h-0"
        style={{ minHeight: 720 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={false}
              onCheckedChange={() => {
                /* select all placeholder */
              }}
            />
            <div className="font-semibold text-lg">Tất cả học viên</div>
          </div>
          {/* Sắp xếp đã bỏ */}
        </div>

        <div className="px-6 py-4 border-b flex items-center gap-4 text-base">
          <Label className="inline-flex items-center gap-3">
            <Checkbox
              checked={showNotSubmitted}
              onCheckedChange={(v) => setShowNotSubmitted(Boolean(v))}
            />
            <span>Chưa nộp</span>
          </Label>

          <Label className="inline-flex items-center gap-3">
            <Checkbox
              checked={showSubmittedNotGraded}
              onCheckedChange={(v) => setShowSubmittedNotGraded(Boolean(v))}
            />
            <span>Đã nộp (chưa chấm)</span>
          </Label>

          <Label className="inline-flex items-center gap-3">
            <Checkbox
              checked={showGraded}
              onCheckedChange={(v) => setShowGraded(Boolean(v))}
            />
            <span>Đã chấm</span>
          </Label>
        </div>

        {/* ScrollArea được đặt để chiếm đầy chiều cao còn lại và cuộn */}
        <ScrollArea className="flex-1 min-h-0 h-full px-4 py-3">
          <div className="mb-4">
            <div className="flex items-center justify-start gap-3 px-3 py-2 bg-slate-50 rounded-md">
              <div className="font-semibold">Chưa nộp</div>
              <div className="text-sm text-slate-500">
                ({groups.notSubmitted.length})
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {visibleNotSubmitted.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500 rounded-md bg-white">
                {" "}
                {showNotSubmitted ? "Không có ai." : "Đã ẩn"}
              </div>
            ) : (
              visibleNotSubmitted.map((m) => {
                const s =
                  submissionMap.get(normalizeUserId(m.userId ?? m.id ?? "")) ??
                  null;
                return <MemberRow key={m.userId} member={m} submission={s} />;
              })
            )}
          </div>

          <Separator className="my-6" />

          <div className="mb-4">
            <div className="flex items-center justify-start gap-3 px-3 py-2 bg-slate-50 rounded-md">
              <div className="font-semibold">Đã nộp (chưa chấm)</div>
              <div className="text-sm text-slate-500">
                ({groups.submittedNotGraded.length})
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {visibleSubmittedNotGraded.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500 rounded-md bg-white">
                {showSubmittedNotGraded ? "Không có ai." : "Đã ẩn"}
              </div>
            ) : (
              visibleSubmittedNotGraded.map((m) => {
                const s =
                  submissionMap.get(normalizeUserId(m.userId ?? m.id ?? "")) ??
                  null;
                return <MemberRow key={m.userId} member={m} submission={s} />;
              })
            )}
          </div>

          <Separator className="my-6" />

          <div className="mb-4">
            <div className="flex items-center justify-start gap-3 px-3 py-2 bg-slate-50 rounded-md">
              <div className="font-semibold">Đã chấm</div>
              <div className="text-sm text-slate-500">
                ({groups.graded.length})
              </div>
            </div>
          </div>

          <div className="space-y-2 pb-6">
            {visibleGraded.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500 rounded-md bg-white">
                {showGraded ? "Chưa có ai được chấm." : "Đã ẩn"}
              </div>
            ) : (
              visibleGraded.map((m) => {
                const s =
                  submissionMap.get(normalizeUserId(m.userId ?? m.id ?? "")) ??
                  null;
                return <MemberRow key={m.userId} member={m} submission={s} />;
              })
            )}
          </div>
        </ScrollArea>
      </aside>

      <main
        className="flex-1 rounded-xl bg-white shadow-sm flex flex-col overflow-hidden"
        style={{ minHeight: 720 }}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/class/${role}/${classId}?tab=exercise`)}
              className="p-2"
            >
              ←
            </Button>
            <div>
              <div className="text-2xl md:text-3xl font-semibold">
                {selectedMember ? selectedMember.fullname : "Chọn học viên"}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {selectedSubmission ? (
                  <span>
                    Đã nộp •{" "}
                    {new Date(
                      selectedSubmission.latestSubmissionTime ??
                        selectedSubmission.firstSubmissionTime ??
                        Date.now()
                    ).toLocaleString()}
                  </span>
                ) : (
                  <span>Chưa nộp</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-slate-500">Điểm</div>
            {(() => {
              const s = selectedSubmission
                ? Number(
                    selectedSubmission.score ??
                      (selectedSubmission as any).raw?.score ??
                      null
                  )
                : null;
              const cls = scoreColorClass(
                Number.isFinite(Number(s)) ? s : null,
                maxAllowedForThisWork
              );
              return (
                <div
                  className={`mt-2 inline-flex items-center justify-center w-32 h-14 rounded-lg bg-slate-100 text-2xl font-semibold ${cls}`}
                >
                  {selectedSubmission
                    ? getScoreText(selectedSubmission) ?? "—"
                    : "—"}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="flex-1 p-8 overflow-auto">
          {detailLoading ? (
            <div className="text-slate-500">Đang tải...</div>
          ) : selectedSubmission ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {(selectedSubmission.files ?? []).length === 0 ? (
                <div className="text-sm text-slate-500">
                  Không có tệp đính kèm.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(selectedSubmission.files ?? []).map(
                    (f: ClassworkSubmissionFile) => {
                      const ext =
                        (f.fileName ?? "").split(".").pop()?.toLowerCase() ??
                        "";
                      const isImage = [
                        "png",
                        "jpg",
                        "jpeg",
                        "gif",
                        "webp",
                        "svg",
                      ].includes(ext);
                      return (
                        <Card
                          key={f.id}
                          className="flex flex-col md:flex-row items-center gap-4 p-5"
                        >
                          <div className="flex-1">
                            <a
                              href={f.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-lg font-medium text-sky-600 hover:underline"
                            >
                              {f.fileName}
                            </a>
                            <div className="text-sm text-slate-500 mt-2">
                              {isImage ? "Hình ảnh" : "Tệp đính kèm"}
                            </div>
                          </div>
                          <div className="w-40 h-28 flex items-center justify-center rounded overflow-hidden bg-slate-50">
                            {isImage ? (
                              <img
                                src={f.fileUrl}
                                alt={f.fileName}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <div className="text-4xl text-slate-400">📎</div>
                            )}
                          </div>
                        </Card>
                      );
                    }
                  )}
                </div>
              )}

              {isTeacher && (
                <Card className="p-6 bg-slate-50">
                  <div className="mb-3 text-base font-medium text-slate-700">
                    Chấm điểm
                  </div>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
                    <Input
                      type="number"
                      value={gradeValue}
                      onChange={(e) =>
                        setGradeValue(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="Điểm"
                      className="w-36 py-3 text-lg"
                      min={0}
                      max={maxAllowedForThisWork}
                    />
                    <Textarea
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      placeholder="Phản hồi (không bắt buộc)"
                      className="flex-1 min-h-[96px]"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleGradeSubmit}
                      className="px-6 py-3 text-base"
                    >
                      Lưu điểm
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGradeValue("");
                        setGradeFeedback("");
                      }}
                      className="px-5 py-3"
                    >
                      Hủy
                    </Button>
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    Tối đa: {maxAllowedForThisWork}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-slate-500">Học viên này chưa nộp bài.</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClassworkSubmissionsPage;
