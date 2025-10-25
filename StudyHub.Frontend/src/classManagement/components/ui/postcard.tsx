import React, { useState } from "react";
import CommentComposer from "@/classManagement/components/ui/commentcomposer";
import DOMPurify from "dompurify";

// ====== Types ======
export type PostFile = {
  id: number | string;
  fileName: string;
  fileUrl: string;
};

export type PostComment = {
  id: number | string;
  notificationId?: number | string;
  userId?: number | string;
  userFullname: string;
  content: string;
  avatarUrl?: string;
  createdAt?: string;
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
  // allow basic formatting tags and inline style (used by composer)
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
      ],
      ALLOWED_ATTR: ["style", "class"],
    });
  } catch {
    // fallback: escape HTML entirely
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
          // safe because we've sanitized
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      );
    }

    const url = (match[1] || "").trim();
    const ytId = extractYouTubeId(url);
    if (ytId) {
      const embedSrc = `https://www.youtube.com/embed/${ytId}?rel=0`;
      nodes.push(
        <div key={`yt-${idx}`} className="my-3 embed-video w-full max-w-full" style={{ aspectRatio: "16/9" }}>
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
      // Not a recognized youtube link — render as sanitized link
      const safeUrl = sanitizeHtml(escapeHtml(url));
      nodes.push(
        <div key={`link-${idx}`} className="my-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
            // content sanitized above; link href is raw but we rely on browser to handle
          >
            {safeUrl}
          </a>
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
  const name = file.fileName;
  const extMatch = (name || url).split(".").pop() || "";
  const ext = extMatch.toLowerCase();

  const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(url) || ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
  const isPdf = ext === "pdf" || /\.pdf$/i.test(url);

  // small generic thumbnails for non-image files
  const renderThumb = () => {
    if (isImage) {
      return (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // fallback to generic if image fails to load
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      );
    }

    if (isPdf) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-red-50 text-red-600">
          {/* simple PDF icon + extension */}
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
            <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" strokeWidth="1.2" />
            <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.2" />
            <text x="50%" y="70%" dominantBaseline="middle" textAnchor="middle" fontSize="8" fill="currentColor" fontFamily="Inter, Arial, sans-serif">{ext.toUpperCase()}</text>
          </svg>
        </div>
      );
    }

    // other file types
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
      className="flex items-center gap-3 bg-white border rounded overflow-hidden px-3 py-2 hover:shadow transition"
    >
      <div className="w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-100">{renderThumb()}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-800 truncate underline decoration-dashed">{name}</div>
        <div className="text-xs text-gray-500 mt-1">{isPdf ? "PDF" : isImage ? "Image" : ext.toUpperCase() || "File"}</div>
      </div>
      <div className="text-xs text-blue-600">Tải xuống</div>
    </a>
  );
};

// ====== Component ======
const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [localComments, setLocalComments] = useState(post.comments ?? []);

  const handleSendComment = (text: string) => {
    const newComment: PostComment = {
      id: Date.now(),
      userFullname: "You",
      content: text,
      avatarUrl: "/vite.svg",
      createdAt: "just now",
    };
    setLocalComments((c) => [...c, newComment]);
    setShowComments(true);
    // optionally call API here
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-4">
        <img src={"/vite.svg"} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800"></div>
              <div className="text-xs text-gray-400">{post.createdAt ?? "just now"}</div>
            </div>
            <div className="text-sm text-gray-400 cursor-pointer">•••</div>
          </div>

          {/* Title */}
          {post.title && <div className="mt-3 text-gray-800 font-semibold">{post.title}</div>}

          {/* Nội dung bài đăng (safely render HTML + embed-video → iframe) */}
          <div className="mt-1 text-gray-600">
            {renderContent(post.description)}
          </div>

          {/* Hiển thị file đính kèm (nếu có) - PREVIEW BOXES */}
          {post.files && post.files.length > 0 && (
            <div className="mt-3 bg-gray-50 border rounded p-3 space-y-2">
              {post.files.map((file) => (
                <FilePreview key={file.id} file={file} />
              ))}
            </div>
          )}

          {/* Nút comment & share */}
          <div className="mt-4 border-t pt-3 flex items-center justify-between text-sm text-gray-500">
            <button className="flex items-center gap-2 hover:text-gray-700" onClick={() => setShowComments((s) => !s)}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {localComments.length} comments
            </button>
            <div className="text-gray-400 cursor-pointer hover:text-gray-600">Share</div>
          </div>

          {/* Comment composer */}
          <div className="mt-4">
            <CommentComposer onSend={handleSendComment} avatarUrl="/vite.svg" />
          </div>

          {/* Danh sách comment */}
          {showComments && localComments.length > 0 && (
            <div className="mt-3 space-y-3">
              {localComments.map((c) => (
                <div key={c.id} className="flex gap-3 items-start">
                  <img src={c.avatarUrl ?? "/vite.svg"} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                  <div className="text-sm">
                    <div className="font-medium">
                      {c.userFullname}{" "}
                      <span className="text-gray-400 text-xs ml-2">{c.createdAt ?? "just now"}</span>
                    </div>
                    <div className="text-gray-700 mt-1">{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCard;