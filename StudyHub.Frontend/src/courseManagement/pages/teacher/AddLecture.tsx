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
import { ArrowLeft, Loader2, Upload, X, HelpCircle } from "lucide-react";
import { courseApi } from "@/courseManagement/services/courseService";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";
import { AppDialog } from "@/courseManagement/components/AppDialog";
import type { DialogProps } from "@/courseManagement/components/AppDialog";
import type { Exam, Question } from "@/courseManagement/interfaces/types";
import { EXAM_TYPE } from "@/courseManagement/constants/ExamType";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import QuestionTemplate from "@/exam/components/QuestionTemplate";

const AddLecture: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = searchParams.get("type") || "video";
  const [type, setTypeState] = useState<string>(initialType);
  const [useEmbed] = useState(true);
  const [embedSrc, setEmbedSrc] = useState("");
  const courseIdFromQuery = searchParams.get("courseId");
  const chapterIdFromQuery = searchParams.get("chapterId");
  const [chapters, setChapters] = useState<{ id: number; name: string }[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    chapterIdFromQuery ?? null
  );
  // chapterInfo not required directly; we keep postDate and lessons
  const [chapterPostDate, setChapterPostDate] = useState<string | null>(null);
  const [chapterLessons, setChapterLessons] = useState<any[]>([]);
  const [courseEndDate, setCourseEndDate] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    courseIdFromQuery ?? null
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [readingContent, setReadingContent] = useState("");
  const [duration, setDuration] = useState("");
  const [postDate, setPostDate] = useState("");
  // Interactive questions metadata (local only until saved to backend)
  const [interactiveQuestions, setInteractiveQuestions] = useState<
    Array<{
      id: string; // temporary client id
      timeSec: number; // seconds
      timeLabel: string; // user input like 01:23
      question: string;
      type: "mc" | "text";
      options?: string[]; // for mc
      correctIndex?: number | null;
      correctAnswer?: string | null; // expected answer for text questions
    }>
  >([]);
  const [isPreview, setIsPreview] = useState(false);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceUploading, setResourceUploading] = useState(false);
  const [resourceUrl, setResourceUrl] = useState<string | null>(null);
  const [resourceId, setResourceId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);

  const [dialog, setDialog] = useState<DialogProps>({
    open: false,
    title: "",
    message: "",
  });
  const createLesson = useLectureStore((s: any) => s.createLesson);

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

  // Đồng bộ dữ liệu giữa Quill và state
  useEffect(() => {
    if (!quill) return;
    quill.on("text-change", () => {
      setReadingContent(quill.root.innerHTML);
    });
  }, [quill]);

  // Khi thay đổi state từ bên ngoài (ví dụ load lại)
  useEffect(() => {
    if (quill && readingContent && readingContent !== quill.root.innerHTML) {
      quill.clipboard.dangerouslyPasteHTML(readingContent);
    }
  }, [readingContent, quill]);

  useEffect(() => {
    const t = searchParams.get("type") || "video";
    if (t !== type) setTypeState(t);
  }, [searchParams, type]);

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
        try {
          const ch = await courseApi.getChapter(Number(selectedChapterId));
          if (ch) {
            // try to read postDate and lessons in a few common shapes
            const post = (ch as any).postDate || (ch as any).createdAt || null;
            setChapterPostDate(post ? String(post) : null);
            // lessons may be called lessons, lectures or items depending on API
            const lessons =
              (ch as any).lessons ||
              (ch as any).lectures ||
              (ch as any).items ||
              [];
            setChapterLessons(Array.isArray(lessons) ? lessons : []);
            if ((ch as any).courseId) {
              setSelectedCourseId(String((ch as any).courseId));
              // fetch course end date
              try {
                const course = await courseApi.getCourseById(
                  Number((ch as any).courseId)
                );
                if (course) setCourseEndDate(course.endAt ?? null);
              } catch (err) {
                console.warn("Failed to load course for end date", err);
              }
            }
          }
        } catch (err) {
          console.error("Failed to load chapter", err);
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

  // Validate lecture fields before create
  const validateLectureForm = () => {
    const errors: string[] = [];

    if (!selectedChapterId) errors.push("Vui lòng chọn chương cho bài giảng.");
    if (!title || !title.trim()) errors.push("Tiêu đề bài giảng là bắt buộc.");

    if (type === "video") {
      // default to embed iframe for videos
      if (!embedSrc || !embedSrc.trim())
        errors.push("Vui lòng dán link nhúng (embed) hợp lệ.");
      else {
        // allow raw iframe tags or plain URLs
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
    } else if (type === "reading") {
      // reading
      const cleaned = (readingContent || "").replace(/<(.|\n)*?>/g, "").trim();
      if (!cleaned) errors.push("Nội dung đọc không được bỏ trống.");
    } else {
      if (!duration) {
        errors.push("Với loại bài giảng kiểm tra thì thời gian là bắt buộc!");
      }

      if (questions.length === 0) {
        errors.push(
          "Vui lòng điền đầy đủ thông tin và thêm ít nhất một câu hỏi."
        );
      }

      for (const q of questions) {
        if (!q.questionText.trim()) {
          errors.push("Vui lòng nhập nội dung cho tất cả các câu hỏi.");
        }
        if (
          q.type === EXAM_TYPE.SINGLE_CHOICE ||
          q.type === EXAM_TYPE.MULTI_CHOICE
        ) {
          if (q.options.some((opt) => !String(opt).trim())) {
            errors.push(
              `Vui lòng nhập nội dung cho tất cả các lựa chọn hoặc xóa lựa chọn trống cho câu hỏi "${q.questionText}".`
            );
          }
        }

        if (q.type === EXAM_TYPE.SINGLE_CHOICE) {
          if (!String(q.correctAnswer).trim()) {
            errors.push(
              `Vui lòng chọn đáp án đúng cho câu hỏi "${q.questionText}".`
            );
          }
        } else if (q.type === EXAM_TYPE.MULTI_CHOICE) {
          if (
            !Array.isArray(q.correctAnswer) ||
            q.correctAnswer.length === 0 ||
            q.correctAnswer.some((ans) => !String(ans).trim())
          ) {
            errors.push(
              `Vui lòng chọn ít nhất một đáp án đúng cho câu hỏi "${q.questionText}".`
            );
          }
        } else if (q.type === EXAM_TYPE.TEXT_INPUT) {
          if (!String(q.correctAnswer).trim()) {
            errors.push(
              `Vui lòng nhập đáp án đúng cho câu hỏi "${q.questionText}".`
            );
          }
        } else if (q.type === EXAM_TYPE.FILL_IN_BLANK) {
          const expectedBlanks = (
            q.questionText.match(
              new RegExp(
                // eslint-disable-next-line no-useless-escape
                "[BLANK]".replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
                "g"
              )
            ) || []
          ).length;
          if (expectedBlanks === 0) {
            errors.push(
              `Câu hỏi điền khuyết "${q.questionText}" phải chứa ít nhất một placeholder '[BLANK]'.`
            );
          }
          if (
            !Array.isArray(q.correctAnswer) ||
            q.correctAnswer.length !== expectedBlanks ||
            q.correctAnswer.some((ans) => !String(ans).trim())
          ) {
            errors.push(
              `Vui lòng nhập đầy đủ ${expectedBlanks} đáp án đúng cho câu hỏi điền khuyết "${q.questionText}".`
            );
          }
        } else if (q.type === EXAM_TYPE.MATCHING) {
          if (
            !q.terms ||
            q.terms.length === 0 ||
            q.terms.some((term) => !String(term).trim())
          ) {
            errors.push(
              `Vui lòng nhập đầy đủ các thuật ngữ cho câu hỏi ghép đôi "${q.questionText}".`
            );
          }
          if (
            !q.definitions ||
            q.definitions.length === 0 ||
            q.definitions.some((def) => !String(def).trim())
          ) {
            errors.push(
              `Vui lòng nhập đầy đủ các định nghĩa cho câu hỏi ghép đôi "${q.questionText}".`
            );
          }
          if (q.terms?.length !== q.definitions?.length) {
            errors.push(
              `Số lượng thuật ngữ và định nghĩa phải bằng nhau cho câu hỏi "${q.questionText}".`
            );
          }
        }
      }
    }

    if (duration && Number.isNaN(Number(duration))) {
      errors.push("Thời lượng phải là một số hợp lệ (phút).");
    } else if (duration && Number(duration) <= 0) {
      errors.push("Thời lượng phải là số dương (lớn hơn 0).");
    }

    // Post date validity
    if (postDate && isNaN(new Date(postDate).getTime())) {
      errors.push("Ngày đăng không hợp lệ.");
    }

    // If chapter has a postDate, the lecture postDate (if provided) cannot be earlier
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

    // If course end date is known, lecture postDate must not be after course end
    if (postDate && courseEndDate) {
      const lec = new Date(postDate);
      const ced = new Date(courseEndDate);
      if (!isNaN(lec.getTime()) && !isNaN(ced.getTime())) {
        if (lec.getTime() > ced.getTime()) {
          errors.push(
            "Ngày đăng bài giảng phải nhỏ hơn hoặc bằng ngày kết thúc khóa học."
          );
        }
      }
    }

    // Validate embedSrc or videoUrl more strictly
    if (type === "video") {
      if (useEmbed && embedSrc && embedSrc.trim()) {
        // allow raw iframe tags or plain URLs
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

    // resource size limit (if user selected a file but didn't upload)
    if (resourceFile) {
      const maxBytes = 50 * 1024 * 1024; // 50MB
      if (resourceFile.size > maxBytes)
        errors.push("Tài nguyên quá lớn. Kích thước tối đa 50MB.");
    }

    // Title uniqueness within chapter (case-insensitive)
    if (title && chapterLessons && chapterLessons.length > 0) {
      const tnorm = title.trim().toLowerCase();
      const dup = chapterLessons.some((l: any) => {
        const name =
          (l && (l.name || l.title || l.nameText || l.titleText)) || "";
        return String(name).trim().toLowerCase() === tnorm;
      });
      if (dup)
        errors.push(
          "Tiêu đề bài giảng trùng với một bài giảng đã tồn tại trong chương."
        );
    }

    // Resource file name duplication check against existing lesson resources
    if (resourceFile && chapterLessons && chapterLessons.length > 0) {
      const fname = resourceFile.name.trim().toLowerCase();
      const existingNames = chapterLessons
        .map((l: any) => {
          // try several common fields where resource URL might be
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

    // interactive questions validation
    if (interactiveQuestions && interactiveQuestions.length > 0) {
      const seen = new Set<number>();
      for (const q of interactiveQuestions) {
        if (
          !q ||
          typeof q.timeSec !== "number" ||
          !isFinite(q.timeSec) ||
          q.timeSec < 0
        ) {
          errors.push("Một câu hỏi tương tác có thời gian không hợp lệ.");
          break;
        }
        if (seen.has(q.timeSec)) {
          errors.push(
            "Có hai câu hỏi cùng thời điểm. Vui lòng đảm bảo mỗi thời điểm chỉ có một câu hỏi."
          );
          break;
        }
        seen.add(q.timeSec);
      }
    }

    return errors;
  };

  // helper: parse mm:ss or seconds to seconds
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

  // Small inline editor component to create an interactive question
  const InteractiveQuestionEditor: React.FC<{
    onAdd: (q: any) => void;
  }> = ({ onAdd }) => {
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
    };

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
      // For text-type questions, teacher may provide the expected answer (optional)

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
        // include expected answer for text questions
        correctAnswer:
          qtype === "text"
            ? correctAnswer
              ? correctAnswer.trim()
              : null
            : null,
      };
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
            <Button onClick={doAdd}>Thêm câu hỏi</Button>
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

  // Upload resource (file) -> upload to storage then persist LessonResource row
  const handleUploadResource = async () => {
    if (!resourceFile)
      return setDialog({
        open: true,
        title: "Chưa chọn file",
        message: "Vui lòng chọn file trước khi tải lên.",
      });
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
        return setDialog({
          open: true,
          title: "Tệp trùng lặp",
          message:
            "Tệp tải lên có tên trùng với tệp đã tồn tại trong chương. Vui lòng đổi tên file trước khi tải lên.",
        });
      }
    }

    setResourceUploading(true);
    try {
      const uploadRes = await courseApi.uploadResource(resourceFile);
      const url = (uploadRes && (uploadRes.url || uploadRes)) as string;
      const created = await courseApi.createLessonResource({ url });
      setResourceUrl(created?.url ?? url);
      setResourceId(created?.id ?? null);
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

  // Hàm tạo lecture
  const handleCreate = async () => {
    const errors = validateLectureForm();
    if (errors.length) {
      setDialog({
        open: true,
        title: "Thiếu hoặc sai thông tin",
        message: errors.map((err, index) => (
          <React.Fragment key={`err-${index}`}>
            {err} {index < errors.length - 1 && <br />}
          </React.Fragment>
        )),
      });
      return;
    }

    setSaving(true);
    try {
      const dto: any = {
        name: title,
        chapterId: selectedChapterId ? Number(selectedChapterId) : 0,
        status: true,
        type:
          type === "video" ? "Video" : type === "reading" ? "Reading" : "Exam",
        videoUrl: type === "video" ? embedSrc : null,
        readingContent: type !== "video" ? readingContent : null,
        duration: duration || null,
        description: description || null,
        postDate: postDate ? new Date(postDate) : new Date(),
        isPreview,
        ResourceId: resourceId ?? null,
        // send interactive questions as part of the lesson payload
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

      const created = createLesson
        ? await createLesson(dto)
        : await courseApi.createLesson(dto);

      if (!created || !created.id) {
        setDialog({
          open: true,
          title: "Thất bại",
          message: "Tạo bài giảng thất bại.",
        });
      }

      const newExam: Exam = {
        id: 999,
        title: title,
        description: description.length !== 0 ? description : title,
        duration: parseInt(duration),
        createdBy: user?.id ?? "",
        questions: questions.map(({ id, ...rest }, index) => {
          return {
            id: index + 1,
            ...rest,
          };
        }),
        showAnswers: true,
        showCorrectAnswers: true,
        lessonId: created.id,
        openTime: postDate ? new Date(postDate) : new Date(),
      };

      const isExamCreated =
        type === "exam" ? await courseApi.createExam(newExam) : true;

      if (isExamCreated) {
        setDialog({
          open: true,
          title: "Thành công",
          message: "Tạo bài giảng thành công.",
          navigateTo: `/course/teacher/edit-course/${courseIdFromQuery}`,
        });
      } else {
        setDialog({
          open: true,
          title: "Thất bại",
          message: "Tạo bài giảng thất bại.",
        });
      }
    } catch (err) {
      console.error("Create lecture failed", err);
      setDialog({
        open: true,
        title: "Thất bại",
        message: "Tạo bài giảng thất bại.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full px-8 h-full flex flex-col">
      <div className="text-sm text-[#525252] my-3">
        Bài giảng / Thêm bài giảng
      </div>

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

      <Card className="overflow-y-auto flex-1 scrollbar-hide my-3">
        <CardContent>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 space-y-4">
              {/* Chapter */}
              <div className="space-y-2">
                <Label>
                  Chương <span className="text-red-500">*</span>
                </Label>
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
                <Label>
                  Loại bài giảng <span className="text-red-500">*</span>
                </Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn loại bài giảng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Bài giảng video</SelectItem>
                    <SelectItem value="reading">Tài liệu đọc</SelectItem>
                    <SelectItem value="exam">Bài kiểm tra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>
                  Tên bài giảng <span className="text-red-500">*</span>
                </Label>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Thời gian (phút){" "}
                    <span
                      className={`text-red-500 ${
                        type === "exam" ? "" : "hidden"
                      }`}
                    >
                      *
                    </span>
                  </Label>
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

              {/* Interactive questions editor (visible only for video type) */}
              <div
                className={`space-y-2 pt-4 ${type === "video" ? "" : "hidden"}`}
              >
                <div className="flex items-center justify-between">
                  <Label> Câu hỏi tương tác (Interactive questions)</Label>
                  <div className="text-sm text-gray-500">
                    Hiển thị trên video tại thời điểm
                  </div>
                </div>

                {/* list existing questions */}
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
                              setInteractiveQuestions((prev) =>
                                prev.filter((x) => x.id !== q.id)
                              );
                            }}
                          >
                            Xóa
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* add new question form (simple inline) */}
                <InteractiveQuestionEditor
                  onAdd={(newQ) => {
                    setInteractiveQuestions((prev) => [...prev, newQ]);
                  }}
                />
              </div>

              {/* Teacher Name + Preview */}
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
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Đang tải...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Tải lên
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
                          onClick={() => {
                            setResourceUrl(null);
                            setResourceId(null);
                            setResourceFile(null);
                          }}
                          className="flex items-center gap-1 text-rose-600 hover:text-rose-700"
                        >
                          <X className="w-4 h-4" />
                          Xóa
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="preview"
                    type="checkbox"
                    checked={isPreview}
                    onChange={(e) => setIsPreview(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="preview">Cho phép xem trước bài giảng</Label>
                </div>
              </div>

              <div
                className={`space-y-4 ${type === "video" ? "block" : "hidden"}`}
              >
                <div className="flex items-center gap-3">
                  <Label>
                    Video URL <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2 text-sm">
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
                                  <strong>Lấy mã nhúng (Embed)</strong> - Chia
                                  sẻ → Nhúng → Sao chép{" "}
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
                        Nhập link embed (ví dụ YouTube embed URL) để xem trước
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div
                className={`space-y-2 ${
                  type === "reading" ? "block" : "hidden"
                }`}
              >
                <Label>
                  Nội dung đọc <span className="text-red-500">*</span>
                </Label>
                <div
                  ref={quillRef}
                  className="bg-white rounded-md min-h-[250px] p-2"
                />
              </div>
              <div
                className={`space-y-2 ${type === "exam" ? "block" : "hidden"}`}
              >
                <Label>
                  Câu hỏi <span className="text-red-500">*</span>
                </Label>
                <QuestionTemplate
                  questions={questions}
                  setQuestions={setQuestions}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Global dialog for create/upload actions */}
      <AppDialog dialog={dialog} setDialog={setDialog} />
    </div>
  );
};

export default AddLecture;
