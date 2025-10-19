import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
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
import { ArrowLeft, Video } from "lucide-react";
import { courseApi } from "@/courseManagement/services/courseService";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";

const AddLecture: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get("type") || "video";
  const [type, setTypeState] = useState<string>(initialType);
  const courseIdFromQuery = searchParams.get("courseId");
  const chapterIdFromQuery = searchParams.get("chapterId");

  const [chapters, setChapters] = useState<{ id: number; name: string }[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    chapterIdFromQuery ?? null
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
  }, [searchParams]);

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
      alert("Please provide a lecture title");
      return;
    }
    if ((courseIdFromQuery || chapterIdFromQuery) && !selectedChapterId) {
      alert("Please select a chapter");
      return;
    }

    setSaving(true);
    try {
      const dto: any = {
        name: title,
        chapterId: selectedChapterId ? Number(selectedChapterId) : 0,
        status: true,
        type: type === "video" ? "Video" : "Đọc",
        videoUrl: type === "video" ? videoUrl : null,
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
        alert("Failed to create lecture");
      }
    } catch (err) {
      console.error("Create lecture failed", err);
      alert("Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        <div className="text-sm text-[#525252] mb-3">
          Lectures / Add Lecture
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 text-[#525252]" />
            </button>

            <div>
              <h1 className="text-2xl font-normal text-[#171717]">
                Add Lecture
              </h1>
              <p className="text-sm text-[#525252]">
                Add detailed information about your lecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "Create Lecture"}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 space-y-4">
                {/* Chapter */}
                <div className="space-y-2">
                  <Label>Chapter</Label>
                  {chapters.length ? (
                    <Select
                      value={selectedChapterId ?? undefined}
                      onValueChange={(v) => setSelectedChapterId(v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a chapter" />
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
                      No chapters found.
                    </p>
                  )}
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label>Lecture Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Lecture</SelectItem>
                      <SelectItem value="đọc">Reading Material</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label>Lecture Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter lecture title"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Enter description"
                  />
                </div>

                {/* File Upload */}
                {type === "video" ? (
                  <div className="space-y-4">
                    <Label>Video URL</Label>
                    <Input
                      placeholder="https://example.com/video.mp4"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Label>Reading Content</Label>
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
                    <Label>Duration (minutes)</Label>
                    <Input
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Post Date</Label>
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
                    <Label>Make this lecture previewable</Label>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <aside className="col-span-12 lg:col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-28 bg-[#FAFAFA] rounded flex items-center justify-center text-sm text-[#666]">
                      <Video className="w-6 h-6 text-[#666]" />
                    </div>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddLecture;
