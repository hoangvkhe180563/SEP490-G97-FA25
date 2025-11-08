import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import type {
  ClassMemberDto,
  ClassworkSubmission,
  ClassworkSubmissionFile,
} from "@/classManagement/interfaces/class";
import { mapToCoarseRole } from "@/classManagement/utils/roleutil";

/**
 * Simplified and reliable ClassworkSubmissionsPage
 *
 * What changed (per your request):
 * - Simplify classification rules:
 *   - "Submitted" if submission has files OR has first/latest submission timestamp.
 *   - "Graded" if submission has a non-empty score.
 * - Ensure members who have a submission but weren't present in the initial submissions list
 *   are discovered by calling getSubmissionByUserAndClasswork for the missing members.
 *   This fixes the case where the right-hand detail shows Student 3's submission but left-hand
 *   list didn't include them.
 * - Keep grading flow and refresh after grade.
 *
 * This avoids fragile heuristics (matching by name/email) and focuses on two checks you asked for:
 * "has file/timestamp" and "has score".
 */

const ClassworkSubmissionsPage: React.FC = () => {
  const params = useParams<{
    id?: string;
    role?: string;
    classworkId?: string;
  }>();
  const classId = Number(params.id ?? 0);
  const workId = Number(params.classworkId ?? 0);
  const navigate = useNavigate();

  const {
    getClassworkSubmissions,
    getClassMembers,
    currentClass,
    getSubmissionByUserAndClasswork,
    gradeSubmission,
  } = useClassStore();
  const { user } = useAuthStore();

  const coarseRole = mapToCoarseRole(user?.roles);
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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // 1) load members (prefer currentClass cache)
        let students = currentClass?.data?.students ?? [];
        if (!students || students.length === 0) {
          const mem = await getClassMembers(classId);
          students = mem ?? [];
        }
        if (!mounted) return;
        setMembers(students);

        // 2) load submissions (server list)
        const subs = await getClassworkSubmissions(workId);
        if (!mounted) return;
        const normSubs = (subs ?? []).map((s) => {
          // normalize files field for convenience
          s.files = s.files ?? (s as any).submissionFiles ?? [];
          return s;
        });
        setSubmissions(normSubs);

        // 3) find members that don't have a corresponding submission in server list,
        //    and fetch per-user submission for them (fast in practice for small classes).
        //    This is the simple, reliable fix: for each member without mapped submission,
        //    call getSubmissionByUserAndClasswork to see if they submitted.
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
          // parallel fetch but tolerate errors
          const promises = missingMembers.map((m) =>
            getSubmissionByUserAndClasswork(
              workId,
              String(m.userId ?? m.id ?? "").trim()
            ).catch((e) => null)
          );
          const results = await Promise.all(promises);
          const found = results
            .filter((r): r is ClassworkSubmission => !!r)
            .map((s) => {
              s.files = s.files ?? (s as any).submissionFiles ?? [];
              return s;
            });

          if (found.length > 0) {
            // merge into submissions state and dedupe by submission.id
            const merged = [...(normSubs ?? [])];
            const existingIds = new Set(merged.map((x) => x.id));
            for (const f of found) {
              if (!existingIds.has(f.id)) merged.push(f);
            }
            if (mounted) setSubmissions(merged);
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
    currentClass?.data?.students,
    getClassworkSubmissions,
    getClassMembers,
    getSubmissionByUserAndClasswork,
  ]);

  if (loading) return <div className="p-8 text-slate-500">Đang tải...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  // simple checks per your request --------------------------------
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
    // simple rule: files OR timestamps
    const filesOk = Array.isArray(s.files) && s.files.length > 0;
    const timeOk = !!(s.latestSubmissionTime || s.firstSubmissionTime);
    // also consider raw.submissionFiles if present
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

  // build quick lookup map by appUserId (string)
  const submissionMap = new Map<string, ClassworkSubmission>();
  (submissions ?? []).forEach((s) => {
    const key = normalizeUserId(s.appUserId ?? (s as any).userId ?? "");
    if (key) submissionMap.set(key, s);
  });

  // group members using only simple checks (submitted if has file/time; graded if score)
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

  // pick member -> fetch freshest submission for that user
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
      } else {
        // fallback to map
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
        }
      }
    } catch (err) {
      console.error("Failed to load individual submission", err);
      setSelectedSubmission(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // classwork-submissions5.tsx -> thay thế handleGradeSubmit bằng đoạn này
  // Thay thế toàn bộ handleGradeSubmit hiện tại bằng đoạn này
  // Thay handleGradeSubmit bằng đoạn sau
  const handleGradeSubmit = async () => {
    if (!isTeacher) {
      alert("Bạn không có quyền chấm điểm.");
      return;
    }
    if (!selectedSubmission) {
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

    // Lấy notificationId một cách an toàn từ selectedSubmission (thử nhiều trường)
    const candidateNotif =
      Number(
        selectedSubmission.classworkId ??
          (selectedSubmission as any).notificationId ??
          (selectedSubmission as any).raw?.notificationId ??
          0
      ) || 0;
    const notificationId =
      candidateNotif > 0 ? candidateNotif : Number(workId ?? 0);
    const submissionId = Number(selectedSubmission.id ?? 0);
    const grader = user?.id ?? localStorage.getItem("currentUserId") ?? "";

    console.debug(
      "[handleGradeSubmit] notificationId:",
      notificationId,
      "submissionId:",
      submissionId,
      "score:",
      numeric,
      "grader:",
      grader
    );

    if (!notificationId || notificationId <= 0) {
      alert(
        `Không thể chấm: notificationId không hợp lệ (${notificationId}). Kiểm tra selectedSubmission.raw để biết tên trường.`
      );
      return;
    }
    if (!submissionId || submissionId <= 0) {
      alert(`Không thể chấm: submissionId không hợp lệ (${submissionId}).`);
      return;
    }

    // giữ bản sao để rollback khi cần
    const prevSubmissions = submissions ?? [];

    try {
      // optimistic update (local)
      setSubmissions((prev) => {
        if (!prev) return prev;
        return prev.map((s) =>
          s.id === submissionId ? { ...s, score: numeric } : s
        );
      });
      setSelectedSubmission((prev) =>
        prev && prev.id === submissionId ? { ...prev, score: numeric } : prev
      );

      // gọi API chấm
      const res = await gradeSubmission(
        notificationId,
        submissionId,
        numeric,
        gradeFeedback ?? "",
        grader
      );

      if (!res) {
        // rollback bằng cách reload server-safe
        const reloaded = await getClassworkSubmissions(notificationId);
        setSubmissions(reloaded ?? prevSubmissions);
        alert(
          "Lưu điểm thất bại: không có phản hồi từ server. Kiểm tra console/network."
        );
        return;
      }
      if (!res.success) {
        // rollback
        const reloaded = await getClassworkSubmissions(notificationId);
        setSubmissions(reloaded ?? prevSubmissions);
        const msg = res.message ?? JSON.stringify(res.raw ?? res);
        alert(`Lưu điểm thất bại: ${msg}`);
        return;
      }

      // Thành công: reload danh sách submissions cho đúng notificationId
      const updated = await getClassworkSubmissions(notificationId);
      if (!updated) {
        // nếu server không trả dữ liệu, ít nhất rollback sang prev
        setSubmissions(prevSubmissions);
        alert(
          res.message ??
            "Đã lưu điểm nhưng không thể cập nhật danh sách (server trả null)."
        );
        return;
      }
      setSubmissions(updated);
      alert(res.message ?? "Đã lưu điểm");
      // load lại submission chi tiết của học sinh vừa chấm (đảm bảo side panel cập nhật)
      const refreshed = await getSubmissionByUserAndClasswork(
        notificationId,
        normalizeUserId(selectedMember?.userId)
      );
      if (refreshed) {
        refreshed.files =
          refreshed.files ?? (refreshed as any).submissionFiles ?? [];
        setSelectedSubmission(refreshed);
      } else {
        // fallback: tìm trong updated list và set nếu có
        const found =
          (updated ?? []).find((s) => s.id === submissionId) ?? null;
        if (found) setSelectedSubmission(found);
      }

     
    } catch (err) {
      console.error("grade submit error", err);
      // rollback attempt: try reload using notificationId, otherwise restore prev
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
    return (
      <div
        key={member.userId}
        onClick={() => pickMember(member)}
        className={`flex items-center justify-between cursor-pointer p-4 hover:bg-slate-50 ${
          isSelected ? "bg-slate-100" : ""
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
              submitted ? "bg-blue-600" : "bg-slate-400"
            } text-lg`}
          >
            {member.fullname
              ? member.fullname.charAt(0).toUpperCase()
              : String(member.userId).charAt(0).toUpperCase()}
          </div>
          <div className="text-base">
            <div className="font-medium">
              {member.fullname ?? member.userId}
            </div>
            {member.email && (
              <div className="text-sm text-slate-400">{member.email}</div>
            )}
          </div>
        </div>

        <div className="text-base text-right min-w-[84px]">
          {graded ? (
            <div className="text-green-600 font-semibold">{scoreText}</div>
          ) : submitted ? (
            <div className="text-slate-600">{scoreText}</div>
          ) : (
            <div className="text-slate-400">—</div>
          )}
        </div>
      </div>
    );
  };

  const visibleNotSubmitted = showNotSubmitted ? groups.notSubmitted : [];
  const visibleSubmittedNotGraded = showSubmittedNotGraded
    ? groups.submittedNotGraded
    : [];
  const visibleGraded = showGraded ? groups.graded : [];

  return (
    <div className="flex h-full p-8 gap-6">
      <aside
        className="w-96 border rounded-xl bg-white overflow-auto"
        style={{ minHeight: 650 }}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5" />
            <div className="font-semibold text-lg">Tất cả học viên</div>
          </div>
          <div>
            <button className="px-3 py-2 border rounded text-sm">
              Sắp xếp
            </button>
          </div>
        </div>

        <div className="p-4 border-b flex items-center gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={showNotSubmitted}
              onChange={(e) => setShowNotSubmitted(e.target.checked)}
            />
            Chưa nộp
          </label>
          <label className="inline-flex items-center gap-2 ml-3">
            <input
              type="checkbox"
              checked={showSubmittedNotGraded}
              onChange={(e) => setShowSubmittedNotGraded(e.target.checked)}
            />
            Đã nộp (chưa chấm)
          </label>
          <label className="inline-flex items-center gap-2 ml-3">
            <input
              type="checkbox"
              checked={showGraded}
              onChange={(e) => setShowGraded(e.target.checked)}
            />
            Đã chấm
          </label>
        </div>

        <div className="p-3 border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Chưa nộp</div>
            <div className="text-sm text-slate-500">
              {groups.notSubmitted.length}
            </div>
          </div>
        </div>
        <div className="divide-y">
          {visibleNotSubmitted.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">
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

        <div className="p-3 border-t border-b bg-slate-50 mt-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Đã nộp (chưa chấm)</div>
            <div className="text-sm text-slate-500">
              {groups.submittedNotGraded.length}
            </div>
          </div>
        </div>
        <div className="divide-y">
          {visibleSubmittedNotGraded.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">
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

        <div className="p-3 border-t border-b bg-slate-50 mt-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Đã chấm</div>
            <div className="text-sm text-slate-500">{groups.graded.length}</div>
          </div>
        </div>
        <div className="divide-y">
          {visibleGraded.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">
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
      </aside>

      <main
        className="flex-1 border rounded-xl bg-white flex flex-col overflow-hidden"
        style={{ minHeight: 650 }}
      >
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <div className="text-2xl font-semibold">
              {selectedMember ? selectedMember.fullname : "Chọn học viên"}
            </div>
            <div className="text-base text-slate-500">
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

          <div className="text-right">
            <div className="text-sm text-slate-500">Điểm</div>
            <div className="text-2xl font-semibold text-slate-800">
              {selectedSubmission
                ? getScoreText(selectedSubmission) ?? "—"
                : "—"}
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {detailLoading ? (
            <div className="text-slate-500">Đang tải...</div>
          ) : selectedSubmission ? (
            <div className="max-w-3xl">
              {(selectedSubmission.files ?? []).length === 0 ? (
                <div className="text-sm text-slate-500">
                  Không có tệp đính kèm.
                </div>
              ) : (
                <div className="space-y-4">
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
                        <div
                          key={f.id}
                          className="flex items-center border rounded-lg p-4"
                        >
                          <div className="flex-1">
                            <a
                              href={f.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline text-lg font-medium"
                            >
                              {f.fileName}
                            </a>
                            <div className="text-sm text-slate-500 mt-1">
                              {isImage ? "Hình ảnh" : "Tệp đính kèm"}
                            </div>
                          </div>

                          <div className="w-32 h-20 flex items-center justify-center">
                            {isImage ? (
                              <img
                                src={f.fileUrl}
                                alt={f.fileName}
                                className="max-h-20 max-w-full object-contain rounded"
                              />
                            ) : (
                              <div className="text-3xl text-slate-400">📎</div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {isTeacher && (
                <div className="mt-6 p-4 border rounded-lg bg-slate-50">
                  <div className="mb-2 text-sm text-slate-600">Chấm điểm</div>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="number"
                      value={gradeValue}
                      onChange={(e) =>
                        setGradeValue(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      className="border p-2 rounded w-28"
                      placeholder="Điểm"
                      min={0}
                      max={100}
                    />
                    <textarea
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      placeholder="Phản hồi (không bắt buộc)"
                      className="flex-1 border rounded p-2"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleGradeSubmit}
                      className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Lưu điểm
                    </button>
                    <button
                      onClick={() => {
                        setGradeValue("");
                        setGradeFeedback("");
                      }}
                      className="px-4 py-2 border rounded"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500">Học viên này chưa nộp bài.</div>
          )}
        </div>

        <div className="border-t p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center text-lg">
            {user?.fullname ? user.fullname.charAt(0).toUpperCase() : "C"}
          </div>
          <input
            type="text"
            placeholder="Thêm nhận xét riêng tư..."
            className="flex-1 border rounded-full px-4 py-3 text-base focus:outline-none"
          />
          <button className="ml-2 px-4 py-3 bg-blue-600 text-white rounded-lg">
            Gửi
          </button>
        </div>
      </main>
    </div>  
  );
};

export default ClassworkSubmissionsPage;
