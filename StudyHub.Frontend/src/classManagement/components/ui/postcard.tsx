/* eslint-disable @typescript-eslint/no-unused-expressions */
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
import { Tooltip } from "@/common/components/ui/tooltip";
import { format, formatISO } from "date-fns";
import FilePreview from "@/classManagement/components/ui/filepreview";
/* icons */
import { MoreHorizontal, Share2, Trash2, Underline } from "lucide-react";

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
  description?: string;
  createdBy?: number | string;
  createdAt?: string;
  files?: PostFile[];
  comments?: PostComment[];
  avatarImage?: string | null| undefined;
  authorName?: string | null| undefined;
  createdByName?: string;
};

// helpers omitted for brevity (escapeHtml, extractYouTubeId, sanitizeHtml, renderContent)
// ... keep same helpers as original file (not duplicated here for brevity)
// For clarity in this snippet, assume they are unchanged and present above.

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

  // Resolve avatar for the post author using multiple possible fields and fallbacks
  

  // Helper to render avatar fallback text (initials)
  const avatarFallbackText = () => {
    const name = (post as any).authorName ?? (post as any).createdByName ?? post.title ?? "";
    if (!name) return "U";
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleSendComment = async (htmlContent: string) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: PostComment = {
      id: tempId,
      notificationId: typeof post.id === "number" ? post.id : Number(post.id),
      userId: currentUserId,
      userFullname: currentUserFullname,
      content: htmlContent,
      avatarUrl: (user as any)?.avatarUrl ?? (user as any)?.avatar ?? (user as any)?.imageUrl ?? "/vite.svg",
      createdAt: formatISO(new Date()),
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

  const authorAvatar = post.avatarImage;
  console.log("Avater URL for post author:", authorAvatar);
  console.log("Post for post author:", post);
  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarImage src={authorAvatar??undefined} alt="avatar" />
          <AvatarFallback>{avatarFallbackText()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">{(post as any).authorName ?? (post as any).createdByName ?? ""}</div>
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

          <div className="mt-1 text-gray-600">{post.description}</div>

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
            <CommentComposer onSend={handleSendComment} avatarUrl={(user as any)?.avatarUrl ?? (user as any)?.avatar ?? (user as any)?.imageUrl ?? "/vite.svg"} />
          </div>

          {showComments && localComments.length > 0 && (
            <div className="mt-3 space-y-3">
              {localComments.map((c) => (
                <div key={c.id} className="flex gap-3 items-start">
                  <Avatar>
                    <AvatarImage src={c.avatarUrl ?? (user as any)?.avatarUrl ?? (user as any)?.avatar ?? (user as any)?.imageUrl ?? "/vite.svg"} alt="avatar" />
                    <AvatarFallback>{(c.userFullname || "U").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <div className="font-medium">
                      {c.userFullname}{" "}
                      <span className="text-gray-400 text-xs ml-2">{formatTimestamp(c.createdAt)}</span>
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