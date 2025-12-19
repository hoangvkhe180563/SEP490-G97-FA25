import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
import {
  ArrowLeft,
  Loader2,
  Upload,
  X,
  HelpCircle,
  Calendar,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/common/components/ui/breadcrumb";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/common/components/ui/popover";
import { courseApi } from "@/courseManagement/services/courseService";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";
import { AppDialog } from "@/courseManagement/components/AppDialog";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parse } from "date-fns";
import type { DialogProps } from "@/courseManagement/components/AppDialog";
import type { Exam, Question } from "@/courseManagement/interfaces/types";
import { EXAM_TYPE } from "@/courseManagement/constants/ExamType";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import QuestionTemplate from "@/exam/components/QuestionTemplate";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/common/components/ui/tabs";
import RandomQuestionTemplate from "@/exam/components/RandomQuestionTemplate";

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
  const [postOpen, setPostOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Date | undefined>(undefined);
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
  const [resourceFileName, setResourceFileName] = useState<string | null>(null);
  const [resourceUploading, setResourceUploading] = useState(false);
  const [resourceUrl, setResourceUrl] = useState<string | null>(null);
  const [resourceId, setResourceId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("new-questions");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [randomQuestions, setRandomQuestions] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [dialog, setDialog] = useState<DialogProps>({
    open: false,
    title: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
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
      setErrors((prev) => {
        if (!prev || !prev.readingContent) return prev;
        const c = { ...prev };
        delete c.readingContent;
        return c;
      });
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
            // sync selectedPost if chapter provides a post/start date
            if (post) {
              const d = new Date(post as any);
              if (!isNaN(d.getTime())) setSelectedPost(d);
            }
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

                //hoàng fetch course để lấy subject id và lớp
                if (course) {
                  setCourseEndDate(course.endAt ?? null);
                  setSelectedSubjectId(course.subjectId);
                  setSelectedGrade(course.grade);
                }
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
    const fieldErrors: Record<string, string> = {};
    const aggErrors: string[] = [];

    if (!selectedChapterId)
      fieldErrors.chapter = "Vui lòng chọn chương cho bài giảng.";
    if (!title || !title.trim())
      fieldErrors.title = "Tiêu đề bài giảng là bắt buộc.";

    if (type === "video") {
      // default to embed iframe for videos
      if (!embedSrc || !embedSrc.trim())
        fieldErrors.embedSrc = "Vui lòng dán link nhúng (embed) hợp lệ.";
      else {
        // allow raw iframe tags or plain URLs
        const trimmed = embedSrc.trim();
        if (trimmed.startsWith("<iframe")) {
          const m = trimmed.match(/src=["']([^"']+)["']/);
          if (!m || !m[1])
            fieldErrors.embedSrc =
              "Embed iframe không có thuộc tính src hợp lệ.";
          else {
            try {
              new URL(m[1]);
            } catch (e) {
              fieldErrors.embedSrc = "URL trong iframe embed không hợp lệ.";
            }
          }
        } else {
          try {
            new URL(trimmed);
          } catch (e) {
            fieldErrors.embedSrc = "Link embed không phải URL hợp lệ.";
          }
        }
      }
    } else if (type === "reading") {
      // reading
      const cleaned = (readingContent || "").replace(/<(.|\n)*?>/g, "").trim();
      if (!cleaned)
        fieldErrors.readingContent = "Nội dung đọc không được bỏ trống.";
    } else {
      if (!duration) {
        fieldErrors.duration =
          "Với loại bài giảng kiểm tra thì thời gian là bắt buộc!";
      }

      if (selectedTab === "new-questions" && questions.length === 0) {
        aggErrors.push(
          "Vui lòng điền đầy đủ thông tin và thêm ít nhất một câu hỏi."
        );
      } else if (selectedTab === "bank-questions" && !Number(randomQuestions)) {
        aggErrors.push("Vui lòng điền số câu hỏi cần tạo!");
      } else if (
        selectedTab === "bank-questions" &&
        Number(randomQuestions) <= 0
      ) {
        aggErrors.push("Số câu hỏi phải > 0!");
      }

      for (const q of questions) {
        if (!q.questionText.trim()) {
          aggErrors.push("Vui lòng nhập nội dung cho tất cả các câu hỏi.");
        }
        if (
          q.type === EXAM_TYPE.SINGLE_CHOICE ||
          q.type === EXAM_TYPE.MULTI_CHOICE
        ) {
          if (q.options.some((opt) => !String(opt).trim())) {
            aggErrors.push(
              `Vui lòng nhập nội dung cho tất cả các lựa chọn hoặc xóa lựa chọn trống cho câu hỏi "${q.questionText}".`
            );
          }
        }

        if (q.type === EXAM_TYPE.SINGLE_CHOICE) {
          if (!String(q.correctAnswer).trim()) {
            aggErrors.push(
              `Vui lòng chọn đáp án đúng cho câu hỏi "${q.questionText}".`
            );
          }
        } else if (q.type === EXAM_TYPE.MULTI_CHOICE) {
          if (
            !Array.isArray(q.correctAnswer) ||
            q.correctAnswer.length === 0 ||
            q.correctAnswer.some((ans) => !String(ans).trim())
          ) {
            aggErrors.push(
              `Vui lòng chọn ít nhất một đáp án đúng cho câu hỏi "${q.questionText}".`
            );
          }
        } else if (q.type === EXAM_TYPE.TEXT_INPUT) {
          if (!String(q.correctAnswer).trim()) {
            aggErrors.push(
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
            aggErrors.push(
              `Câu hỏi điền khuyết "${q.questionText}" phải chứa ít nhất một placeholder '[BLANK]'.`
            );
          }
          if (
            !Array.isArray(q.correctAnswer) ||
            q.correctAnswer.length !== expectedBlanks ||
            q.correctAnswer.some((ans) => !String(ans).trim())
          ) {
            aggErrors.push(
              `Vui lòng nhập đầy đủ ${expectedBlanks} đáp án đúng cho câu hỏi điền khuyết "${q.questionText}".`
            );
          }
        } else if (q.type === EXAM_TYPE.MATCHING) {
          if (
            !q.terms ||
            q.terms.length === 0 ||
            q.terms.some((term) => !String(term).trim())
          ) {
            aggErrors.push(
              `Vui lòng nhập đầy đủ các thuật ngữ cho câu hỏi ghép đôi "${q.questionText}".`
            );
          }
          if (
            !q.definitions ||
            q.definitions.length === 0 ||
            q.definitions.some((def) => !String(def).trim())
          ) {
            aggErrors.push(
              `Vui lòng nhập đầy đủ các định nghĩa cho câu hỏi ghép đôi "${q.questionText}".`
            );
          }
          if (q.terms?.length !== q.definitions?.length) {
            aggErrors.push(
              `Số lượng thuật ngữ và định nghĩa phải bằng nhau cho câu hỏi "${q.questionText}".`
            );
          }
        }
      }
    }

    if (duration && Number.isNaN(Number(duration))) {
      fieldErrors.duration = "Thời lượng phải là một số hợp lệ (phút).";
    } else if (duration && Number(duration) <= 0) {
      fieldErrors.duration = "Thời lượng phải là số dương (lớn hơn 0).";
    }

    // Post date validity
    if (postDate) {
      try {
        const lec = parse(postDate, "dd/MM/yyyy", new Date());
        if (isNaN(lec.getTime())) {
          const alt = new Date(postDate);
          if (isNaN(alt.getTime()))
            fieldErrors.postDate = "Ngày đăng không hợp lệ.";
        }
      } catch (e) {
        fieldErrors.postDate = "Ngày đăng không hợp lệ.";
      }
    }

    // If chapter has a postDate, the lecture postDate (if provided) cannot be earlier
    if (postDate && chapterPostDate) {
      let lec: Date | null = null;
      try {
        const tmp = parse(postDate, "dd/MM/yyyy", new Date());
        lec = !isNaN(tmp.getTime()) ? tmp : new Date(postDate);
      } catch (e) {
        lec = new Date(postDate);
      }
      let chd: Date | null = null;
      try {
        chd = new Date(chapterPostDate);
        if (isNaN(chd.getTime())) {
          const tmp2 = parse(String(chapterPostDate), "dd/MM/yyyy", new Date());
          chd = !isNaN(tmp2.getTime()) ? tmp2 : null;
        }
      } catch (e) {
        chd = null;
      }
      if (lec && chd && !isNaN(lec.getTime()) && !isNaN(chd.getTime())) {
        if (lec.getTime() < chd.getTime()) {
          fieldErrors.postDate =
            "Ngày đăng bài giảng không thể nhỏ hơn ngày bắt đầu của chương.";
        }
      }
    }

    // If course end date is known, lecture postDate must not be after course end
    if (postDate && courseEndDate) {
      let lec: Date | null = null;
      try {
        const tmp = parse(postDate, "dd/MM/yyyy", new Date());
        lec = !isNaN(tmp.getTime()) ? tmp : new Date(postDate);
      } catch (e) {
        lec = new Date(postDate);
      }
      let ced: Date | null = null;
      try {
        ced = new Date(courseEndDate as any);
        if (isNaN(ced.getTime())) {
          const tmp2 = parse(String(courseEndDate), "dd/MM/yyyy", new Date());
          ced = !isNaN(tmp2.getTime()) ? tmp2 : null;
        }
      } catch (e) {
        ced = null;
      }
      if (lec && ced && !isNaN(lec.getTime()) && !isNaN(ced.getTime())) {
        if (lec.getTime() > ced.getTime()) {
          fieldErrors.postDate =
            "Ngày đăng bài giảng phải nhỏ hơn hoặc bằng ngày kết thúc khóa học.";
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
            fieldErrors.embedSrc =
              "Embed iframe không có thuộc tính src hợp lệ.";
          else {
            try {
              new URL(m[1]);
            } catch (e) {
              fieldErrors.embedSrc = "URL trong iframe embed không hợp lệ.";
            }
          }
        } else {
          try {
            new URL(trimmed);
          } catch (e) {
            fieldErrors.embedSrc = "Link embed không phải URL hợp lệ.";
          }
        }
      }
    }

    // resource size limit (if user selected a file but didn't upload)
    if (resourceFile) {
      const maxBytes = 50 * 1024 * 1024; // 50MB
      if (resourceFile.size > maxBytes)
        fieldErrors.resourceFile =
          "Tài nguyên quá lớn. Kích thước tối đa 50MB.";
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
        fieldErrors.title =
          "Tiêu đề bài giảng trùng với một bài giảng đã tồn tại trong chương.";
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
        fieldErrors.resourceFile =
          "Tệp tải lên có tên trùng với tệp đã tồn tại trong chương. Vui lòng đổi tên file trước khi tải lên.";
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
          fieldErrors.interactiveQuestions =
            "Một câu hỏi tương tác có thời gian không hợp lệ.";
          break;
        }
        if (seen.has(q.timeSec)) {
          fieldErrors.interactiveQuestions =
            "Có hai câu hỏi cùng thời điểm. Vui lòng đảm bảo mỗi thời điểm chỉ có một câu hỏi.";
          break;
        }
        seen.add(q.timeSec);
      }
    }

    return { fieldErrors, aggErrors };
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

  // helper: extract filename from a URL (remove query string and decode)
  const getFileNameFromUrl = (url?: string | null) => {
    if (!url) return "";
    try {
      const path = String(url).split("?")[0];
      const parts = path.split("/");
      const raw = parts[parts.length - 1] || path;
      return decodeURIComponent(raw);
    } catch {
      return String(url);
    }
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
      // preserve the selected filename if available, otherwise extract from URL
      setResourceFileName(
        (prev) =>
          prev ?? (resourceFile ? resourceFile.name : getFileNameFromUrl(url))
      );
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
    const { fieldErrors, aggErrors } = validateLectureForm();
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    if (aggErrors && aggErrors.length > 0) {
      setDialog({
        open: true,
        title: "Thiếu hoặc sai thông tin",
        message: aggErrors.map((err, index) => (
          <React.Fragment key={`err-${index}`}>
            {err} {index < aggErrors.length - 1 && <br />}
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
        postDate: postDate
          ? parse(postDate, "dd/MM/yyyy", new Date())
          : new Date(),
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
        openTime: postDate ? parse(postDate, "dd/MM/yyyy", new Date()) : new Date(),
        subjectId: selectedSubjectId,
        grade: selectedGrade,
      };

      if (selectedTab === "bank-questions") {
        newExam.noRandomQuestions = Number(randomQuestions);
      }

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
      <Breadcrumb>
        <BreadcrumbList className="text-[#525252] my-3">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/course/teacher/courses">Khóa học</Link>
            </BreadcrumbLink>
            <BreadcrumbSeparator />
          </BreadcrumbItem>

          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/course/teacher/edit-course/${selectedCourseId}`}>
                Chỉnh sửa khóa học
              </Link>
            </BreadcrumbLink>
            <BreadcrumbSeparator />
          </BreadcrumbItem>

          <BreadcrumbItem>
            <BreadcrumbPage>Thêm bài giảng</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

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
                    onValueChange={(v) => {
                      setSelectedChapterId(v);
                      setErrors((prev) => {
                        if (!prev || !prev.chapter) return prev;
                        const c = { ...prev };
                        delete c.chapter;
                        return c;
                      });
                    }}
                  >
                    <SelectTrigger
                      className={`w-full ${
                        errors.chapter
                          ? "border-red-500 ring-1 ring-red-500"
                          : ""
                      }`}
                    >
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
                {errors.chapter && (
                  <div className="text-sm text-rose-600 mt-1">
                    {errors.chapter}
                  </div>
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
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors((prev) => {
                      if (!prev || !prev.title) return prev;
                      const c = { ...prev };
                      delete c.title;
                      return c;
                    });
                  }}
                  placeholder="Nhập tên bài giảng"
                  className={
                    errors.title ? "border-red-500 ring-1 ring-red-500" : ""
                  }
                />
                {errors.title && (
                  <div className="text-sm text-rose-600 mt-1">
                    {errors.title}
                  </div>
                )}
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
                    onChange={(e) => {
                      setDuration(e.target.value);
                      setErrors((prev) => {
                        if (!prev || !prev.duration) return prev;
                        const c = { ...prev };
                        delete c.duration;
                        return c;
                      });
                    }}
                    className={
                      errors.duration
                        ? "border-red-500 ring-1 ring-red-500"
                        : ""
                    }
                  />
                  {errors.duration && (
                    <div className="text-sm text-rose-600 mt-1">
                      {errors.duration}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Ngày đăng</Label>
                  <div className="relative">
                    <Input
                      placeholder="dd/MM/yyyy"
                      value={postDate}
                      readOnly
                      onClick={() => {
                        setPostOpen((s) => !s);
                        setErrors((prev) => {
                          if (!prev || !prev.postDate) return prev;
                          const c = { ...prev };
                          delete c.postDate;
                          return c;
                        });
                      }}
                      className={
                        errors.postDate
                          ? "border-red-500 ring-1 ring-red-500"
                          : ""
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setPostOpen((s) => !s)}
                      className="absolute right-2 top-2 p-1"
                      aria-label="Open calendar"
                    >
                      <Calendar size={16} />
                    </button>

                    {postOpen && (
                      <div className="absolute z-50 mt-2 bg-white rounded-md shadow p-2">
                        <DayPicker
                          mode="single"
                          selected={selectedPost}
                          onSelect={(d) => {
                            if (d) {
                              setSelectedPost(d);
                              const s = format(d, "dd/MM/yyyy");
                              setPostDate(s);
                              setErrors((prev) => {
                                if (!prev || !prev.postDate) return prev;
                                const c = { ...prev };
                                delete c.postDate;
                                return c;
                              });
                            }
                            setPostOpen(false);
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {errors.postDate && (
                    <div className="text-sm text-rose-600 mt-1">
                      {errors.postDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive questions editor (visible only for video type) */}
              <div
                className={`space-y-2 pt-4 ${type === "video" ? "" : "hidden"}`}
              >
                <div className="flex items-center justify-between">
                  <Label> Câu hỏi tương tác</Label>
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
                              setErrors((prev) => {
                                if (!prev || !prev.interactiveQuestions)
                                  return prev;
                                const c = { ...prev };
                                delete c.interactiveQuestions;
                                return c;
                              });
                            }}
                          >
                            Xóa
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                  {errors.interactiveQuestions && (
                    <div className="text-sm text-rose-600 mt-1">
                      {errors.interactiveQuestions}
                    </div>
                  )}
                </div>

                {/* add new question form (simple inline) */}
                <InteractiveQuestionEditor
                  onAdd={(newQ) => {
                    setInteractiveQuestions((prev) => {
                      const next = [...prev, newQ];
                      setErrors((prevErrs) => {
                        if (!prevErrs || !prevErrs.interactiveQuestions)
                          return prevErrs;
                        const c = { ...prevErrs };
                        delete c.interactiveQuestions;
                        return c;
                      });
                      return next;
                    });
                  }}
                />
              </div>

              {/* Teacher Name + Preview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-gray-800 font-medium text-sm">
                      Tài nguyên (File đính kèm)
                    </Label>

                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label="Hướng dẫn tải tài nguyên"
                          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[320px] p-3">
                        <div className="text-sm text-gray-700">
                          <div className="font-medium mb-2">
                            Hướng dẫn tải tài nguyên
                          </div>
                          <ol className="list-decimal pl-5 space-y-1">
                            <li>
                              Nhấn nút để chọn file từ máy tính (tất cả định
                              dạng được hỗ trợ).
                            </li>
                            <li>
                              Sau khi chọn file, nhấn "Tải lên" để upload lên
                              server.
                            </li>
                            <li>
                              Chờ popup thông báo "Tải lên tài nguyên thành
                              công" trước khi tiếp tục.
                            </li>
                          </ol>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
                    {!resourceUrl ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <input
                          type="file"
                          accept="*"
                          onChange={(e) => {
                            const f = e.target.files && e.target.files[0];
                            if (f) {
                              setResourceFile(f);
                              setResourceFileName(f.name);
                              setErrors((prev) => {
                                if (!prev || !prev.resourceFile) return prev;
                                const c = { ...prev };
                                delete c.resourceFile;
                                return c;
                              });
                            } else setResourceFile(null);
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
                              {resourceFileName ||
                                getFileNameFromUrl(resourceUrl)}
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
                            setResourceFileName(null);
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
                      // eslint-disable-next-line no-useless-escape
                      const match = val.match(/src=\"([^\"]+)\"/);
                      const raw = match ? match[1] : val;
                      setEmbedSrc(raw);
                      setErrors((prev) => {
                        if (!prev || !prev.embedSrc) return prev;
                        const c = { ...prev };
                        delete c.embedSrc;
                        return c;
                      });
                    }}
                    className={
                      errors.embedSrc
                        ? "border-red-500 ring-1 ring-red-500"
                        : ""
                    }
                  />
                  {errors.embedSrc && (
                    <div className="text-sm text-rose-600 mt-1">
                      {errors.embedSrc}
                    </div>
                  )}
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
                  className={`bg-white rounded-md min-h-[250px] p-2 ${
                    errors.readingContent
                      ? "border border-red-500 ring-1 ring-red-500"
                      : ""
                  }`}
                />
                {errors.readingContent && (
                  <div className="text-sm text-rose-600 mt-1">
                    {errors.readingContent}
                  </div>
                )}
              </div>
              <div
                className={`space-y-2 ${type === "exam" ? "block" : "hidden"}`}
              >
                <Label>
                  Câu hỏi <span className="text-red-500">*</span>
                </Label>

                <Tabs
                  defaultValue="new-questions"
                  value={selectedTab}
                  onValueChange={setSelectedTab}
                >
                  <TabsList className="mx-auto bg-stone-300">
                    <TabsTrigger value="new-questions" className="p-2">
                      Câu hỏi tự nhập
                    </TabsTrigger>
                    <TabsTrigger value="bank-questions" className="p-2">
                      Câu hỏi từ ngân hàng
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="new-questions">
                    <QuestionTemplate
                      questions={questions}
                      setQuestions={setQuestions}
                    />
                  </TabsContent>
                  <TabsContent value="bank-questions">
                    <RandomQuestionTemplate
                      isLesson
                      selectedSubjectId={selectedSubjectId}
                      selectedGrade={selectedGrade}
                      selectedRandomQuestions={randomQuestions}
                      setSelectedRandomQuestions={setRandomQuestions}
                    />
                  </TabsContent>
                </Tabs>
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
