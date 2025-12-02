import React, { useState, useEffect, useRef } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { mapToCoarseRole } from "@/classManagement/utils/roleutil";
import type { ClassInfo } from "@/classManagement/interfaces/class";
import type { UserRole } from "@/classManagement/components/ui/classcard";
import { axiosInstance } from "@/lib/axios";

import { Button } from "@/common/components/ui/button";
import { Card } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import { Label } from "@/common/components/ui/label";
import { Switch } from "@/common/components/ui/switch";
import { formatISO } from "date-fns";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/common/components/ui/alert";
import { Book, Download, Eye, Trash } from "lucide-react";

type LinkItem = { title: string; url: string };

type FilePreview = {
  id: string;
  file?: File;
  url?: string;
  type: "image" | "pdf" | "other";
  existing?: boolean;
  fileId?: number | string;
  fileName?: string;
};

// --- helpers for Cloudinary & downloads ---
const isCloudinaryUrl = (u?: string) => {
  if (!u) return false;
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
    // detect cross-origin
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

// --- safer deriveUrlFromFile to avoid TS errors when backend shape varies ---
const deriveUrlFromFile = (f: any): string | undefined => {
  if (!f) return undefined;
  if (typeof f === "function") return undefined; // protect against schema/factory being passed by mistake
  const candidates = [
    (f as any).fileUrl,
    (f as any).file_url,
    (f as any).url,
    (f as any).Url,
    (f as any).FileUrl,
    (f as any).path,
    (f as any).link,
  ];
  for (const c of candidates) {
    if (typeof c === "string") {
      const s = c.trim();
      if (s.length > 0) return s;
    }
  }
  return undefined;
};

// --- file type detection ---
const detectFileType = (fileOrName: File | string | undefined): FilePreview["type"] => {
  if (!fileOrName) return "other";
  const t = typeof fileOrName === "string" ? "" : (fileOrName as File).type ?? "";
  if (typeof fileOrName === "string") {
    const lower = fileOrName.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower)) return "image";
    if (/\.pdf$/.test(lower)) return "pdf";
    return "other";
  } else {
    if (/image\/(jpeg|png|webp|gif|bmp|svg)/i.test(t)) return "image";
    if (/pdf/i.test(t) || ((fileOrName as File).name && (fileOrName as File).name.toLowerCase().endsWith(".pdf")))
      return "pdf";
    return "other";
  }
};

const AddEditClassworkForm: React.FC = () => {
  const params = useParams<{ id?: string; classworkId?: string }>();
  const location = useLocation();
  const id = params.id ?? "";

  // fallback: if route doesn't provide classworkId param, try to parse it from path segments
  const classworkIdResolved =
    params.classworkId ??
    (() => {
      try {
        const segments = location.pathname.split("/").filter(Boolean);
        const idx = segments.findIndex((s) => s.toLowerCase() === "classwork");
        if (idx !== -1 && segments.length > idx + 1) return segments[idx + 1];
        return undefined;
      } catch {
        return undefined;
      }
    })();

  const isEdit = !!classworkIdResolved;

  const { user } = useAuthStore();
  const coarseRole = mapToCoarseRole(user?.roles);
  const role: UserRole = coarseRole === "student" ? "student" : "teacher";

  const {
    createClasswork,
    editClasswork,
    getClassWorks,
    getClassInfo,
    currentClass,
  } = useClassStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructionsHtml, setInstructionsHtml] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxScore, setMaxScore] = useState<number | "">("");
  const [gradeType, setGradeType] = useState<string>("points");
  const [allowSubmission, setAllowSubmission] = useState<boolean>(true);

  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [removedExistingFileIds, setRemovedExistingFileIds] = useState<
    (number | string)[]
  >([]);

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<{
    title?: string;
    message: string;
    variant?: "destructive" | "default" | "info";
    link?: { text: string; url: string } | null;
  } | null>(null);
  const alertTimeoutRef = useRef<number | null>(null);

  const showAlert = (
    message: string,
    title?: string,
    variant: "destructive" | "default" | "info" = "destructive",
    durationMs = 6000,
    link?: { text: string; url: string }
  ) => {
    if (alertTimeoutRef.current) {
      window.clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }
    setAlert({ title, message, variant, link: link ?? null });
    if (durationMs > 0) {
      alertTimeoutRef.current = window.setTimeout(() => {
        setAlert(null);
        alertTimeoutRef.current = null;
      }, durationMs);
    }
  };

  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        window.clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const setFieldError = (field: string, message: string) =>
    setErrors((s) => ({ ...s, [field]: message }));
  const clearFieldError = (field: string) =>
    setErrors((s) => {
      if (!s[field]) return s;
      const next = { ...s };
      delete next[field];
      return next;
    });

  useEffect(() => {
    if (role !== "teacher") {
      navigate(`/class/${role}/${id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, id, navigate]);

  // prefill when editing
  useEffect(() => {
    // debug info to help diagnosing missing prefill
    // eslint-disable-next-line no-console
    console.debug(
      "[AddEditClasswork] classworkIdResolved=",
      classworkIdResolved,
      "currentClass?.data?.works length=",
      currentClass?.data?.works?.length
    );

    const fillFromTarget = (target: any) => {
      setTitle(target.title ?? "");
      setDescription(target.description ?? "");
      setInstructionsHtml((target as any).instructionsHtml ?? target.description ?? "");
      if (target.deadline) {
        const d = new Date(target.deadline);
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localISO = formatISO(new Date(d.getTime() - tzOffset)).slice(0, -1);
        setDeadline(localISO.slice(0, 16));
      } else {
        setDeadline("");
      }
      setMaxScore((target as any).maxScore ?? (target as any).max_score ?? "");
      setGradeType((target as any).gradeType ?? "points");
      setAllowSubmission((target as any).allowSubmission ?? true);

      const existingLinks: any[] = (target.links) || [];
      const normLinks = existingLinks
        .map((l: any) => ({ title: l.title ?? "", url: l.url ?? "" }))
        .filter((x: LinkItem) => !!x.url);
      setLinks(normLinks);

      const existingFiles = (target.files ?? []) as any[];
      const safeExistingFiles = Array.isArray(existingFiles) ? existingFiles.filter((f) => f != null) : [];

      const existingPreviews: FilePreview[] = safeExistingFiles.map((f: any) => {
        const url = deriveUrlFromFile(f);
        const name = f?.fileName;
        const type = detectFileType(url ?? name);
        return {
          id: `existing-${f?.id ?? Math.random().toString(36).slice(2, 8)}`,
          url: url ?? undefined,
          type,
          existing: true,
          fileId: f?.id,
          fileName: String(name ?? "file"),
        } as FilePreview;
      });

      if (existingPreviews.length > 0) {
        setFilePreviews((prev) => {
          const existingIds = new Set(prev.filter((p) => p.existing && p.fileId !== undefined).map((p) => String(p.fileId)));
          const newOnes = existingPreviews.filter((ep) => !existingIds.has(String(ep.fileId)));
          return [...prev, ...newOnes];
        });
      }
    };

    if (!isEdit || !classworkIdResolved) return;

    // Try to find in currentClass first
    const foundLocal = (currentClass?.data?.works ?? []).find((w: any) => String(w.id) === String(classworkIdResolved));
    if (foundLocal) {
      // eslint-disable-next-line no-console
      console.debug("[AddEditClasswork] prefilling from currentClass data");
      fillFromTarget(foundLocal);
      return;
    }

    // If not found, try calling getClassWorks() and use returned value if available.
    (async () => {
      try {
        const maybe = await getClassWorks(Number(id));
        // getClassWorks might return works array or update store; try both.
        let worksArray: any[] | undefined = undefined;
        if (Array.isArray(maybe)) worksArray = maybe;
        else worksArray = (currentClass?.data?.works ?? []);

        // if not found yet, give store a short time to update then read again
        if (!worksArray || worksArray.length === 0) {
          // wait briefly for store update (max 1s, polling)
          const maxAttempts = 10;
          let attempt = 0;
          while ((!currentClass?.data?.works || currentClass.data.works.length === 0) && attempt < maxAttempts) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, 100));
            attempt++;
          }
          worksArray = currentClass?.data?.works ?? worksArray;
        }

        const found = (worksArray ?? []).find((w: any) => String(w.id) === String(classworkIdResolved));
        if (found) {
          // eslint-disable-next-line no-console
          console.debug("[AddEditClasswork] prefilling after getClassWorks/fetch:", found);
          fillFromTarget(found);
        } else {
          // not found: as a last resort, try to fetch classwork detail from server via getClassInfo or leave blank
          // eslint-disable-next-line no-console
          console.warn("[AddEditClasswork] classwork not found after getClassWorks, leaving form empty.");
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[AddEditClasswork] getClassWorks fallback failed", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, classworkIdResolved, currentClass?.data?.works]);

  useEffect(() => {
    if (id) getClassInfo(Number(id));
  }, [id, getClassInfo]);

  useEffect(() => {
    return () => {
      filePreviews.forEach((p) => {
        if (p.url && !p.existing) {
          try {
            URL.revokeObjectURL(p.url);
          } catch {
            //
          }
        }
      });
    };
  }, [filePreviews]);

  const handleCancel = () => navigate(`/class/${role}/${id}?tab=exercise`);

  const postCreateNotification = async (fd: FormData) => {
    const endpoints = ["/ClassNotification", "/api/ClassNotification"];
    let lastError: any = null;
    for (const ep of endpoints) {
      try {
        const res = await axiosInstance.post(ep, fd);
        return res;
      } catch (err: any) {
        lastError = err;
        if (err?.response?.status === 404) continue;
        if (err?.response) break;
      }
    }
    throw lastError ?? new Error("Failed to call create notification endpoint");
  };

  // Helper: attempt to download existing preview URLs and convert to File objects
  const convertExistingPreviewsToFiles = async (): Promise<void> => {
    if (!filePreviews || filePreviews.length === 0) return;
    const needsFetch = filePreviews.filter((p) => p.existing && p.url && !p.file);
    if (needsFetch.length === 0) return;

    const updated = await Promise.all(
      filePreviews.map(async (p) => {
        if (!(p.existing && p.url && !p.file)) return p;
        try {
          const res = await axiosInstance.get(p.url, { responseType: "blob" });
          const blob = res.data as Blob;
          const nameFromUrl = p.url!.split("/").pop()?.split("?")[0];
          const name = p.fileName ?? nameFromUrl ?? `file-${Date.now()}`;
          const file = new File([blob], name, { type: blob.type || "application/octet-stream" });
          return { ...p, file, existing: false };
        } catch (err) {
          console.warn("Failed to fetch existing file preview for re-upload:", p.url, err);
          return p;
        }
      })
    );

    setFilePreviews(updated);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      let hasError = false;
      if (!title || title.trim().length === 0) {
        setFieldError("title", "Tiêu đề không được để trống");
        hasError = true;
      }

      if (maxScore === "" || maxScore === null || maxScore === undefined) {
        setFieldError("maxScore", "Điểm tối đa là bắt buộc");
        hasError = true;
      } else if (typeof maxScore === "number" && maxScore < 0) {
        setFieldError("maxScore", "Điểm tối đa phải lớn hơn hoặc bằng 0");
        hasError = true;
      }

      if (!id || Number(id) <= 0) {
        showAlert("ClassId không hợp lệ", "Lỗi", "destructive");
        setLoading(false);
        return;
      }

      if (deadline && deadline.trim() !== "") {
        const selected = new Date(deadline);
        const now = new Date();
        if (isNaN(selected.getTime()) || selected.getTime() <= now.getTime()) {
          setFieldError("deadline", "Hạn nộp phải lớn hơn thời điểm hiện tại");
          hasError = true;
        }
      }

      const createdBy = user?.id ?? localStorage.getItem("currentUserId") ?? "";
      if (!createdBy) {
        showAlert("Thiếu thông tin người dùng", "Lỗi", "destructive");
        setLoading(false);
        return;
      }
      if (hasError) {
        setLoading(false);
        return;
      }

      if (isEdit && classworkIdResolved) {
        await convertExistingPreviewsToFiles();

        const newFiles = filePreviews.filter((p) => p.file).map((p) => p.file!) as File[];
        const keptExistingFileIds = filePreviews
          .filter((p) => p.existing && p.fileId != null && !p.file)
          .map((p) => p.fileId);

        const payload: any = {
          id: Number(classworkIdResolved),
          classId: Number(id),
          title: title.trim(),
          description: description?.trim() ?? "",
          deadline: deadline ? formatISO(new Date(deadline)) : null,
          maxScore: maxScore === "" ? null : Number(maxScore),
          gradeType: gradeType ?? null,
          allowSubmission: !!allowSubmission,
          instructionsHtml: instructionsHtml ?? null,
          files: newFiles.length > 0 ? newFiles : undefined,
          keptExistingFileIds: keptExistingFileIds.length > 0 ? keptExistingFileIds : undefined,
          links: links.length > 0 ? links : undefined,
          removedFileIds: removedExistingFileIds.length > 0 ? removedExistingFileIds : undefined,
        };

        const edited = await editClasswork(payload);
        if (!edited) {
          showAlert("Không thể cập nhật bài tập", "Lỗi", "destructive");
          setLoading(false);
          return;
        }

        await getClassWorks(Number(id));
        await getClassInfo(Number(id));
        navigate(`/class/${role}/${id}?tab=exercise`);
        setLoading(false);
        return;
      }

      // CREATE new classwork
      const fd = new FormData();
      fd.append("ClassId", String(Number(id)));
      fd.append("Type", "classwork");
      fd.append("Title", title.trim());
      fd.append("Description", description?.trim() ?? "");
      fd.append("CreatedBy", createdBy);
      if (deadline) fd.append("Deadline", formatISO(new Date(deadline)));
      if (maxScore !== "") fd.append("MaxScore", String(maxScore));
      if (gradeType) fd.append("GradeType", gradeType);
      fd.append("AllowSubmission", String(allowSubmission));
      if (instructionsHtml) fd.append("InstructionsHtml", instructionsHtml);

      if (filePreviews.length > 0) {
        for (const p of filePreviews) {
          if (!p.existing && p.file) fd.append("Files", p.file, p.file.name);
        }
      }

      if (links.length > 0) fd.append("LinksJson", JSON.stringify(links));

      const res = await postCreateNotification(fd);
      const raw = res?.data ?? null;
      if (!raw || raw.success === false) {
        const msg = raw?.message ?? "Tạo thông báo thất bại";
        showAlert(msg, "Lỗi", "destructive");
        setLoading(false);
        return;
      }

      await getClassWorks(Number(id));
      await getClassInfo(Number(id));
      navigate(`/class/${role}/${id}?tab=exercise`);
    } catch (err: any) {
      console.error("Save error", err);
      const msg = err?.response?.data?.message ?? err?.message ?? "Lỗi khi lưu bài tập";
      showAlert(msg, "Lỗi", "destructive");
    } finally {
      setLoading(false);
    }
  };

  // file selection and preview
  const handleFiles = (files: File[]) => {
    if (!files || files.length === 0) return;
    setFilePreviews((prev) => {
      const existingKeep = prev.slice();
      const existingSignatures = new Set<string>();
      for (const p of existingKeep) {
        const name = p.file?.name ?? p.fileName ?? "";
        const size = p.file?.size ?? 0;
        existingSignatures.add(`${name}:${size}`);
      }

      const newSignatures = new Set<string>();
      const newPreviews: FilePreview[] = [];
      for (const f of files) {
        const sig = `${f.name}:${f.size}`;
        if (existingSignatures.has(sig) || newSignatures.has(sig)) {
          continue;
        }
        newSignatures.add(sig);
        const tp = detectFileType(f);
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const url = URL.createObjectURL(f);
        newPreviews.push({ id, file: f, url, type: tp });
      }

      return [...existingKeep, ...newPreviews];
    });
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length > 0) handleFiles(selected);
    e.currentTarget.value = "";
  };

  const openFileDialog = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); const dtFiles = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : []; if (dtFiles.length > 0) handleFiles(dtFiles); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const removeFile = (id: string) => {
    setFilePreviews((prev) => {
      const toRemove = prev.find((p) => p.id === id);
      if (!toRemove) return prev;
      if (toRemove.existing) {
        if (toRemove.fileId !== undefined) setRemovedExistingFileIds((s) => [...s, toRemove.fileId as number | string]);
        return prev.filter((p) => p.id !== id);
      } else {
        if (toRemove.url) try { URL.revokeObjectURL(toRemove.url); } catch { /* empty */ }
        return prev.filter((p) => p.id !== id);
      }
    });
  };

  const validateUrl = (url: string) => {
    try { const u = new URL(url); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; }
  };

  const addLink = () => {
    clearFieldError("linkUrl");
    if (!linkUrl || !validateUrl(linkUrl)) { setFieldError("linkUrl", "URL không hợp lệ (cần bắt đầu bằng http:// hoặc https://)"); return; }
    setLinks((prev) => [...prev, { title: linkTitle || linkUrl, url: linkUrl }]);
    setLinkTitle(""); setLinkUrl("");
  };

  const removeLink = (index: number) => setLinks((prev) => prev.filter((_, i) => i !== index));

  const classInfo: ClassInfo | null = currentClass?.data?.classInfo ?? null;
  const inputClass = (base = "", field?: string) => { const err = field ? errors[field] : undefined; return `${base} ${err ? "border-red-500 ring-1 ring-red-200" : ""}`.trim(); };

  return (
    <div className="p-8 w-full h-full overflow-y-auto">
      {/* Top bar */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4 w-full">
          <Button
            variant="ghost"
            onClick={() => navigate(`/class/${role}/${id}?tab=exercise`)}
            className="p-2"
          >
            ←
          </Button>
          <div className="flex items-start gap-3 w-full">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
             <Book className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">Bài tập</div>
                  <div className="text-sm text-slate-500">
                    {isEdit ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}
                  </div>
                </div>
                <div>
                  <Button onClick={() => handleSave()} disabled={loading}>
                    {loading ? "Đang lưu..." : "Lưu"}
                  </Button>
                </div>
              </div>

              {alert && (
                <div className="mt-3">
                  <Alert>
                    {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
                    <AlertDescription>
                      <div className="flex items-center gap-2">
                        <span>{alert.message}</span>
                        {alert.link && (
                          <a
                            href={alert.link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline ml-2"
                          >
                            {alert.link.text}
                          </a>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Card className="p-6 mb-4">
            <div className="mb-4">
              <Label>
                Tiêu đề
                <span className="text-red-600 ml-1">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) clearFieldError("title");
                }}
                placeholder="Tiêu đề"
                className={inputClass("mt-2", "title")}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "err-title" : undefined}
              />
              {errors.title && (
                <div id="err-title" className="text-red-600 text-sm mt-1">
                  {errors.title}
                </div>
              )}
            </div>

            <div className="mb-4">
              <Label>Hướng dẫn (không bắt buộc)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả ngắn cho học viên..."
                className="mt-2 min-h-[160px]"
              />
            </div>

            <div className="rounded-lg border p-5">
              <div className="text-md font-semibold mb-4">Đính kèm</div>

              {/* File upload area */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                className="border-dashed border-2 border-slate-200 rounded-lg p-4 bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Kéo thả tệp vào đây hoặc chọn tệp (ảnh, pdf, doc, ...)
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      id="fileInput"
                      type="file"
                      multiple
                      onChange={handleFilesChange}
                      className="hidden"
                    />
                    <Button size="sm" onClick={openFileDialog}>
                      Chọn tệp
                    </Button>
                  </div>
                </div>

                {filePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {filePreviews.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white border rounded p-2 flex items-start gap-2"
                      >
                        <div className="w-16 h-16 flex items-center justify-center bg-slate-100 rounded overflow-hidden shrink-0">
                          {p.type === "image" && p.url ? (
                            <img
                              src={p.url}
                              alt={p.fileName ?? p.file?.name ?? "file"}
                              className="w-full h-full object-cover"
                            />
                          ) : p.type === "pdf" ? (
                            <div className="text-slate-600 text-lg">📄 PDF</div>
                          ) : (
                            <div className="text-slate-600 text-xl">📎</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {p.existing ? p.fileName ?? "file" : p.file?.name ?? "file"}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {!p.existing && p.file ? `${(p.file.size / 1024).toFixed(0)} KB` : ""}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {p.url && (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                             <Eye className="w-4 h-4 mr-1" />
                            </a>
                          )}
                          {p.url && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void downloadUrl(p.url, p.fileName ?? p.file?.name);
                              }}
                              className="text-xs text-slate-600 hover:text-slate-800"
                            >
                              <Download className="w-4 h-4 mr-1" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(p.id)}
                            className="text-sm text-red-600 hover:underline"
                          >
                            <Trash className="w-4 h-4 mr-1" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="mt-4">
                <Label>Thêm liên kết</Label>
                <div className="grid grid-cols-12 gap-2 items-start mt-2">
                  <div className="col-span-5">
                    <Input
                      placeholder="Tiêu đề (tùy chọn)"
                      value={linkTitle}
                      onChange={(e) => setLinkTitle(e.target.value)}
                    />
                  </div>
                  <div className="col-span-6">
                    <Input
                      placeholder="https://example.com"
                      value={linkUrl}
                      onChange={(e) => {
                        setLinkUrl(e.target.value);
                        if (errors.linkUrl) clearFieldError("linkUrl");
                      }}
                      className={inputClass("", "linkUrl")}
                      aria-invalid={!!errors.linkUrl}
                      aria-describedby={errors.linkUrl ? "err-linkUrl" : undefined}
                    />
                    {errors.linkUrl && (
                      <div id="err-linkUrl" className="text-red-600 text-sm mt-1">
                        {errors.linkUrl}
                      </div>
                    )}
                  </div>
                  <div className="col-span-1">
                    <Button size="sm" onClick={addLink}>
                      Thêm
                    </Button>
                  </div>
                </div>

                {links.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {links.map((l, idx) => (
                      <li key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                        <div className="truncate max-w-[75%]">
                          <div className="font-medium text-sm">{l.title}</div>
                          <div className="text-xs text-slate-500">{l.url}</div>
                        </div>
                        <div>
                          <Button size="sm" variant="ghost" onClick={() => removeLink(idx)}>
                            Xóa
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        </div>

        <aside className="col-span-12 lg:col-span-4">
          <Card className="p-5 space-y-4">
            <div>
              <Label>Hạn nộp</Label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => {
                  setDeadline(e.target.value);
                  if (errors.deadline) clearFieldError("deadline");
                }}
                className={inputClass("mt-2", "deadline")}
                aria-invalid={!!errors.deadline}
                aria-describedby={errors.deadline ? "err-deadline" : undefined}
              />
              {errors.deadline && (
                <div id="err-deadline" className="text-red-600 text-sm mt-1">
                  {errors.deadline}
                </div>
              )}
            </div>

            <div>
              <Label>
                Điểm tối đa
                <span className="text-red-600 ml-1">*</span>
              </Label>
              <Input
                type="number"
                value={maxScore}
                onChange={(e) => {
                  const v = e.target.value;
                  setMaxScore(v === "" ? "" : Number(v));
                  if (errors.maxScore) clearFieldError("maxScore");
                }}
                placeholder="Ví dụ: 100"
                min={0}
                className={inputClass("mt-2", "maxScore")}
                aria-invalid={!!errors.maxScore}
                aria-describedby={errors.maxScore ? "err-maxScore" : undefined}
              />
              {errors.maxScore && (
                <div id="err-maxScore" className="text-red-600 text-sm mt-1">
                  {errors.maxScore}
                </div>
              )}
            </div>

            <div>
              <Label>Loại điểm</Label>
              <select
                value={gradeType}
                onChange={(e) => setGradeType(e.target.value)}
                className="w-full border rounded px-3 py-2 mt-2"
              >
                <option value="points">Points</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Cho phép nộp bài</Label>
              <Switch checked={allowSubmission} onCheckedChange={(v) => setAllowSubmission(!!v)} />
            </div>

            <div>
              <Label>Hướng dẫn chi tiết (HTML)</Label>
              <Textarea value={instructionsHtml} onChange={(e) => setInstructionsHtml(e.target.value)} placeholder="Hướng dẫn chi tiết (HTML hoặc plain text)" className="mt-2 min-h-[120px]" />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default AddEditClassworkForm;