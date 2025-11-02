import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import type {
  ClassMemberDto,
  ClassworkSubmission,
  ClassworkSubmissionFile,
} from "@/classManagement/interfaces/class";

/**
 * ClassworkSubmissionsPage (no useMemo)
 * - submissionMap and groups are computed directly on each render (no useMemo)
 * - Pros: code simpler and easier to reason about
 * - Cons: extra allocations on each render; if members/submissions are large,
 *   consider reintroducing useMemo for performance.
 */

const ClassworkSubmissionsPage: React.FC = () => {
  // Hooks (stable order)
  const params = useParams<{ id?: string; role?: string; classworkId?: string }>();
  const classId = Number(params.id ?? 0);
  const workId = Number(params.classworkId ?? 0);
  const navigate = useNavigate();

  const {
    getClassworkSubmissions,
    getClassMembers,
    currentClass,
    getClassInfo,
    getSubmissionByUserAndClasswork,
  } = useClassStore();
  const { user } = useAuthStore();

  // Data state
  const [submissions, setSubmissions] = useState<ClassworkSubmission[] | null>(null);
  const [members, setMembers] = useState<ClassMemberDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI / selection state
  const [selectedMember, setSelectedMember] = useState<ClassMemberDto | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ClassworkSubmission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filter toggles (show groups)
  const [showNotSubmitted, setShowNotSubmitted] = useState(true);
  const [showSubmittedNotGraded, setShowSubmittedNotGraded] = useState(true);
  const [showGraded, setShowGraded] = useState(true);

  // Load members + submissions
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
        setSubmissions(subs ?? []);
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
  }, [classId, workId, currentClass?.data?.students, getClassworkSubmissions, getClassMembers]);

  // Early UI
  if (loading) return <div className="p-8 text-slate-500">Đang tải...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  // ---------- Classification helpers ----------
  // Normalize an id for matching (string)
  const normalizeUserId = (id: any) => String(id ?? "");

  const isGraded = (s?: ClassworkSubmission | null): boolean => {
    if (!s) return false;
    // check common grade fields from different backends
    const cand = s.score  ?? null;
    if (cand !== null && cand !== undefined) {
      if (typeof cand === "number") return true;
      if (typeof cand === "string" && cand.trim() !== "") return true;
    }
    // status-like fields
    const status = (s as any).status ?? (s as any).submissionStatus ?? null;
    if (typeof status === "string") {
      const st = status.toLowerCase();
      if (["graded", "returned", "marked", "evaluated", "completed"].some((v) => st.includes(v))) return true;
    }
    // boolean flag
    if (typeof (s as any).isGraded === "boolean") return (s as any).isGraded;
    return false;
  };

  const hasSubmissionContent = (s?: ClassworkSubmission | null): boolean => {
    if (!s) return false;
    // If graded -> consider as submitted (covers case: graded but no files/time)
    if (isGraded(s)) return true;

    const filesOk = Array.isArray(s.files) && s.files.length > 0;
    const timeOk = !!(s.latestSubmissionTime || s.firstSubmissionTime);
    // optional explicit boolean from backend
    const explicitFlag = typeof (s as any).hasSubmitted === "boolean" ? (s as any).hasSubmitted : undefined;
    if (explicitFlag !== undefined) return explicitFlag;
    return filesOk || timeOk;
  };

  const getScoreText = (s?: ClassworkSubmission | null) => {
    if (!s) return null;
    const cand = s.score ?? null;
    if (cand !== null && cand !== undefined) return `${cand}/100`;
    return null;
  };

  // ---------- Build a submission map (normalized keys) directly (no useMemo) ----------
  const submissionMap = new Map<string, ClassworkSubmission>();
  (submissions ?? []).forEach((s) => {
    // normalize different field names used by backends
    const id = normalizeUserId(s.appUserId ??(s as any).AppUserId);
    submissionMap.set(id, s);
  });

  // ---------- Group members (direct computation) ----------
  type GroupKey = "notSubmitted" | "submittedNotGraded" | "graded";
  const groups: Record<GroupKey, ClassMemberDto[]> = {
    notSubmitted: [],
    submittedNotGraded: [],
    graded: [],
  };

  const mems = members ?? [];
  for (const m of mems) {
    const id = normalizeUserId(m.userId ?? m.id ?? m.userId);
    const s = submissionMap.get(id) ?? null;

    const submitted = hasSubmissionContent(s);
    const graded = isGraded(s);

    if (!submitted) groups.notSubmitted.push(m);
    else if (submitted && !graded) groups.submittedNotGraded.push(m);
    else groups.graded.push(m);
  }

  // ---------- Selection / fetch single submission (merge into submissions) ----------
  const pickMember = async (m: ClassMemberDto) => {
    setSelectedMember(m);
    setSelectedSubmission(null);
    setDetailLoading(true);
    try {
      const s = await getSubmissionByUserAndClasswork(workId, normalizeUserId(m.userId));
      if (s) {
        setSelectedSubmission(s);

        // Merge into submissions state if not present so left list updates
        setSubmissions((prev) => {
          const prevArr = prev ?? [];
          const keyOfS = normalizeUserId((s as any).appUserId ?? (s as any).app_user_id ?? (s as any).userId ?? "");
          const exists = prevArr.some(
            (x) =>
              normalizeUserId((x as any).appUserId ?? (x as any).app_user_id ?? (x as any).userId ?? "") === keyOfS
          );
          if (exists) return prevArr;
          return [...prevArr, s];
        });
      } else {
        const fallback = (submissions ?? []).find(
          (x) => normalizeUserId((x as any).appUserId ?? (x as any).app_user_id ?? (x as any).userId ?? "") === normalizeUserId(m.userId)
        ) ?? null;
        setSelectedSubmission(fallback);
      }
    } catch (err) {
      console.error("Failed to load individual submission", err);
      setSelectedSubmission(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // ---------- Member row component ----------
  const MemberRow: React.FC<{ member: ClassMemberDto; submission?: ClassworkSubmission | null }> = ({ member, submission }) => {
    const submitted = hasSubmissionContent(submission);
    const graded = isGraded(submission);
    const isSelected = selectedMember && normalizeUserId(selectedMember.userId) === normalizeUserId(member.userId);
    const scoreText = getScoreText(submission) ?? (submitted ? "__/100" : "—/100");

    return (
      <div
        key={member.userId}
        onClick={() => pickMember(member)}
        className={`flex items-center justify-between cursor-pointer p-4 hover:bg-slate-50 ${isSelected ? "bg-slate-100" : ""}`}
      >
        <div className="flex items-center gap-4">
          <input type="checkbox" className="w-5 h-5" />
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${submitted ? "bg-blue-600" : "bg-slate-400"} text-lg`}>
            {member.fullname ? member.fullname.charAt(0).toUpperCase() : String(member.userId).charAt(0).toUpperCase()}
          </div>
          <div className="text-base">
            <div className="font-medium">{member.fullname ?? member.userId}</div>
            {member.email && <div className="text-sm text-slate-400">{member.email}</div>}
          </div>
        </div>

        <div className="text-base text-right min-w-[84px]">
          {graded ? (
            <div className="text-green-600 font-semibold">{scoreText}</div>
          ) : submitted ? (
            <div className="text-slate-600">{scoreText}</div>
          ) : (
            <div className="text-slate-400">—/100</div>
          )}
        </div>
      </div>
    );
  };

  // ---------- Visible groups depending on toggles ----------
  const visibleNotSubmitted = showNotSubmitted ? groups.notSubmitted : [];
  const visibleSubmittedNotGraded = showSubmittedNotGraded ? groups.submittedNotGraded : [];
  const visibleGraded = showGraded ? groups.graded : [];

  // ---------- Render ----------
  return (
    <div className="flex h-full p-8 gap-6">
      {/* Left column - grouped lists with filters */}
      <aside className="w-96 border rounded-xl bg-white overflow-auto" style={{ minHeight: 650 }}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5" />
            <div className="font-semibold text-lg">Tất cả học viên</div>
          </div>
          <div>
            <button className="px-3 py-2 border rounded text-sm">Sắp xếp</button>
          </div>
        </div>

        {/* Filter toggles */}
        <div className="p-4 border-b flex items-center gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={showNotSubmitted} onChange={(e) => setShowNotSubmitted(e.target.checked)} />
            Chưa nộp
          </label>
          <label className="inline-flex items-center gap-2 ml-3">
            <input type="checkbox" checked={showSubmittedNotGraded} onChange={(e) => setShowSubmittedNotGraded(e.target.checked)} />
            Đã nộp (chưa chấm)
          </label>
          <label className="inline-flex items-center gap-2 ml-3">
            <input type="checkbox" checked={showGraded} onChange={(e) => setShowGraded(e.target.checked)} />
            Đã chấm
          </label>
        </div>

        {/* Group: Chưa nộp */}
        <div className="p-3 border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Chưa nộp</div>
            <div className="text-sm text-slate-500">{groups.notSubmitted.length}</div>
          </div>
        </div>
        <div className="divide-y">
          {visibleNotSubmitted.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">{showNotSubmitted ? "Không có ai." : "Đã ẩn"}</div>
          ) : (
            visibleNotSubmitted.map((m) => {
              const s = submissionMap.get(normalizeUserId(m.userId)) ?? null;
              return <MemberRow key={m.userId} member={m} submission={s} />;
            })
          )}
        </div>

        {/* Group: Đã nộp (chưa chấm) */}
        <div className="p-3 border-t border-b bg-slate-50 mt-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Đã nộp (chưa chấm)</div>
            <div className="text-sm text-slate-500">{groups.submittedNotGraded.length}</div>
          </div>
        </div>
        <div className="divide-y">
          {visibleSubmittedNotGraded.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">{showSubmittedNotGraded ? "Không có ai." : "Đã ẩn"}</div>
          ) : (
            visibleSubmittedNotGraded.map((m) => {
              const s = submissionMap.get(normalizeUserId(m.userId)) ?? null;
              return <MemberRow key={m.userId} member={m} submission={s} />;
            })
          )}
        </div>

        {/* Group: Đã chấm */}
        <div className="p-3 border-t border-b bg-slate-50 mt-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Đã chấm</div>
            <div className="text-sm text-slate-500">{groups.graded.length}</div>
          </div>
        </div>
        <div className="divide-y">
          {visibleGraded.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">{showGraded ? "Chưa có ai được chấm." : "Đã ẩn"}</div>
          ) : (
            visibleGraded.map((m) => {
              const s = submissionMap.get(normalizeUserId(m.userId)) ?? null;
              return <MemberRow key={m.userId} member={m} submission={s} />;
            })
          )}
        </div>
      </aside>

      {/* Right column - detail panel */}
      <main className="flex-1 border rounded-xl bg-white flex flex-col overflow-hidden" style={{ minHeight: 650 }}>
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <div className="text-2xl font-semibold">{selectedMember ? selectedMember.fullname : "Chọn học viên"}</div>
            <div className="text-base text-slate-500">
              {selectedSubmission ? (
                <span>
                  Đã nộp • <button className="underline text-blue-600" onClick={() => { /* could open history modal */ }}>Xem lịch sử</button>
                </span>
              ) : (
                <span>Chưa nộp</span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-slate-500">Điểm</div>
            <div className="text-2xl font-semibold text-slate-800">
              {selectedSubmission ? (getScoreText(selectedSubmission) ?? "—/100") : "Không có điểm"}
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {detailLoading ? (
            <div className="text-slate-500">Đang tải...</div>
          ) : selectedSubmission ? (
            <div className="max-w-3xl">
              {(selectedSubmission.files ?? []).length === 0 ? (
                <div className="text-sm text-slate-500">Không có tệp đính kèm.</div>
              ) : (
                <div className="space-y-4">
                  {(selectedSubmission.files ?? []).map((f: ClassworkSubmissionFile) => {
                    const ext = (f.fileName ?? "").split(".").pop()?.toLowerCase() ?? "";
                    const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
                    return (
                      <div key={f.id} className="flex items-center border rounded-lg p-4">
                        <div className="flex-1">
                          <a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-lg font-medium">
                            {f.fileName}
                          </a>
                          <div className="text-sm text-slate-500 mt-1">{isImage ? "Hình ảnh" : "Tệp đính kèm"}</div>
                        </div>

                        <div className="w-32 h-20 flex items-center justify-center">
                          {isImage ? (
                            <img src={f.fileUrl} alt={f.fileName} className="max-h-20 max-w-full object-contain rounded" />
                          ) : (
                            <div className="text-3xl text-slate-400">📎</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-500">Học viên này chưa nộp bài.</div>
          )}
        </div>

        {/* bottom private comment bar */}
        <div className="border-t p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center text-lg">
            {user?.fullname ? user.fullname.charAt(0).toUpperCase() : "C"}
          </div>
          <input
            type="text"
            placeholder="Thêm nhận xét riêng tư..."
            className="flex-1 border rounded-full px-4 py-3 text-base focus:outline-none"
          />
          <button className="ml-2 px-4 py-3 bg-blue-600 text-white rounded-lg">Gửi</button>
        </div>
      </main>
    </div>
  );
};

export default ClassworkSubmissionsPage;