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

/**
 * This file is a simplified "Add Classwork" form:
 * - Only supports creating a new classwork (no edit path / no keptExistingFileIds)
 * - Handles new file uploads (previews using object URLs)
 * - Posts FormData to /ClassNotification (or fallback) to create the classwork
 *
 * Use this component when you want a dedicated "Add" page separate from edit. 
 */

type LinkItem = { title: string; url: string };

type FilePreview = {
  id: string;
  file: File;
  url: string;
  type: "image" | "pdf" | "other";
};

const isCloudinaryUrl = (u?: string) => {
  if (!u) return false;
  try {
    const url = new URL(u);
    return url. hostname.endsWith("cloudinary.com");
  } catch {
    return false;
  }
};

const makeCloudinaryFlAttachment = (u: string) => {
  try {
    const url = new URL(u);
    const parts = url.pathname.split("/"). filter(Boolean);
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
      isCrossOrigin = urlObj. origin !== window.location.origin;
    } catch {
      isCrossOrigin = false;
    }

    const res = await fetch(String(fileUrl), {
      method: "GET",
      mode: "cors",
      credentials: isCrossOrigin ? "omit" : "include",
    });

    if (!res.ok || (res as any).type === "opaque") {
      if (isCloudinaryUrl(String(fileUrl))) {
        window.open(makeCloudinaryFlAttachment(String(fileUrl)), "_blank", "noopener,noreferrer");
      } else {
        window. open(String(fileUrl), "_blank", "noopener,noreferrer");
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
    let filename = suggestedName ??  "download";
    const fileNameMatch =
      contentDisposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i) ||
      contentDisposition.match(/filename="? ([^";]+)"?/i);
    if (fileNameMatch && fileNameMatch[1]) {
      try {
        filename = decodeURIComponent(fileNameMatch[1]. replace(/(^['"]|['"]$)/g, ""));
      } catch {
        filename = fileNameMatch[1]. replace(/(^['"]|['"]$)/g, "");
      }
    } else {
      try {
        const urlObj = new URL(String(fileUrl), window.location.href);
        const last = urlObj.pathname.split("/").filter(Boolean).pop();
        if (last) filename = decodeURIComponent(last);
        if (!/\. /. test(filename) && contentType.includes("image/")) {
          const ext = contentType.split("/")[1] || "png";
          filename = `${filename || "image"}.${ext. split(";")[0]}`;
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

const detectFileType = (fileOrName: File | string | undefined): FilePreview["type"] => {
  if (! fileOrName) return "other";
  if (typeof fileOrName === "string") {
    const lower = fileOrName.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower)) return "image";
    if (/\. pdf$/.test(lower)) return "pdf";
    return "other";
  } else {
    if (/image\/(jpeg|png|webp|gif|bmp|svg)/i.test(fileOrName. type)) return "image";
    if (/pdf/i.test(fileOrName.type) || fileOrName.name.toLowerCase().endsWith(".pdf")) return "pdf";
    return "other";
  }
};

const AddClasswork: React.FC = () => {
  const params = useParams<{ id?: string }>();
  const id = params.id ?? "";
  const location = useLocation();

  const { user } = useAuthStore();
  const coarseRole = mapToCoarseRole(user?.roles);
  const role: UserRole = coarseRole === "student" ? "student" : "teacher";

  const { getClassInfo, getClassWorks, currentClass } = useClassStore();
  const navigate = useNavigate();

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructionsHtml, setInstructionsHtml] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxScore, setMaxScore] = useState<number | "">("");
  const [gradeType, setGradeType] = useState<string>("points");
  const [allowSubmission, setAllowSubmission] = useState<boolean>(true);

  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, message: string) =>
    setErrors((s) => ({ ...s, [field]: message }));
  const clearFieldError = (field: string) =>
    setErrors((s) => {
      if (! s[field]) return s;
      const next = { ...s };
      delete next[field];
      return next;
    });

  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        window.clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

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

  // redirect non-teachers away
  useEffect(() => {
    if (role !== "teacher") {
      navigate(`/class/${role}/${id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, id]);

  // ensure class info (optional)
  useEffect(() => {
    if (! id) return;
    (async () => {
      try {
        if (typeof getClassInfo === "function") await getClassInfo(Number(id));
      } catch (err) {
        console.warn("getClassInfo failed", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // helpers
  const handleCancel = () => navigate(`/class/${role}/${id}? tab=exercise`);

  const postCreateNotification = async (fd: FormData) => {
    const endpoints = ["/ClassNotification", "/api/ClassNotification"];
    let lastError: any = null;
    for (const ep of endpoints) {
      try {
        const res = await axiosInstance.post(ep, fd);
        return res;
      } catch (err: any) {
        lastError = err;
        if (err?. response?.status === 404) continue;
        if (err?.response) break;
      }
    }
    throw lastError ??  new Error("Failed to call create notification endpoint");
  };

  // NEW: Validate deadline real-time
  const validateDeadline = (deadlineValue: string) => {
    if (!deadlineValue || deadlineValue.trim() === "") {
      clearFieldError("deadline");
      return true;
    }

    const selected = new Date(deadlineValue);
    const now = new Date();
    
    if (isNaN(selected.getTime())) {
      setFieldError("deadline", "Ngày không hợp lệ");
      return false;
    }
    
    if (selected. getTime() <= now.getTime()) {
      setFieldError("deadline", "Hạn nộp phải lớn hơn thời điểm hiện tại");
      return false;
    }

    clearFieldError("deadline");
    return true;
  };

  // NEW: Handle deadline change with validation
  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDeadline(value);
    validateDeadline(value);
  };

  // convert and send (CREATE only)
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      let hasError = false;
      if (!title || title.trim(). length === 0) {
        setFieldError("title", "Tiêu đề không được để trống");
        hasError = true;
      }

      if (maxScore === "" || maxScore === null || maxScore === undefined) {
        setFieldError("maxScore", "Điểm tối đa là bắt buộc");
        hasError = true;
      } else if (typeof maxScore === "number" && maxScore <= 0) {
        setFieldError("maxScore", "Điểm tối đa phải lớn hơn 0");
        hasError = true;
      }

      if (! id || Number(id) <= 0) {
        showAlert("ClassId không hợp lệ", "Lỗi", "destructive");
        setLoading(false);
        return;
      }

      // Validate deadline
      if (!validateDeadline(deadline)) {
        hasError = true;
      }

      const createdBy = user?.id ??  localStorage.getItem("currentUserId") ?? "";
      if (!createdBy) {
        showAlert("Thiếu thông tin người dùng", "Lỗi", "destructive");
        setLoading(false);
        return;
      }
      if (hasError) {
        setLoading(false);
        return;
      }

      const fd = new FormData();
      fd.append("ClassId", String(Number(id)));
      fd.append("Type", "classwork");
      fd.append("Title", title. trim());
      fd.append("Description", description?. trim() ??  "");
      fd.append("CreatedBy", createdBy);
      if (deadline) fd.append("Deadline", formatISO(new Date(deadline)));
      if (maxScore !== "") fd.append("MaxScore", String(maxScore));
      if (gradeType) fd.append("GradeType", gradeType);
      fd.append("AllowSubmission", String(allowSubmission));
      if (instructionsHtml) fd. append("InstructionsHtml", instructionsHtml);

      if (filePreviews.length > 0) {
        for (const p of filePreviews) {
          if (p.file) fd.append("Files", p.file, p.file.name);
        }
      }

      if (links.length > 0) fd.append("LinksJson", JSON.stringify(links));

      const res = await postCreateNotification(fd);
      const raw = res?. data ??  null;
      if (! raw || raw.success === false) {
        const msg = raw?.message ?? "Tạo thông báo thất bại";
        showAlert(msg, "Lỗi", "destructive");
        setLoading(false);
        return;
      }

      // refresh optional caches (if store has these helpers)
      try {
        if (typeof getClassWorks === "function") await getClassWorks(Number(id));
        if (typeof getClassInfo === "function") await getClassInfo(Number(id));
      } catch {
        // ignore
      }

      navigate(`/class/${role}/${id}?tab=exercise`);
    } catch (err: any) {
      console.error("Save error", err);
      const msg = err?.response?.data?. message ?? err?.message ?? "Lỗi khi lưu bài tập";
      showAlert(msg, "Lỗi", "destructive");
    } finally {
      setLoading(false);
    }
  };

  // file handling (new files only)
  const handleFiles = (files: File[]) => {
    if (! files || files.length === 0) return;
    setFilePreviews((prev) => {
      const existingSignatures = new Set(prev.map((p) => `${p.file.name}:${p.file.size}`));
      const newPreviews: FilePreview[] = [];
      for (const f of files) {
        const sig = `${f.name}:${f.size}`;
        if (existingSignatures.has(sig)) continue;
        existingSignatures.add(sig);
        const tp = detectFileType(f);
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const url = URL.createObjectURL(f);
        newPreviews. push({ id, file: f, url, type: tp });
      }
      return [... prev, ...newPreviews];
    });
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ?  Array.from(e.target. files) : [];
    if (selected.length > 0) handleFiles(selected);
    e.currentTarget.value = "";
  };

  const openFileDialog = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); const dtFiles = e.dataTransfer.files ?  Array.from(e.dataTransfer.files) : []; if (dtFiles.length > 0) handleFiles(dtFiles); };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const removeFile = (id: string) => {
    setFilePreviews((prev) => {
      const toRemove = prev.find((p) => p.id === id);
      if (! toRemove) return prev;
      try { URL.revokeObjectURL(toRemove.url); } catch { /* empty */ }
      return prev.filter((p) => p.id !== id);
    });
  };

  const validateUrl = (url: string) => {
    try { const u = new URL(url); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; }
  };

  const addLink = () => {
    clearFieldError("linkUrl");
    if (!linkUrl || ! validateUrl(linkUrl)) { setFieldError("linkUrl", "URL không hợp lệ (cần bắt đầu bằng http:// hoặc https://)"); return; }
    setLinks((prev) => [...prev, { title: linkTitle || linkUrl, url: linkUrl }]);
    setLinkTitle(""); setLinkUrl("");
  };

  const removeLink = (index: number) => setLinks((prev) => prev.filter((_, i) => i !== index));

  // derived values & helpers
  const classInfo: ClassInfo | null = currentClass?. data?. classInfo ?? null;
  const inputClass = (base = "", field?: string) => { const err = field ? errors[field] : undefined; return `${base} ${err ?  "border-red-500 ring-1 ring-red-500" : ""}`.trim(); };

  // cleanup objectURLs on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach((p) => {
        try { URL.revokeObjectURL(p.url); } catch { /* empty */ }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-8 w-full h-full overflow-y-auto">
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
                  <div className="text-lg font-semibold">Tạo bài tập mới</div>
                  <div className="text-sm text-slate-500">Tạo bài tập cho học sinh</div>
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
                            href={alert.link. url}
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

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Card className="p-6 mb-4">
            <div className="mb-4">
              <Label>Tiêu đề <span className="text-red-600 ml-1">*</span></Label>
              <Input
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (errors.title) clearFieldError("title"); }}
                placeholder="Tiêu đề"
                className={inputClass("mt-2", "title")}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "err-title" : undefined}
              />
              {errors.title && <div id="err-title" className="text-red-600 text-sm mt-1">{errors.title}</div>}
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
                    <Button size="sm" onClick={openFileDialog}>Chọn tệp</Button>
                  </div>
                </div>

                {filePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {filePreviews.map((p) => (
                      <div key={p.id} className="bg-white border rounded p-2 flex items-start gap-2">
                        <div className="w-16 h-16 flex items-center justify-center bg-slate-100 rounded overflow-hidden shrink-0">
                          {p.type === "image" && p.url ?  (
                            <img src={p.url} alt={p.file.name} className="w-full h-full object-cover" />
                          ) : p.type === "pdf" ? (
                            <div className="text-slate-600 text-lg">📄 PDF</div>
                          ) : (
                            <div className="text-slate-600 text-xl">📎</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{p. file.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{`${(p.file.size / 1024).toFixed(0)} KB`}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {p.url && (
                            <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                              <Eye className="w-4 h-4 mr-1" />
                            </a>
                          )}
                          {p.url && (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); void downloadUrl(p.url, p.file.name); }}
                              className="text-xs text-slate-600 hover:text-slate-800"
                            >
                              <Download className="w-4 h-4 mr-1" />
                            </button>
                          )}
                          <button type="button" onClick={() => removeFile(p.id)} className="text-sm text-red-600 hover:underline">
                            <Trash className="w-4 h-4 mr-1" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <Label>Thêm liên kết</Label>
                <div className="grid grid-cols-12 gap-2 items-start mt-2">
                  <div className="col-span-5">
                    <Input placeholder="Tiêu đề (tùy chọn)" value={linkTitle} onChange={(e) => setLinkTitle(e. target.value)} />
                  </div>
                  <div className="col-span-6">
                    <Input
                      placeholder="https://example.com"
                      value={linkUrl}
                      onChange={(e) => { setLinkUrl(e.target.value); if (errors.linkUrl) clearFieldError("linkUrl"); }}
                      className={inputClass("", "linkUrl")}
                      aria-invalid={!!errors.linkUrl}
                      aria-describedby={errors.linkUrl ?  "err-linkUrl" : undefined}
                    />
                    {errors.linkUrl && <div id="err-linkUrl" className="text-red-600 text-sm mt-1">{errors.linkUrl}</div>}
                  </div>
                  <div className="col-span-1">
                    <Button size="sm" onClick={addLink}>Thêm</Button>
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
                          <Button size="sm" variant="ghost" onClick={() => removeLink(idx)}>Xóa</Button>
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
                onChange={handleDeadlineChange}
                className={inputClass("mt-2", "deadline")}
                aria-invalid={!!errors.deadline}
                aria-describedby={errors.deadline ? "err-deadline" : undefined}
              />
              {errors.deadline && <div id="err-deadline" className="text-red-600 text-sm mt-1">{errors.deadline}</div>}
            </div>

            <div>
              <Label>Điểm tối đa <span className="text-red-600 ml-1">*</span></Label>
              <Input
                type="number"
                value={maxScore}
                onChange={(e) => { const v = e.target.value; setMaxScore(v === "" ? "" : Number(v)); if (errors.maxScore) clearFieldError("maxScore"); }}
                placeholder="Ví dụ: 100"
                min={0}
                className={inputClass("mt-2", "maxScore")}
                aria-invalid={!!errors.maxScore}
                aria-describedby={errors. maxScore ? "err-maxScore" : undefined}
              />
              {errors.maxScore && <div id="err-maxScore" className="text-red-600 text-sm mt-1">{errors.maxScore}</div>}
            </div>

            <div>
              <Label>Loại điểm</Label>
              <select value={gradeType} onChange={(e) => setGradeType(e. target.value)} className="w-full border rounded px-3 py-2 mt-2">
                <option value="points">Points</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Cho phép nộp bài</Label>
              <Switch checked={allowSubmission} onCheckedChange={(v) => setAllowSubmission(!! v)} />
            </div>

           
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default AddClasswork;