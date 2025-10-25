import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/common/components/ui/button";
import { Triangle, Youtube, Upload, Link2, X } from "lucide-react";

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
  // onPost(contentHtml, files?, links?, titleHtml?)
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
  // isEmpty means both title and content are empty
  const [isEmpty, setIsEmpty] = useState(true);

  // YouTube modal state
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState<
    { videoId: string; title: string; thumbnail?: string }[]
  >([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  // Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkQuery, setLinkQuery] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkPreview, setLinkPreview] = useState<{ title?: string; thumbnail?: string; domain?: string } | null>(null);

  const updateEmptyState = () => {
    const titleText = titleRef.current?.textContent?.trim() ?? "";
    const contentText = editorRef.current?.textContent?.trim() ?? "";
    setIsEmpty(titleText.length === 0 && contentText.length === 0);
  };

  const exec = (cmd: string, value?: string) => {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const insertUnorderedListWithMarker = () => {
    const html =
      '<ul style="list-style-type: disc; list-style-position: outside; padding-left: 1.2rem;"><li><br></li></ul>';
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
    const html = editorRef.current?.innerHTML.trim() ?? "";
    const titleHtml = titleRef.current?.innerHTML.trim() ?? "";

    // Validate title: server expects Title not empty
    if (!titleHtml || titleHtml === "<br>" || titleHtml === "") {
      // focus title
      titleRef.current?.focus();
      return;
    }

    // collect File objects (regular uploaded files)
    const filesFromAttachments = attachments
      .filter((a) => a.type === "file")
      .map((a) => (a as any).file as File);

   // collect links (both link and youtube attachments)
    const linksToSend: LinkPayload[] = attachments
      .filter((a) => a.type === "link" || a.type === "youtube")
      .map((a) => {
        return {
          url: a.url,
          title: a.title,
          thumbnail: a.thumbnail,
        } as LinkPayload;
      });

    // pass content, files, links and title to parent onPost
    await onPost(
      html,
      filesFromAttachments.length ? filesFromAttachments : undefined,
      linksToSend.length ? linksToSend : undefined,
      titleHtml
    );

    // reset
    editorRef.current!.innerHTML = "";
    titleRef.current!.innerHTML = "";
    setAttachments([]);
    setIsExpanded(false);
    setIsEmpty(true);
  };

  const handleCancel = () => {
    editorRef.current!.innerHTML = "";
    titleRef.current!.innerHTML = "";
    setIsExpanded(false);
    setAttachments([]);
    setIsEmpty(true);
  };

  const handleFocus = () => {
    setIsExpanded(true);
    setTimeout(() => {
      // focus title if empty, otherwise editor
      const titleText = titleRef.current?.textContent?.trim() ?? "";
      if (!titleText) titleRef.current?.focus();
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

  // YouTube helpers (unchanged)
  const getYouTubeApiKey = () => {
    const viteEnv =
      (typeof import.meta !== "undefined" ? (import.meta as any).env : undefined) || {};
    const viteKey = viteEnv?.VITE_YOUTUBE_API_KEY || viteEnv?.NEXT_PUBLIC_YOUTUBE_API_KEY;
    const winKey =
      typeof window !== "undefined"
        ? ((window as any).__YOUTUBE_API_KEY ||
            (window as any).YT_API_KEY ||
            (window as any).NEXT_PUBLIC_YOUTUBE_API_KEY)
        : undefined;
    let procKey: string | undefined = undefined;
    try {
      const proc = (globalThis as any).process;
      if (proc && proc.env) {
        procKey = proc.env.NEXT_PUBLIC_YOUTUBE_API_KEY || proc.env.VITE_YOUTUBE_API_KEY;
      }
    } catch {
      // ignore
    }
    return viteKey || procKey || winKey || undefined;
  };

  const parseYouTubeIdFromInput = (input: string): string | null => {
    const t = input.trim();
    try {
      const u = new URL(t, window.location.href);
      if (u.hostname.includes("youtu.be")) {
        return u.pathname.slice(1);
      }
      if (u.hostname.includes("youtube.com")) {
        if (u.searchParams.has("v")) return u.searchParams.get("v");
        const parts = u.pathname.split("/");
        const idx = parts.indexOf("embed");
        if (idx >= 0 && parts.length > idx + 1) return parts[idx + 1];
      }
    } catch {
      // not a full URL
    }
    const possibleId = t.match(/^[a-zA-Z0-9_-]{11}$/);
    return possibleId ? possibleId[0] : null;
  };

  const fetchOEmbedForVideo = async (videoUrl: string) => {
    setYtError(null);
    setYtLoading(true);
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
        videoUrl
      )}&format=json`;
      const res = await fetch(oembedUrl);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`oEmbed HTTP ${res.status}: ${txt}`);
      }
      const j = await res.json();
      const vid = parseYouTubeIdFromInput(videoUrl);
      if (!vid) throw new Error("Không xác định được video id từ URL");
      const result = {
        videoId: vid,
        title: j.title ?? `Video ${vid}`,
        thumbnail: j.thumbnail_url,
      };
      setYtResults([result]);
      return result;
    } catch (err: any) {
      setYtError("Không lấy được metadata bằng oEmbed: " + (err?.message ?? String(err)));
      throw err;
    } finally {
      setYtLoading(false);
    }
  };

  const searchYouTube = async (query: string) => {
    setYtError(null);
    setYtResults([]);
    if (!query || query.trim().length === 0) {
      setYtError("Nhập từ khoá hoặc dán link để tìm video.");
      return;
    }

    const apiKey = getYouTubeApiKey();
    const maybeVid = parseYouTubeIdFromInput(query);

    if (apiKey) {
      setYtLoading(true);
      try {
        const q = encodeURIComponent(query);
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${q}&key=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status}: ${txt}`);
        }
        const data = await res.json();
        const items = data.items ?? [];
        const results = items
          .map((it: any) => {
            const videoId = it.id?.videoId;
            const snippet = it.snippet;
            if (!videoId || !snippet) return null;
            return {
              videoId,
              title: snippet.title,
              thumbnail:
                snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
            };
          })
          .filter(Boolean) as { videoId: string; title: string; thumbnail?: string }[];
        setYtResults(results);
        if (results.length === 0) setYtError("Không tìm thấy video nào cho từ khoá này.");
      } catch (err: any) {
        setYtError("Lỗi khi tìm kiếm YouTube: " + (err?.message ?? String(err)));
      } finally {
        setYtLoading(false);
      }
      return;
    }

    if (maybeVid) {
      const watchUrl = `https://www.youtube.com/watch?v=${maybeVid}`;
      try {
        await fetchOEmbedForVideo(watchUrl);
      } catch {
        // error state is already set in fetchOEmbedForVideo
      }
      return;
    }

    setYtError(
      "Chưa cấu hình YouTube API key và từ khoá không phải URL/ID. Dán link video YouTube vào ô và nhấn 'Chèn (URL)', hoặc đặt biến môi trường VITE_YOUTUBE_API_KEY / NEXT_PUBLIC_YOUTUBE_API_KEY / window.__YOUTUBE_API_KEY để bật chức năng tìm kiếm."
    );
  };

  // Insert youtube embed into editor and attachments
  const insertYoutubeEmbed = async (videoUrl: string) => {
    const vid = parseYouTubeIdFromInput(videoUrl);
    if (!vid) {
      const html = `<div class="embed-video">${videoUrl}</div><p><br></p>`;
      document.execCommand("insertHTML", false, html);
      editorRef.current?.focus();
      updateEmptyState();
      return;
    }

    try {
      const meta = await fetchOEmbedForVideo(videoUrl);
      const html = `<div class="embed-video"><iframe src="https://www.youtube.com/embed/${vid}" frameborder="0" allowfullscreen></iframe></div><p><br></p>`;
      document.execCommand("insertHTML", false, html);
      editorRef.current?.focus();
      updateEmptyState();

      const attachment: Attachment = {
        id: `${Date.now()}-${vid}`,
        type: "youtube",
        videoId: vid,
        title: meta?.title ?? `Video ${vid}`,
        thumbnail: meta?.thumbnail,
        url: `https://www.youtube.com/watch?v=${vid}`,
      };
      setAttachments((prev) => [...prev, attachment]);
    } catch (err) {
      const html = `<div class="embed-video"><iframe src="https://www.youtube.com/embed/${vid}" frameborder="0" allowfullscreen></iframe></div><p><br></p>`;
      document.execCommand("insertHTML", false, html);
      editorRef.current?.focus();
      updateEmptyState();
      const attachment: Attachment = {
        id: `${Date.now()}-${vid}`,
        type: "youtube",
        videoId: vid,
        title: `Video ${vid}`,
        thumbnail: undefined,
        url: `https://www.youtube.com/watch?v=${vid}`,
      };
      setAttachments((prev) => [...prev, attachment]);
    }
  };

  // Link preview fetcher: try to fetch HTML and parse OG/Twitter meta; if CORS blocks, fallback to no metadata
  const fetchLinkPreview = async (url: string) => {
    setLinkError(null);
    setLinkPreview(null);
    setLinkLoading(true);
    try {
      // Basic sanity parse to get domain
      let domain: string | undefined = undefined;
      try {
        const u = new URL(url, window.location.href);
        domain = u.hostname.replace(/^www\./, "");
      } catch {
        domain = undefined;
      }

      // Try fetching page HTML (may be blocked by CORS)
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const text = await res.text();
      // parse meta tags quickly using DOMParser
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
        (doc.querySelector("title")?.textContent ?? undefined) ||
        url;
      const thumbnail = getMeta(["og:image"]) || getMeta(["twitter:image"]) || undefined;

      setLinkPreview({ title, thumbnail, domain });
      return { title, thumbnail, domain };
    } catch (err: any) {
      // CORS or other failure
      setLinkError(
        "Không lấy được metadata trang (có thể do CORS). Sẽ dùng URL làm tiêu đề. " +
          (err?.message ?? String(err))
      );
      setLinkPreview({ title: url, domain: undefined });
      return { title: url, thumbnail: undefined, domain: undefined };
    } finally {
      setLinkLoading(false);
    }
  };

  // Insert link into editor and add attachment
  const insertLinkEmbed = async (rawUrl: string) => {
    const val = rawUrl.trim();
    if (!val) return;
    // ensure we have absolute URL
    let url = val;
    try {
      const u = new URL(val, window.location.href);
      url = u.href;
    } catch {
      // keep as-is
    }

    // try to fetch preview but do not block insertion if fails
    let preview;
    try {
      preview = await fetchLinkPreview(url);
    } catch {
      preview = { title: url, thumbnail: undefined, domain: undefined };
    }

    // Insert anchor into editor
    const display = preview?.title ?? url;
    const safeHtml = `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(display)}</a><p><br></p>`;
    document.execCommand("insertHTML", false, safeHtml);
    editorRef.current?.focus();
    updateEmptyState();

    const attachment: Attachment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: "link",
      url,
      title: preview?.title ?? url,
      thumbnail: preview?.thumbnail,
      domain: preview?.domain,
    };
    setAttachments((prev) => [...prev, attachment]);
  };

  // Small helper to escape HTML for inserted link text/href
  const escapeHtml = (s: string) =>
    s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  return (
    <>
      <motion.div
        className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 transition-all w-full "
        layout
        transition={{ layout: { duration: 0.3, type: "spring" } }}
      >
        <div className="flex space-x-3">
          {avatarUrl && (
            <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border" />
          )}

          <div className="flex-1">
            {!isExpanded ? (
              <div
                onClick={handleFocus}
                className="min-h-[48px] bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-500 cursor-text hover:bg-gray-100 transition-colors flex items-center"
              >
                Thông báo nội dung nào đó cho lớp học của bạn
              </div>
            ) : (
              <motion.div layout className="flex flex-col">
                <div className="relative mb-2">
                  {/* Title (single-line, contentEditable) */}
                  <div
                    ref={titleRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => {
                      updateEmptyState();
                    }}
                    data-placeholder="Tiêu đề (bắt buộc)"
                    className="min-h-[36px] bg-gray-50 rounded-xl p-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 empty:before:opacity-70"
                    style={{
                      wordBreak: "break-word",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  ></div>
                </div>

                <div className="relative">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => {
                      updateEmptyState();
                    }}
                    data-placeholder="Nội dung mô tả... (có thể định dạng)"
                    className="min-h-[100px] bg-gray-50 rounded-xl p-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 empty:before:opacity-70"
                    style={{
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  ></div>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">📎 File đính kèm:</p>
                    <div className="space-y-2">
                      {attachments.map((att, index) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            {/* Thumbnail / icon */}
                            <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                              {att.type === "youtube" ? (
                                att.thumbnail ? (
                                  <img
                                    src={att.thumbnail}
                                    alt={att.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-xs text-gray-500">YT</div>
                                )
                              ) : att.type === "link" ? (
                                att.thumbnail ? (
                                  <img
                                    src={att.thumbnail}
                                    alt={att.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-xs text-gray-500">LINK</div>
                                )
                              ) : (
                                // file preview (image or generic)
                                (() => {
                                  const file = att.file;
                                  if (file.type.startsWith("image/")) {
                                    const src = URL.createObjectURL(file);
                                    return (
                                      <img
                                        src={src}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                      />
                                    );
                                  }
                                  const ext = (att.file.name.split(".").pop() || "").toUpperCase();
                                  return (
                                    <div className="text-xs text-gray-700 font-medium">
                                      {ext || "FILE"}
                                    </div>
                                  );
                                })()
                              )}
                            </div>

                            <div className="flex flex-col max-w-xs">
                              <div className="text-sm text-gray-800 truncate underline decoration-dashed">
                                {att.type === "youtube"
                                  ? att.title
                                  : att.type === "link"
                                  ? att.title
                                  : att.file.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {att.type === "youtube"
                                  ? "YouTube"
                                  : att.type === "link"
                                  ? att.domain ?? (() => { try { return new URL(att.url).hostname.replace(/^www\./, "") } catch { return att.url } })()
                                  : att.file.type
                                  ? att.file.type
                                  : "File"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {att.type === "link" && (
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 text-xs hover:underline mr-2"
                              >
                                Mở
                              </a>
                            )}
                            <button
                              onClick={() => removeAttachment(index)}
                              className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-200 mt-3 pt-2">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => exec("bold")}
                      className="p-2 hover:text-blue-600 rounded-md hover:bg-gray-100 font-bold"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => exec("italic")}
                      className="p-2 hover:text-blue-600 rounded-md hover:bg-gray-100 italic"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => exec("underline")}
                      className="p-2 hover:text-blue-600 rounded-md hover:bg-gray-100 underline"
                      title="Underline"
                    >
                      U
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => exec("strikeThrough")}
                      className="p-2 hover:text-blue-600 rounded-md hover:bg-gray-100 line-through"
                      title="Gạch ngang"
                    >
                      S
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertUnorderedListWithMarker()}
                      className="p-2 hover:text-blue-600 rounded-md hover:bg-gray-100"
                      title="Danh sách"
                    >
                      •
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertOrderedListWithMarker()}
                      className="p-2 hover:text-blue-600 rounded-md hover:bg-gray-100"
                      title="Danh sách số"
                    >
                      1.
                    </button>

                    <div className="w-px h-5 bg-gray-300"></div>

                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={clearFormatting}
                      className="p-2 hover:text-blue-600 rounded-md hover:bg-gray-100"
                      title="Xóa định dạng"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-gray-100" onClick={handleCancel}>
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      className={`rounded-full px-5 text-white ${
                        isEmpty ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                      onClick={handlePost}
                      disabled={isEmpty}
                    >
                      Đăng
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 ml-1 text-gray-500">
                  <button
                    title="Video"
                    className="p-2 hover:text-blue-600 rounded-full hover:bg-gray-100"
                    onClick={() => {
                      setYtQuery("");
                      setYtResults([]);
                      setYtError(null);
                      setShowYoutubeModal(true);
                    }}
                  >
                    <Youtube size={18} />
                  </button>

                  <label
                    title="Tải tệp lên"
                    className="p-2 hover:text-blue-600 rounded-full hover:bg-gray-100 cursor-pointer"
                  >
                    <Upload size={18} />
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files ?? []).map((f) => ({
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
                  <button
                    title="Chèn liên kết"
                    className="p-2 hover:text-blue-600 rounded-full hover:bg-gray-100"
                    onClick={() => {
                      setLinkQuery("");
                      setLinkPreview(null);
                      setLinkError(null);
                      setShowLinkModal(true);
                    }}
                  >
                    <Link2 size={18} />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* YouTube modal (unchanged) */}
      {showYoutubeModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowYoutubeModal(false)} />
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-3">
                <div className="flex items-center text-xl font-semibold gap-2">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M23 7.2a3 3 0 00-2.1-2.12C19.44 4.4 12 4.4 12 4.4s-7.44 0-8.9.68A3 3 0 001 7.2 31 31 0 001 12a31 31 0 001.1 4.8 3 3 0 002.1 2.12C4.56 19.6 12 19.6 12 19.6s7.44 0 8.9-.68A3 3 0 0023 16.8 31 31 0 0023 12a31 31 0 00-0-4.8z" fill="#FF0000"/>
                    <path d="M10 15.5l5.5-3.5L10 8.5v7z" fill="#fff"/>
                  </svg>
                  <span>YouTube</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
                  onClick={() => {
                    window.open("https://www.youtube.com", "_blank");
                  }}
                >
                  Mở YouTube
                </button>
                <button className="text-gray-500 hover:text-gray-700 p-1" onClick={() => setShowYoutubeModal(false)}>
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="flex gap-2">
                <input
                  value={ytQuery}
                  onChange={(e) => setYtQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") searchYouTube(ytQuery);
                  }}
                  placeholder="Tìm video trên YouTube hoặc dán link (nhấn Enter để tìm). Nếu không có API key, dán link/ID để lấy metadata bằng oEmbed."
                  className="flex-1 border rounded px-3 py-2 outline-none"
                />
                <button className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700" onClick={() => searchYouTube(ytQuery)}>
                  Tìm
                </button>
                <button
                  className="bg-gray-100 text-gray-700 rounded px-3 py-2 hover:bg-gray-200"
                  onClick={() => {
                    const val = ytQuery.trim();
                    if (!val) return;
                    try {
                      const u = new URL(val, window.location.href);
                      if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
                        insertYoutubeEmbed(val);
                        setShowYoutubeModal(false);
                        return;
                      }
                    } catch {
                      // not a url
                    }
                    searchYouTube(ytQuery);
                  }}
                >
                  Chèn (URL)
                </button>
              </div>

              <div className="mt-4">
                {ytLoading && <div className="text-sm text-gray-500">Đang tìm...</div>}
                {ytError && <div className="text-sm text-red-500">{ytError}</div>}

                {!ytLoading && ytResults.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ytResults.map((r) => (
                      <div
                        key={r.videoId}
                        className="border rounded overflow-hidden hover:shadow cursor-pointer"
                        onClick={() => {
                          const url = `https://www.youtube.com/watch?v=${r.videoId}`;
                          insertYoutubeEmbed(url);
                          setShowYoutubeModal(false);
                        }}
                      >
                        <div className="w-full h-32 bg-gray-200 overflow-hidden">
                          {r.thumbnail ? (
                            <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">No image</div>
                          )}
                        </div>
                        <div className="p-2 text-xs text-gray-800">{r.title}</div>
                      </div>
                    ))}
                  </div>
                )}

                {!ytLoading && !ytError && ytResults.length === 0 && (
                  <div className="text-sm text-gray-400 mt-2">Chưa có kết quả. Nhập từ khoá và nhấn Tìm.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowLinkModal(false)} />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-3">
                <div className="flex items-center text-lg font-semibold gap-2">
                  <Link2 size={18} />
                  <span>Chèn liên kết</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-gray-500 hover:text-gray-700 p-1" onClick={() => setShowLinkModal(false)}>
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="flex gap-2">
                <input
                  value={linkQuery}
                  onChange={(e) => setLinkQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fetchLinkPreview(linkQuery);
                  }}
                  placeholder="Dán link ở đây (ví dụ https://example.com) và nhấn 'Lấy preview' hoặc 'Chèn (URL)'."
                  className="flex-1 border rounded px-3 py-2 outline-none"
                />
                <button
                  className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
                  onClick={() => fetchLinkPreview(linkQuery)}
                >
                  Lấy preview
                </button>
                <button
                  className="bg-gray-100 text-gray-700 rounded px-3 py-2 hover:bg-gray-200"
                  onClick={async () => {
                    if (!linkQuery.trim()) return;
                    await insertLinkEmbed(linkQuery);
                    setShowLinkModal(false);
                  }}
                >
                  Chèn (URL)
                </button>
              </div>

              <div className="mt-4">
                {linkLoading && <div className="text-sm text-gray-500">Đang lấy preview...</div>}
                {linkError && <div className="text-sm text-red-500">{linkError}</div>}

                {!linkLoading && linkPreview && (
                  <div className="flex items-start gap-3 border rounded p-2">
                    <div className="w-28 h-16 bg-gray-100 overflow-hidden rounded">
                      {linkPreview.thumbnail ? (
                        <img src={linkPreview.thumbnail} alt={linkPreview.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">No image</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 truncate">{linkPreview.title}</div>
                      <div className="text-xs text-gray-500">{linkPreview.domain}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-sm text-blue-600 hover:underline"
                        onClick={async () => {
                          await insertLinkEmbed(linkQuery);
                          setShowLinkModal(false);
                        }}
                      >
                        Chèn
                      </button>
                    </div>
                  </div>
                )}

                {!linkLoading && !linkPreview && !linkError && (
                  <div className="text-sm text-gray-400 mt-2">Chưa có preview. Dán link và nhấn "Lấy preview" hoặc "Chèn (URL)".</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}