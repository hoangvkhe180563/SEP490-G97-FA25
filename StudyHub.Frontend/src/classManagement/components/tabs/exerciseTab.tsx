/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/common/components/ui/button";
import { Card } from "@/common/components/ui/card";
import type { ClassWork } from "@/classManagement/interfaces/class";
import { isPastDeadline } from "@/classManagement/utils/dateutil";

type Props = {
  works: ClassWork[];
  role: "teacher" | "student";
  // Backwards-compatible: onOpenWork still supported.
  onOpenWork?: (workId: number) => void;
  onOpenWorkStudent?: (workId: number) => void;
  onOpenWorkTeacher?: (workId: number) => void;
  onAddWork?: () => void;
  fetchCountsForWork?: (workId: number) => Promise<void>;
  submissionCounts?: Record<number, number | null>;
  memberCounts?: Record<number, number | null>;
  classDefaultCount?: number | null;
  navigateToEdit?: (workId: number) => void;
};

const normalizeFiles = (rawFiles: any[], workId: number) => {
  if (!Array.isArray(rawFiles)) return [];
  return rawFiles.map((f: any, idx: number) => ({
    id: f?.id ?? `${workId}-file-${idx}`,
    fileName: f?.fileName ?? f?.name ?? "",
    fileUrl: f?.fileUrl ?? f?.url ?? f?.documentUrl ?? null,
    thumbnail: f?.thumbnail ?? undefined,
    fileType: (f?.fileType ?? f?.contentType ?? "").toString().toLowerCase(),
    raw: f,
  }));
};

const isImageExt = (nameOrUrl?: string) => {
  if (!nameOrUrl || typeof nameOrUrl !== "string") return false;
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(nameOrUrl) || /jpg|jpeg|png|gif|webp|bmp|svg/i.test((nameOrUrl.split(".").pop() || ""));
};

const isPdfExt = (nameOrUrl?: string) => {
  if (!nameOrUrl || typeof nameOrUrl !== "string") return false;
  return /\.pdf$/i.test(nameOrUrl) || (nameOrUrl.split(".").pop() || "").toLowerCase() === "pdf";
};

const isCloudinaryUrl = (u?: string) => {
  if (!u || typeof u !== "string") return false;
  try {
    const url = new URL(u);
    return url.hostname.endsWith("cloudinary.com");
  } catch {
    return false;
  }
};

const makeCloudinaryFlAttachment = (u: string) => {
  try {
    const url = new URL(u);
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("upload");
    if (idx !== -1) {
      parts.splice(idx + 1, 0, "fl_attachment");
      url.pathname = "/" + parts.join("/");
      return url.toString();
    }
    return u + (u.includes("?") ? "&" : "?") + "fl_attachment=1";
  } catch {
    return u;
  }
};

async function downloadUrl(fileUrl?: string, suggestedName?: string): Promise<void> {
  if (!fileUrl) return;
  try {
    let isCrossOrigin = false;
    try {
      const urlObj = new URL(String(fileUrl), window.location.href);
      isCrossOrigin = urlObj.origin !== window.location.origin;
    } catch {
      isCrossOrigin = false;
    }

    const res = await fetch(String(fileUrl), {
      method: "GET",
      mode: "cors",
      credentials: isCrossOrigin ? "omit" : "include",
    });

    if (!res.ok) {
      if (isCloudinaryUrl(String(fileUrl))) {
        window.open(makeCloudinaryFlAttachment(String(fileUrl)), "_blank", "noopener,noreferrer");
      } else {
        window.open(String(fileUrl), "_blank", "noopener,noreferrer");
      }
      return;
    }

    if ((res as any).type === "opaque") {
      if (isCloudinaryUrl(String(fileUrl))) {
        window.open(makeCloudinaryFlAttachment(String(fileUrl)), "_blank", "noopener,noreferrer");
      } else {
        window.open(String(fileUrl), "_blank", "noopener,noreferrer");
      }
      return;
    }

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    const blob = await res.blob();

    if (contentType.includes("text/html")) {
      if (isCloudinaryUrl(String(fileUrl))) {
        window.open(makeCloudinaryFlAttachment(String(fileUrl)), "_blank", "noopener,noreferrer");
      } else {
        window.open(String(fileUrl), "_blank", "noopener,noreferrer");
      }
      return;
    }

    const contentDisposition = res.headers.get("content-disposition") || "";
    let filename = suggestedName ?? "download";
    const fileNameMatch =
      contentDisposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i) ||
      contentDisposition.match(/filename="?([^";]+)"?/i);
    if (fileNameMatch && fileNameMatch[1]) {
      try {
        filename = decodeURIComponent(fileNameMatch[1].replace(/(^['"]|['"]$)/g, ""));
      } catch {
        filename = fileNameMatch[1].replace(/(^['"]|['"]$)/g, "");
      }
    } else {
      try {
        const urlObj = new URL(String(fileUrl), window.location.href);
        const last = urlObj.pathname.split("/").filter(Boolean).pop();
        if (last) filename = decodeURIComponent(last);
        if (!/\./.test(filename) && contentType.includes("image/")) {
          const ext = contentType.split("/")[1] || "png";
          filename = `${filename || "image"}.${ext.split(";")[0]}`;
        }
      } catch { /* empty */ }
    }

    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
  } catch (err) {
    console.warn("downloadUrl fallback", err);
    if (isCloudinaryUrl(String(fileUrl))) {
      window.open(makeCloudinaryFlAttachment(String(fileUrl)), "_blank", "noopener,noreferrer");
    } else {
      window.open(String(fileUrl), "_blank", "noopener,noreferrer");
    }
  }
}

/**
 * AttachmentRow: accepts either:
 * - a string (url) OR
 * - an object { fileUrl?, fileName?, url?, name?, raw? }
 *
 * It safely computes url/name and guards against non-string values to avoid `.split` on objects.
 */
const AttachmentRow: React.FC<{ file: any }> = ({ file }) => {
  // Determine url and name robustly
  let url: string | null = null;
  let name: string | null = null;

  if (typeof file === "string") {
    url = file;
    name = file;
  } else if (file && typeof file === "object") {
    // common shapes
    url = (file.fileUrl ?? file.url ?? file.documentUrl ?? file.raw?.fileUrl ?? file.raw?.url ?? null) as string | null;
    name = (file.fileName ?? file.name ?? (typeof url === "string" ? url.split("/").pop() : null) ?? null) as string | null;
    // fallback to JSON string if nothing else
    if (!name && file.id) name = String(file.id);
  } else {
    // unknown type: show nothing
    url = null;
    name = null;
  }

  const display = (name ?? url ?? "").toString();
  const ext = (display || "").split(".").pop()?.toLowerCase() ?? "";
  const image = isImageExt(display);
  const pdf = isPdfExt(display);
  const stop = (e: React.MouseEvent) => { e.stopPropagation(); };

  return (
    <div className="w-full flex items-center gap-3 bg-white border rounded overflow-hidden px-3 py-2 hover:shadow transition">
      <div className="w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
        {image ? (
          url ? (
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={stop} className="w-full h-full block">
              <img src={url} alt={display} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            </a>
          ) : (
            <div className="w-full h-full bg-gray-100" />
          )
        ) : pdf ? (
          <div className="flex items-center justify-center w-full h-full bg-red-50 text-red-600">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" strokeWidth="1.2" />
              <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-700">
            <div className="text-xs font-medium">{ext ? ext.toUpperCase() : "FILE"}</div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0" style={{ overflow: "hidden" }}>
        <div className="text-sm text-gray-800 underline decoration-dashed truncate block" title={display}>{display}</div>
        <div className="text-xs text-gray-500 mt-1" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {pdf ? "PDF" : image ? "Image" : (ext ? ext.toUpperCase() : "File")}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        {url ? (
          <>
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={stop} className="text-xs text-blue-600 hover:underline px-2 py-1 rounded">Mở</a>
            <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); void downloadUrl(url as string, display); }} className="text-xs text-slate-600 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100">Tải</button>
          </>
        ) : (
          <div className="text-xs text-slate-400">Không có liên kết</div>
        )}
      </div>
    </div>
  );
};

const ExerciseTab: React.FC<Props> = ({
  works,
  role,
  onOpenWork,
  onOpenWorkStudent,
  onOpenWorkTeacher,
  onAddWork,
  fetchCountsForWork,
  submissionCounts = {},
  memberCounts = {},
  classDefaultCount = null,
  navigateToEdit,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const uniqWorks = useMemo(() => {
    const map = new Map<number, ClassWork>();
    (works ?? []).forEach((w) => {
      if (w && typeof w.id === "number") map.set(w.id, w);
    });
    return Array.from(map.values());
  }, [works]);

  const resolveClassIdFromPath = () => {
    try {
      const segments = location.pathname.split("/").filter(Boolean);
      const idx = segments.findIndex((s) => s.toLowerCase() === "class");
      if (idx !== -1 && segments.length > idx + 2) {
        return segments[idx + 2];
      }
    } catch { /* empty */ }
    return null;
  };

  const handleCardClick = (w: ClassWork) => {
    // Student: navigate to detail (use explicit student callback if provided,
    // otherwise fallback to legacy onOpenWork)
    if (role === "student") {
      const fn = onOpenWorkStudent ?? onOpenWork;
      if (typeof fn === "function") {
        fn(w.id);
        return;
      }
      const classIdCandidate = (w as any).classId ?? (w as any).class?.id ?? resolveClassIdFromPath();
      if (classIdCandidate) {
        navigate(`/class/student/${classIdCandidate}/classwork/${w.id}/detail`);
        return;
      }
      return;
    }

    // Teacher: toggle open panel under the card (do NOT navigate away)
    const next = openDropdownId === w.id ? null : w.id;
    setOpenDropdownId(next);
    if (next === w.id && typeof fetchCountsForWork === "function") {
      void fetchCountsForWork(w.id);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        {role === "teacher" && (
          <Button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (typeof onAddWork === "function") onAddWork(); }}
            className="text-base"
          >
            + Thêm bài tập
          </Button>
        )}
      </div>

      <div className="mt-2">
        {uniqWorks.length === 0 ? (
          <div className="text-slate-500 text-base">Chưa có bài tập nào.</div>
        ) : (
          <div className="space-y-4">
            {uniqWorks.map((w) => {
              const past = !!w.deadline && isPastDeadline(w.deadline);
              const submission = submissionCounts[w.id] ?? "—";
              const members = (memberCounts[w.id] ?? null) !== null ? memberCounts[w.id] : (classDefaultCount !== null ? classDefaultCount : "—");
              const isOpen = openDropdownId === w.id;

              const rawFiles = (w as any).files ?? (w as any).attachments ?? (w as any).documents ?? (w as any).raw?.files ?? (w as any).raw?.attachments ?? [];
              const files = Array.isArray(rawFiles) ? normalizeFiles(rawFiles, w.id) : [];

              return (
                <div key={w.id}>
                  <div className={`bg-white border rounded-xl p-5 cursor-pointer hover:bg-blue-50 flex justify-between items-start`} onClick={() => handleCardClick(w)}>
                    <div className="max-w-[70%]">
                      <div className="text-lg font-semibold text-slate-900">{w.title}</div>
                      <div className="text-base text-slate-600 mt-2">{w.description}</div>
                    </div>

                    <div className="text-right min-w-[140px]">
                      <div className="text-xs text-slate-400">Hạn nộp</div>
                      <div className="font-medium text-slate-800 mt-1">{w.deadline ? new Date(w.deadline).toLocaleString() : "Không xác định"}</div>
                      {past && <div className="mt-2 text-xs text-red-600 font-semibold">Đã quá hạn</div>}
                      {role === "teacher" && (
                        <div className="mt-3">
                          <Button
                            type="button"
                            aria-label={`Sửa bài tập ${w.title}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (past) return;
                              if (typeof navigateToEdit === "function") {
                                navigateToEdit(w.id);
                                return;
                              }
                              const classIdCandidate = (w as any).classId ?? (w as any).class?.id ?? resolveClassIdFromPath();
                              const classId = classIdCandidate ?? "";
                              if (classId) {
                                navigate(`/class/${role}/${classId}/classwork/${w.id}`);
                              } else {
                                navigate(`/class/${role}/classwork/${w.id}`);
                              }
                            }}
                            variant="secondary"
                            size="sm"
                            disabled={past}
                          >
                            ✏️ Sửa
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isOpen && role === "teacher" && (
                    <Card className="mt-2">
                      <div className="p-5">
                        <div><span className="font-semibold">Tiêu đề:</span> <span className="ml-2">{w.title}</span></div>

                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <div className="text-xs text-slate-400">Hạn nộp</div>
                            <div className="font-medium">{w.deadline ? new Date(w.deadline).toLocaleString() : "Không xác định"}</div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-slate-400">Đã nộp / Tổng</div>
                            <div className="font-semibold text-slate-700">{submission} / {members}</div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="text-xs text-slate-400 mb-2">Tệp đính kèm</div>
                          {files.length === 0 ? <div className="text-sm text-slate-400">Không có tệp đính kèm</div> : <div className="space-y-2">{files.map((f) => <AttachmentRow key={String(f.id) + String(f.fileUrl ?? "")} file={f} />)}</div>}
                        </div>

                        <div className="mt-4 text-right">
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // teacher explicit handler first, then legacy fallback
                              const fn = onOpenWorkTeacher ?? onOpenWork;
                              if (typeof fn === "function") {
                                fn(w.id);
                                return;
                              }
                              const classIdCandidate = (w as any).classId ?? (w as any).class?.id ?? resolveClassIdFromPath();
                              if (classIdCandidate) {
                                navigate(`/class/teacher/${classIdCandidate}/classwork/${w.id}/submissions`);
                              } else {
                                navigate(`/class/teacher/${w.id}/classwork/${w.id}/submissions`);
                              }
                            }}
                          >
                            Xem chi tiết
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseTab;