import React, { useState, useEffect, useRef } from "react";
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
import { Tooltip } from "@/common/components/ui/tooltip";
import { format, formatISO } from "date-fns";

/* icons */
import { MoreHorizontal, Share2, Trash2 } from "lucide-react";

export type PostComment = {
  id: number | string; // allow string for optimistic temp ids
  notificationId?: number|string;
  userId?: number | string;
  userFullname: string;
  content: string; // HTML content
  avatarUrl?: string | null;
  createdAt?: string;
};

// ====== Types ======
export type PostFile = {
  id: number | string;
  fileName: string;
  fileUrl: string;
};

export type Post = {
  id: number | string;
  classId?: number;
  title?: string;
  description?: string; // may contain sanitized HTML and embed blocks
  createdBy?: number | string;
  createdAt?: string;
  files?: PostFile[];
  comments?: PostComment[];
};

// ===== Helpers =====
const escapeHtml = (unsafe: string) =>
  unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

// Basic YouTube ID extractor supporting common URL forms
const extractYouTubeId = (url: string): string | null => {
  try {
    const u = new URL(url, window.location.href);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1);
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.searchParams.has("v")) return u.searchParams.get("v");
      // embed path: /embed/<id>
      const parts = u.pathname.split("/");
      const idx = parts.indexOf("embed");
      if (idx >= 0 && parts.length > idx + 1) return parts[idx + 1];
    }
  } catch {
    // not a valid URL
  }
  return null;
};

const sanitizeHtml = (html: string) => {
  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "b",
        "strong",
        "i",
        "em",
        "u",
        "s",
        "span",
        "div",
        "p",
        "br",
        "ul",
        "ol",
        "li",
        "a",
      ],
      ALLOWED_ATTR: ["style", "class", "href", "target", "rel"],
    });
  } catch {
    return escapeHtml(html);
  }
};

// Render function: splits embed-video blocks (<div class="embed-video">URL</div>)
// into sanitized HTML segments and iframe/link nodes
const renderContent = (html?: string) => {
  if (!html) return null;
  const nodes: React.ReactNode[] = [];
  const re = /<div\s+class=(?:'|")embed-video(?:'|")\s*>(.*?)<\/div\s*>/gis;
  let lastIndex = 0;
  let match;
  let idx = 0;

  while ((match = re.exec(html)) !== null) {
    const matchIndex = match.index;
    const before = html.slice(lastIndex, matchIndex);
    if (before && before.trim()) {
      const sanitized = sanitizeHtml(before);
      nodes.push(
        <div
          key={`html-${idx}-${lastIndex}`}
          className="post-html"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      );
    }

    const url = (match[1] || "").trim();
    const ytId = extractYouTubeId(url);
    if (ytId) {
      const embedSrc = `https://www.youtube.com/embed/${ytId}?rel=0`;
      nodes.push(
        <div
          key={`yt-${idx}`}
          className="my-3 embed-video w-full max-w-full"
          style={{ aspectRatio: "16/9" }}
        >
          <iframe
            title={`youtube-${ytId}`}
            src={embedSrc}
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full rounded"
          />
        </div>
      );
    } else if (url) {
      const safeUrl = sanitizeHtml(escapeHtml(url));
      nodes.push(
        <div key={`link-${idx}`} className="my-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#2563eb",
              textDecoration: "underline",
              display: "block",
              wordBreak: "break-all",
              overflowWrap: "anywhere",
              whiteSpace: "normal",
              hyphens: "auto",
            }}
            dangerouslySetInnerHTML={{ __html: safeUrl }}
          />
        </div>
      );
    }

    lastIndex = re.lastIndex;
    idx++;
  }

  // trailing content
  const tail = html.slice(lastIndex);
  if (tail && tail.trim()) {
    const sanitizedTail = sanitizeHtml(tail);
    nodes.push(
      <div
        key={`html-tail-${idx}-${lastIndex}`}
        className="post-html"
        dangerouslySetInnerHTML={{ __html: sanitizedTail }}
      />
    );
  }

  return <>{nodes}</>;
};

// ====== Helper: file preview component ======
const FilePreview: React.FC<{ file: PostFile }> = ({ file }) => {
  const url = file.fileUrl;
  const name = file.fileName || "";
  const extMatch = (name || url).split(".").pop() || "";
  const ext = extMatch.toLowerCase();

  const isImage =
    /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(url) ||
    ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
  const isPdf = ext === "pdf" || /\.pdf$/i.test(url);

  const getDisplayName = (): { text: string; full: string } => {
    try {
      const parsedName = new URL(name);
      const short =
        parsedName.hostname +
        (parsedName.pathname && parsedName.pathname !== "/" ? parsedName.pathname : "");
      return { text: short, full: name };
    } catch {
      try {
        const parsedUrl = new URL(url);
        const short =
          parsedUrl.hostname +
          (parsedUrl.pathname && parsedUrl.pathname !== "/" ? parsedUrl.pathname : "");
        return { text: short, full: url };
      } catch {
        const max = 120;
        if (name.length > max) return { text: name.slice(0, max) + "...", full: name };
        return { text: name, full: name };
      }
    }
  };

  const display = getDisplayName();

  const renderThumb = () => {
    if (isImage) {
      return (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      );
    }

    if (isPdf) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-red-50 text-red-600">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
            <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" strokeWidth="1.2" />
            <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.2" />
            <text x="50%" y="70%" dominantBaseline="middle" textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="Inter, Arial, sans-serif">
              {ext.toUpperCase()}
            </text>
          </svg>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-700">
        <div className="text-xs font-medium">{ext ? ext.toUpperCase() : "FILE"}</div>
      </div>
    );
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center gap-3 bg-white border rounded overflow-hidden px-3 py-2 hover:shadow transition"
      style={{
        maxWidth: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        wordBreak: "break-all",
        whiteSpace: "normal",
      }}
      title={display.full}
    >
      <div className="w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">{renderThumb()}</div>

      <div className="flex-1 min-w-0" style={{ overflow: "hidden" }}>
        <div
          className="text-sm text-gray-800 underline decoration-dashed"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
            whiteSpace: "normal",
            hyphens: "auto",
            lineHeight: "1.15rem",
            maxHeight: "2.4rem",
          }}
        >
          {display.text}
        </div>

        <div className="text-xs text-gray-500 mt-1" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {isPdf ? "PDF" : isImage ? "Image" : (ext ? ext.toUpperCase() : "File")}
        </div>
      </div>

      <div className="text-xs text-blue-600 ml-3 flex-shrink-0">Tải xuống</div>
    </a>
  );
};

// ====== Component ======
const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [localComments, setLocalComments] = useState<PostComment[]>(post.comments ?? []);
  const [isDeleted, setIsDeleted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setLocalComments(post.comments ?? []);
  }, [post.comments]);

  const addComment = useClassStore((s) => s.addComment);
  const deleteNotification = useClassStore((s) => s.deleteNotification);

  const { user } = useAuthStore();
  const currentUserId = user?.id ?? "unknown-user";
  const currentUserFullname = user?.fullname ?? "Bạn";

  const handleSendComment = async (htmlContent: string) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: PostComment = {
      id: tempId,
      notificationId: typeof post.id === "number" ? post.id : Number(post.id),
      userId: currentUserId,
      userFullname: currentUserFullname,
      content: htmlContent,
      avatarUrl: user?.avatar ?? "/vite.svg",
      createdAt: formatISO(new Date()) ,
    };

    setLocalComments((c) => [...c, optimistic]);
    setShowComments(true);

    try {
      const created = await addComment({
        notificationId: post.id,
        content: htmlContent,
        userId: currentUserId,
      });
      if (created) {
        setLocalComments((prev) =>
          prev.map((c) => (String(c.id) === String(tempId) ? created : c))
        );
        setShowComments(true);
      } else {
        setLocalComments((prev) =>
          prev.map((c) => (String(c.id) === String(tempId) ? { ...c, id: Date.now() } : c))
        );
        setShowComments(true);
      }
    } catch (err) {
      console.error("Failed to send comment", err);
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

  const formatDate = (iso?: string | number) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso);
      // format with date-fns for consistent output
      return d.toLocaleString("vi-VN");
    } catch {
      return String(iso);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarImage src={post.createdBy ? "/vite.svg" : "/vite.svg"} alt="avatar" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800" />
              <div className="text-xs text-gray-400">{formatDate(post.createdAt)}</div>
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

          <div className="mt-1 text-gray-600">{renderContent(post.description)}</div>

          {post.files && post.files.length > 0 && (
            <div className="mt-3 bg-gray-50 border rounded p-3 space-y-2">
              {post.files.map((file) => (
                <FilePreview key={file.id} file={file} />
              ))}
            </div>
          )}

          <Separator className="my-3" />

          <div className="flex items-center justify-between text-sm text-gray-500">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments((s) => !s)}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {localComments.length} comments
            </Button>

            
          </div>

          <div className="mt-4">
            <CommentComposer onSend={handleSendComment} avatarUrl={user?.avatar ?? "/vite.svg"} />
          </div>

          {showComments && localComments.length > 0 && (
            <div className="mt-3 space-y-3">
              {localComments.map((c) => (
                <div key={c.id} className="flex gap-3 items-start">
                  <Avatar>
                    <AvatarImage src={c.avatarUrl ?? "/vite.svg"} alt="avatar" />
                    <AvatarFallback>{(c.userFullname || "U").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <div className="font-medium">
                      {c.userFullname}{" "}
                      <span className="text-gray-400 text-xs ml-2">{formatDate(c.createdAt)}</span>
                    </div>
                    <div
                      className="text-gray-700 mt-1"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(c.content ?? "") }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PostCard;