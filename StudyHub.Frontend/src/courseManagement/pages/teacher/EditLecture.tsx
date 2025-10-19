import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { courseApi } from "@/courseManagement/services/courseService";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
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

  // === All lesson fields ===
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"video" | "document">("video");
  const [videoUrl, setVideoUrl] = useState("");
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

        // if lesson has chapter and no chapter selected from query, preselect it
        if (l.chapterId && !selectedChapterId && !chapterIdFromQuery) {
          setSelectedChapterId(String(l.chapterId));
        }

        // fetch chapters if needed
        if ((l.chapterId ?? 0) > 0 && !courseIdFromQuery) {
          try {
            const ch = await courseApi.getChapter(l.chapterId);
            if (ch && ch.courseId) {
              const all = await courseApi.getChapters(ch.courseId);
              setChapters(
                (all || []).map((c: any) => ({ id: c.id, name: c.name }))
              );
              if (!selectedChapterId) setSelectedChapterId(String(l.chapterId));
            }
          } catch {
            // ignore
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
        videoUrl: type === "video" ? videoUrl : null,
        readingContent: type !== "video" ? readingContent : null,
        duration,
        description,
        postDate: postDate ? new Date(postDate) : null,
        isPreview,
      };

      const updated = updateLesson
        ? await updateLesson(lessonId, dto)
        : await courseApi.updateLesson(lessonId, dto);
      if (updated) navigate(-1);
      else alert("Update failed");
    } catch (err) {
      console.error("update lesson failed", err);
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-[#525252] mb-3">
          Lectures / Edit Lecture
        </div>

        {/* Header */}
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
                Edit Lecture
              </h1>
              <p className="text-sm text-[#525252]">
                Modify lecture details and content
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!confirm("Delete this lecture? This cannot be undone."))
                  return;
                try {
                  const res = deleteLesson
                    ? await deleteLesson(lessonId)
                    : await courseApi.deleteLesson(lessonId);
                  if (res) navigate(-1);
                  else alert("Delete failed");
                } catch (err) {
                  console.error("delete failed", err);
                  alert("Delete failed");
                }
              }}
            >
              Delete
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {/* Chapter & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Label>Chapter</Label>
                {chapters.length > 0 ? (
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
                  <div className="text-sm text-[#6b6b6b]">
                    No chapters found for this course.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label>Lecture Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Lecture</SelectItem>
                    <SelectItem value="document">Reading Lecture</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <Label>Lecture Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            {/* Description */}
            <div className="space-y-4">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Duration & PostDate */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Label>Duration (minutes)</Label>
                <Input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <Label>Post Date</Label>
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
            <div className="flex items-center gap-2 mt-2">
              <input
                id="isPreview"
                type="checkbox"
                checked={isPreview}
                onChange={(e) => setIsPreview(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="isPreview">Mark as Preview</Label>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="col-span-12 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Lecture Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-[#404040]">
                <div className="flex justify-between">
                  <span>Views</span>
                  <span className="font-semibold">—</span>
                </div>
                <div className="flex items-center gap-2">
                  <input id="recording" type="checkbox" className="w-4 h-4" />
                  <label htmlFor="recording">Enable recording</label>
                </div>
                <div className="flex items-center gap-2">
                  <input id="notify" type="checkbox" className="w-4 h-4" />
                  <label htmlFor="notify">Send notifications</label>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default EditLecture;
