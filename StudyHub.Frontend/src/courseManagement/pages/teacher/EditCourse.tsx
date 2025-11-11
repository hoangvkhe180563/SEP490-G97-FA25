import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Checkbox } from "@/common/components/ui/checkbox";
import { Label } from "@/common/components/ui/label";
import {
  ArrowLeft,
  Trash2,
  Upload,
  Plus,
  Eye,
  Edit2,
  Pencil,
  Loader2,
} from "lucide-react";
import { documentService } from "@/documentManagement/services/documentService";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import type {
  ChapterListDto,
  CourseListDto,
} from "@/courseManagement/types/api";
import type { DialogProps } from "@/courseManagement/components/AppDialog";
import { AppDialog } from "@/courseManagement/components/AppDialog";
import { useAuthStore } from "@/auth/stores/useAuthStore";

const EditCourse: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const courseId = Number(id || 0);

  const [dialog, setDialog] = useState<DialogProps>({
    open: false,
    title: "",
    message: "",
  });

  const selectedCourse = useCourseStore(
    (s) => s.selectedCourse as CourseListDto
  );
  const updateCourse = useCourseStore((s) => s.updateCourse);
  const fetchChapters = useLectureStore((s) => s.fetchChapters);
  const chaptersFromStore = useLectureStore((s) => s.chapters);
  const createChapter = useLectureStore((s) => s.createChapter);
  const fetchCourseById = useCourseStore((s) => s.fetchCourseById);
  const uploadThumbnail = useCourseStore((s) => s.uploadThumbnail);
  const deleteChapterStore = useLectureStore((s) => s.deleteChapter);
  const updateChapterStore = useLectureStore((s) => s.updateChapter);
  const fetchChapter = useLectureStore((s) => s.fetchChapter);
  const deleteLessonStore = useLectureStore((s) => s.deleteLesson);
  const filterAppUsers = useAppUserStore((s) => s.filterAppUsers);
  const authUser = useAuthStore((s) => s.user);

  const fetchCourseByIdRef = useRef(fetchCourseById);
  const fetchChaptersRef = useRef(fetchChapters);

  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [name, setName] = useState("");
  const [information, setInformation] = useState("");
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [gradeId, setGradeId] = useState<number | "">("");
  const [status, setStatus] = useState<string>("");
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [chaptersLocal, setChaptersLocal] = useState<ChapterListDto[]>([]);
  const [modalChapter, setModalChapter] = useState<ChapterListDto | undefined>(
    undefined
  );
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [chapterModalSaving, setChapterModalSaving] = useState(false);
  const [modalChapterMode, setModalChapterMode] = useState<"view" | "edit">(
    "view"
  );

  useEffect(() => {
    const fetchSubjects = async () => {
      const res = await documentService.getSubjects();
      if (Array.isArray(res)) {
        setSubjects(res.map((s: any) => ({ id: s.id, name: s.name })));
      }
    };
    fetchSubjects();
  }, [filterAppUsers]);

  useEffect(() => {
    fetchCourseByIdRef.current = fetchCourseById;
    fetchChaptersRef.current = fetchChapters;
  }, [fetchCourseById, fetchChapters]);

  const modalChapterRef = useRef<ChapterListDto | undefined>(modalChapter);

  useEffect(() => {
    modalChapterRef.current = modalChapter;
  }, [modalChapter]);

  const chaptersLen = chaptersFromStore ? chaptersFromStore.length : 0;
  const selectedId = selectedCourse ? selectedCourse.id : undefined;

  useEffect(() => {
    if (!courseId) return;

    if (!selectedId || selectedId !== courseId) {
      fetchCourseByIdRef.current(courseId);
      setChaptersLocal([]);
      if (fetchChaptersRef.current) fetchChaptersRef.current(courseId);
      return;
    }

    if (!chaptersLen || chaptersLen === 0) {
      if (fetchChaptersRef.current) fetchChaptersRef.current(courseId);
    }
  }, [courseId, selectedId, chaptersLen]);

  useEffect(() => {
    let mounted = true;
    if (!courseId) return;

    if (!selectedCourse || (selectedCourse as any).id !== courseId) {
      if (mounted) {
        setName("");
        setInformation("");
        setPrice(undefined);
        setSubjectId("");
        setGradeId("");
        setStatus("");
        setIsFeatured(false);
        setChaptersLocal([]);
        setStartAt("");
        setEndAt("");
      }
    } else {
      setName(selectedCourse.name ?? "");
      setInformation(selectedCourse.information ?? "");
      setPrice(selectedCourse.price ?? undefined);
      setSubjectId(selectedCourse.subjectId ?? "");
      setGradeId(
        (selectedCourse as any).gradeId ?? (selectedCourse as any).grade ?? ""
      );
      setStatus(selectedCourse.status ?? undefined);
      setIsFeatured((selectedCourse as any).isFeatured ?? false);
      setStartAt(formatDate(selectedCourse.startAt));
      setEndAt(formatDate(selectedCourse.endAt));
    }

    return () => {
      mounted = false;
    };
  }, [courseId, selectedCourse]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toISOString().split("T")[0];
  };

  // Validation for fields before save
  const validateForm = () => {
    const errors: string[] = [];

    if (!name || !name.trim()) errors.push("Tiêu đề khóa học là bắt buộc.");
    if (!information || !information.trim())
      errors.push("Mô tả ngắn là bắt buộc.");

    if (price === undefined || Number.isNaN(price) || Number(price) < 0)
      errors.push("Giá khóa học phải là số hợp lệ và lớn hơn hoặc bằng 0.");

    if (subjectId === "" || subjectId === undefined || Number(subjectId) <= 0)
      errors.push("Vui lòng chọn chủ đề cho khóa học.");

    if (
      gradeId === "" ||
      gradeId === undefined ||
      Number(gradeId) < 1 ||
      Number(gradeId) > 12
    )
      errors.push("Vui lòng chọn khối lớp hợp lệ (1-12).");

    if (!status || (typeof status === "string" && status.trim() === ""))
      errors.push("Vui lòng chọn trạng thái khóa học.");

    // validate course dates
    const hasStart = Boolean(startAt);
    const hasEnd = Boolean(endAt);
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    if (hasStart) {
      startDate = new Date(startAt);
      if (isNaN(startDate.getTime())) errors.push("Ngày bắt đầu không hợp lệ.");
    }
    if (hasEnd) {
      endDate = new Date(endAt);
      if (isNaN(endDate.getTime())) errors.push("Ngày kết thúc không hợp lệ.");
    }
    if (startDate && endDate && startDate > endDate)
      errors.push("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.");

    // Ensure there is at least one chapter with at least one lesson
    if (!chaptersLocal || chaptersLocal.length === 0)
      errors.push("Khóa học nên có ít nhất 1 chương.");
    else {
      const hasLesson = chaptersLocal.some((c) => (c.lessons || []).length > 0);
      if (!hasLesson) errors.push("Ít nhất một chương phải chứa một bài học.");
    }

    // Per-chapter and per-lesson validation
    if (Array.isArray(chaptersLocal)) {
      chaptersLocal.forEach((ch, chIndex) => {
        const title = (ch as any).name ?? "";
        if (!title || !String(title).trim()) {
          errors.push(`Phần ${chIndex + 1}: Tiêu đề phần là bắt buộc.`);
        }

        // postDate may be a Date or a parsable string
        const pdRaw: any = (ch as any).postDate ?? null;
        if (pdRaw) {
          const pd = pdRaw instanceof Date ? pdRaw : new Date(pdRaw);
          if (isNaN(pd.getTime())) {
            errors.push(
              `Phần ${title || chIndex + 1}: Ngày đăng không hợp lệ.`
            );
          } else {
            if (startDate && pd < startDate)
              errors.push(
                `Phần ${
                  title || chIndex + 1
                }: Ngày đăng phải lớn hơn hoặc bằng ngày bắt đầu khóa học.`
              );
            if (endDate && pd > endDate)
              errors.push(
                `Phần ${
                  title || chIndex + 1
                }: Ngày đăng phải nhỏ hơn hoặc bằng ngày kết thúc khóa học.`
              );
          }
        }

        // lessons basic checks
        const lessons = (ch as any).lessons ?? [];
        if (Array.isArray(lessons)) {
          lessons.forEach((ls: any, li: number) => {
            if (!ls || !ls.name || !String(ls.name).trim()) {
              errors.push(
                `Phần ${title || chIndex + 1} - Bài ${
                  li + 1
                }: Tiêu đề bài học là bắt buộc.`
              );
            }
          });
        }
      });
    }

    // Optional: thumbnail size check (if user selected a file but not uploaded yet)
    if (thumbnailFile) {
      const maxBytes = 5 * 1024 * 1024; // 5MB
      if (thumbnailFile.size > maxBytes)
        errors.push("Ảnh thu nhỏ vượt quá 5MB. Vui lòng chọn file nhỏ hơn.");
    }

    return errors;
  };

  useEffect(() => {
    if (chaptersFromStore) {
      const belongsToCurrent =
        chaptersFromStore.length === 0
          ? true
          : chaptersFromStore.every((c: any) => c.courseId === courseId);

      if (belongsToCurrent) {
        setChaptersLocal(chaptersFromStore);
        return;
      }
    }

    if (selectedCourse?.chapters) {
      setChaptersLocal(selectedCourse.chapters as ChapterListDto[]);
    } else {
      setChaptersLocal([]);
    }
  }, [chaptersFromStore, selectedCourse, courseId]);

  useEffect(() => {
    const current = modalChapterRef.current;
    if (!current) return;
    const updated = chaptersLocal.find((c) => c.id === current.id);
    if (!updated) return;
    const modalLessonsLen = (current.lessons || []).length;
    const updatedLessonsLen = (updated.lessons || []).length;
    if (updatedLessonsLen !== modalLessonsLen) {
      setModalChapter(updated);
    }
  }, [chaptersLocal]);

  const handleAddChapter = async () => {
    if (!courseId) {
      return setDialog({
        open: true,
        title: "Thiếu thông tin",
        message: "Vui lòng mở trang này từ một khóa học để thêm một phần.",
      });
    }

    const tempId = -Date.now();
    const temp: any = {
      id: tempId,
      courseId,
      name: "Phần mới",
      numberOfLessons: 0,
      description: "",
      duration: "",
      postDate: null,
      difficultyLevel: "",
      resourceUrl: "",
      lessons: [],
    };

    setChaptersLocal((prev) => [...prev, temp]);
    setModalChapter(temp);
    setModalChapterMode("edit");
    setIsChapterModalOpen(true);
  };

  const handleDeleteChapter = (id: number) => {
    setDialog({
      open: true,
      title: "Xóa chương",
      message: "Bạn có chắc chắn muốn xóa chương này?",
      onConfirm: async () => {
        try {
          const res = deleteChapterStore ? await deleteChapterStore(id) : false;
          if (res) {
            // Xóa local
            setChaptersLocal((prev) => prev.filter((c) => c.id !== id));

            // Đồng bộ dữ liệu
            try {
              if (fetchChaptersRef.current)
                await fetchChaptersRef.current(courseId);
            } catch (err) {
              console.warn("fetchChapters after delete failed", err);
            }
            try {
              if (fetchCourseByIdRef.current)
                await fetchCourseByIdRef.current(courseId);
            } catch (err) {
              console.warn("fetchCourseById after delete failed", err);
            }

            // Thông báo thành công
            setDialog({
              open: true,
              title: "Thành công",
              message: "Đã xóa chương thành công.",
            });
          } else {
            setDialog({
              open: true,
              title: "Thất bại",
              message: "Xóa chương thất bại.",
            });
          }
        } catch (err) {
          console.error("delete chapter failed", err);
          setDialog({
            open: true,
            title: "Lỗi",
            message: "Đã xảy ra lỗi khi xóa chương.",
          });
        }
      },
    });
  };

  const handleAddLessonToChapter = async (chapterId: number) => {
    const qp = new URLSearchParams();
    if (courseId) qp.set("courseId", String(courseId));
    if (chapterId) qp.set("chapterId", String(chapterId));
    qp.set("type", "reading");
    navigate(`/course/teacher/add-lecture?${qp.toString()}`);
  };

  const deleteLesson = (lessonId: number) => {
    setDialog({
      open: true,
      title: "Xóa bài giảng",
      message: "Bạn có chắc chắn muốn xóa bài giảng này?",
      onConfirm: async () => {
        if (!deleteLessonStore) {
          setDialog({
            open: true,
            title: "Thất bại",
            message: "Xóa không khả dụng",
          });
          return;
        }

        try {
          const res = await deleteLessonStore(lessonId);
          if (res) {
            // Cập nhật UI local
            setChaptersLocal((prev) =>
              prev.map((ch) => ({
                ...ch,
                lessons: (ch.lessons || []).filter((ls) => ls.id !== lessonId),
              }))
            );

            // Hiển thị thông báo thành công
            setDialog({
              open: true,
              title: "Thành công",
              message: "Xóa bài giảng thành công",
            });
          } else {
            setDialog({
              open: true,
              title: "Thất bại",
              message: "Xóa thất bại",
            });
          }
        } catch (err) {
          console.error("delete lesson failed", err);
          setDialog({
            open: true,
            title: "Thất bại",
            message: "Xóa bài giảng thất bại",
          });
        }
      },
    });
  };

  const openChapterModal = async (
    chapterId: number,
    mode: "view" | "edit" = "view"
  ) => {
    setModalChapterMode(mode);
    const found = chaptersLocal.find((c) => c.id === chapterId);
    if (found) {
      setModalChapter(found);
      setIsChapterModalOpen(true);
      return;
    }
    if (!fetchChapter) return;
    const ch = await fetchChapter(chapterId);
    if (ch) {
      setModalChapter(ch);
      setIsChapterModalOpen(true);
    }
  };

  const closeChapterModal = () => {
    if (
      modalChapter &&
      (modalChapter as any).id &&
      (modalChapter as any).id < 0
    ) {
      setChaptersLocal((prev) =>
        prev.filter((c) => c.id !== (modalChapter as any).id)
      );
    }
    setIsChapterModalOpen(false);
    setModalChapter(undefined);
  };

  const saveModalChapter = async () => {
    if (!modalChapter) return;
    if (!updateChapterStore)
      return setDialog({
        open: true,
        title: "Thất bại",
        message: "Cập nhật không khả dụng",
      });
    // Validate modal chapter postDate against course start/end (if provided)
    try {
      const pdRaw: any = (modalChapter as any).postDate ?? null;
      if (pdRaw) {
        const pd = pdRaw instanceof Date ? pdRaw : new Date(pdRaw);
        if (isNaN(pd.getTime())) {
          setDialog({
            open: true,
            title: "Lỗi",
            message: "Ngày đăng phần không hợp lệ.",
          });
          return;
        }

        if (startAt) {
          const s = new Date(startAt);
          if (!isNaN(s.getTime()) && pd < s) {
            setDialog({
              open: true,
              title: "Lỗi ngày",
              message:
                "Ngày đăng phần phải lớn hơn hoặc bằng ngày bắt đầu khóa học.",
            });
            return;
          }
        }

        if (endAt) {
          const e = new Date(endAt);
          if (!isNaN(e.getTime()) && pd > e) {
            setDialog({
              open: true,
              title: "Lỗi ngày",
              message:
                "Ngày đăng phần phải nhỏ hơn hoặc bằng ngày kết thúc khóa học.",
            });
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Chapter date validation failed", err);
    }

    setChapterModalSaving(true);
    try {
      const dto: any = {
        name: modalChapter.name,
        courseId: modalChapter.courseId,
        description: (modalChapter as any).description ?? null,
        numberOfLessons:
          (modalChapter as any).numberOfLessons ??
          (modalChapter.lessons || []).length ??
          0,
        duration: (modalChapter as any).duration ?? null,
        postDate: (modalChapter as any).postDate ?? null,
        difficultyLevel: (modalChapter as any).difficultyLevel ?? null,
        resourceUrl: (modalChapter as any).resourceUrl ?? null,
        lessons: (modalChapter.lessons || []).map((l) => ({
          name: l.name,
          chapterId: modalChapter.id,
          type: l.type ?? "Video",
          videoUrl: (l as any).videoUrl ?? null,
          readingContent: (l as any).readingContent ?? null,
        })),
      };
      if ((modalChapter as any).id < 0) {
        if (!createChapter) {
          setDialog({
            open: true,
            title: "Thất bại",
            message: "Tạo không khả dụng",
          });
          return;
        }
        const created = await createChapter(dto);
        if (created && created.id) {
          setChaptersLocal((prev) =>
            prev.map((c) => (c.id === (modalChapter as any).id ? created : c))
          );
          setDialog({
            open: true,
            title: "Thành công",
            message: "Tạo thành công",
          });
          closeChapterModal();
        } else {
          setDialog({
            open: true,
            title: "Thất bại",
            message: "Tạo thất bại",
          });
        }
      } else {
        const updated = await updateChapterStore(modalChapter.id, dto);
        if (updated) {
          setChaptersLocal((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
          setDialog({
            open: true,
            title: "Thành công",
            message: "Lưu thành công",
          });
          closeChapterModal();
        } else {
          setDialog({
            open: true,
            title: "Thất bại",
            message: "Lưu thất bại",
          });
        }
      }
    } catch (err) {
      console.error("save chapter failed", err);
      setDialog({
        open: true,
        title: "Thất bại",
        message: "Lưu thất bại",
      });
    } finally {
      setChapterModalSaving(false);
    }
  };

  return (
    <div className="bg-white h-full">
      <div className="max-w-[1200px] mx-auto px-8 py-6 h-full flex flex-col">
        <div className="text-sm text-[#525252] mb-3">
          Khóa học / Chỉnh sửa khóa học
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/course/teacher/courses")}
              className="w-8 h-8 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50 p-0"
            >
              <ArrowLeft className="w-4 h-4 text-[#525252]" />
            </Button>

            <div>
              <h1 className="text-2xl font-normal text-[#171717]">
                Chỉnh sửa khóa học
              </h1>
              <p className="text-sm text-[#525252]">
                Thay đổi thông tin và nội dung khóa học
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/course/teacher/courses")}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              onClick={async () => {
                // validate before attempting save
                const errors = validateForm();
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
                  if (!updateCourse) return;
                  if (!authUser?.id)
                    return setDialog({
                      open: true,
                      title: "Thiếu thông tin",
                      message: "Bạn chưa đăng nhập.",
                    });
                  const chaptersPayload = (chaptersLocal || []).map((ch) => ({
                    name: ch.name,
                    courseId: ch.courseId ?? courseId,
                    description: (ch as any).description ?? null,
                    postDate: (ch as any).postDate ?? null,
                    lessons: (ch.lessons || []).map((l) => ({
                      name: l.name,
                      chapterId: ch.id,
                      type: l.type ?? "Video",
                      videoUrl: (l as any).videoUrl ?? null,
                      readingContent: (l as any).readingContent ?? null,
                    })),
                  }));

                  // if course was previously a draft and is now opened, reset approval
                  const willOpenFromDraft =
                    selectedCourse?.status === "Nháp" && status === "Mở";
                  const dto: any = {
                    name,
                    information,
                    imageUrl:
                      thumbnailPreview ?? selectedCourse?.imageUrl ?? null,
                    price: price ?? 0,
                    schoolId: authUser?.schoolId ?? null,
                    subjectId:
                      typeof subjectId === "number"
                        ? subjectId
                        : Number(subjectId || 0),
                    grade:
                      typeof gradeId === "number"
                        ? gradeId
                        : Number(gradeId || 0),
                    chapters: chaptersPayload,
                    isFeatured: isFeatured,
                    status: status ?? null,
                    startAt: startAt ? new Date(startAt).toISOString() : null,
                    endAt: endAt ? new Date(endAt).toISOString() : null,
                    updatedAt: new Date().toISOString(),
                    UpdatedBy: authUser?.id,
                    isApproved: willOpenFromDraft
                      ? false
                      : selectedCourse?.isApproved,
                  };

                  await updateCourse(courseId, dto);
                  setDialog({
                    open: true,
                    title: "Thành công",
                    message: "Cập nhật khóa học thành công",
                    navigateTo: `/course/teacher/courses`,
                  });
                } catch (err) {
                  console.error("Update failed", err);
                  setDialog({
                    open: true,
                    title: "Thất bại",
                    message: "Cập nhật không thành công",
                  });
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-8 overflow-y-auto flex-1 scrollbar-hide">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
                <CardDescription>
                  Tiêu đề khóa học, mô tả ngắn, môn học và lớp học
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label>Tiêu đề khóa học</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nhập tiêu đề khóa học"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Mô tả ngắn</Label>
                    <Textarea
                      value={information}
                      onChange={(e) => setInformation(e.target.value)}
                      rows={4}
                      placeholder="Nhập mô tả ngắn..."
                    />
                  </div>

                  {/* Subject & Grade */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Chủ đề</Label>
                      <Select
                        value={String(subjectId)}
                        onValueChange={(v) =>
                          setSubjectId(v === "" ? "" : Number(v))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn chủ đề" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((opt) => (
                            <SelectItem
                              key={String(opt.id)}
                              value={String(opt.id)}
                            >
                              {opt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Khối lớp</Label>
                      <Select
                        value={String(gradeId)}
                        onValueChange={(v) =>
                          setGradeId(v === "" ? "" : Number(v))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn khối lớp" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                            <SelectItem key={g} value={String(g)}>
                              {String(g)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Ngày bắt đầu
                      </Label>
                      <Input
                        type="date"
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Ngày kết thúc
                      </Label>
                      <Input
                        type="date"
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle>Nội dung khóa học</CardTitle>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={handleAddChapter}
                    >
                      <Plus className="w-3 h-3" /> Thêm phần
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chaptersLocal && chaptersLocal.length > 0 ? (
                    chaptersLocal.map((ch, chIndex) => (
                      <div
                        key={`${String(ch.id ?? "new")}-${chIndex}`}
                        className="border border-[#E5E5E5] rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-full">
                            {/* Chapter Name */}
                            <p className="text-base w-full text-[#171717] font-semibold border-b pb-1 mb-1 focus:outline-none">
                              {ch.name}
                            </p>
                            <p className="text-sm w-full text-gray-400 pb-1 focus:outline-none">
                              {ch.description}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 ml-4 mt-1">
                            <Button
                              variant="ghost"
                              className="p-2 border rounded-md hover:bg-muted transition-colors"
                              onClick={() => openChapterModal(ch.id, "edit")}
                              title="Chỉnh sửa chương"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              className="p-2 border rounded-md hover:bg-muted transition-colors"
                              onClick={() => openChapterModal(ch.id, "view")}
                              title="Xem chương"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleDeleteChapter(ch.id)}
                              title="Xóa chương"
                            >
                              <Trash2 className="w-3.5 h-4 text-[#A3A3A3]" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {(ch.lessons ?? []).map((l, idx) => (
                            <div
                              key={`${String(l.id ?? "new")}-${String(
                                ch.id ?? "new"
                              )}-${idx}`}
                              className="bg-[#FAFAFA] rounded h-9 px-2 gap-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              {/* === Left: Tên bài học === */}
                              <div
                                className="flex-1 flex items-center gap-2 cursor-pointer"
                                onClick={() =>
                                  navigate(`/course/teacher/lecture/${l.id}`)
                                }
                                title="Xem chi tiết bài giảng"
                              >
                                <div className="w-2 h-2 rounded-full bg-[#D9D9D9]" />
                                <p className="text-sm text-[#404040] bg-transparent w-full hover:text-[#2563EB] transition-colors">
                                  {l.name}
                                </p>
                              </div>

                              {/* === Right: Action buttons === */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[#8A8A8A] mr-3">
                                  {l.type}
                                </span>

                                <Button
                                  variant="ghost"
                                  className="p-1 hover:bg-gray-100 rounded"
                                  title="Xem chi tiết"
                                  onClick={() =>
                                    navigate(`/course/teacher/lecture/${l.id}`)
                                  }
                                >
                                  <Eye className="w-4 h-4 text-[#525252]" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  className="p-1 hover:bg-gray-100 rounded"
                                  title="Chỉnh sửa"
                                  onClick={() =>
                                    navigate(
                                      `/course/teacher/edit-lecture/${l.id}`
                                    )
                                  }
                                >
                                  <Edit2 className="w-4 h-4 text-[#525252]" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  className="p-1 hover:bg-gray-100 rounded text-rose-600"
                                  title="Xóa bài giảng"
                                  onClick={() => deleteLesson(l.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            onClick={() => handleAddLessonToChapter(ch.id)}
                            className="w-full h-[38px] border-dashed border-[#D4D4D4] rounded flex items-center justify-center gap-2 text-sm text-[#525252] hover:bg-gray-50"
                          >
                            <Plus className="w-3 h-3.5" /> Thêm bài học
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">
                      Chưa có mô-đun nào. Sử dụng Thêm bài học để tạo nội dung.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hình thu nhỏ khóa học</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {/* Vùng hiển thị hoặc xem trước ảnh */}
                    <div
                      className="relative h-44 w-full rounded-lg border border-dashed border-gray-300 
                 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 
                 transition group overflow-hidden"
                    >
                      {thumbnailPreview || selectedCourse?.imageUrl ? (
                        <>
                          <img
                            src={
                              thumbnailPreview ??
                              selectedCourse?.imageUrl ??
                              undefined
                            }
                            alt="thumbnail"
                            className="h-full w-full object-cover rounded-lg"
                          />
                          <div
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 
                       flex items-center justify-center text-white text-sm transition"
                          >
                            Nhấn “Tải lên hình ảnh mới” để thay đổi
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-gray-500 font-medium">
                            Chưa có hình thu nhỏ
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            (Hỗ trợ JPG, PNG — tối đa 5MB)
                          </p>
                        </>
                      )}
                    </div>

                    {/* Khu vực chọn và tải lên ảnh */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Hidden file input triggered by a shadcn Button */}
                      <input
                        ref={fileInputRef}
                        id="thumbnail-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files && e.target.files[0];
                          if (f) {
                            setThumbnailFile(f);
                            setThumbnailPreview(URL.createObjectURL(f));
                          } else {
                            setThumbnailFile(null);
                            setThumbnailPreview(null);
                          }
                        }}
                      />

                      <Button
                        className="inline-flex items-center justify-center px-4 py-2 bg-[#f28d3d] text-white text-sm font-medium rounded-lg hover:bg-[#e77c1e] transition shadow-sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Chọn ảnh
                      </Button>

                      <Button
                        variant="outline"
                        className="border-[#f28d3d] text-[#f28d3d] hover:bg-[#f28d3d] hover:text-white 
                   transition font-medium"
                        onClick={async () => {
                          if (!thumbnailFile)
                            return setDialog({
                              open: true,
                              title: "Thiếu thông tin",
                              message: "Vui lòng chọn ảnh trước",
                            });
                          if (!uploadThumbnail)
                            return setDialog({
                              open: true,
                              title: "Thất bại",
                              message: "Upload không khả dụng",
                            });
                          try {
                            setThumbnailUploading(true);
                            const url = await uploadThumbnail(thumbnailFile);
                            setThumbnailPreview(url);
                            setDialog({
                              open: true,
                              title: "Thành công",
                              message: "Lưu ảnh thành công",
                            });
                          } catch (err) {
                            console.error("Upload failed", err);
                            setDialog({
                              open: true,
                              title: "Thất bại",
                              message: "Upload hình thất bại",
                            });
                          } finally {
                            setThumbnailUploading(false);
                          }
                        }}
                      >
                        {thumbnailUploading ? (
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
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cài đặt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Giá khóa học</Label>
                      <Input
                        type="number"
                        value={price || ""}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-4">
                      {status === "Đóng" ? (
                        <p className="text-sm text-gray-500 mt-1 italic">
                          ⚠️ Khóa học đã đóng — không thể thay đổi trạng thái.
                        </p>
                      ) : (
                        <>
                          <Label>Trạng thái</Label>
                          <Select
                            value={status}
                            onValueChange={(v) => setStatus(v)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mở">Đang mở</SelectItem>
                              <SelectItem value="Nháp">Nháp</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      )}

                      <div className="text-xs text-[#8A8A8A]">
                        <div>
                          Cập nhật gần nhất{" "}
                          <span className="float-right">
                            {formatDate(
                              selectedCourse?.updatedAt ??
                                selectedCourse?.createdAt
                            )}
                          </span>
                        </div>
                        <div>
                          Được tạo vào{" "}
                          <span className="float-right">
                            {formatDate(selectedCourse?.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isFeatured}
                        onCheckedChange={(v) => setIsFeatured(!!v)}
                      />
                      <Label>Khóa học nổi bật</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
      {/* Chapter Modal */}
      {isChapterModalOpen && modalChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-[720px] rounded shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                {modalChapterMode === "view" ? "View Section" : "Edit Section"}
              </h3>
              <div className="flex items-center gap-2">
                {/* <button
                  onClick={closeChapterModal}
                  className="text-sm text-gray-600"
                >
                  Close
                </button> */}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                <Label>Tiêu đề phần</Label>
                <Input
                  value={modalChapter.name}
                  onChange={(e) =>
                    setModalChapter({ ...modalChapter, name: e.target.value })
                  }
                  disabled={modalChapterMode === "view"}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-4">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={(modalChapter as any).description ?? ""}
                    onChange={(e) =>
                      setModalChapter({
                        ...modalChapter,
                        description: e.target.value,
                      })
                    }
                    disabled={modalChapterMode === "view"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-4">
                    <Label>Số lượng bài học</Label>
                    <div className="text-sm text-[#404040] py-2">
                      {(modalChapter?.lessons || []).length ?? 0}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label>Ngày đăng</Label>
                    <Input
                      type="date"
                      value={
                        (modalChapter as any).postDate
                          ? new Date((modalChapter as any).postDate)
                              .toISOString()
                              .slice(0, 10)
                          : ""
                      }
                      onChange={(e) =>
                        setModalChapter({
                          ...modalChapter,
                          postDate: e.target.value
                            ? new Date(e.target.value)
                            : null,
                        })
                      }
                      disabled={modalChapterMode === "view"}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Bài học</Label>
                <div className="space-y-2">
                  {(modalChapter.lessons || []).map((ls, idx) => (
                    <div
                      key={`${String(ls.id ?? "new")}-modal-${idx}`}
                      className="flex items-center justify-between bg-[#FAFAFA] rounded p-2"
                    >
                      <div>{ls.name}</div>
                      <div className="flex gap-2">
                        <Button
                          variant="link"
                          className="text-sm"
                          onClick={() =>
                            navigate(`/course/teacher/lecture/${ls.id}`)
                          }
                        >
                          Xem
                        </Button>
                        <Button
                          variant="link"
                          className="text-sm"
                          onClick={() =>
                            navigate(`/course/teacher/edit-lecture/${ls.id}`)
                          }
                        >
                          Chỉnh sửa
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={closeChapterModal}
                  disabled={chapterModalSaving}
                >
                  Đóng
                </Button>
                {modalChapterMode === "edit" && (
                  <Button
                    onClick={saveModalChapter}
                    disabled={chapterModalSaving}
                  >
                    {chapterModalSaving ? "Đang lưu..." : "Lưu phần"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <AppDialog dialog={dialog} setDialog={setDialog} />
    </div>
  );
};

export default EditCourse;
