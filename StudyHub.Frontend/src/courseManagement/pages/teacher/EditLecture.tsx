import React, { useEffect, useState, useRef } from "react";
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
import { Checkbox } from "@/common/components/ui/checkbox";
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
  const [chapterPostDate, setChapterPostDate] = useState<string | null>(null);
  const [chapterLessons, setChapterLessons] = useState<any[]>([]);
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

  // Interactive questions metadata (local only until saved to backend)
  const [interactiveQuestions, setInteractiveQuestions] = useState<
    Array<{
      id: string;
      timeSec: number;
      timeLabel: string;
      question: string;
      type: "mc" | "text";
      options?: string[];
      correctIndex?: number | null;
      correctAnswer?: string | null;
    }>
  >([]);
  const [editingQuestionInitial, setEditingQuestionInitial] = useState<
    any | null
  >(null);

  // Resource (file) states
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceUploading, setResourceUploading] = useState(false);
  const [resourceUrl, setResourceUrl] = useState<string | null>(null);
  const [resourceId, setResourceId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  const fetchInteractiveQuestions = useLectureStore(
    (s) => s.fetchInteractiveQuestions
  );
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
          try {
            const ch = await fetchChapter(Number(selectedChapterId));
            if (ch) {
              const post =
                (ch as any).postDate || (ch as any).createdAt || null;
              setChapterPostDate(post ? String(post) : null);
              const lessons =
                (ch as any).lessons ||
                (ch as any).lectures ||
                (ch as any).items ||
                [];
              setChapterLessons(Array.isArray(lessons) ? lessons : []);
              if ((ch as any).courseId) {
                setSelectedCourseId(String((ch as any).courseId));
              }
            }
          } catch (err) {
            console.error("failed to load chapter", err);
          }
        }
        // load interactive questions for the lesson (prefer explicit endpoint)
        try {
          if (fetchInteractiveQuestions) {
            const remote = await fetchInteractiveQuestions(lessonId);
            if (Array.isArray(remote) && remote.length > 0) {
              const mapped = remote.map((q: any) => ({
                id: q.id
                  ? String(q.id)
                  : `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                timeSec:
                  typeof q.timeSec === "number"
                    ? q.timeSec
                    : Number(q.timeSec) || 0,
                timeLabel: (() => {
                  const s =
                    typeof q.timeSec === "number"
                      ? q.timeSec
                      : Number(q.timeSec) || 0;
                  const m = Math.floor(s / 60);
                  const sec = Math.floor(s % 60);
                  return `${m}:${sec.toString().padStart(2, "0")}`;
                })(),
                question: q.question ?? q.text ?? "",
                type:
                  q.type === "text" || q.type === "mc"
                    ? q.type
                    : q.type && String(q.type).toLowerCase().includes("text")
                    ? "text"
                    : "mc",
                options: Array.isArray(q.options)
                  ? q.options
                  : q.options
                  ? JSON.parse(JSON.stringify(q.options))
                  : undefined,
                correctIndex:
                  typeof q.correctIndex === "number" ? q.correctIndex : null,
                correctAnswer: q.correctAnswer ?? null,
              }));
              setInteractiveQuestions(mapped);
            } else {
              // fallback: try to read from lesson DTO if endpoint returned nothing
              const iq =
                (l as any).interactiveQuestions ||
                (l as any).interactiveQuestionsDto ||
                null;
              if (Array.isArray(iq)) {
                const mapped = iq.map((q: any) => ({
                  id: q.id
                    ? String(q.id)
                    : `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  timeSec:
                    typeof q.timeSec === "number"
                      ? q.timeSec
                      : Number(q.timeSec) || 0,
                  timeLabel: (() => {
                    const s =
                      typeof q.timeSec === "number"
                        ? q.timeSec
                        : Number(q.timeSec) || 0;
                    const m = Math.floor(s / 60);
                    const sec = Math.floor(s % 60);
                    return `${m}:${sec.toString().padStart(2, "0")}`;
                  })(),
                  question: q.question ?? q.text ?? "",
                  type:
                    q.type === "text" || q.type === "mc"
                      ? q.type
                      : q.type && String(q.type).toLowerCase().includes("text")
                      ? "text"
                      : "mc",
                  options: Array.isArray(q.options)
                    ? q.options
                    : q.options
                    ? JSON.parse(JSON.stringify(q.options))
                    : undefined,
                  correctIndex:
                    typeof q.correctIndex === "number" ? q.correctIndex : null,
                  correctAnswer: q.correctAnswer ?? null,
                }));
                setInteractiveQuestions(mapped);
              }
            }
          }
        } catch (err) {
          // non-fatal
          console.warn("failed to load interactive questions", err);
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
    // Prevent uploading a file with the same filename as an existing lesson resource in this chapter
    if (resourceFile && chapterLessons && chapterLessons.length > 0) {
      const fname = resourceFile.name.trim().toLowerCase();
      const existingNames = chapterLessons
        .map((l: any) => {
          const url =
            (l &&
              (l.resourceUrl ||
                l.resource?.url ||
                l.resourceUrlPath ||
                l.fileUrl)) ||
            null;
          if (!url) return null;
          try {
            const u = String(url);
            const parts = u.split("/");
            return parts[parts.length - 1].split("?")[0].toLowerCase();
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean) as string[];
      if (existingNames.some((n) => n === fname)) {
        setDialog({
          open: true,
          title: "Tệp trùng lặp",
          message:
            "Tệp tải lên có tên trùng với tệp đã tồn tại trong chương. Vui lòng đổi tên file trước khi tải lên.",
        });
        return;
      }
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

  // helper: parse mm:ss or seconds to seconds (used by inline editor)
  const parseTimeToSeconds = (s: string) => {
    if (!s) return NaN;
    const t = s.trim();
    if (/^\d+:\d{2}$/.test(t)) {
      const [m, sec] = t.split(":");
      return Number(m) * 60 + Number(sec);
    }
    if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
    return NaN;
  };

  // Small inline editor component to create an interactive question (same UI as AddLecture)
  const InteractiveQuestionEditor: React.FC<{
    onAdd: (q: any) => void;
    onUpdate?: (q: any) => void;
    initial?: any | null;
    onCancel?: () => void;
  }> = ({ onAdd, onUpdate, initial = null, onCancel }) => {
    const [timeLabel, setTimeLabel] = useState("0:00");
    const [questionText, setQuestionText] = useState("");
    const [qtype, setQtype] = useState<"mc" | "text">("mc");
    const [options, setOptions] = useState<string[]>(["", ""]);
    const [correctIndex, setCorrectIndex] = useState<number | null>(0);
    const [correctAnswer, setCorrectAnswer] = useState<string>("");

    const reset = () => {
      setTimeLabel("0:00");
      setQuestionText("");
      setQtype("mc");
      setOptions(["", ""]);
      setCorrectIndex(0);
      setCorrectAnswer("");
      // notify parent that editing finished if provided
      if (onCancel) onCancel();
    };

    // initialize editor when initial prop changes (for editing existing question)
    useEffect(() => {
      if (!initial) return;
      try {
        setTimeLabel(
          initial.timeLabel ??
            ((): any => {
              const s = Number(initial.timeSec) || 0;
              const m = Math.floor(s / 60);
              const sec = Math.floor(s % 60);
              return `${m}:${sec.toString().padStart(2, "0")}`;
            })()
        );
        setQuestionText(initial.question ?? "");
        setQtype(initial.type ?? "mc");
        setOptions(
          initial.options && Array.isArray(initial.options)
            ? initial.options.slice()
            : ["", ""]
        );
        setCorrectIndex(
          typeof initial.correctIndex === "number" ? initial.correctIndex : 0
        );
        setCorrectAnswer(initial.correctAnswer ?? "");
      } catch (err) {
        // ignore
      }
    }, [initial]);

    const doAdd = () => {
      const sec = parseTimeToSeconds(timeLabel);
      if (Number.isNaN(sec) || sec < 0) {
        setDialog({
          open: true,
          title: "Lỗi thời gian",
          message: "Thời gian không hợp lệ. Dùng mm:ss hoặc số giây.",
        });
        return;
      }
      if (!questionText.trim()) {
        setDialog({
          open: true,
          title: "Lỗi câu hỏi",
          message: "Nội dung câu hỏi không thể để trống.",
        });
        return;
      }
      if (qtype === "mc") {
        const cleaned = options.map((o) => (o || "").trim()).filter(Boolean);
        if (cleaned.length < 2) {
          setDialog({
            open: true,
            title: "Lỗi lựa chọn",
            message: "Câu hỏi nhiều lựa chọn cần ít nhất 2 phương án.",
          });
          return;
        }
      }

      const newQ = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timeSec: sec,
        timeLabel,
        question: questionText,
        type: qtype,
        options:
          qtype === "mc"
            ? options.map((o) => o.trim()).filter(Boolean)
            : undefined,
        correctIndex:
          qtype === "mc"
            ? typeof correctIndex === "number"
              ? correctIndex
              : null
            : null,
        correctAnswer:
          qtype === "text"
            ? correctAnswer
              ? correctAnswer.trim()
              : null
            : null,
      };

      // if we are editing an existing question, preserve its id and call onUpdate
      if (initial && initial.id) {
        const updated = { ...newQ, id: initial.id };
        if (onUpdate) onUpdate(updated);
        reset();
        return;
      }

      onAdd(newQ);
      reset();
    };

    return (
      <div className="border rounded p-3 bg-white">
        <div className="grid grid-cols-12 gap-2 items-start">
          <div className="col-span-2">
            <Input
              value={timeLabel}
              onChange={(e) => setTimeLabel(e.target.value)}
              placeholder="mm:ss hoặc giây"
            />
          </div>
          <div className="col-span-6">
            <Input
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Nội dung câu hỏi"
            />
            <div className="flex items-center gap-2 mt-2 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="qtype"
                  checked={qtype === "mc"}
                  onChange={() => setQtype("mc")}
                />{" "}
                MC
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="qtype"
                  checked={qtype === "text"}
                  onChange={() => setQtype("text")}
                />{" "}
                Text
              </label>
            </div>
          </div>
          <div className="col-span-4 flex items-center gap-2 justify-end">
            <Button onClick={doAdd}>
              {initial ? "Lưu thay đổi" : "Thêm câu hỏi"}
            </Button>
            {initial && (
              <Button
                variant="ghost"
                onClick={() => {
                  reset();
                  if (onCancel) onCancel();
                }}
              >
                Hủy
              </Button>
            )}
          </div>

          {qtype === "mc" && (
            <div className="col-span-12 mt-3">
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={correctIndex === idx}
                      onChange={() => setCorrectIndex(idx)}
                    />
                    <Input
                      value={opt}
                      onChange={(e) =>
                        setOptions((s) =>
                          s.map((v, i) => (i === idx ? e.target.value : v))
                        )
                      }
                      placeholder={`Lựa chọn ${idx + 1}`}
                    />
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setOptions((s) => s.filter((_, i) => i !== idx))
                      }
                    >
                      Xóa
                    </Button>
                  </div>
                ))}
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOptions((s) => [...s, ""])}
                  >
                    Thêm lựa chọn
                  </Button>
                </div>
              </div>
            </div>
          )}

          {qtype === "text" && (
            <div className="col-span-12 mt-3">
              <div className="space-y-2">
                <Label>Đáp án mong đợi (tùy chọn)</Label>
                <Input
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Nhập đáp án đúng (so sánh text)"
                />
                <div className="text-xs text-gray-500">
                  Nếu để trống, câu hỏi text sẽ không có đáp án mong đợi.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
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

    // Duration positive
    if (duration && !Number.isNaN(Number(duration)) && Number(duration) <= 0) {
      errors.push("Thời lượng phải là số dương (lớn hơn 0).");
    }

    // If chapter has a postDate, lecture postDate cannot be earlier
    if (postDate && chapterPostDate) {
      const lec = new Date(postDate);
      const chd = new Date(chapterPostDate);
      if (!isNaN(lec.getTime()) && !isNaN(chd.getTime())) {
        if (lec.getTime() < chd.getTime()) {
          errors.push(
            "Ngày đăng bài giảng không thể nhỏ hơn ngày bắt đầu của chương."
          );
        }
      }
    }

    // Validate embed/url for video
    if (type === "video") {
      if (useEmbed && embedSrc && embedSrc.trim()) {
        const trimmed = embedSrc.trim();
        if (trimmed.startsWith("<iframe")) {
          const m = trimmed.match(/src=["']([^"']+)["']/);
          if (!m || !m[1])
            errors.push("Embed iframe không có thuộc tính src hợp lệ.");
          else {
            try {
              new URL(m[1]);
            } catch (e) {
              errors.push("URL trong iframe embed không hợp lệ.");
            }
          }
        } else {
          try {
            new URL(trimmed);
          } catch (e) {
            errors.push("Link embed không phải URL hợp lệ.");
          }
        }
      }
    }

    if (resourceFile) {
      const maxBytes = 50 * 1024 * 1024; // 50MB
      if (resourceFile.size > maxBytes)
        errors.push("Tài nguyên quá lớn. Kích thước tối đa 50MB.");
    }

    // Title uniqueness within chapter (exclude current lesson)
    if (title && chapterLessons && chapterLessons.length > 0) {
      const tnorm = title.trim().toLowerCase();
      const dup = chapterLessons.some((l: any) => {
        const lid = Number((l && (l.id || l.lessonId || l.lectureId)) || 0);
        if (lid && lid === lessonId) return false; // ignore self
        const name =
          (l && (l.name || l.title || l.nameText || l.titleText)) || "";
        return String(name).trim().toLowerCase() === tnorm;
      });
      if (dup)
        errors.push(
          "Tiêu đề bài giảng trùng với một bài giảng đã tồn tại trong chương."
        );
    }

    // Resource file duplication check
    if (resourceFile && chapterLessons && chapterLessons.length > 0) {
      const fname = resourceFile.name.trim().toLowerCase();
      const existingNames = chapterLessons
        .map((l: any) => {
          const url =
            (l &&
              (l.resourceUrl ||
                l.resource?.url ||
                l.resourceUrlPath ||
                l.fileUrl)) ||
            null;
          if (!url) return null;
          try {
            const u = String(url);
            const parts = u.split("/");
            return parts[parts.length - 1].split("?")[0].toLowerCase();
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean) as string[];
      if (existingNames.some((n) => n === fname)) {
        errors.push(
          "Tệp tải lên có tên trùng với tệp đã tồn tại trong chương. Vui lòng đổi tên file trước khi tải lên."
        );
      }
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
        // include interactive questions when saving
        interactiveQuestions:
          interactiveQuestions && interactiveQuestions.length
            ? interactiveQuestions.map((q) => ({
                timeSec: q.timeSec,
                question: q.question,
                type: q.type,
                options: q.options ?? null,
                correctIndex:
                  typeof q.correctIndex === "number" ? q.correctIndex : null,
                correctAnswer: q.correctAnswer ?? null,
              }))
            : null,
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
          <Button
            variant="ghost"
            onClick={() =>
              navigate("/course/teacher/edit-course/" + selectedCourseId)
            }
            className="w-8 h-8 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50 p-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#525252]" />
          </Button>
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
                  <Checkbox
                    checked={useEmbed}
                    onCheckedChange={(v) => setUseEmbed(!!v)}
                  />
                  <span>Embed (iframe)</span>
                  <Button
                    variant="ghost"
                    className="ml-2 text-gray-500 hover:text-gray-700 p-0"
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
                                <code>&lt;iframe&gt;...&lt;/iframe&gt;</code>
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
                    aria-label="Hướng dẫn embed YouTube"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </Button>
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
                  {/* Interactive questions editor moved here (below video preview) */}
                  <div className="space-y-2 pt-4">
                    <div className="flex items-center justify-between">
                      <Label> Câu hỏi tương tác (Interactive questions)</Label>
                      <div className="text-sm text-gray-500">
                        Hiển thị trên video tại thời điểm
                      </div>
                    </div>

                    <div className="space-y-2">
                      {interactiveQuestions.length === 0 ? (
                        <div className="text-sm text-gray-500">
                          Chưa có câu hỏi tương tác.
                        </div>
                      ) : (
                        interactiveQuestions.map((q) => (
                          <div
                            key={q.id}
                            className="flex items-start gap-3 bg-white border rounded p-3"
                          >
                            <div className="w-28 text-sm font-mono text-gray-700">
                              {q.timeLabel}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                {q.question}
                              </div>
                              <div className="text-xs text-gray-500">
                                {q.type === "mc"
                                  ? `MC — ${q.options?.length ?? 0} lựa chọn`
                                  : `Text${
                                      q.correctAnswer
                                        ? ` — đáp án: ${q.correctAnswer}`
                                        : ""
                                    }`}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingQuestionInitial(q);
                                }}
                              >
                                Sửa
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setInteractiveQuestions((prev) =>
                                    prev.filter((x) => x.id !== q.id)
                                  )
                                }
                              >
                                Xóa
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <InteractiveQuestionEditor
                      initial={editingQuestionInitial}
                      onAdd={(newQ) =>
                        setInteractiveQuestions((prev) => [...prev, newQ])
                      }
                      onUpdate={(updated) => {
                        setInteractiveQuestions((prev) =>
                          prev.map((p) => (p.id === updated.id ? updated : p))
                        );
                        setEditingQuestionInitial(null);
                      }}
                      onCancel={() => setEditingQuestionInitial(null)}
                    />
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
                      ref={fileInputRef}
                      type="file"
                      accept="*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files && e.target.files[0];
                        if (f) setResourceFile(f);
                        else setResourceFile(null);
                      }}
                    />

                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4"
                    >
                      Chọn tệp
                    </Button>

                    <div className="flex-1 text-sm text-gray-700 break-words">
                      {resourceFile ? resourceFile.name : "Chưa chọn tệp"}
                    </div>

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
                          {resourceUrl.split("/").pop()}
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
              <Checkbox
                checked={isPreview}
                onCheckedChange={(v) => setIsPreview(!!v)}
              />
              <Label>Đánh dấu là bản xem trước</Label>
            </div>
          </div>
        </div>
      </div>
      <AppDialog dialog={dialog} setDialog={setDialog} />
    </div>
  );

  // Interactive questions editor UI in the form will use the state below
};

export default EditLecture;
