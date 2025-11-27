/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useState, useEffect, useRef } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useNavigate, useParams } from "react-router-dom";
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

type LinkItem = { title: string; url: string };

// FilePreview supports both newly selected files (file present) and existing remote files (existing=true)
type FilePreview = {
  id: string;
  file?: File;
  url?: string; // object URL for images or remote URL
  type: "image" | "pdf" | "other";
  existing?: boolean;
  fileId?: number | string; // id from server when existing
  fileName?: string; // for existing entries
};

const AddEditClassworkForm: React.FC = () => {
  const params = useParams<{ id?: string; classworkId?: string }>();
  const id = params.id ?? "";

  const { user } = useAuthStore();
  const coarseRole = mapToCoarseRole(user?.roles);
  const role: UserRole = coarseRole === "student" ? "student" : "teacher";

  const isEdit = !!params.classworkId;
  const {
    createClasswork,
    editClasswork,
    getClassWorks,
    getClassInfo,
    currentClass,
  } = useClassStore();
  const navigate = useNavigate();

  // form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructionsHtml, setInstructionsHtml] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxScore, setMaxScore] = useState<number | "">("");
  const [gradeType, setGradeType] = useState<string>("points");
  const [allowSubmission, setAllowSubmission] = useState<boolean>(true);

  // attachments
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // to track which existing remote file ids user removed in the UI (server-side deletion optional)
  const [removedExistingFileIds, setRemovedExistingFileIds] = useState<(number | string)[]>([]);

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [loading, setLoading] = useState(false);

  // only teachers allowed to access this page (check auth-derived role)
  useEffect(() => {
    if (role !== "teacher") {
      navigate(`/class/${role}/${id}`);
    }
  }, [role, id, navigate]);

  // helper: detect type from File or filename/url
  const detectFileType = (fileOrName: File | string | undefined): FilePreview["type"] => {
    if (!fileOrName) return "other";
    const t = typeof fileOrName === "string" ? "" : fileOrName.type ?? "";
    if (typeof fileOrName === "string") {
      const lower = fileOrName.toLowerCase();
      if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower)) return "image";
      if (/\.pdf$/.test(lower)) return "pdf";
      return "other";
    } else {
      if (/image\/(jpeg|png|webp|gif|bmp|svg)/i.test(t)) return "image";
      if (/pdf/i.test(t) || (fileOrName.name && fileOrName.name.toLowerCase().endsWith(".pdf"))) return "pdf";
      return "other";
    }
  };

  // when editing, prefill fields from store.currentClass.works if present, including existing files/links
  useEffect(() => {
    if (isEdit && params.classworkId && currentClass?.data?.works) {
      const cw = currentClass.data.works.find(
        (w) => String(w.id) === String(params.classworkId)
      );
      if (cw) {
        setTitle(cw.title ?? "");
        setDescription(cw.description ?? "");
        setInstructionsHtml((cw as any).instructionsHtml ?? cw.description ?? "");
        if (cw.deadline) {
          const d = new Date(cw.deadline);
          const tzOffset = d.getTimezoneOffset() * 60000;
          const localISO = formatISO(new Date(d.getTime() - tzOffset)).slice(0, -1);
          setDeadline(localISO.slice(0, 16));
        } else {
          setDeadline("");
        }
        setMaxScore((cw as any).maxScore ?? (cw as any).max_score ?? "");
        setGradeType((cw as any).gradeType ?? "points");
        setAllowSubmission((cw as any).allowSubmission ?? true);

        // Prefill links if present on cw
        const existingLinks: any[] =
          (cw.links ?? (cw as any).linkDtos ?? (cw as any).linkDto ?? (cw as any).raw?.links ?? (cw as any).raw?.linkDtos) || [];
        const normLinks = existingLinks.map((l: any) => ({
          title: l.title ?? l.name ?? l.fileName ?? l.url ?? "",
          url: l.url ?? l.link ?? l.fileUrl ?? "",
        })).filter((x: LinkItem) => !!x.url);
        setLinks(normLinks);

        // Prefill existing files if available (cw.files or cw.raw.files)
        const existingFiles = (cw.files ?? (cw as any).raw?.files ?? (cw as any).submissionFiles ?? []) as any[];
        const existingPreviews: FilePreview[] = (existingFiles || []).map((f: any) => {
          const url = f.fileUrl ?? f.url ?? f.file_url ?? f.urlPath ?? null;
          const name = f.fileName ?? f.name ?? f.file_name ?? "file";
          const type = detectFileType(name);
          return {
            id: `existing-${f.id ?? Math.random().toString(36).slice(2,8)}`,
            url: url ?? undefined,
            type,
            existing: true,
            fileId: f.id,
            fileName: name,
          } as FilePreview;
        });
        if (existingPreviews.length > 0) {
          setFilePreviews((prev) => [...existingPreviews, ...prev]);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, params.classworkId, currentClass?.data?.works]);

  useEffect(() => {
    if (id) getClassInfo(Number(id));
  }, [id, getClassInfo]);

  // cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach((p) => {
        if (p.url && !p.existing) URL.revokeObjectURL(p.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = () => navigate(`/class/${role}/${id}?tab=exercise`);

  // Helper to post FormData to /ClassNotification (create)
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

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);

    try {
      // basic validation
      if (!title || title.trim().length === 0) {
        alert("Tiêu đề không được để trống");
        setLoading(false);
        return;
      }
      if (!id || Number(id) <= 0) {
        alert("ClassId không hợp lệ");
        setLoading(false);
        return;
      }

      const createdBy = user?.id ?? (localStorage.getItem("currentUserId") ?? "");
      if (!createdBy) {
        alert("Thiếu thông tin người dùng");
        setLoading(false);
        return;
      }

      // If editing -> use store.editClasswork which expects a payload with files array (Files only new files)
      if (isEdit && params.classworkId) {
        const payload: any = {
          id: Number(params.classworkId),
          classId: Number(id),
          title: title.trim(),
          description: description?.trim() ?? "",
          deadline: deadline ? formatISO(new Date(deadline)) : null,
          maxScore: maxScore === "" ? null : Number(maxScore),
          gradeType: gradeType ?? null,
          allowSubmission: !!allowSubmission,
          instructionsHtml: instructionsHtml ?? null,
          // Include only newly selected files (existing remote files are already on server)
          files: filePreviews.filter((p) => !p.existing && p.file).map((p) => p.file) as File[] | undefined,
          links: links.length > 0 ? links : undefined,
          // include removedExistingFileIds so server may remove them if supported
          removedFileIds: removedExistingFileIds.length > 0 ? removedExistingFileIds : undefined,
        };

        const edited = await editClasswork(payload);
        if (!edited) {
          alert("Không thể cập nhật bài tập");
          setLoading(false);
          return;
        }

        await getClassWorks(Number(id));
        await getClassInfo(Number(id));
        navigate(`/class/${role}/${id}?tab=exercise`);
        setLoading(false);
        return;
      }

      // Create new classwork -> actually create a ClassNotification with Type = "classwork"
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

      // append files from filePreviews but only newly selected files (existing ones are remote)
      if (filePreviews.length > 0) {
        filePreviews.forEach((p) => {
          if (!p.existing && p.file) fd.append("Files", p.file, p.file.name);
        });
      }

      // append links as LinksJson
      if (links.length > 0) {
        fd.append("LinksJson", JSON.stringify(links));
      }

      const res = await postCreateNotification(fd);
      const raw = res?.data ?? null;
      if (!raw || raw.success === false) {
        const msg = raw?.message ?? "Tạo thông báo thất bại";
        alert(msg);
        setLoading(false);
        return;
      }

      await getClassWorks(Number(id));
      await getClassInfo(Number(id));
      navigate(`/class/${role}/${id}?tab=exercise`);
    } catch (err: any) {
      console.error("Save error", err);
      const msg = err?.response?.data?.message ?? err?.message ?? "Lỗi khi lưu bài tập";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- File selection like notification: click or drag-and-drop, thumbnails, remove ---
  const handleFiles = (files: File[]) => {
    const next: FilePreview[] = files.map((f) => {
      const tp = detectFileType(f);
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const url = tp === "image" ? URL.createObjectURL(f) : undefined;
      return { id, file: f, url, type: tp };
    });
    setFilePreviews((prev) => [...prev, ...next]);
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length > 0) {
      handleFiles(selected);
    }
    // Reset input so same file can be re-selected later
    e.currentTarget.value = "";
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dtFiles = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (dtFiles.length > 0) handleFiles(dtFiles);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (id: string) => {
    setFilePreviews((prev) => {
      const toRemove = prev.find((p) => p.id === id);
      if (!toRemove) return prev;
      if (toRemove.existing) {
        // mark existing server-side file id for removal (server must support this)
        if (toRemove.fileId !== undefined) {
          setRemovedExistingFileIds((s) => [...s, toRemove.fileId as number | string]);
        }
        return prev.filter((p) => p.id !== id);
      } else {
        // revoke object URL for newly added file
        if (toRemove.url) URL.revokeObjectURL(toRemove.url);
        return prev.filter((p) => p.id !== id);
      }
    });
  };

  // Links handlers
  const validateUrl = (url: string) => {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const addLink = () => {
    if (!linkUrl || !validateUrl(linkUrl)) {
      alert("URL không hợp lệ (cần bắt đầu bằng http:// hoặc https://)");
      return;
    }
    setLinks((prev) => [...prev, { title: linkTitle || linkUrl, url: linkUrl }]);
    setLinkTitle("");
    setLinkUrl("");
  };

  const removeLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const classInfo: ClassInfo | null = currentClass?.data?.classInfo ?? null;

  return (
    <div className="p-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="p-2">
            ←
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              📝
            </div>
            <div>
              <div className="text-lg font-semibold">Bài tập</div>
              <div className="text-sm text-slate-500">
                {isEdit ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}
              </div>
            </div>
          </div>
        </div>
        <div>
          <Button onClick={() => handleSave()} disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu"}
          </Button>
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
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tiêu đề"
                className="mt-2"
              />
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

              {/* File upload area (like notification) */}
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
                      <div key={p.id} className="bg-white border rounded p-2 flex items-start gap-2">
                        <div className="w-16 h-16 flex items-center justify-center bg-slate-100 rounded overflow-hidden shrink-0">
                          {p.type === "image" && p.url ? (
                            <img src={p.url} alt={p.fileName ?? p.file?.name} className="w-full h-full object-cover" />
                          ) : p.type === "pdf" ? (
                            <div className="text-slate-600 text-lg">📄 PDF</div>
                          ) : (
                            <div className="text-slate-600 text-xl">📎</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{p.existing ? (p.fileName ?? "file") : p.file?.name}</div>
                          <div className="text-xs text-slate-400 mt-1">
                            {p.existing ? "" : p.file ? `${(p.file.size / 1024).toFixed(0)} KB` : ""}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {p.url ? (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Xem
                            </a>
                          ) : (
                            <div className="text-xs text-slate-400">—</div>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => removeFile(p.id)}>
                            Xóa
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Links */}
              <div className="mt-4">
                <Label>Thêm liên kết</Label>
                <div className="grid grid-cols-12 gap-2 items-end mt-2">
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
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
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
          {/* Sidebar: assignment-specific fields */}
          <Card className="p-5 space-y-4">
            <div>
              <Label>
                Hạn nộp
              </Label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Điểm tối đa</Label>
              <Input
                type="number"
                value={maxScore}
                onChange={(e) => {
                  const v = e.target.value;
                  setMaxScore(v === "" ? "" : Number(v));
                }}
                placeholder="Ví dụ: 100"
                min={0}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Loại điểm</Label>
              <select
                value={gradeType}
                onChange={(e) => setGradeType(e.target.value)}
                className="w-full border rounded px-3 py-2 mt-2"
              >
                <option value="points">Points</option>
                <option value="percentage">Percentage</option>
                <option value="pass_fail">Pass / Fail</option>
                <option value="letter">Letter</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Cho phép nộp bài</Label>
              <Switch
                checked={allowSubmission}
                onCheckedChange={(v) => setAllowSubmission(!!v)}
              />
            </div>

            <div>
              <Label>Hướng dẫn chi tiết (HTML)</Label>
              <Textarea
                value={instructionsHtml}
                onChange={(e) => setInstructionsHtml(e.target.value)}
                placeholder="Hướng dẫn chi tiết (HTML hoặc plain text)"
                className="mt-2 min-h-[120px]"
              />
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default AddEditClassworkForm;