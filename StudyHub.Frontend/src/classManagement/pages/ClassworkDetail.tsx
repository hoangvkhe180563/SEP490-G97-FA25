import React, { useEffect, useRef, useState, useMemo } from "react";
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
import { isPastDeadline } from "@/classManagement/utils/dateutil";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { Button } from "@/common/components/ui/button";
import { Card } from "@/common/components/ui/card";
import { Textarea } from "@/common/components/ui/textarea";
import { Badge } from "@/common/components/ui/badge";
import { formatISO } from "date-fns";
import { Book } from "lucide-react";



const AvatarIcon: React.FC = () => (
  <div className="w-16 h-16 rounded-full flex items-center justify-center shadow">
    <Book className="w-5 h-5 text-amber-950" />
  </div>
);

const FileTile: React.FC<{
  name?: string;
  url?: string;
  type?: "image" | "pdf" | "other";
}> = ({ name, url, type }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border rounded-lg">
      <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded overflow-hidden">
        {type === "image" && url ? (
          <img src={url} alt={name} className="w-full h-full object-cover" />
        ) : type === "pdf" ? (
          <div className="text-slate-600">📄</div>
        ) : (
          <div className="text-slate-600">📎</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-sm text-blue-600 hover:underline block break-all max-w-full"
          >
            {name}
          </a>
        ) : (
          <div className="font-medium text-sm truncate">{name}</div>
        )}
      </div>
      {type !== "other" && (
        <Badge className="bg-slate-100 text-slate-700">
          {type === "image" ? "Ảnh" : "PDF"}
        </Badge>
      )}
    </div>
  );
};

const FilePreview: React.FC<{ f: ClassworkSubmissionFile }> = ({ f }) => {
  const ext = (f.fileName ?? "").split(".").pop()?.toLowerCase() ?? "";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
  const isPdf = ext === "pdf";
  return (
    <div className="flex items-center border rounded-lg p-3 bg-white">
      <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded mr-4 overflow-hidden">
        {isImage ? (
          <img
            src={String(f.fileUrl)}
            alt={f.fileName}
            className="max-h-12 max-w-full object-cover"
          />
        ) : isPdf ? (
          <div className="text-slate-600">📄</div>
        ) : (
          <div className="text-2xl">📎</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <a
          href={String(f.fileUrl)}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline font-medium block break-all max-w-full"
        >
          {f.fileName}
        </a>
        <div className="text-xs text-slate-500 mt-1">
          {isImage ? "Hình ảnh" : isPdf ? "PDF" : "Tệp đính kèm"}
        </div>
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
          <span className="text-xs text-slate-400 ml-2">
            {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
          </span>
        </div>
        <div
          className="text-sm text-slate-700 mt-1"
          dangerouslySetInnerHTML={{ __html: c.content ?? c.html ?? c.text ?? "" }}
        />
      </div>
    </div>
  );
};

const ClassworkDetail: React.FC = () => {
  // ----- hooks (stable order) -----
  const params = useParams<Record<string, string | undefined>>();
  const location = useLocation();
  const navigate = useNavigate();

  const id = params.id;

  const classworkIdResolved =
    params.classworkId ??
    (() => {
      const segments = location.pathname.split("/").filter(Boolean);
      const idx = segments.findIndex((s) => s.toLowerCase() === "classwork");
      if (idx !== -1 && segments.length > idx + 1) return segments[idx + 1];
      return undefined;
    })();

  const { user } = useAuthStore();
  const coarseRole = mapToCoarseRole(user?.roles);
  const role = coarseRole === "student" ? "student" : "teacher";

  const {
    getClassWorks,
    submitClasswork,
    getClassworkSubmissions,
    getClassworkDetail,
    getClassInfo,
    getSubmissionByUserAndClasswork,
    currentClass,
    addComment,
  } = useClassStore();

  // UI state
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

  const [cwDetail, setCwDetail] = useState<null | { data?: any; submissions?: any[]; files?: any[] }>(null);

  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  // refs to prevent duplicate network calls
  const initialFetchedRef = useRef<string | null>(null);
  const fetchedClassworkDetailRef = useRef<string | null>(null);
  const fetchedSubmissionsRef = useRef<string | null>(null);
  const fetchedUserSubmissionRef = useRef<string | null>(null);

  // ----- stable derived values -----
  // Use primitive deps (length) to avoid deep object identity changes causing effects to retrigger
  const worksLength = (currentClass && currentClass.data && Array.isArray(currentClass.data.works)) ? currentClass.data.works.length : 0;
  const teachersLength = (currentClass && currentClass.data && Array.isArray(currentClass.data.teachers)) ? currentClass.data.teachers.length : 0;

  // teacherForClasswork: stable useMemo called unconditionally
  const teacherForClasswork = useMemo(() => {
    const teachers = (currentClass && currentClass.data && Array.isArray(currentClass.data.teachers)) ? currentClass.data.teachers : [];
    const createdBy = (classwork as any)?.createdBy ?? null;
    if (createdBy) {
      const found = teachers.find((t: any) => String(t.userId) === String(createdBy));
      if (found) return found as any;
    }
    if (teachers.length > 0) return teachers[0] as any;
    return (currentClass && currentClass.data && currentClass.data.teachers) ?? null;
  }, [teachersLength, classwork]);

  // ----- Effects (minimal, guarded) -----

  // initial fetch: getClassInfo + getClassWorks (only once per class id)
  useEffect(() => {
    if (!id) return;
    if (initialFetchedRef.current === id) return;
    initialFetchedRef.current = id;

    (async () => {
      try {
        if (typeof getClassInfo === "function") await getClassInfo(Number(id));
      } catch (err) {
        console.error("getClassInfo failed", err);
      }
      try {
        if (typeof getClassWorks === "function") await getClassWorks(Number(id));
      } catch (err) {
        console.error("getClassWorks failed", err);
      }
    })();
    // only depend on id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // keep local classwork in sync with store snapshot — depend only on primitive length and the resolved id
  useEffect(() => {
    const works = (currentClass && currentClass.data && Array.isArray(currentClass.data.works)) ? currentClass.data.works : [];
    if (!classworkIdResolved) {
      setClasswork(null);
      return;
    }
    const found = works.find((w: any) => String(w.id) === String(classworkIdResolved));
    if (found) setClasswork(found as ClassWork);
    else {
      // If works array is present but not found -> not found
      if (works.length > 0) setClasswork(null);
      else setClasswork(undefined); // still loading
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classworkIdResolved, worksLength]);

  // when classwork is set, fetch detail/submissions/userSubmission (guarded per classwork)
  useEffect(() => {
    if (!classwork || !classwork.id) {
      setCwDetail(null);
      setSubmissions([]);
      setUserSubmission(null);
      setComments([]);
      return;
    }
    const cwIdStr = String(classwork.id);

    // fetch detail once per classwork id
    if (fetchedClassworkDetailRef.current !== cwIdStr) {
      fetchedClassworkDetailRef.current = cwIdStr;
      (async () => {
        try {
          if (typeof getClassworkDetail === "function") {
            const detail = await getClassworkDetail(Number(classwork.id));
            if (detail) {
              setCwDetail({
                data: detail.data ?? {},
                submissions: detail.submissions ?? [],
                files: detail.files ?? [],
              });
              if (Array.isArray(detail.submissions) && detail.submissions.length > 0) {
                const normalized: ClassworkSubmission[] = detail.submissions.map((s: any) => ({
                  id: s.id,
                  classworkId: s.classworkId ?? s.notificationId ?? classwork.id,
                  appUserId: s.appUserId ?? s.app_user_id ?? s.userId ?? "",
                  firstSubmissionTime: s.firstSubmissionTime ?? null,
                  latestSubmissionTime: s.latestSubmissionTime ?? null,
                  files: (s.submissionFiles ?? s.files ?? []).map((f: any) => ({
                    id: f.id,
                    fileName: f.fileName,
                    fileUrl: f.fileUrl,
                  })),
                  score: s.score ?? null,
                  submissionStatus: s.submissionStatus ?? null,
                  raw: s,
                }));
                setSubmissions(normalized);
              }
            } else {
              setCwDetail(null);
            }
          }
        } catch (err) {
          console.error("getClassworkDetail error", err);
          setCwDetail(null);
        }
      })();
    }

    // fetch submissions once per classwork id if needed
    if (fetchedSubmissionsRef.current !== cwIdStr) {
      fetchedSubmissionsRef.current = cwIdStr;
      (async () => {
        try {
          if (!cwDetail?.submissions || cwDetail.submissions.length === 0) {
            if (typeof getClassworkSubmissions === "function") {
              const all = await getClassworkSubmissions(Number(classwork.id));
              setSubmissions(all ?? []);
            } else {
              setSubmissions([]);
            }
          }
        } catch (err) {
          console.error("getClassworkSubmissions error", err);
          setSubmissions([]);
        }
      })();
    }

    // fetch current user's submission once per cwId:userId
    const currentUserId = user?.id ?? (typeof window !== "undefined" ? localStorage.getItem("currentUserId") ?? "" : "");
    const userKey = `${cwIdStr}:${currentUserId}`;
    if (currentUserId && fetchedUserSubmissionRef.current !== userKey) {
      fetchedUserSubmissionRef.current = userKey;
      (async () => {
        try {
          if (typeof getSubmissionByUserAndClasswork === "function") {
            const mine = await getSubmissionByUserAndClasswork(Number(classwork.id), currentUserId);
            setUserSubmission(mine);
            setEditingSubmission(false);
          } else {
            setUserSubmission(null);
          }
        } catch (err) {
          console.error("getSubmissionByUserAndClasswork error", err);
          setUserSubmission(null);
        }
      })();
    }

    // load comments from notification snapshot once (non-reactive)
    const notiList = (currentClass && currentClass.data && Array.isArray(currentClass.data.notifications)) ? currentClass.data.notifications : [];
    const noti: ClassNotification | undefined = notiList.find((n: any) => Number(n.id) === Number(classwork.id));
    if (noti && Array.isArray(noti.comments)) {
      const normalized = (noti.comments ?? []).map((c: any) => ({
        id: c.id,
        notificationId: c.notificationId ?? noti.id,
        userId: c.appUserId ?? null,
        content: c.content ?? "",
        createdAt: c.createdAt ?? "",
        userFullname: c.userFullname ?? "",
        imageUrl: c.imageUrl ?? null,
        raw: c,
      }));
      setComments(normalized);
    } else {
      setComments([]);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classwork, user && user.id]);

  // click outside handler for menu
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      const target = e.target as Node;
      if (!menuRef.current.contains(target)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  // ----- helpers & handlers -----
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
    if ((!!userSubmission && !editingSubmission) && files.length === 0 && linkAttachments.length === 0) {
      setEditingSubmission(true);
      setMenuOpen(true);
      return;
    }

    setLoadingSubmit(true);
    try {
      const appUserId = user?.id ?? (typeof window !== "undefined" ? localStorage.getItem("currentUserId") ?? "" : "");
      await submitClasswork(Number(classwork.id), appUserId, files, linkAttachments);

      // allow refetch of user submission and submissions
      fetchedUserSubmissionRef.current = null;
      fetchedSubmissionsRef.current = null;

      if (typeof getSubmissionByUserAndClasswork === "function") {
        const mine = await getSubmissionByUserAndClasswork(Number(classwork.id), appUserId);
        setUserSubmission(mine);
      }
      if (typeof getClassworkSubmissions === "function") {
        const updated = await getClassworkSubmissions(Number(classwork.id));
        setSubmissions(updated ?? []);
      }

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

  const handleAddComment = async () => {
    if (!classwork?.id) return;
    if (!commentText || commentText.trim().length === 0) return;
    setCommentLoading(true);
    try {
      const createdBy = user?.id ?? (typeof window !== "undefined" ? localStorage.getItem("currentUserId") ?? "" : "");
      const created = await addComment({ notificationId: classwork.id, userId: createdBy, content: commentText });

      if (created && typeof created === "object") {
        const createdAny = created as any;
        const createdUserId = createdAny.userId ?? createdBy;
        const mapped = {
          id: createdAny.id ?? Date.now(),
          notificationId: classwork.id,
          userId: createdUserId,
          content: createdAny.content ?? commentText,
          createdAt: createdAny.createdAt ?? formatISO(new Date()),
          userFullname: createdAny.userFullname ?? createdAny.userName ?? "",
          imageUrl: null,
          raw: createdAny,
        };
        setComments((prev) => {
          const exists = prev.some((c) => String(c.id) === String(mapped.id));
          if (exists) return prev;
          return [mapped, ...prev];
        });
        if (typeof getClassInfo === "function") void getClassInfo(Number(id));
      } else {
        if (typeof getClassInfo === "function") await getClassInfo(Number(id));
      }

      setCommentText("");
    } catch (err) {
      console.error("add comment error", err);
      alert("Lỗi khi thêm bình luận");
    } finally {
      setCommentLoading(false);
    }
  };

  // ----- render guards -----
  if (classwork === undefined) {
    return (
      <div className="p-8">
        <div className="text-slate-500">Đang tải thông tin bài tập...</div>
      </div>
    );
  }

  if (classwork === null) {
    return (
      <div className="p-8">
        <div className="text-slate-500">Không tìm thấy bài tập này.</div>
      </div>
    );
  }

  // derived display values
  const hasSubmitted = !!userSubmission;
  const getScoreText = (s?: ClassworkSubmission | null) => {
    if (!s) return null;
    const cand = s.score ?? (s as any).raw?.score ?? null;
    if (cand !== null && cand !== undefined && String(cand).trim() !== "") return `${cand}`;
    return null;
  };

  const classworkFiles: any[] = (classwork.files && classwork.files.length > 0) ? classwork.files : cwDetail?.files ?? [];
  const classworkLinks: any[] = (classwork.links && classwork.links.length > 0) ? classwork.links : cwDetail?.data?.links ?? cwDetail?.data?.linkDtos ?? [];

  const teacherFeedback = userSubmission?.feedback ?? "";
  const gradedBy = (userSubmission as any)?.gradeByName ?? null;
  const gradedAt = (userSubmission as any)?.gradedAt ?? null;

  const allowSubmissionFlag = (() => {
    const cwAny = classwork as any;
    if (Object.prototype.hasOwnProperty.call(cwAny, "allowSubmission")) return Boolean(cwAny.allowSubmission);
    if (Object.prototype.hasOwnProperty.call(cwAny, "allow_submission")) return Boolean(cwAny.allow_submission);
    if (Object.prototype.hasOwnProperty.call(cwAny, "allowSubmit")) return Boolean(cwAny.allowSubmit);
    return true;
  })();

  return (
    <div className="p-8 w-full h-full overflow-y-auto">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-5">
          <Button variant="ghost" onClick={() => navigate(`/class/${role}/${id}?tab=exercise`)} className="p-2">←</Button>
          <AvatarIcon />
          <div>
            <h1 className="text-3xl font-bold">{classwork.title}</h1>
            <div className="text-base text-slate-500 mt-1">
              <span>{teacherForClasswork?.fullname ?? "Giáo viên"} • {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="mt-3 text-base text-slate-700">{classwork.maxScore ?? 100} điểm</div>
          </div>
        </div>
        <div className="text-base text-slate-600">
          {(() => {
            if (!classwork.deadline) return "Không xác định";
            const d = new Date(classwork.deadline);
            const day = d.getDate();
            const monthNames = ["thg 1","thg 2","thg 3","thg 4","thg 5","thg 6","thg 7","thg 8","thg 9","thg 10","thg 11","thg 12"];
            return `Đến hạn ${day} ${monthNames[d.getMonth()]}`;
          })()}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Card className="p-6">
            <div className="text-slate-700 mb-6 text-lg">{classwork.description || "Không có mô tả"}</div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-lg">Tài liệu bài tập</div>
                <div className="text-sm text-slate-500">{(classworkFiles?.length ?? 0) + (classworkLinks?.length ?? 0)} mục</div>
              </div>

              {(classworkFiles && classworkFiles.length > 0) || (classworkLinks && classworkLinks.length > 0) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {classworkFiles?.map((f: any) => {
                    const url = f.fileUrl ?? f.url;
                    const name = f.fileName ?? f.name ?? "Tệp đính kèm";
                    const ext = (name || "").split(".").pop()?.toLowerCase() ?? "";
                    const type = ["png","jpg","jpeg","gif","webp","svg"].includes(ext) ? "image" : ext === "pdf" ? "pdf" : "other";
                    return <FileTile key={f.id ?? name} name={name} url={url} type={type} />;
                  })}
                  {classworkLinks?.map((l: any, idx: number) => (
                    <div key={`link-${idx}`} className="p-3 bg-white border rounded-lg flex items-center gap-3">
                      <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded">🔗</div>
                      <div className="flex-1 min-w-0">
                        <a href={l.url ?? l.link ?? "#"} target="_blank" rel="noreferrer" className="font-medium text-sm text-blue-600 hover:underline truncate block">
                          {l.title ?? l.name ?? l.url}
                        </a>
                        <div className="text-xs text-slate-500 mt-1">Liên kết</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">Không có tài liệu kèm theo bài tập.</div>
              )}
            </div>

            <div className="mb-6">
              <div className="mb-3 font-semibold">Bình luận chung</div>
              <div className="mb-3">
                <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Viết bình luận..." className="min-h-[96px]" />
                <div className="flex justify-end mt-3 gap-2">
                  <Button variant="secondary" onClick={() => setCommentText("")}>Hủy</Button>
                  <Button onClick={handleAddComment} disabled={commentLoading || !commentText.trim()}>{commentLoading ? "Đang gửi..." : "Gửi bình luận"}</Button>
                </div>
              </div>

              <div className="space-y-2">
                {comments.length === 0 ? <div className="text-sm text-slate-500">Chưa có bình luận nào.</div> : comments.map((c) => <CommentItem key={c.id ?? `${c.userId}-${c.createdAt}`} c={c} />)}
              </div>
            </div>

            <div className="border-t my-6" />

            <div>
              <h4 className="text-lg font-semibold mb-3">Danh sách bài đã nộp</h4>
              <div className="space-y-3">
                {submissions.length === 0 ? <div className="text-slate-500 text-base">Chưa có bài nộp nào.</div> : submissions.map((sub) => {
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
                      <div className="flex flex-col gap-2 mt-3">{(sub.files ?? []).map((f: ClassworkSubmissionFile) => <FilePreview key={f.id} f={f} />)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        <aside className="col-span-12 lg:col-span-4">
          <Card className="p-5 mb-4">
            <div className="flex flex-col gap-4">
              {hasSubmitted && userSubmission && !editingSubmission ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-base text-slate-600">Đã nộp: {new Date(userSubmission.latestSubmissionTime ?? userSubmission.firstSubmissionTime ?? Date.now()).toLocaleString()}</div>
                    <div>
                      {getScoreText(userSubmission) ? <div className="text-right"><div className="text-xs text-slate-400">Điểm của bạn</div><div className="text-2xl font-bold text-green-600">{getScoreText(userSubmission)}</div></div> : <div className="text-xs text-slate-400">Chưa chấm</div>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(userSubmission.files ?? []).length === 0 ? <div className="text-slate-500 text-sm">Không có tệp đính kèm.</div> : (userSubmission.files ?? []).map((f: ClassworkSubmissionFile) => (
                      <div key={f.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                        <div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-sm">📎</div><div className="text-sm min-w-0"><a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline block break-all max-w-full">{f.fileName}</a></div></div>
                      </div>
                    ))}
                  </div>

                  <div className="text-sm text-slate-400">Bạn có thể nộp lại nếu muốn thêm tệp.</div>

                  <div className="mt-3">
                    <Button onClick={() => { setEditingSubmission(true); setMenuOpen(true); }} className="w-full">Nộp lại</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative" ref={menuRef}>
                    {allowSubmissionFlag ? (
                      <>
                        <Button className="w-full py-3" onClick={() => setMenuOpen((s) => !s)}><span className="text-lg mr-2">+</span> Thêm hoặc tạo</Button>
                        {menuOpen && (
                          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-20">
                            <button className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50" onClick={() => handleAddLink("drive")}><div className="w-6">📁</div><div>Google Drive</div></button>
                            <button className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50" onClick={() => handleAddLink("link")}><div className="w-6">🔗</div><div>Đường liên kết</div></button>
                            <button className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50" onClick={() => { setMenuOpen(false); fileInputRef.current?.click(); }}><div className="w-6">📎</div><div>Tệp</div></button>
                          </div>
                        )}
                      </>
                    ) : <div className="text-sm text-slate-500 p-2 border rounded">Giáo viên đã tắt quyền nộp bài cho bài tập này.</div>}
                  </div>

                  <div className="space-y-3 mt-4">
                    {files.length === 0 && linkAttachments.length === 0 ? <div className="text-slate-500 text-sm">Chưa có tệp hoặc liên kết nào được thêm.</div> : <>
                      {files.map((f, idx) => <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-sm">{f.name?.slice(0,1).toUpperCase()}</div><div className="text-sm truncate">{f.name}</div></div><Button variant="ghost" size="sm" onClick={() => removeFileAt(idx)}>Xóa</Button></div>)}
                      {linkAttachments.map((l, idx) => <div key={`link-${idx}`} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-sm">🔗</div><div className="text-sm truncate"><a href={l.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{l.title ?? l.url}</a></div></div><Button variant="ghost" size="sm" onClick={() => removeLinkAt(idx)}>Xóa</Button></div>)}
                    </>}
                  </div>

                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

                  {allowSubmissionFlag ? <div className="flex gap-3 mt-4"><Button disabled={isPastDeadline(classwork.deadline) || loadingSubmit} onClick={handleSubmit} className="flex-1">{loadingSubmit ? "Đang nộp..." : hasSubmitted ? (editingSubmission ? "Nộp lại" : "Nộp lại") : "Đánh dấu là đã hoàn thành"}</Button>{editingSubmission && <Button variant="outline" onClick={() => { setEditingSubmission(false); setFiles([]); setLinkAttachments([]); setMenuOpen(false); }}>Hủy</Button>}</div> : null}

                  <div className="text-xs text-slate-400 mt-2">{isPastDeadline(classwork.deadline) ? "Không thể nộp bài tập sau ngày đến hạn" : allowSubmissionFlag ? "Bạn có thể nộp trước hạn nộp" : null}</div>
                </>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-sm text-slate-700">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12">
                  <Avatar className="w-12 h-12"><AvatarFallback className="text-lg">{gradedBy ? String(gradedBy).charAt(0).toUpperCase() : (teacherForClasswork?.fullname ? teacherForClasswork.fullname.charAt(0).toUpperCase() : "G")}</AvatarFallback></Avatar>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400">Nhận xét của giáo viên</div>
                  <div className="mt-2 bg-slate-50 p-4 rounded-md text-sm text-slate-800 min-h-[48px]">
                    {teacherFeedback && String(teacherFeedback).trim().length > 0 ? <div style={{ whiteSpace: "pre-wrap" }}>{teacherFeedback}</div> : <div className="text-slate-400">Chưa có nhận xét</div>}
                  </div>
                  {(gradedBy || gradedAt) && <div className="mt-2 text-xs text-slate-400">{gradedBy ? <span>Chấm bởi {gradedBy}</span> : null}{gradedBy && gradedAt ? <span> • </span> : null}{gradedAt ? <span>{new Date(gradedAt).toLocaleString()}</span> : null}</div>}
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default ClassworkDetail;