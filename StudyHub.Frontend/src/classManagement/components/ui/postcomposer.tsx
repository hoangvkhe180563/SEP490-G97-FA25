import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/common/components/ui/button";
import { Triangle, Youtube, Upload, Link2, X } from "lucide-react";

export default function PostComposer({
  onPost,
  avatarUrl,
}: {
  onPost: (content: string, files?: File[]) => void | Promise<void>;
  avatarUrl?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isEmpty, setIsEmpty] = useState(true);

  // YouTube modal state
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState<
    { videoId: string; title: string; thumbnail?: string }[]
  >([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

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
    setIsEmpty(false);
  };

  const insertOrderedListWithMarker = () => {
    const html =
      '<ol style="list-style-type: decimal; list-style-position: outside; padding-left: 1.2rem;"><li><br></li></ol>';
    document.execCommand("insertHTML", false, html);
    editorRef.current?.focus();
    setIsEmpty(false);
  };

  const clearFormatting = () => {
    document.execCommand("removeFormat", false, undefined);
    editorRef.current?.focus();
  };

  const handlePost = async () => {
    const html = editorRef.current?.innerHTML.trim() ?? "";
    if (!html || html === "<br>") return;
    await onPost(html, files);
    editorRef.current!.innerHTML = "";
    setFiles([]);
    setIsExpanded(false);
    setIsEmpty(true);
  };

  const handleCancel = () => {
    editorRef.current!.innerHTML = "";
    setIsExpanded(false);
    setFiles([]);
    setIsEmpty(true);
  };

  const handleFocus = () => {
    setIsExpanded(true);
    setTimeout(() => editorRef.current?.focus(), 0);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const insertYoutubeEmbed = (videoUrl: string) => {
    const html = `<div class="embed-video">${videoUrl}</div><p><br></p>`;
    document.execCommand("insertHTML", false, html);
    editorRef.current?.focus();
    setIsEmpty(false);
  };

  const getYouTubeApiKey = () => {
    const viteEnv = (typeof import.meta !== "undefined" ? (import.meta as any).env : undefined) || {};
    const viteKey = viteEnv?.VITE_YOUTUBE_API_KEY || viteEnv?.NEXT_PUBLIC_YOUTUBE_API_KEY;
    const winKey =
      typeof window !== "undefined"
        ? ((window as any).__YOUTUBE_API_KEY || (window as any).YT_API_KEY || (window as any).NEXT_PUBLIC_YOUTUBE_API_KEY)
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

  // Helper: detect if input is a YouTube URL or looks like a video id
  const parseYouTubeIdFromInput = (input: string): string | null => {
    const t = input.trim();
    try {
      // if it's a URL
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
      // not a full URL, maybe it's an id like "dQw4w9WgXcQ"
    }
    // fallback: if input looks like a video id (11 chars, allowed chars)
    const possibleId = t.match(/^[a-zA-Z0-9_-]{11}$/);
    return possibleId ? possibleId[0] : null;
  };

  // Use YouTube oEmbed to get title/thumbnail for a given video URL (no API key required)
  const fetchOEmbedForVideo = async (videoUrl: string) => {
    setYtError(null);
    setYtLoading(true);
    setYtResults([]);
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
      const res = await fetch(oembedUrl);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`oEmbed HTTP ${res.status}: ${txt}`);
      }
      const j = await res.json();
      // oEmbed returns title, thumbnail_url, author_name, etc.
      // We need a videoId to insert — try to parse from URL
      const vid = parseYouTubeIdFromInput(videoUrl);
      if (!vid) throw new Error("Không xác định được video id từ URL");
      setYtResults([
        {
          videoId: vid,
          title: j.title ?? `Video ${vid}`,
          thumbnail: j.thumbnail_url,
        },
      ]);
    } catch (err: any) {
      setYtError("Không lấy được metadata bằng oEmbed: " + (err?.message ?? String(err)));
    } finally {
      setYtLoading(false);
    }
  };

  // Search YouTube: prefer Data API if apiKey available; otherwise use oEmbed fallback for URLs/IDs only.
  const searchYouTube = async (query: string) => {
    setYtError(null);
    setYtResults([]);
    if (!query || query.trim().length === 0) {
      setYtError("Nhập từ khoá hoặc dán link để tìm video.");
      return;
    }

    const apiKey = getYouTubeApiKey();
    const maybeVid = parseYouTubeIdFromInput(query);

    // If API key is available, use Data API search
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
              thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
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

    // No API key: fall back to oEmbed if the user provided a URL or an exact video id
    if (maybeVid) {
      // construct a full youtube watch url and fetch oEmbed
      const watchUrl = `https://www.youtube.com/watch?v=${maybeVid}`;
      await fetchOEmbedForVideo(watchUrl);
      return;
    }

    // No API key and not a URL/id -> instruct user to paste URL or configure key
    setYtError(
      "Chưa cấu hình YouTube API key và từ khoá không phải URL/ID. Dán link video YouTube vào ô và nhấn 'Chèn (URL)', hoặc đặt biến môi trường VITE_YOUTUBE_API_KEY / NEXT_PUBLIC_YOUTUBE_API_KEY / window.__YOUTUBE_API_KEY để bật chức năng tìm kiếm."
    );
  };

  return (
    <>
      <motion.div
        className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 transition-all w-full "
        layout
        transition={{ layout: { duration: 0.3, type: "spring" } }}
      >
        <div className="flex space-x-3">
          {avatarUrl && (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full border"
            />
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
                <div className="relative">
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                      const text = e.currentTarget.textContent?.trim() ?? "";
                      setIsEmpty(text.length === 0);
                    }}
                    data-placeholder="Thông báo nội dung nào đó cho lớp học của bạn"
                    className="min-h-[100px] bg-gray-50 rounded-xl p-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 empty:before:opacity-70"
                    style={{
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap"
                    }}
                  ></div>
                </div>

                {files.length > 0 && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">📎 File đính kèm:</p>
                    <div className="space-y-1">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm">
                          <span className="text-gray-800 truncate">{file.name}</span>
                          <button
                            onClick={() => removeFile(index)}
                            className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                          >
                            <X size={16} />
                          </button>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:bg-gray-100"
                      onClick={handleCancel}
                    >
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      className={`rounded-full px-5 text-white ${
                        isEmpty
                          ? "bg-blue-300 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
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
                    title="Tài nguyên"
                    className="p-2 hover:text-blue-600 rounded-full hover:bg-gray-100"
                  >
                    <Triangle size={18} />
                  </button>

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
                      onChange={(e) =>
                        setFiles([...files, ...Array.from(e.target.files ?? [])])
                      }
                      className="hidden"
                    />
                  </label>
                  <button
                    title="Chèn liên kết"
                    className="p-2 hover:text-blue-600 rounded-full hover:bg-gray-100"
                  >
                    <Link2 size={18} />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* YouTube modal */}
      {showYoutubeModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowYoutubeModal(false)}
          />
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
                <button
                  className="text-gray-500 hover:text-gray-700 p-1"
                  onClick={() => setShowYoutubeModal(false)}
                >
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
                <button
                  className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
                  onClick={() => searchYouTube(ytQuery)}
                >
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
                    // fallback run search (this will either use API key or show hint)
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
    </>
  );
}