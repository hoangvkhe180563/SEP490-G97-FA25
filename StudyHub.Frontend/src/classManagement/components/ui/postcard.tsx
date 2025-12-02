import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import CommentComposer from "@/classManagement/components/ui/commentcomposer";
import useClassStore from "@/classManagement/stores/useClassStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";

/* shadcn components */
import { Card } from "@/common/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar";
import { Button } from "@/common/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/common/components/ui/dropdown-menu";
import { Separator } from "@/common/components/ui/separator";
import { format, formatISO } from "date-fns";
/* icons */
import { MoreHorizontal, Trash2 } from "lucide-react";

export type PostComment = {
  id: number | string;
  notificationId?: number | string;
  userId?: number | string;
  userFullname: string;
  content: string;
  avatarUrl?: string | null;
  createdAt?: string;
};

export type PostFile = {
  id: number | string;
  fileName: string;
  fileUrl: string;
};

export type Post = {
  id: number | string;
  classId?: number;
  title?: string;
  description?: string; // may contain HTML (bold/italic)
  createdBy?: number | string;
  createdAt?: string;
  files?: PostFile[];
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

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [localComments, setLocalComments] = useState<PostComment[]>(post.comments ?? []);
  const [isDeleted, setIsDeleted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // track downloading state per file id
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  useEffect(() => {
  
    setLocalComments((prev) => {
      const server = post.comments ?? [];
      // keep any optimistic temp comments from prev (temp- prefix)
      const temp = prev.filter((c) => String(c.id).startsWith("temp-"));
      const merged = [...server];
      for (const t of temp) {
        if (!merged.some((m) => String(m.id) === String(t.id))) merged.push(t);
      }
      return merged;
    });
  }, [post.comments]);

  const addComment = useClassStore((s) => s.addComment);
  const deleteNotification = useClassStore((s) => s.deleteNotification);

  const { user } = useAuthStore();
  const currentUserId = user?.id ?? "unknown-user";
  const currentUserFullname = user?.fullname ?? "Bạn";
  const currentUserAvatar =
    (user as any)?.avatarUrl ?? undefined;

  // Resolve avatar for the post author with fallbacks:
  const authorAvatar =
    post.avatarImage ??
    (String(post.createdBy) === String(currentUserId) ? currentUserAvatar : undefined);

  const avatarFallbackText = () => {
    const name = (post as any).authorName ?? "";
    if (!name) return "U";
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // helper to scroll comments container
  const scrollCommentsToBottom = () => {
    try {
      const el = document.querySelector(`#post-${post.id} .comments-list`) as HTMLElement | null;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
      // focus input if visible
      const input = document.querySelector(`#post-${post.id} input`) as HTMLInputElement | null;
      if (input) input.focus();
    } catch {
      // ignore
    }
  };

  const handleSendComment = async (textContent: string) => {
    // comment composer sends plain text; convert to minimal html (escape)
    const htmlContent = textContent
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("\n", "<br/>");

    const tempId = `temp-${Date.now()}`;
    const optimistic: PostComment = {
      id: tempId,
      notificationId: typeof post.id === "number" ? post.id : Number(post.id),
      userId: currentUserId,
      userFullname: currentUserFullname,
      content: htmlContent,
      avatarUrl: currentUserAvatar ?? null,
      createdAt: formatISO(new Date()),
    };

    // optimistic UI: append comment locally without triggering parent reload
    setLocalComments((c) => [...c, optimistic]);
    setShowComments(true);

    // ensure UI shows the new comment
    setTimeout(scrollCommentsToBottom, 50);

    try {
      const created = await addComment({
        notificationId: post.id,
        content: htmlContent,
        userId: currentUserId,
      });

      if (created) {
        // ensure created has avatar + fullname (fallback to current user if server omitted them)
        const patched = {
          ...(created as any),
          avatarUrl: (created as any)?.avatarUrl ?? currentUserAvatar ?? null,
          userFullname: (created as any)?.userFullname ?? currentUserFullname,
        } as PostComment;

        // replace optimistic comment with patched server comment
        setLocalComments((prev) =>
          prev.map((c) => (String(c.id) === String(tempId) ? patched : c))
        );
        // scroll to newly inserted server comment
        setTimeout(scrollCommentsToBottom, 50);
      } else {
        // server returned falsy - mark optimistic as pending id
        setLocalComments((prev) =>
          prev.map((c) =>
            String(c.id) === String(tempId) ? { ...c, id: `pending-${Date.now()}` } : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to send comment", err);
      // remove optimistic comment on error
      setLocalComments((prev) => prev.filter((c) => String(c.id) !== String(tempId)));
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm("Bạn có chắc muốn xóa thông báo này?")) return;

    setIsDeleted(true);

    try {
      const ok = await deleteNotification(post.id);
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

  // Improved programmatic download with better fallbacks and filename detection
  const downloadFile = async (file: PostFile) => {
    const key = String(file.id ?? file.fileUrl ?? file.fileName ?? Date.now());
    setDownloading((d) => ({ ...d, [key]: true }));

    try {
      const res = await fetch(String(file.fileUrl), {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        window.open(String(file.fileUrl), "_blank", "noopener");
        return;
      }

      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      const blob = await res.blob();

      if (contentType.includes("text/html") && !/\.(pdf|jpg|jpeg|png|gif|docx?|xlsx?|pptx?|zip|rar)$/i.test(String(file.fileUrl))) {
        window.open(String(file.fileUrl), "_blank", "noopener");
        return;
      }

      const contentDisposition = res.headers.get("content-disposition") || "";
      let filename = file.fileName ?? "download";
      const fileNameMatch =
        contentDisposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i) ||
        contentDisposition.match(/filename="?([^";]+)"?/i);
      if (fileNameMatch && fileNameMatch[1]) {
        try {
          filename = decodeURIComponent(fileNameMatch[1].replace(/(^['"]|['"]$)/g, ""));
        } catch {
          filename = fileNameMatch[1].replace(/(^['"]|['"]$)/g, "");
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // revoke after some time
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.warn("Programmatic download failed, falling back to opening in new tab", err);
      window.open(String(file.fileUrl), "_blank", "noopener");
    } finally {
      setDownloading((d) => ({ ...d, [key]: false }));
    }
  };

  return (
    <Card className="p-4">
      {/* add id to the container so we can query inside for scrolling/focusing */}
      <div id={`post-${post.id}`} className="flex items-start gap-4">
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
                {(post as any).authorName ?? (post as any).createdByName ?? ""}
              </div>
              <div className="text-xs text-gray-400">{formatTimestamp(post.createdAt)}</div>
            </div>

            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onSelect={handleDelete} className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      alert("Dismiss student (chưa triển khai)");
                    }}
                    className="flex items-center gap-2 text-red-600"
                  >
                    Dismiss student
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {post.title && <div className="mt-3 text-gray-800 font-semibold">{post.title}</div>}

          {/* Render description as sanitized HTML to preserve bold/italic/links */}
          <div
            className="mt-1 text-gray-600"
            dangerouslySetInnerHTML={{ __html: safeHtml(post.description) }}
          />

          {post.files && post.files.length > 0 && (
            <div className="mt-3 bg-gray-50 border rounded p-3 space-y-2">
              {post.files.map((file) => {
                const key = String(file.id ?? file.fileUrl ?? file.fileName);
                return (
                  <div key={key} className="flex items-center justify-between bg-white rounded p-2 border">
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
                      {/* View: open in new tab */}
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-3 py-1 text-sm rounded bg-slate-100 hover:bg-slate-200"
                      >
                        Xem
                      </a>

                      {/* Download: programmatic download with fallback */}
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
                // toggle comments visibility; if opening, scroll and focus
                setShowComments((prev) => {
                  const next = !prev;
                  if (next) setTimeout(scrollCommentsToBottom, 50);
                  return next;
                });
              }}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {localComments.length} bình luận
            </Button>
          </div>

          {/* Show composer and list only when user opened comments */}
          {showComments && (
            <>
              <div className="mt-4">
                <CommentComposer
                  onSend={(text) => handleSendComment(text)}
                  avatarUrl={currentUserAvatar}
                />
              </div>

              {localComments.length > 0 && (
                <div className="mt-3 space-y-3 comments-list" style={{ maxHeight: 320, overflow: "auto" }}>
                  {localComments.map((c) => (
                    <div key={c.id} className="flex gap-3 items-start">
                      <Avatar>
                        {c.avatarUrl ? (
                          <AvatarImage src={c.avatarUrl} alt="avatar" />
                        ) : (
                          <AvatarFallback>
                            {((c.userFullname || "U").charAt(0) || "U").toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="text-sm">
                        <div className="font-medium">
                          {c.userFullname}{" "}
                          <span className="text-gray-400 text-xs ml-2">{formatTimestamp(c.createdAt)}</span>
                        </div>
                        <div
                          className="text-gray-700 mt-1"
                          dangerouslySetInnerHTML={{ __html: safeHtml(c.content) }}
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
    </Card>
  );
};

export default PostCard;