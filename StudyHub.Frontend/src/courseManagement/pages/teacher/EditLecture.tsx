import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { courseApi } from "@/courseManagement/services/courseService";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
// card components not used in this file
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
import { ArrowLeft } from "lucide-react";

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
  const [type, setType] = useState<"video" | "document">("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [useEmbed, setUseEmbed] = useState(false);
  const [embedSrc, setEmbedSrc] = useState("");
  const [readingContent, setReadingContent] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [postDate, setPostDate] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  const [saving, setSaving] = useState(false);

  const updateLesson = useLectureStore((s: any) => s.updateLesson);
  const deleteLesson = useLectureStore((s: any) => s.deleteLesson);

  // === Load lesson data ===
  useEffect(() => {
    if (!lessonId) return;
    (async () => {
      try {
        const l = await courseApi.getLesson(lessonId);
        if (!l) return;

        setTitle(l.name ?? "");
        setType(l.type?.toLowerCase() === "video" ? "video" : "document");
        setVideoUrl(l.videoUrl ?? "");
        setReadingContent(l.readingContent ?? "");
        setDuration(l.duration ?? "");
        setDescription(l.description ?? "");
        setPostDate(
          l.postDate ? new Date(l.postDate).toISOString().slice(0, 10) : ""
        );
        setIsPreview(!!l.isPreview);

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
          const ch = await courseApi.getChapter(l.chapterId);
          if (ch && ch.courseId) {
            const all = await courseApi.getChapters(ch.courseId);
            setChapters(
              (all || []).map((c: any) => ({ id: c.id, name: c.name }))
            );
            if (!selectedChapterId) setSelectedChapterId(String(l.chapterId));
          }
        }
        if (selectedChapterId) {
          const ch = await courseApi.getChapter(Number(selectedChapterId));
          if (ch && (ch as any).courseId) {
            setSelectedCourseId(String((ch as any).courseId));
          }
        }
      } catch (err) {
        console.error("Failed to load lesson:", err);
      }
    })();
  }, [lessonId, chapterIdFromQuery, selectedChapterId, courseIdFromQuery]);

  // === Fetch chapters when courseId is known ===
  useEffect(() => {
    const cid = courseIdFromQuery ? Number(courseIdFromQuery) : undefined;
    if (!cid) return;
    let mounted = true;
    (async () => {
      try {
        const ch = await courseApi.getChapters(cid);
        if (!mounted) return;
        setChapters((ch || []).map((c: any) => ({ id: c.id, name: c.name })));
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
  }, [courseIdFromQuery, selectedChapterId, chapterIdFromQuery]);

  // === Save (Update) ===
  const handleSave = async () => {
    setSaving(true);
    try {
      const dto = {
        name: title,
        chapterId: selectedChapterId ? Number(selectedChapterId) : 0,
        status: true,
        type: type === "video" ? "Video" : "Document",
        videoUrl: type === "video" ? (useEmbed ? embedSrc : videoUrl) : null,
        readingContent: type !== "video" ? readingContent : null,
        duration,
        description,
        postDate: postDate ? new Date(postDate) : null,
        isPreview,
      };

      const updated = updateLesson
        ? await updateLesson(lessonId, dto)
        : await courseApi.updateLesson(lessonId, dto);
      if (updated) navigate("/course/teacher/edit-course/" + selectedCourseId);
      else alert("Cập nhật không thành công");
    } catch (err) {
      console.error("update lesson failed", err);
      alert("Cập nhật không thành công");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
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
              onClick={async () => {
                if (
                  !confirm(
                    "Xóa bài giảng này? Hành động này không thể hoàn tác."
                  )
                )
                  return;
                try {
                  const res = deleteLesson
                    ? await deleteLesson(lessonId)
                    : await courseApi.deleteLesson(lessonId);
                  if (res)
                    navigate("/course/teacher/edit-course/" + selectedCourseId);
                  else alert("Xóa thất bại");
                } catch (err) {
                  console.error("xóa thất bại", err);
                  alert("Xóa thất bại");
                }
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
        <div className="grid grid-cols-12 gap-4">
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
                    <SelectItem value="document">Bài giảng tài liệu</SelectItem>
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
                <Textarea
                  value={readingContent}
                  onChange={(e) => setReadingContent(e.target.value)}
                  rows={6}
                />
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
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
    </div>
  );
};

export default EditLecture;
