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
import LessonExamQuestions from "@/courseManagement/components/LessonExamQuestions";
import { EXAM_TYPE } from "@/courseManagement/constants/ExamType";
import { useAuthStore } from "@/auth/stores/useAuthStore";

const AddLecture: React.FC = () => {
  const { user } = useAuthStore();
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
  // chapterInfo not required directly; we keep postDate and lessons
  const [chapterPostDate, setChapterPostDate] = useState<string | null>(null);
  const [chapterLessons, setChapterLessons] = useState<any[]>([]);
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
      if (!useEmbed) {
        if (!videoUrl || !videoUrl.trim())
          errors.push("Vui lòng cung cấp URL video hoặc chọn Embed.");
        else {
          try {
            new URL(videoUrl);
          } catch (e) {
            errors.push("URL video không hợp lệ.");
          }
        }
      } else {
        if (!embedSrc || !embedSrc.trim())
          errors.push("Vui lòng dán link nhúng (embed) hợp lệ.");
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
        errors.push("Vui lòng điền đầy đủ thông tin và thêm ít nhất một câu hỏi.");
      }

      for (const q of questions) {
        if (!q.questionText.trim()) {
          errors.push("Vui lòng nhập nội dung cho tất cả các câu hỏi.");
        }
        if (q.type === EXAM_TYPE.SINGLE_CHOICE || q.type === EXAM_TYPE.MULTI_CHOICE) {
          if (q.options.some(opt => !String(opt).trim())) {
            errors.push(`Vui lòng nhập nội dung cho tất cả các lựa chọn hoặc xóa lựa chọn trống cho câu hỏi "${q.questionText}".`);
          }
        }

        if (q.type === EXAM_TYPE.SINGLE_CHOICE) {
          if (!String(q.correctAnswer).trim()) {
            errors.push(`Vui lòng chọn đáp án đúng cho câu hỏi "${q.questionText}".`);
          }
        } else if (q.type === EXAM_TYPE.MULTI_CHOICE) {
          if (!Array.isArray(q.correctAnswer) || q.correctAnswer.length === 0 || q.correctAnswer.some(ans => !String(ans).trim())) {
            errors.push(`Vui lòng chọn ít nhất một đáp án đúng cho câu hỏi "${q.questionText}".`);
          }
        } else if (q.type === EXAM_TYPE.TEXT_INPUT) {
          if (!String(q.correctAnswer).trim()) {
            errors.push(`Vui lòng nhập đáp án đúng cho câu hỏi "${q.questionText}".`);
          }
        } else if (q.type === EXAM_TYPE.FILL_IN_BLANK) {
          const expectedBlanks = (q.questionText.match(new RegExp("[BLANK]".replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length;
          if (expectedBlanks === 0) {
            errors.push(`Câu hỏi điền khuyết "${q.questionText}" phải chứa ít nhất một placeholder '[BLANK]'.`);
          }
          if (!Array.isArray(q.correctAnswer) || q.correctAnswer.length !== expectedBlanks || q.correctAnswer.some(ans => !String(ans).trim())) {
            errors.push(`Vui lòng nhập đầy đủ ${expectedBlanks} đáp án đúng cho câu hỏi điền khuyết "${q.questionText}".`);
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

    return errors;
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
        message: errors.map((err, index) => (<React.Fragment key={`err-${index}`}>{err} {index < errors.length - 1 && <br />}</React.Fragment>)),
      });
      return;
    }

    setSaving(true);
    try {
      const dto: any = {
        name: title,
        chapterId: selectedChapterId ? Number(selectedChapterId) : 0,
        status: true,
        type: type === "video" ? "Video" : type === "reading" ? "Reading" : "Exam",
        videoUrl: type === "video" ? (useEmbed ? embedSrc : videoUrl) : null,
        readingContent: type !== "video" ? readingContent : null,
        duration: duration || null,
        description: description || null,
        postDate: postDate ? new Date(postDate) : new Date(),
        isPreview,
        ResourceId: resourceId ?? null,
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
        createdBy: user?.id ?? '',
        questions: questions.map(({ id, ...rest }, index) => {
          return {
            id: index + 1, ...rest
          }
        }),
        showAnswers: true,
        showCorrectAnswers: true,
        lessonId: created.id,
        openTime: postDate ? new Date(postDate) : new Date()
      };

      const isExamCreated = type === 'exam' ? await courseApi.createExam(newExam) : true;

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
                <Label>Chương <span className='text-red-500'>*</span></Label>
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
                <Label>Loại bài giảng <span className='text-red-500'>*</span></Label>
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
                <Label>Tên bài giảng <span className='text-red-500'>*</span></Label>
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
                  <Label>Thời gian (phút) <span className={`text-red-500 ${type === 'exam' ? '' : 'hidden'}`}>*</span></Label>
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

              <div className={`space-y-4 ${type === 'video' ? 'block' : 'hidden'}`}>
                <div className="flex items-center gap-3">
                  <Label>Video URL <span className='text-red-500'>*</span></Label>
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      id="use-embed"
                      type="checkbox"
                      checked={useEmbed}
                      onChange={(e) => setUseEmbed(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="use-embed">Embed (iframe)</label>
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
                                  <strong>Tải video lên YouTube</strong> -
                                  Đăng nhập → Tạo → Tải video lên
                                </li>
                                <li>
                                  <strong>Lấy mã nhúng (Embed)</strong> - Chia
                                  sẻ → Nhúng → Sao chép{" "}
                                  <code>
                                    &lt;iframe&gt;...&lt;/iframe&gt;
                                  </code>{" "}
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
              <div className={`space-y-2 ${type === 'reading' ? 'block' : 'hidden'}`}>
                <Label>Nội dung đọc <span className='text-red-500'>*</span></Label>
                <div
                  ref={quillRef}
                  className="bg-white rounded-md min-h-[250px] p-2"
                />
              </div>
              <div className={`space-y-2 ${type === 'exam' ? 'block' : 'hidden'}`}>
                <Label>Câu hỏi <span className='text-red-500'>*</span></Label>
                <LessonExamQuestions questions={questions} setQuestions={setQuestions} />
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
