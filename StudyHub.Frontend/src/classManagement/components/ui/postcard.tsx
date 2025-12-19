import React, { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import CommentComposer from "@/classManagement/components/ui/commentcomposer";
import useClassStore from "@/classManagement/stores/useClassStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import type { ClassNotificationFile } from "@/classManagement/interfaces/class";

/* shadcn components */
import { Card } from "@/common/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/common/components/ui/avatar";
import { Button } from "@/common/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/common/components/ui/dropdown-menu";
import { Separator } from "@/common/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/common/components/ui/dialog";
import { format, formatISO } from "date-fns";
/* icons */
import { MoreHorizontal, Trash2, Edit } from "lucide-react";

export type PostComment = {
  id: number | string;
  notificationId?: number | string;
  userId?: number | string;
  userFullname: string;
  content: string;
  avatarUrl?: string | null;
  createdAt?: string;
};

export type Post = {
  id: number | string;
  classId: number;
  title?: string;
  description?: string; // may contain HTML (bold/italic)
  createdBy: string;
  createdAt: string;
  files: ClassNotificationFile[] | undefined;
  comments?: PostComment[];
  avatarImage?: string | null | undefined;
  authorName?: string | null | undefined;
  createdByName?: string;
};

const safeHtml = (html?: string) => {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "b",
      "strong",
      "i",
      "em",
      "u",
      "br",
      "p",
      "ul",
      "ol",
      "li",
      "a",
      "span",
      "div",
      "blockquote",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
  });
};

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

const PostCard: React.FC<{
  post: Post;
  onUpdate?: (updated: Post) => void;
}> = ({ post, onUpdate }) => {
  // local copy of the post so we can update UI immediately after edit
  const [localPost, setLocalPost] = useState<Post>(post);

  // keep local comments separate (optimistic comments)
  const [localComments, setLocalComments] = useState<PostComment[]>(
    post.comments ?? []
  );
  const [showComments, setShowComments] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  console.log("Open", menuOpen);

  // downloading state per file id
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  // --- Editing modal state & handlers ---
  const [editOpen, setEditOpen] = useState(false);
  const editTitleRef = useRef<HTMLDivElement | null>(null);
  const editDescRef = useRef<HTMLDivElement | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  // kept existing file ids (init from incoming post, will reset when opening modal)
  const [keptExistingFileIds, setKeptExistingFileIds] = useState<
    Array<number | string>
  >(() => (post.files ?? []).map((f) => f.id));
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // sync localPost when parent prop changes (but keep optimistic comments)
  useEffect(() => {
    setLocalPost(post);
    // merge comments while preserving optimistic ones that start with temp-
    setLocalComments((prev) => {
      const server = post.comments ?? [];
      const temp = prev.filter((c) => String(c.id).startsWith("temp-"));
      const merged = [...server];
      for (const t of temp) {
        if (!merged.some((m) => String(m.id) === String(t.id))) merged.push(t);
      }
      return merged;
    });
    // reset kept ids to new incoming post files
    setKeptExistingFileIds((post.files ?? []).map((f) => f.id));
  }, [post]);

  // reset editable fields when opening the edit modal
  useEffect(() => {
    if (editOpen) {
      setKeptExistingFileIds((localPost.files ?? []).map((f) => f.id));
      setNewFiles([]);
      setTimeout(() => {
        if (editTitleRef.current)
          editTitleRef.current.innerHTML = localPost.title ?? "";
        if (editDescRef.current)
          editDescRef.current.innerHTML = localPost.description ?? "";
      }, 0);
    }
  }, [editOpen, localPost.title, localPost.description, localPost.files]);

  const toggleKeepFile = (fid: number | string) => {
    setKeptExistingFileIds((prev) =>
      prev.some((x) => String(x) === String(fid))
        ? prev.filter((x) => String(x) !== String(fid))
        : [...prev, fid]
    );
  };

  const addComment = useClassStore((s) => s.addComment);
  const deleteNotification = useClassStore((s) => s.deleteNotification);
  // store method used for edit (classwork/posts share same handler)
  const editClasswork = useClassStore((s) => (s as any).editClasswork);

  const { user } = useAuthStore();
  const currentUserId = user?.id ?? "unknown-user";
  const currentUserFullname = user?.fullname ?? "Bạn";
  const currentUserAvatar =
    (user as any)?.avatarUrl ??
    (user as any)?.avatar ??
    (user as any)?.imageUrl ??
    undefined;

  // Resolve avatar for the post author with fallbacks:
  const authorAvatar =
    localPost.avatarImage ??
    (String(localPost.createdBy) === String(currentUserId)
      ? currentUserAvatar
      : undefined);

  const avatarFallbackText = () => {
    const name =
      (localPost as any).authorName ??
      (localPost as any).createdByName ??
      localPost.title ??
      "";
    if (!name) return "U";
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  // helper to scroll comments container
  const scrollCommentsToBottom = () => {
    try {
      const el = document.querySelector(
        `#post-${localPost.id} .comments-list`
      ) as HTMLElement | null;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
      // focus input if visible
      const input = document.querySelector(
        `#post-${localPost.id} input`
      ) as HTMLInputElement | null;
      if (input) input.focus();
    } catch {
      // ignore
    }
  };

  const handleSendComment = async (textContent: string) => {
    const htmlContent = textContent
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("\n", "<br/>");

    const tempId = `temp-${Date.now()}`;
    const optimistic: PostComment = {
      id: tempId,
      notificationId:
        typeof localPost.id === "number" ? localPost.id : Number(localPost.id),
      userId: currentUserId,
      userFullname: currentUserFullname,
      content: htmlContent,
      avatarUrl: currentUserAvatar ?? null,
      createdAt: formatISO(new Date()),
    };

    setLocalComments((c) => [...c, optimistic]);
    setShowComments(true);
    setTimeout(scrollCommentsToBottom, 50);

    try {
      const created = await addComment({
        notificationId: localPost.id,
        content: htmlContent,
        userId: currentUserId,
      });

      if (created) {
        const patched = {
          ...(created as any),
          avatarUrl: (created as any)?.avatarUrl ?? currentUserAvatar ?? null,
          userFullname: (created as any)?.userFullname ?? currentUserFullname,
        } as PostComment;

        setLocalComments((prev) =>
          prev.map((c) => (String(c.id) === String(tempId) ? patched : c))
        );
        setTimeout(scrollCommentsToBottom, 50);
      } else {
        setLocalComments((prev) =>
          prev.map((c) =>
            String(c.id) === String(tempId)
              ? { ...c, id: `pending-${Date.now()}` }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to send comment", err);
      setLocalComments((prev) =>
        prev.filter((c) => String(c.id) !== String(tempId))
      );
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm("Bạn có chắc muốn xóa thông báo này?")) return;

    setIsDeleted(true);

    try {
      const ok = await deleteNotification(localPost.id);
      if (!ok) {
        setIsDeleted(false);
        console.error("Xóa thông báo thất bại");
      }
    } catch (err) {
      console.error("delete failed", err);
      setIsDeleted(false);
    }
  };

  if (isDeleted) return null;

  const formatTimestamp = (val?: string | number | null): string => {
    if (!val && val !== 0) return "";
    let d: Date;
    if (typeof val === "number") d = new Date(val);
    else d = new Date(String(val));
    if (isNaN(d.getTime())) return String(val);
    try {
      return format(d, "dd/MM/yyyy HH:mm");
    } catch {
      return d.toLocaleString("vi-VN");
    }
  };

  // Programmatic download (unchanged, adapted type)
  const downloadFile = async (file: ClassNotificationFile) => {
    const key = String(file.id ?? file.fileUrl ?? file.fileName ?? Date.now());
    setDownloading((d) => ({ ...d, [key]: true }));

    try {
      let isCrossOrigin = false;
      try {
        const urlObj = new URL(String(file.fileUrl), window.location.href);
        isCrossOrigin = urlObj.origin !== window.location.origin;
      } catch {
        isCrossOrigin = false;
      }

      const fetchOptions: RequestInit = {
        method: "GET",
        mode: "cors",
        credentials: isCrossOrigin ? "omit" : "include",
      };

      const res = await fetch(String(file.fileUrl), fetchOptions);

      if (!res.ok) {
        if (isCloudinaryUrl(String(file.fileUrl))) {
          window.open(
            makeCloudinaryFlAttachment(String(file.fileUrl)),
            "_blank",
            "noopener"
          );
        } else {
          window.open(String(file.fileUrl), "_blank", "noopener");
        }
        return;
      }

      if ((res as any).type === "opaque") {
        if (isCloudinaryUrl(String(file.fileUrl))) {
          window.open(
            makeCloudinaryFlAttachment(String(file.fileUrl)),
            "_blank",
            "noopener"
          );
        } else {
          window.open(String(file.fileUrl), "_blank", "noopener");
        }
        return;
      }

      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      const blob = await res.blob();

      if (contentType.includes("text/html")) {
        if (isCloudinaryUrl(String(file.fileUrl))) {
          window.open(
            makeCloudinaryFlAttachment(String(file.fileUrl)),
            "_blank",
            "noopener"
          );
        } else {
          window.open(String(file.fileUrl), "_blank", "noopener");
        }
        return;
      }

      const contentDisposition = res.headers.get("content-disposition") || "";
      let filename = file.fileName ?? "download";
      const fileNameMatch =
        contentDisposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i) ||
        contentDisposition.match(/filename="?([^";]+)"?/i);
      if (fileNameMatch && fileNameMatch[1]) {
        try {
          filename = decodeURIComponent(
            fileNameMatch[1].replace(/(^['"]|['"]$)/g, "")
          );
        } catch {
          filename = fileNameMatch[1].replace(/(^['"]|['"]$)/g, "");
        }
      } else {
        try {
          const urlObj = new URL(String(file.fileUrl), window.location.href);
          const pathName = urlObj.pathname;
          const last = pathName.split("/").filter(Boolean).pop();
          if (last && last.includes(".")) filename = decodeURIComponent(last);
        } catch {
          /* ignore */
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.warn(
        "Programmatic download failed, falling back to opening in new tab",
        err
      );
      if (isCloudinaryUrl(String(file.fileUrl))) {
        window.open(
          makeCloudinaryFlAttachment(String(file.fileUrl)),
          "_blank",
          "noopener"
        );
      } else {
        window.open(String(file.fileUrl), "_blank", "noopener");
      }
    } finally {
      setDownloading((d) => ({ ...d, [key]: false }));
    }
  };

  // submit edited data and update local UI immediately on success
  const handleEditSubmit = async () => {
    setEditError(null);
    if (!editClasswork) {
      setEditError("Chức năng chỉnh sửa không khả dụng.");
      return;
    }

    const titleHtml = editTitleRef.current?.innerHTML.trim() ?? "";
    const descHtml = editDescRef.current?.innerHTML.trim() ?? "";

    if (!titleHtml || titleHtml === "<br>" || titleHtml === "") {
      setEditError("Tiêu đề là bắt buộc");
      return;
    }
    if (!descHtml || descHtml === "<br>" || descHtml === "") {
      setEditError("Nội dung là bắt buộc");
      return;
    }

    setEditing(true);
    try {
      const payload: any = {
        id: Number(localPost.id) || localPost.id,
        classId: localPost.classId,
        title: titleHtml,
        description: descHtml,
        files: newFiles.length ? newFiles : null,
        keptExistingFileIds:
          Array.isArray(keptExistingFileIds) && keptExistingFileIds.length
            ? keptExistingFileIds
            : null,
      };

      const res = await editClasswork(payload);
      if (!res) {
        setEditError("Sửa thất bại");
        setEditing(false);
        return;
      }

      // editClasswork returns raw.data or raw; try to extract updated object
      const updated = (res as any)?.data ?? (res as any) ?? null;

      // Build updated files list for UI:
      let updatedFiles: ClassNotificationFile[] | undefined = undefined;
      if (Array.isArray(updated?.files) && updated.files.length >= 0) {
        // assume server supplies files in compatible shape
        updatedFiles = updated.files.map((f: any) => {
          return {
            id: Number(f.id ?? f.fileId ?? f.id ?? 0),
            fileName: f.fileName ?? f.name ?? f.title ?? String(f.id ?? ""),
            fileUrl: f.fileUrl ?? f.url ?? f.path ?? "#",
          } as ClassNotificationFile;
        });
      } else {
        // if server did not return files, derive from keptExistingFileIds + newFiles
        const existingKept = (localPost.files ?? []).filter((f) =>
          Array.isArray(keptExistingFileIds)
            ? keptExistingFileIds.some((k) => String(k) === String(f.id))
            : true
        );
        const newFilePlaceholders = newFiles.map((f, i) => ({
          id: -(Date.now() + i), // negative id as placeholder
          fileName: f.name,
          fileUrl: "#",
        })) as ClassNotificationFile[];
        updatedFiles = [...existingKept, ...newFilePlaceholders];
      }

      // Build updated post object for UI and parent callback
      const updatedPost: Post = {
        ...localPost,
        title: updated?.title ?? payload.title,
        description: updated?.description ?? payload.description,
        files: updatedFiles,
      };

      // Update local post so UI reflects changes immediately
      setLocalPost(updatedPost);

      // notify parent (so lists like notifications in parent can update instantly)
      try {
        if (typeof onUpdate === "function") onUpdate(updatedPost);
      } catch {
        // ignore callback errors
      }

      // close modal
      setEditOpen(false);
    } catch (err) {
      console.error("Edit failed", err);
      setEditError("Sửa thất bại");
    } finally {
      setEditing(false);
    }
  };

  return (
    <Card className="p-4">
      <div id={`post-${localPost.id}`} className="flex items-start gap-4">
        <Avatar>
          {authorAvatar ? (
            <AvatarImage src={authorAvatar} alt="avatar" />
          ) : (
            <AvatarFallback>{avatarFallbackText()}</AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">
                {(localPost as any).authorName ??
                  (localPost as any).createdByName ??
                  ""}
              </div>
              <div className="text-xs text-gray-400">
                {formatTimestamp(localPost.createdAt)}
              </div>
            </div>

            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onSelect={() => {
                      setMenuOpen(false);
                      setEditOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" /> Chỉnh sửa
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={handleDelete}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Xoá
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {localPost.title && (
            <div className="mt-3 text-gray-800 font-semibold">
              {localPost.title}
            </div>
          )}

          <div
            className="mt-1 text-gray-600"
            dangerouslySetInnerHTML={{
              __html: safeHtml(localPost.description),
            }}
          />

          {localPost.files && localPost.files.length > 0 && (
            <div className="mt-3 bg-gray-50 border rounded p-3 space-y-2">
              {localPost.files.map((file) => {
                const key = String(file.id ?? file.fileUrl ?? file.fileName);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between bg-white rounded p-2 border"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-sm text-sky-600 hover:underline truncate block"
                        title={file.fileName}
                      >
                        {file.fileName}
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-3 py-1 text-sm rounded bg-slate-100 hover:bg-slate-200"
                      >
                        Xem
                      </a>

                      <button
                        type="button"
                        onClick={() => downloadFile(file)}
                        disabled={Boolean(downloading[key])}
                        className="inline-flex items-center px-3 py-1 text-sm rounded bg-white border hover:bg-slate-50"
                        title="Tải xuống"
                      >
                        {downloading[key] ? "Đang tải..." : "Tải"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Separator className="my-3" />

          <div className="flex items-center justify-between text-sm text-gray-500">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowComments((prev) => {
                  const next = !prev;
                  if (next) setTimeout(scrollCommentsToBottom, 50);
                  return next;
                });
              }}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              {localComments.length} bình luận
            </Button>
          </div>

          {showComments && (
            <>
              <div className="mt-4">
                <CommentComposer
                  onSend={(text) => handleSendComment(text)}
                  avatarUrl={currentUserAvatar}
                />
              </div>

              {localComments.length > 0 && (
                <div
                  className="mt-3 space-y-3 comments-list"
                  style={{ maxHeight: 320, overflow: "auto" }}
                >
                  {localComments.map((c) => (
                    <div key={c.id} className="flex gap-3 items-start">
                      <Avatar>
                        {c.avatarUrl ? (
                          <AvatarImage src={c.avatarUrl} alt="avatar" />
                        ) : (
                          <AvatarFallback>
                            {(
                              (c.userFullname || "U").charAt(0) || "U"
                            ).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="text-sm">
                        <div className="font-medium">
                          {c.userFullname}{" "}
                          <span className="text-gray-400 text-xs ml-2">
                            {formatTimestamp(c.createdAt)}
                          </span>
                        </div>
                        <div
                          className="text-gray-700 mt-1"
                          dangerouslySetInnerHTML={{
                            __html: safeHtml(c.content),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(val) => !val && setEditOpen(false)}
      >
        <DialogContent className="sm:max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông báo</DialogTitle>
            <DialogDescription>
              Chỉnh sửa tiêu đề, nội dung và file đính kèm.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 space-y-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">
                Tiêu đề <span className="text-red-600 ml-1">*</span>
              </div>
              <div
                ref={editTitleRef}
                contentEditable
                suppressContentEditableWarning
                className="min-h-[40px] bg-gray-50 rounded p-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
                style={{ wordBreak: "break-word" }}
              />
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">
                Nội dung <span className="text-red-600 ml-1">*</span>
              </div>
              <div
                ref={editDescRef}
                contentEditable
                suppressContentEditableWarning
                className="min-h-[120px] bg-gray-50 rounded p-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
                style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              />
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-2">File hiện có</div>
              {(localPost.files ?? []).length === 0 && (
                <div className="text-sm text-gray-500">Không có file nào.</div>
              )}
              <div className="space-y-2">
                {(localPost.files ?? []).map((f) => {
                  const kept = keptExistingFileIds.some(
                    (x) => String(x) === String(f.id)
                  );
                  return (
                    <div
                      key={String(f.id)}
                      className="flex items-center justify-between bg-white rounded p-2 border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-sky-600 truncate max-w-xs">
                          {f.fileName}
                        </div>
                        <div className="text-xs text-gray-400">
                          {kept ? "Giữ" : "Đã xóa"}
                        </div>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleKeepFile(f.id)}
                          className={`text-sm px-3 py-1 rounded ${
                            kept ? "bg-yellow-50" : "bg-gray-50"
                          } border`}
                        >
                          {kept ? "Bỏ chọn" : "Giữ lại"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">Thêm file mới</div>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setNewFiles((prev) => [...prev, ...files]);
                  (e.target as HTMLInputElement).value = "";
                }}
              />
              {newFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                  {newFiles.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between bg-white rounded p-2 border"
                    >
                      <div className="text-sm truncate max-w-xs">{f.name}</div>
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setNewFiles((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          className="text-sm px-3 py-1 rounded bg-gray-50 border"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {editError && (
              <div className="text-sm text-red-600">{editError}</div>
            )}
          </div>

          <DialogFooter>
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                onClick={() => setEditOpen(false)}
                disabled={editing}
              >
                Hủy
              </Button>
              <Button onClick={handleEditSubmit} disabled={editing}>
                {editing ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PostCard;
