import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/common/components/ui/card";
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
import { courseApi } from "@/courseManagement/services/courseService";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";

const AddLecture: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get("type") || "video";
  const [type, setTypeState] = useState<string>(initialType);
  const [useEmbed, setUseEmbed] = useState(false);
  const [embedSrc, setEmbedSrc] = useState("");
  const courseIdFromQuery = searchParams.get("courseId");
  const chapterIdFromQuery = searchParams.get("chapterId");

  const [chapters, setChapters] = useState<{ id: number; name: string }[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    chapterIdFromQuery ?? null
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    courseIdFromQuery ?? null
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [readingContent, setReadingContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [postDate, setPostDate] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  const [saving, setSaving] = useState(false);

  const createLesson = useLectureStore((s: any) => s.createLesson);

  // Đồng bộ query param "type"
  useEffect(() => {
    const t = searchParams.get("type") || "video";
    if (t !== type) setTypeState(t);
  }, [searchParams, type]);

  // Lấy danh sách chapters
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
        console.error("Failed to load chapters", err);
      }
      if (selectedChapterId) {
        const ch = await courseApi.getChapter(Number(selectedChapterId));
        if (ch && (ch as any).courseId) {
          setSelectedCourseId(String((ch as any).courseId));
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [courseIdFromQuery, selectedChapterId, chapterIdFromQuery]);

  const setType = (t: string) => {
    setTypeState(t);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("type", t);
    setSearchParams(newParams);
  };

  // Hàm tạo lecture
  const handleCreate = async () => {
    if (!title) {
      alert("Vui lòng cung cấp tiêu đề cho bài giảng.");
      return;
    }
    if ((courseIdFromQuery || chapterIdFromQuery) && !selectedChapterId) {
      alert("Vui lòng chọn một chương cho bài giảng.");
      return;
    }

    setSaving(true);
    try {
      const dto: any = {
        name: title,
        chapterId: selectedChapterId ? Number(selectedChapterId) : 0,
        status: true,
        type: type === "video" ? "Video" : "Đọc",
        videoUrl: type === "video" ? (useEmbed ? embedSrc : videoUrl) : null,
        readingContent: type !== "video" ? readingContent : null,
        duration: duration || null,
        description: description || null,
        postDate: postDate ? new Date(postDate) : null,
        isPreview,
      };

      const created = createLesson
        ? await createLesson(dto)
        : await courseApi.createLesson(dto);

      if (created && created.id) {
        navigate(`/course/teacher/edit-course/${courseIdFromQuery}`);
      } else {
        alert("Tạo bài giảng thất bại");
      }
    } catch (err) {
      console.error("Create lecture failed", err);
      alert("Tạo bài giảng thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        <div className="text-sm text-[#525252] mb-3">
          Bài giảng / Thêm bài giảng
        </div>

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
                Thêm bài giảng mới
              </h1>
              <p className="text-sm text-[#525252]">
                Thêm thông tin chi tiết về bài giảng của bạn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() =>
                navigate("/course/teacher/edit-course/" + selectedCourseId)
              }
            >
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Đang tạo..." : "Tạo bài giảng"}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 space-y-4">
                {/* Chapter */}
                <div className="space-y-2">
                  <Label>Chương</Label>
                  {chapters.length ? (
                    <Select
                      value={selectedChapterId ?? undefined}
                      onValueChange={(v) => setSelectedChapterId(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn một chương" />
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
                    <p className="text-sm text-muted-foreground">
                      Không tìm thấy chương nào. Vui lòng tạo chương trước.
                    </p>
                  )}
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label>Loại bài giảng</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn loại bài giảng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Bài giảng video</SelectItem>
                      <SelectItem value="đọc">Tài liệu đọc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label>Tên bài giảng</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tên bài giảng"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Nhập mô tả"
                  />
                </div>

                {/* File Upload / Embed */}
                {type === "video" ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Label>Video URL</Label>
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          id="use-embed"
                          type="checkbox"
                          checked={useEmbed}
                          onChange={(e) => setUseEmbed(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label htmlFor="use-embed">Embed (iframe)</label>
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
                        <div className="border rounded overflow-hidden">
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
                              Nhập link embed (ví dụ YouTube embed URL) để xem
                              trước
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

                {/* Duration, Date, Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Thời gian (phút)</Label>
                    <Input
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ngày đăng</Label>
                    <Input
                      type="date"
                      value={postDate}
                      onChange={(e) => setPostDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Teacher Name + Preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      checked={isPreview}
                      onChange={(e) => setIsPreview(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label>Cho phép xem trước bài giảng</Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddLecture;
