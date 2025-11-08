import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { mapToCoarseRole } from "@/classManagement/utils/roleutil";
import type {
  ClassWork,
  ClassworkSubmission,
  LinkPayload,
  ClassworkSubmissionFile,
  ClassNotification,
} from "@/classManagement/interfaces/class";
import { isPastDeadline } from "../utils/dateutil";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { Button } from "@/common/components/ui/button";

const AvatarIcon: React.FC = () => (
  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl shadow">📝</div>
);

const RightCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow p-5 mb-4 border">
    <div className="text-md font-semibold mb-3">{title}</div>
    <div>{children}</div>
  </div>
);

const Icon: React.FC<{ name: "drive" | "link" | "file" | string }> = ({ name }) => {
  if (name === "drive") return (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 17h18l-2-4-4-8H9L5 13l-2 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>);
  if (name === "link") return (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M10 14a5 5 0 0 1 7.07 0l1.41 1.41a5 5 0 0 1-7.07 7.07l-1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14 10a5 5 0 0 1-7.07 0L5.52 8.59a5 5 0 0 1 7.07-7.07L14 2.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>);
  return (<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M17 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>);
};

const FilePreview: React.FC<{ f: ClassworkSubmissionFile }> = ({ f }) => {
  const ext = (f.fileName ?? "").split(".").pop()?.toLowerCase() ?? "";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
  const isPdf = ext === "pdf";
  return (
    <div className="flex items-center border rounded-lg p-3 bg-white">
      <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded mr-4 overflow-hidden">
        {isImage ? (
          <img src={String(f.fileUrl)} alt={f.fileName} className="max-h-12 max-w-full object-cover" />
        ) : isPdf ? (
          <svg className="w-6 h-6 text-slate-600" viewBox="0 0 24 24" fill="none"><path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        ) : (
          <div className="text-2xl">📎</div>
        )}
      </div>
      <div className="flex-1">
        <a href={String(f.fileUrl)} target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">{f.fileName}</a>
        <div className="text-xs text-slate-500 mt-1">{isImage ? "Hình ảnh" : isPdf ? "PDF" : "Tệp đính kèm"}</div>
      </div>
    </div>
  );
};

const CommentItem: React.FC<{ c: any }> = ({ c }) => {
  const name = c.userFullname ?? c.userName ?? c.displayName ?? "Người dùng";
  return (
    <div className="flex gap-3 p-3 border-b">
      <Avatar>
        <AvatarFallback>{(name || "U").charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="text-sm font-medium">
          {name}
          <span className="text-xs text-slate-400 ml-2">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</span>
        </div>
        <div className="text-sm text-slate-700 mt-1" dangerouslySetInnerHTML={{ __html: c.content ?? c.html ?? c.text ?? "" }} />
      </div>
    </div>
  );
};

const ClassworkDetail: React.FC = () => {
  const params = useParams<Record<string, string | undefined>>();
  const location = useLocation();
  const navigate = useNavigate();

  const id = params.id;

  const classworkIdResolved =
    params.classworkId ??
    (() => {
      const segments = location.pathname.split("/").filter(Boolean);
      const idx = segments.findIndex((s) => s.toLowerCase() === "classwork");
      if (idx !== -1 && segments.length > idx + 1) {
        return segments[idx + 1];
      }
      return undefined;
    })();

  const { user } = useAuthStore();
  const coarseRole = mapToCoarseRole(user?.roles);
  const role = coarseRole === "student" ? "student" : "teacher";

  const {
    getClassWorks,
    submitClasswork,
    getClassworkSubmissions,
    getClassInfo,
    getSubmissionByUserAndClasswork,
    currentClass,
    addComment,
  } = useClassStore();

  const [classwork, setClasswork] = useState<ClassWork | null | undefined>(undefined);

  const [files, setFiles] = useState<File[]>([]);
  const [linkAttachments, setLinkAttachments] = useState<LinkPayload[]>([]);
  const [submissions, setSubmissions] = useState<ClassworkSubmission[]>([]);
  const [userSubmission, setUserSubmission] = useState<ClassworkSubmission | null>(null);

  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // comments state for this classwork (notification)
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getClassInfo(Number(id));
    try {
      const maybePromise = getClassWorks(Number(id)) as any;
      if (maybePromise && typeof maybePromise.then === "function") {
        maybePromise.catch((err: any) => console.error("getClassWorks error:", err));
      }
    } catch (e) {
      console.error("getClassWorks call error:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const works = currentClass?.data?.works ?? [];
    if (!classworkIdResolved) {
      setClasswork(null);
      return;
    }
    const found = works.find((w) => String(w.id) === String(classworkIdResolved));
    if (found) setClasswork(found);
    else {
      if (works.length > 0) setClasswork(null);
      else setClasswork(undefined);
    }
  }, [currentClass?.data?.works, classworkIdResolved]);

  // helper to display score text
  const getScoreText = (s?: ClassworkSubmission | null) => {
    if (!s) return null;
    const cand = s.score ?? (s as any).raw?.score ?? null;
    if (cand !== null && cand !== undefined && String(cand).trim() !== "") return `${cand}`;
    return null;
  };

  // load submissions and user's submission + comments
  useEffect(() => {
    if (!classwork || !classwork.id) {
      setSubmissions([]);
      setUserSubmission(null);
      setComments([]);
      return;
    }

    (async () => {
      try {
        const all = await getClassworkSubmissions(Number(classwork.id));
        setSubmissions(all ?? []);
      } catch (err) {
        console.error("getClassworkSubmissions error", err);
        setSubmissions([]);
      }
    })();

    (async () => {
      try {
        const currentUserId = user?.id ?? localStorage.getItem("currentUserId") ?? "";
        if (!currentUserId) {
          setUserSubmission(null);
          return;
        }
        const mine = await getSubmissionByUserAndClasswork(Number(classwork.id), currentUserId);
        setUserSubmission(mine);
        setEditingSubmission(false);
      } catch (err) {
        console.error("getSubmissionByUserAndClasswork error", err);
        setUserSubmission(null);
      }
    })();

    // load comments: try to find matching notification in currentClass.notifications
    const noti: ClassNotification | undefined = (currentClass?.data?.notifications ?? []).find(n => Number(n.id) === Number(classwork.id));
    if (noti) {
      const normalized = (noti.comments ?? []).map((c: any) => ({
        id: c.id,
        notificationId: c.notificationId ?? noti.id,
        userId: c.appUserId ?? c.app_user_id ?? c.userId ?? null,
        content: c.content ?? c.text ?? c.html ?? "",
        createdAt: c.createdAt ?? c.created_at ?? "",
        userFullname: c.userFullname ?? c.userFullName ?? c.fullName ?? "",
        imageUrl: c.imageUrl ?? c.avatarUrl ?? null,
        raw: c,
      }));
      setComments(normalized);
    } else {
      setComments([]);
    }
  }, [classwork, getClassworkSubmissions, getSubmissionByUserAndClasswork, currentClass, user?.id]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      const target = e.target as Node;
      if (!menuRef.current.contains(target)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    if (newFiles.length === 0) return;
    setFiles((prev) => [...prev, ...newFiles]);
    setMenuOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddLink = async (kind: "drive" | "link") => {
    const url = window.prompt(`${kind === "drive" ? "Drive URL" : "Nhập đường liên kết"}`);
    if (!url) return;
    const rawTitle = window.prompt("Tiêu đề hiển thị (không bắt buộc)");
    const title = rawTitle ?? undefined;
    setLinkAttachments((prev) => [...prev, { url, title }]);
    setMenuOpen(false);
  };

  const removeFileAt = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));
  const removeLinkAt = (index: number) => setLinkAttachments((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!classwork?.id) return;
    if (hasSubmittedAndNotEditing() && files.length === 0 && linkAttachments.length === 0) {
      setEditingSubmission(true);
      setMenuOpen(true);
      return;
    }

    setLoadingSubmit(true);
    try {
      const appUserId = user?.id ?? localStorage.getItem("currentUserId") ?? "";
      await submitClasswork(Number(classwork.id), appUserId, files, linkAttachments);

      const mine = await getSubmissionByUserAndClasswork(Number(classwork.id), appUserId);
      setUserSubmission(mine);

      const updated = await getClassworkSubmissions(Number(classwork.id));
      setSubmissions(updated ?? []);

      setFiles([]);
      setLinkAttachments([]);
      setMenuOpen(false);
      setEditingSubmission(false);
    } catch (err) {
      console.error("Submit error", err);
      alert("Nộp bài thất bại. Vui lòng thử lại.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const classInfo = currentClass?.data?.classInfo ?? null;

  // add a public comment to the classwork (notification)
  const handleAddComment = async () => {
    if (!classwork?.id) return;
    if (!commentText || commentText.trim().length === 0) return;
    setCommentLoading(true);
    try {
      const createdBy = user?.id ?? localStorage.getItem("currentUserId") ?? "";
      // call store.addComment which should return the created comment object (or null/false)
      const created = await addComment({
        notificationId: classwork.id,
        userId: createdBy,
        content: commentText,
      });

      // Immediately append the created comment (if we received an object) for instant UI feedback.
      // Then refresh server-side notifications in background by reloading class info so store stays consistent.
      if (created && typeof created === "object") {
        const createdAny = created as any;
        const createdUserId = createdAny.userId ?? createdAny.appUserId ?? createdAny.app_user_id ?? createdBy;
        const mapped = {
          id: createdAny.id ?? Date.now(),
          notificationId: classwork.id,
          userId: createdUserId,
          content: createdAny.content ?? createdAny.text ?? commentText,
          createdAt: createdAny.createdAt ?? createdAny.created_at ?? new Date().toISOString(),
          userFullname: createdAny.userFullname ?? createdAny.userName ?? "",
          imageUrl: null,
          raw: createdAny,
        };
        setComments(prev => {
          // dedupe by id to avoid duplicate entries
          const exists = prev.some(c => String(c.id) === String(mapped.id));
          if (exists) return prev;
          return [mapped, ...prev];
        });
        // background refresh to sync store/state (non-blocking)
        void getClassInfo(Number(id));
      } else {
        // fallback: try to refresh from server/store
        await getClassInfo(Number(id));
        // after refresh, try to re-read notification comments (the useEffect that observes currentClass will run and set comments)
      }

      setCommentText("");
    } catch (err) {
      console.error("add comment error", err);
      alert("Lỗi khi thêm bình luận");
    } finally {
      setCommentLoading(false);
    }
  };

  if (classwork === undefined) {
    return <div className="p-8"><div className="text-slate-500">Đang tải thông tin bài tập...</div></div>;
  }

  if (classwork === null) {
    return <div className="p-8"><div className="text-slate-500">Không tìm thấy bài tập này.</div></div>;
  }

  const hasSubmitted = !!userSubmission;
  function hasSubmittedAndNotEditing() {
    return hasSubmitted && !editingSubmission;
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
            className="p-3 rounded-full hover:bg-slate-100 text-lg"
          >
            ←
          </button>
          <AvatarIcon />
          <div>
            <h1 className="text-3xl font-bold">{classwork.title}</h1>
            <div className="text-base text-slate-500 mt-1">
              <span>{currentClass?.data?.teacher?.fullname ?? "Giáo viên"} • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="mt-3 text-base text-slate-700">{classwork.maxScore ?? 100} điểm</div>
          </div>
        </div>
        <div className="text-base text-slate-600">{(() => {
          if (!classwork.deadline) return "Không xác định";
          const d = new Date(classwork.deadline);
          const day = d.getDate();
          const monthNames = ["thg 1","thg 2","thg 3","thg 4","thg 5","thg 6","thg 7","thg 8","thg 9","thg 10","thg 11","thg 12"];
          return `Đến hạn ${day} ${monthNames[d.getMonth()]}`;
        })()}</div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white border rounded-xl p-6">
            <div className="text-slate-700 mb-4 text-lg">{classwork.description || "Không có mô tả"}</div>

            {/* Public comments for the classwork (visible to class) */}
            <div className="mb-6">
              <div className="mb-3 font-semibold">Bình luận chung</div>
              <div className="mb-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="w-full border rounded p-3 min-h-[80px]"
                />
                <div className="flex justify-end mt-2 gap-2">
                  <Button onClick={() => setCommentText("")} variant="secondary">Hủy</Button>
                  <Button onClick={handleAddComment} disabled={commentLoading || !commentText.trim()}>{commentLoading ? "Đang gửi..." : "Gửi bình luận"}</Button>
                </div>
              </div>

              <div className="space-y-2">
                {comments.length === 0 ? (
                  <div className="text-sm text-slate-500">Chưa có bình luận nào.</div>
                ) : (
                  comments.map((c) => <CommentItem key={c.id ?? `${c.userId}-${c.createdAt}`} c={c} />)
                )}
              </div>
            </div>

            <hr className="my-6" />
            <div className="flex items-center gap-4 text-slate-700 mb-3">
              <svg className="w-6 h-6 text-slate-500" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              <div className="font-semibold">Nhận xét của lớp học</div>
            </div>
            <div><button className="text-blue-600 font-medium">Thêm nhận xét về lớp học</button></div>

            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-3">Danh sách bài đã nộp</h4>
              <div className="space-y-3">
                {submissions.length === 0 ? (<div className="text-slate-500 text-base">Chưa có bài nộp nào.</div>) : submissions.map((sub) => {
                  const scoreText = getScoreText(sub);
                  const graded = !!scoreText;
                  return (
                    <div key={sub.id} className="border rounded-lg p-4 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="text-base text-slate-800">Nộp lần cuối: {new Date(sub.latestSubmissionTime ?? sub.firstSubmissionTime ?? Date.now()).toLocaleString()}</div>
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${graded ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                            {graded ? `Điểm: ${scoreText}` : "Chưa chấm"}
                          </div>
                          {graded && (sub as any).gradedAt && <div className="text-xs text-slate-400">• {new Date((sub as any).gradedAt).toLocaleDateString()}</div>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 mt-3">
                        {(sub.files ?? []).map((f) => <FilePreview key={f.id} f={f} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <aside className="col-span-12 lg:col-span-4">
          <RightCard title={hasSubmitted ? "Bài bạn đã nộp" : "Bài tập của bạn"}>
            <div className="flex flex-col gap-4">
              {hasSubmitted && userSubmission && !editingSubmission ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-base text-slate-600">Đã nộp: {new Date(userSubmission.latestSubmissionTime ?? userSubmission.firstSubmissionTime ?? Date.now()).toLocaleString()}</div>
                    <div>
                      {/* display score prominently */}
                      {getScoreText(userSubmission) ? (
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Điểm của bạn</div>
                          <div className="text-2xl font-bold text-green-600">{getScoreText(userSubmission)}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">Chưa chấm</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(userSubmission.files ?? []).length === 0 ? (
                      <div className="text-slate-500 text-sm">Không có tệp đính kèm.</div>
                    ) : (
                      userSubmission.files.map((f: ClassworkSubmissionFile) => (
                        <div key={f.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-sm">📎</div>
                            <div className="text-sm"><a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">{f.fileName}</a></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="text-sm text-slate-400">Bạn có thể nộp lại nếu muốn thêm tệp.</div>
                </>
              ) : (
                <>
                  <div className="relative" ref={menuRef}>
                    <button onClick={() => setMenuOpen((s) => !s)} className="w-full border rounded-full py-3 text-base flex items-center justify-center gap-3 font-medium"><span className="text-lg">+</span> Thêm hoặc tạo</button>
                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-20">
                        <button className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50" onClick={() => handleAddLink("drive")}><div className="w-6"><Icon name="drive" /></div><div>Google Drive</div></button>
                        <button className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50" onClick={() => handleAddLink("link")}><div className="w-6"><Icon name="link" /></div><div>Đường liên kết</div></button>
                        <button className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50" onClick={() => { setMenuOpen(false); fileInputRef.current?.click(); }}><div className="w-6"><Icon name="file" /></div><div>Tệp</div></button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {files.length === 0 && linkAttachments.length === 0 ? (<div className="text-slate-500 text-sm">Chưa có tệp hoặc liên kết nào được thêm.</div>) : (<>
                      {files.map((f, idx) => (<div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-sm">{f.name?.slice(0,1).toUpperCase()}</div><div className="text-sm">{f.name}</div></div><button onClick={() => removeFileAt(idx)} className="text-xs text-red-500">Xóa</button></div>))}
                      {linkAttachments.map((l, idx) => (<div key={`link-${idx}`} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-sm">🔗</div><div className="text-sm"><a href={l.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{l.title ?? l.url}</a></div></div><button onClick={() => removeLinkAt(idx)} className="text-xs text-red-500">Xóa</button></div>))}
                    </>)}
                  </div>
                </>
              )}

              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

              <div className="flex gap-3">
                <button
                  disabled={isPastDeadline(classwork.deadline) || loadingSubmit}
                  onClick={handleSubmit}
                  className={`flex-1 py-3 rounded-lg text-white ${isPastDeadline(classwork.deadline) ? "bg-gray-300" : "bg-blue-600"}`}
                >
                  {loadingSubmit ? "Đang nộp..." : (hasSubmitted ? (editingSubmission ? "Nộp lại" : "Nộp lại") : "Đánh dấu là đã hoàn thành")}
                </button>

                {editingSubmission && (
                  <button
                    onClick={() => {
                      setEditingSubmission(false);
                      setFiles([]);
                      setLinkAttachments([]);
                      setMenuOpen(false);
                    }}
                    className="px-4 py-3 rounded-lg border"
                  >
                    Hủy
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-400 mt-2">{isPastDeadline(classwork.deadline) ? "Không thể nộp bài tập sau ngày đến hạn" : "Bạn có thể nộp trước hạn nộp"}</div>
            </div>
          </RightCard>

          <RightCard title="Nhận xét riêng tư">
            <div className="text-sm text-slate-700"><button className="text-blue-600 font-medium">Thêm nhận xét cho {currentClass?.data?.teacher?.fullname ?? "học viên"}</button></div>
          </RightCard>
        </aside>
      </div>
    </div>
  );
};

export default ClassworkDetail;