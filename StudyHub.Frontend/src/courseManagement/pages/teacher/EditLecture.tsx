import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import { Button } from "@/common/components/ui/button";
import { Label } from "@/common/components/ui/label";
import { ArrowLeft, Loader2, Upload, X, HelpCircle } from "lucide-react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";
import type { DialogProps } from "@/courseManagement/components/AppDialog";
import { AppDialog } from "@/courseManagement/components/AppDialog";

const EditLecture: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const lessonId = Number(id || 0);
  const [searchParams] = useSearchParams();
  const courseIdFromQuery = searchParams.get("courseId");
  const chapterIdFromQuery = searchParams.get("chapterId");

  const [chapters, setChapters] = useState<{ id: number; name: string }[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    chapterIdFromQuery ?? null
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    courseIdFromQuery ?? null
  );

  // === All lesson fields ===
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"video" | "reading">("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [useEmbed, setUseEmbed] = useState(false);
  const [embedSrc, setEmbedSrc] = useState("");
  const [readingContent, setReadingContent] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [postDate, setPostDate] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  // Resource (file) states
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceUploading, setResourceUploading] = useState(false);
  const [resourceUrl, setResourceUrl] = useState<string | null>(null);
  const [resourceId, setResourceId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<DialogProps>({
    open: false,
    title: "",
    message: "",
  });

  const updateLesson = useLectureStore((s) => s.updateLesson);
  const deleteLesson = useLectureStore((s) => s.deleteLesson);
  const fetchLesson = useLectureStore((s) => s.fetchLesson);
  const getLessonResource = useLectureStore((s) => s.getLessonResource);
  const fetchChapter = useLectureStore((s) => s.fetchChapter);
  const fetchChapters = useLectureStore((s) => s.fetchChapters);
  const uploadResource = useLectureStore((s) => s.uploadResource);
  const createLessonResource = useLectureStore((s) => s.createLessonResource);
  const updateLessonResource = useLectureStore((s) => s.updateLessonResource);
  const deleteLessonResource = useLectureStore((s) => s.deleteLessonResource);

  const { quill, quillRef } = useQuill({
    theme: "snow",
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"],
      ],
    },
    placeholder:
      "Nhập nội dung tài liệu (có thể định dạng chữ, thêm ảnh, link...)",
  });

  // Sync quill -> state
  useEffect(() => {
    if (!quill) return;
    quill.on("text-change", () => {
      setReadingContent(quill.root.innerHTML);
    });
  }, [quill]);

  // When readingContent set from load, paste into quill
  useEffect(() => {
    if (quill && readingContent && readingContent !== quill.root.innerHTML) {
      quill.clipboard.dangerouslyPasteHTML(readingContent);
    }
  }, [readingContent, quill]);

  // === Load lesson data ===
  useEffect(() => {
    if (!lessonId) return;
    (async () => {
      try {
        const l = await fetchLesson(lessonId);
        if (!l) return;
        setTitle(l.name ?? "");
        setType(l.type?.toLowerCase() === "video" ? "video" : "reading");
        setVideoUrl(l.videoUrl ?? "");
        setReadingContent(l.readingContent ?? "");
        setDuration(l.duration ?? "");
        setDescription(l.description ?? "");
        setPostDate(
          l.postDate ? new Date(l.postDate).toISOString().slice(0, 10) : ""
        );
        setIsPreview(!!l.isPreview);

        if (l.resourceId) {
          setResourceId(l.resourceId);
          try {
            if (getLessonResource) {
              const res = await getLessonResource(l.resourceId);
              if (res) setResourceUrl(res.url ?? null);
            }
          } catch (err) {
            // ignore but log
            console.error("failed to fetch lesson resource", err);
          }
        }

        // initialize embed state if videoUrl looks like an embed
        if (l.videoUrl && typeof l.videoUrl === "string") {
          const v = l.videoUrl as string;
          const isEmbed =
            v.includes("youtube") || v.includes("vimeo") || v.includes("embed");
          if (isEmbed) {
            setUseEmbed(true);
            setEmbedSrc(v);
            setVideoUrl("");
          } else {
            setUseEmbed(false);
            setVideoUrl(v);
            setEmbedSrc("");
          }
        }

        // if lesson has chapter and no chapter selected from query, preselect it
        if (l.chapterId && !selectedChapterId && !chapterIdFromQuery) {
          setSelectedChapterId(String(l.chapterId));
        }

        // fetch chapters if needed
        if ((l.chapterId ?? 0) > 0 && !courseIdFromQuery) {
          const ch = await fetchChapter(l.chapterId);
          if (ch && ch.courseId) {
            const all = await fetchChapters(ch.courseId);
            setChapters((all || []).map((c) => ({ id: c.id, name: c.name })));
            if (!selectedChapterId) setSelectedChapterId(String(l.chapterId));
          }
        }
        if (selectedChapterId) {
          const ch = await fetchChapter(Number(selectedChapterId));
          if (ch && (ch as any).courseId) {
            setSelectedCourseId(String((ch as any).courseId));
          }
        }
      } catch (err) {
        console.error("Failed to load lesson:", err);
      }
    })();
  }, [
    lessonId,
    chapterIdFromQuery,
    selectedChapterId,
    courseIdFromQuery,
    fetchChapter,
    fetchChapters,
    fetchLesson,
    getLessonResource,
  ]);

  // === Fetch chapters when courseId is known ===
  useEffect(() => {
    const cid = courseIdFromQuery ? Number(courseIdFromQuery) : undefined;
    if (!cid) return;
    let mounted = true;
    (async () => {
      try {
        const ch = await fetchChapters(cid);
        if (!mounted) return;
        setChapters((ch || []).map((c) => ({ id: c.id, name: c.name })));
        if ((ch || []).length > 0 && !selectedChapterId) {
          if (chapterIdFromQuery) setSelectedChapterId(chapterIdFromQuery);
          else setSelectedChapterId(String((ch || [])[0].id));
        }
      } catch (err) {
        console.error("failed to load chapters", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [courseIdFromQuery, selectedChapterId, chapterIdFromQuery, fetchChapters]);

  // Upload resource (file) -> upload to storage then persist LessonResource row
  const handleUploadResource = async () => {
    if (!resourceFile) {
      setDialog({
        open: true,
        title: "Chưa chọn file",
        message: "Vui lòng chọn file trước khi tải lên.",
      });
      return;
    }
    setResourceUploading(true);
    try {
      const uploadRes = await uploadResource(resourceFile);
      const url = uploadRes as string;

      let createdOrUpdated = null;
      if (resourceId) {
        createdOrUpdated = await updateLessonResource(resourceId, { url });
      } else {
        createdOrUpdated = await createLessonResource({ url });
      }

      setResourceUrl(createdOrUpdated?.url ?? url);
      setResourceId(createdOrUpdated?.id ?? resourceId ?? null);
      setResourceFile(null);
      setDialog({
        open: true,
        title: "Thành công",
        message: "Tải lên tài nguyên thành công.",
      });
    } catch (err) {
      console.error("Upload resource failed", err);
      setDialog({
        open: true,
        title: "Thất bại",
        message: "Tải lên thất bại.",
      });
    } finally {
      setResourceUploading(false);
    }
  };

  const handleDeleteResource = async () => {
    if (resourceId) {
      try {
        if (deleteLessonResource) await deleteLessonResource(resourceId);
      } catch (err) {
        console.error("delete resource failed", err);
      }
    }
    setResourceUrl(null);
    setResourceId(null);
    setResourceFile(null);
  };

  // === Save (Update) ===
  const handleSave = async () => {
    // validate before save
    const errors: string[] = [];
    if (!selectedChapterId) errors.push("Vui lòng chọn chương cho bài giảng.");
    if (!title || !title.trim()) errors.push("Tiêu đề bài giảng là bắt buộc.");

    if (type === "video") {
      if (!useEmbed) {
        if (!videoUrl || !videoUrl.trim())
          errors.push("Vui lòng cung cấp URL video hoặc chọn Embed.");
        else {
          try {
            // quick URL validity
            new URL(videoUrl);
          } catch (e) {
            errors.push("URL video không hợp lệ.");
          }
        }
      } else {
        if (!embedSrc || !embedSrc.trim())
          errors.push("Vui lòng dán link nhúng (embed) hợp lệ.");
      }
    } else {
      const cleaned = (readingContent || "").replace(/<(.|\n)*?>/g, "").trim();
      if (!cleaned) errors.push("Nội dung đọc không được để trống.");
    }

    if (duration && Number.isNaN(Number(duration)))
      errors.push("Thời lượng phải là một số hợp lệ (phút).");

    if (postDate && isNaN(new Date(postDate).getTime()))
      errors.push("Ngày đăng không hợp lệ.");

    if (resourceFile) {
      const maxBytes = 50 * 1024 * 1024; // 50MB
      if (resourceFile.size > maxBytes)
        errors.push("Tài nguyên quá lớn. Kích thước tối đa 50MB.");
    }

    if (errors.length) {
      setDialog({
        open: true,
        title: "Thiếu hoặc sai thông tin",
        message: errors.join("\n"),
      });
      return;
    }

    setSaving(true);
    try {
      const dto = {
        name: title,
        chapterId: selectedChapterId ? Number(selectedChapterId) : 0,
        status: true,
        type: type === "video" ? "video" : "reading",
        videoUrl: type === "video" ? (useEmbed ? embedSrc : videoUrl) : null,
        readingContent: type !== "video" ? readingContent : null,
        duration,
        description,
        postDate: postDate ? new Date(postDate) : null,
        isPreview,
        ResourceId: resourceId ?? null,
      };

      const updated = await updateLesson(lessonId, dto);

      if (updated) {
        setDialog({
          open: true,
          title: "Thành công",
          message: "Cập nhật bài giảng thành công.",
          navigateTo: "/course/teacher/edit-course/" + selectedCourseId,
        });
      } else {
        setDialog({
          open: true,
          title: "Thất bại",
          message: "Cập nhật bài giảng thất bại.",
        });
      }
    } catch (err) {
      console.error("update lesson failed", err);
      setDialog({
        open: true,
        title: "Thất bại",
        message: "Cập nhật không thành công",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-6 h-full flex flex-col">
      {/* Breadcrumb */}
      <div className="text-sm text-[#525252] mb-3">
        Bài giảng / Chỉnh sửa bài giảng
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              navigate("/course/teacher/edit-course/" + selectedCourseId)
            }
            className="w-8 h-8 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 text-[#525252]" />
          </button>
          <div>
            <h1 className="text-2xl font-normal text-[#171717]">
              Chỉnh sửa bài giảng
            </h1>
            <p className="text-sm text-[#525252]">
              Chỉnh sửa thông tin và nội dung bài giảng
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() =>
              navigate("/course/teacher/edit-course/" + selectedCourseId)
            }
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setDialog({
                open: true,
                title: "Xóa bài giảng",
                message:
                  "Bạn có chắc muốn xóa bài giảng này? Hành động này không thể hoàn tác.",
                onConfirm: async () => {
                  try {
                    const res = deleteLesson
                      ? await deleteLesson(lessonId)
                      : false;
                    if (res) {
                      setDialog({
                        open: true,
                        title: "Thành công",
                        message: "Xóa bài giảng thành công.",
                        navigateTo: `/course/teacher/edit-course/${selectedCourseId}`,
                      });
                    } else {
                      setDialog({
                        open: true,
                        title: "Thất bại",
                        message: "Xóa bài giảng thất bại.",
                      });
                    }
                  } catch (err) {
                    console.error("xóa thất bại", err);
                    setDialog({
                      open: true,
                      title: "Thất bại",
                      message: "Xóa thất bại.",
                    });
                  }
                },
              });
            }}
          >
            Xóa
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu bài giảng"}
          </Button>
        </div>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-12 gap-4 overflow-y-auto flex-1 scrollbar-hide my-3">
        <div className="col-span-12 space-y-4">
          {/* Chapter & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <Label>Chương</Label>
              {chapters.length > 0 ? (
                <Select
                  value={selectedChapterId ?? undefined}
                  onValueChange={(v) => setSelectedChapterId(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn chương" />
                  </SelectTrigger>
                  <SelectContent>
                    {chapters.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-[#6b6b6b]">
                  Không tìm thấy chương nào cho khóa học này.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Label>Loại bài giảng</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn loại bài giảng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Bài giảng video</SelectItem>
                  <SelectItem value="reading">Bài giảng tài liệu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <Label>Tiêu đề bài giảng</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-4">
            <Label>Mô tả</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Duration & PostDate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <Label>Thời lượng (phút)</Label>
              <Input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <Label>Ngày đăng</Label>
              <Input
                type="date"
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
              />
            </div>
          </div>

          {/* Content / URL */}
          {type === "video" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Label>Video URL</Label>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    id="use-embed-edit"
                    type="checkbox"
                    checked={useEmbed}
                    onChange={(e) => setUseEmbed(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="use-embed-edit">Embed (iframe)</label>
                  <button
                    type="button"
                    onClick={() =>
                      setDialog({
                        open: true,
                        title: "Hướng dẫn lấy link nhúng YouTube",
                        message: (
                          <div className="space-y-2 text-sm">
                            <p>
                              📹 <strong>Các bước thực hiện:</strong>
                            </p>
                            <ol className="list-decimal ml-5">
                              <li>
                                <strong>Tải video lên YouTube</strong> - Đăng
                                nhập → Tạo → Tải video lên
                              </li>
                              <li>
                                <strong>Lấy mã nhúng (Embed)</strong> - Chia sẻ
                                → Nhúng → Sao chép{" "}
                                <code>&lt;iframe&gt;...&lt;/iframe&gt;</code>{" "}
                                hoặc URL:
                                <br />
                                <a
                                  href="https://www.youtube.com/embed/VIDEO_ID"
                                  target="_blank"
                                  className="text-blue-600 underline"
                                >
                                  https://www.youtube.com/embed/VIDEO_ID
                                </a>
                              </li>
                              <li>
                                <strong>Dán vào hệ thống</strong> - Quay lại
                                form → dán vào ô Embed
                              </li>
                            </ol>
                            <p className="italic text-gray-500">
                              💡 Gợi ý: Để video không công khai, đặt chế độ
                              “Không công khai (Unlisted)”.
                            </p>
                          </div>
                        ),
                      })
                    }
                    className="ml-2 text-gray-500 hover:text-gray-700"
                    aria-label="Hướng dẫn embed YouTube"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {!useEmbed ? (
                <Input
                  placeholder="https://example.com/video.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Dán link embed YouTube (vd: https://www.youtube.com/embed/...)"
                    value={embedSrc}
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = val.match(/src="([^"]+)"/);
                      setEmbedSrc(match ? match[1] : val);
                    }}
                  />

                  <div className="border rounded overflow-hidden mt-2">
                    {embedSrc ? (
                      <iframe
                        title="embed-preview"
                        src={embedSrc}
                        className="w-full aspect-video rounded-md border border-gray-200"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : (
                      <div className="p-3 text-sm text-gray-500">
                        Nhập link embed (ví dụ YouTube embed URL) để xem trước
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Label>Nội dung đọc</Label>
              <div
                ref={quillRef}
                className="bg-white rounded-md min-h-[250px] p-2"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-gray-800 font-medium text-sm">
                Tài nguyên (File đính kèm)
              </Label>

              <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
                {!resourceUrl ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <input
                      type="file"
                      accept="*"
                      onChange={(e) => {
                        const f = e.target.files && e.target.files[0];
                        if (f) setResourceFile(f);
                        else setResourceFile(null);
                      }}
                      className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />

                    <Button
                      onClick={handleUploadResource}
                      disabled={resourceUploading || !resourceFile}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4"
                    >
                      {resourceUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Đang
                          tải...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" /> Tải lên
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-gray-800">
                          Đã tải:
                        </span>{" "}
                        <a
                          href={resourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {resourceUrl}
                        </a>
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteResource}
                      className="flex items-center gap-1 text-rose-600 hover:text-rose-700"
                    >
                      <X className="w-4 h-4" /> Xóa
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <input
                id="isPreview"
                type="checkbox"
                checked={isPreview}
                onChange={(e) => setIsPreview(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="isPreview">Đánh dấu là bản xem trước</Label>
            </div>
          </div>
        </div>
      </div>
      <AppDialog dialog={dialog} setDialog={setDialog} />
    </div>
  );
};

export default EditLecture;
