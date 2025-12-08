import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, Youtube, Upload, Link as LinkIcon } from "lucide-react";
import { useAuthStore } from "@/auth/stores/useAuthStore";

/* shadcn components */
import { Button } from "@/common/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/common/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/common/components/ui/dialog";
import { Input } from "@/common/components/ui/input";
/* types */
export type LinkPayload = { url: string; title?: string; thumbnail?: string };

type Attachment =
  | { id: string; type: "file"; file: File; title?: string }
  | {
      id: string;
      type: "youtube";
      videoId: string;
      title: string;
      thumbnail?: string;
      url: string;
    }
  | {
      id: string;
      type: "link";
      url: string;
      title: string;
      thumbnail?: string;
      domain?: string;
    };



export default function PostComposer({
  onPost,
  avatarUrl,
}: {
  onPost: (
    content: string,
    files?: File[] | undefined,
    links?: LinkPayload[] | undefined,
    title?: string | undefined
  ) => void | Promise<void>;
  avatarUrl?: string;
}) {
  const titleRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isEmpty, setIsEmpty] = useState(true);
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");

  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState<
    { videoId: string; title: string; thumbnail?: string }[]
  >([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkQuery, setLinkQuery] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkPreview, setLinkPreview] = useState<{ title?: string; thumbnail?: string; domain?: string } | null>(null);

  const updateEmptyState = () => {
    const titleText = titleRef.current?.textContent?. trim() ??  "";
    const contentText = editorRef.current?.textContent?. trim() ?? "";
    setIsEmpty(titleText.length === 0 && contentText.length === 0);
    
    // Clear errors when user types
    if (titleText.length > 0) setTitleError("");
    if (contentText.length > 0) setContentError("");
  };

  const exec = (cmd: string, value?: string) => {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const insertUnorderedListWithMarker = () => {
    const html =
      '<ul style="list-style-type: disc; list-style-position: outside; padding-left: 1. 2rem;"><li><br></li></ul>';
    document.execCommand("insertHTML", false, html);
    editorRef.current?.focus();
    updateEmptyState();
  };

  const insertOrderedListWithMarker = () => {
    const html =
      '<ol style="list-style-type: decimal; list-style-position: outside; padding-left: 1.2rem;"><li><br></li></ol>';
    document.execCommand("insertHTML", false, html);
    editorRef.current?.focus();
    updateEmptyState();
  };

  const clearFormatting = () => {
    document.execCommand("removeFormat", false, undefined);
    editorRef.current?.focus();
  };

  const handlePost = async () => {
    const html = editorRef.current?.innerHTML. trim() ?? "";
    const titleHtml = titleRef.current?.innerHTML.trim() ?? "";

    let hasError = false;

    if (! titleHtml || titleHtml === "<br>" || titleHtml === "") {
      setTitleError("Tiêu đề là bắt buộc");
      titleRef.current?.focus();
      hasError = true;
    } else {
      setTitleError("");
    }

    if (isEmpty || !html || html === "<br>" || html === "") {
      setContentError("Nội dung là bắt buộc");
      if (! hasError) editorRef.current?.focus();
      hasError = true;
    } else {
      setContentError("");
    }

    if (hasError) return;

    const filesFromAttachments = attachments
      .filter((a) => a.type === "file")
      .map((a) => (a as any).file as File);

    const linksToSend: LinkPayload[] = attachments
      .filter((a) => a.type === "link" || a.type === "youtube")
      .map((a) => {
        return {
          url: (a as any).url,
          title: (a as any).title,
          thumbnail: (a as any).thumbnail,
        } as LinkPayload;
      });

    await onPost(
      html,
      filesFromAttachments. length ?  filesFromAttachments : undefined,
      linksToSend. length ? linksToSend : undefined,
      titleHtml
    );

    if (editorRef.current) editorRef.current.innerHTML = "";
    if (titleRef.current) titleRef.current.innerHTML = "";
    setAttachments([]);
    setIsExpanded(false);
    setIsEmpty(true);
    setTitleError("");
    setContentError("");
  };

  const handleCancel = () => {
    if (editorRef.current) editorRef.current.innerHTML = "";
    if (titleRef.current) titleRef.current.innerHTML = "";
    setIsExpanded(false);
    setAttachments([]);
    setIsEmpty(true);
    setTitleError("");
    setContentError("");
  };

  const handleFocus = () => {
    setIsExpanded(true);
    setTimeout(() => {
      const titleText = titleRef.current?.textContent?.trim() ?? "";
      if (! titleText) titleRef.current?.focus();
      else editorRef.current?.focus();
    }, 0);
  };

  const removeAttachment = (index: number) => {
    const att = attachments[index];
    if (att && att.type === "file") {
      const f = att.file;
      try {
        // revoke created object URLs if you created them elsewhere
      } catch {
        //
      }
    }
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchLinkPreview = async (url: string) => {
    setLinkError(null);
    setLinkPreview(null);
    setLinkLoading(true);
    try {
      let domain: string | undefined = undefined;
      try {
        const u = new URL(url, window.location.href);
        domain = u.hostname. replace(/^www\./, "");
      } catch {
        domain = undefined;
      }

      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const getMeta = (propNames: string[]) => {
        for (const p of propNames) {
          const m1 = doc.querySelector(`meta[property="${p}"]`) as HTMLMetaElement | null;
          if (m1 && m1.content) return m1.content;
          const m2 = doc.querySelector(`meta[name="${p}"]`) as HTMLMetaElement | null;
          if (m2 && m2.content) return m2.content;
        }
        return undefined;
      };
      const title =
        getMeta(["og:title"]) ||
        getMeta(["twitter:title"]) ||
        (doc.querySelector("title")?.textContent ??  undefined) ||
        url;
      const thumbnail = getMeta(["og:image"]) || getMeta(["twitter:image"]) || undefined;

      setLinkPreview({ title, thumbnail, domain });
      return { title, thumbnail, domain };
    } catch (err: any) {
      setLinkError(
        "Không lấy được metadata trang (có thể do CORS).  Sẽ dùng URL làm tiêu đề.  " +
          (err?. message ??  String(err))
      );
      setLinkPreview({ title: url, domain: undefined });
      return { title: url, thumbnail: undefined, domain: undefined };
    } finally {
      setLinkLoading(false);
    }
  };

  const insertLinkEmbed = async (rawUrl: string) => {
    const val = rawUrl.trim();
    if (!val) return;
    let url = val;
    try {
      const u = new URL(val, window. location.href);
      url = u.href;
    } catch {
      // keep as-is
    }

    let preview;
    try {
      preview = await fetchLinkPreview(url);
    } catch {
      preview = { title: url, thumbnail: undefined, domain: undefined };
    }

    const display = preview?. title ?? url;
    const safeHtml = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(display)}</a><p><br></p>`;
    document. execCommand("insertHTML", false, safeHtml);
    editorRef.current?.focus();
    updateEmptyState();

    const attachment: Attachment = {
      id: `${Date.now()}-${Math. random().toString(36).slice(2, 9)}`,
      type: "link",
      url,
      title: preview?.title ??  url,
      thumbnail: preview?. thumbnail,
      domain: preview?.domain,
    };
    setAttachments((prev) => [...prev, attachment]);
  };

  const escapeHtml = (s: string) =>
    s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      . replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  // --- NEW: determine fallback avatar from auth store if avatarUrl prop missing ---
  const { user } = useAuthStore();
  const fallbackAvatar = avatarUrl;

  // track if avatar image fails to load and fall back to initials
  const [imgBroken, setImgBroken] = useState(false);

  return (
    <>
      <motion.div
        className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 transition-all w-full"
        layout
        transition={{ layout: { duration: 0.25, type: "spring" } }}
      >
        <div className="flex space-x-3">
          <div>
            <Avatar>
              {! imgBroken && fallbackAvatar ? (
                <AvatarImage
                  src={fallbackAvatar}
                  alt="avatar"
                  onError={() => setImgBroken(true)}
                />
              ) : (
                <AvatarFallback>
                  {(user as any)?.fullname
                    ? String((user as any).fullname)
                        .split(/\s+/)
                        .map((p: string) => p.charAt(0))
                        .slice(0, 2)
                        . join("")
                        .toUpperCase()
                    : "U"}
                </AvatarFallback>
              )}
            </Avatar>
          </div>

          <div className="flex-1">
            {! isExpanded ?  (
              <div
                onClick={handleFocus}
                className="min-h-[48px] bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-500 cursor-text hover:bg-gray-100 transition-colors flex items-center"
              >
                Thông báo nội dung nào đó cho lớp học của bạn
              </div>
            ) : (
              <motion.div layout className="flex flex-col">
                <div className="relative mb-2">
                  <div
                    ref={titleRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={updateEmptyState}
                    data-placeholder="Tiêu đề (bắt buộc)"
                    className={`min-h-[36px] bg-gray-50 rounded-xl p-2 text-sm text-gray-800 outline-none focus:ring-2 ${
                      titleError ? "focus:ring-red-500 border border-red-500" : "focus:ring-blue-400"
                    } focus:bg-white empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 empty:before:opacity-70`}
                    style={{
                      wordBreak: "break-word",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  />
                  {titleError && (
                    <p className="text-xs text-red-600 mt-1">{titleError}</p>
                  )}
                </div>

                <div className="relative">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={updateEmptyState}
                    data-placeholder="Nội dung mô tả...  (có thể định dạng)"
                    className={`min-h-[100px] bg-gray-50 rounded-xl p-3 text-sm text-gray-800 outline-none focus:ring-2 ${
                      contentError ? "focus:ring-red-500 border border-red-500" : "focus:ring-blue-400"
                    } focus:bg-white empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 empty:before:opacity-70`}
                    style={{
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  />
                  {contentError && (
                    <p className="text-xs text-red-600 mt-1">{contentError}</p>
                  )}
                </div>

                {attachments.length > 0 && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">📎 File đính kèm:</p>
                    <div className="space-y-2">
                      {attachments. map((att, index) => (
                        <div key={att.id} className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                              {att.type === "youtube" ?  (
                                att.thumbnail ? (
                                  <img src={att.thumbnail} alt={att.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="text-xs text-gray-500">YT</div>
                                )
                              ) : att.type === "link" ? (
                                att.thumbnail ? (
                                  <img src={att.thumbnail} alt={att.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="text-xs text-gray-500">LINK</div>
                                )
                              ) : (
                                (() => {
                                  const file = att.file;
                                  if (file. type.startsWith("image/")) {
                                    const src = URL.createObjectURL(file);
                                    return <img src={src} alt={file.name} className="w-full h-full object-cover" />;
                                  }
                                  const ext = (att.file.name.split("."). pop() || "").toUpperCase();
                                  return <div className="text-xs text-gray-700 font-medium">{ext || "FILE"}</div>;
                                })()
                              )}
                            </div>

                            <div className="flex flex-col max-w-xs">
                              <div className="text-sm text-gray-800 truncate underline decoration-dashed">
                                {att.type === "youtube" ? att.title : att.type === "link" ? att.title : att.file.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {att.type === "youtube"
                                  ? "YouTube"
                                  : att.type === "link"
                                  ? att.domain ??  (() => { try { return new URL(att.url).hostname. replace(/^www\./, "") } catch { return att.url } })()
                                  : att.file.type
                                  ? att.file.type
                                  : "File"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {att.type === "link" && (
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline mr-2">
                                Mở
                              </a>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                              <X size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-200 mt-3 pt-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Button variant="ghost" size="sm" onMouseDown={(e)=>e.preventDefault()} onClick={() => exec("bold")} className="font-bold">B</Button>
                    <Button variant="ghost" size="sm" onMouseDown={(e)=>e.preventDefault()} onClick={() => exec("italic")} className="italic">I</Button>
                    <Button variant="ghost" size="sm" onMouseDown={(e)=>e.preventDefault()} onClick={() => exec("underline")} className="underline">U</Button>
                    <Button variant="ghost" size="sm" onMouseDown={(e)=>e.preventDefault()} onClick={() => exec("strikeThrough")}>S</Button>
                    <Button variant="ghost" size="sm" onMouseDown={(e)=>e.preventDefault()} onClick={insertUnorderedListWithMarker}>•</Button>
                    <Button variant="ghost" size="sm" onMouseDown={(e)=>e.preventDefault()} onClick={insertOrderedListWithMarker}>1. </Button>

                    <div style={{ width: 1, height: 20, background: "#e5e7eb" }} className="mx-1" />

                    <Button variant="ghost" size="sm" onMouseDown={(e)=>e.preventDefault()} onClick={clearFormatting}>
                      <X size={14} />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={handleCancel}>Hủy</Button>
                    <Button size="sm" onClick={handlePost}>
                      Đăng
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 ml-1 text-gray-500">
                  <label title="Tải tệp lên" className="cursor-pointer">
                    <div className="p-2 hover:text-blue-600 rounded-full hover:bg-gray-100 inline-flex">
                      <Upload size={18} />
                    </div>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const newFiles = Array.from(e. target.files ??  []). map((f) => ({
                          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                          type: "file" as const,
                          file: f,
                          title: f.name,
                        }));
                        setAttachments((prev) => [...prev, ...newFiles]);
                        updateEmptyState();
                      }}
                      className="hidden"
                    />
                  </label>

                  <Button variant="ghost" size="icon" onClick={() => { setLinkQuery(""); setLinkPreview(null); setLinkError(null); setShowLinkModal(true); }}>
                    <LinkIcon size={18} />
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Link Dialog */}
      <Dialog open={showLinkModal} onOpenChange={(val) => ! val && setShowLinkModal(false)}>
        <DialogContent className="sm:max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>Chèn liên kết</DialogTitle>
            <DialogDescription>Dán link để lấy preview hoặc chèn ngay. </DialogDescription>
          </DialogHeader>

          <div className="p-4">
            <div className="flex gap-2">
              <Input value={linkQuery} onChange={(e)=>setLinkQuery(e. target.value)} onKeyDown={(e)=>{ if(e.key==="Enter") fetchLinkPreview(linkQuery); }} placeholder="Dán link ở đây..." />
              <Button onClick={()=>fetchLinkPreview(linkQuery)}>Lấy preview</Button>
              <Button variant="outline" onClick={async ()=>{ if(! linkQuery. trim()) return; await insertLinkEmbed(linkQuery); setShowLinkModal(false); }}>Chèn (URL)</Button>
            </div>

            <div className="mt-4">
              {linkLoading && <div className="text-sm text-gray-500">Đang lấy preview...</div>}
              {linkError && <div className="text-sm text-red-500">{linkError}</div>}

              {! linkLoading && linkPreview && (
                <div className="flex items-start gap-3 border rounded p-2">
                  <div className="w-28 h-16 bg-gray-100 overflow-hidden rounded">
                    {linkPreview. thumbnail ?  <img src={linkPreview.thumbnail} alt={linkPreview.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500">No image</div>}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800 truncate">{linkPreview.title}</div>
                    <div className="text-xs text-gray-500">{linkPreview.domain}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="link" onClick={async ()=>{ await insertLinkEmbed(linkQuery); setShowLinkModal(false); }}>Chèn</Button>
                  </div>
                </div>
              )}

              {! linkLoading && !linkPreview && ! linkError && <div className="text-sm text-gray-400 mt-2">Chưa có preview.  Dán link và nhấn "Lấy preview" hoặc "Chèn (URL)". </div>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={()=>setShowLinkModal(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}