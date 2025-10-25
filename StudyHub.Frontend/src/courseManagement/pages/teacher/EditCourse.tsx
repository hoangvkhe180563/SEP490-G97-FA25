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
import { Label } from "@/common/components/ui/label";
import {
  ArrowLeft,
  Trash2,
  Upload,
  Plus,
  Eye,
  Edit2,
  Pencil,
} from "lucide-react";
import { documentService } from "@/documentManagement/services/documentService";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import type {
  ChapterListDto,
  LessonListDto,
  CourseListDto,
} from "@/courseManagement/types/api";

const EditCourse: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const courseId = Number(id || 0);

  const selectedCourse = useCourseStore(
    (s) => s.selectedCourse as CourseListDto | undefined
  );
  const updateCourse = useCourseStore((s) => s.updateCourse);

  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await documentService.getSubjects();
        setSubjects(s || []);
      } catch (err) {
        console.error("Failed to load subjects", err);
      }
    };
    load();
  }, []);

  const [name, setName] = useState("");
  const [information, setInformation] = useState("");
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [gradeId, setGradeId] = useState<number | "">("");
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const fetchChapters = useLectureStore((s) => s.fetchChapters);
  const chaptersFromStore = useLectureStore((s) => s.chapters);
  const createChapter = useLectureStore((s) => s.createChapter);
  const fetchCourseById = useCourseStore((s) => s.fetchCourseById);
  const uploadThumbnail = useCourseStore((s) => s.uploadThumbnail);

  const fetchCourseByIdRef = useRef(fetchCourseById);
  const fetchChaptersRef = useRef(fetchChapters);

  useEffect(() => {
    fetchCourseByIdRef.current = fetchCourseById;
  }, [fetchCourseById]);

  useEffect(() => {
    fetchChaptersRef.current = fetchChapters;
  }, [fetchChapters]);
  const deleteChapterStore = useLectureStore((s) => s.deleteChapter);
  const updateChapterStore = useLectureStore((s) => s.updateChapter);
  const fetchChapter = useLectureStore((s) => s.fetchChapter);
  const deleteLessonStore = useLectureStore((s) => s.deleteLesson);
  const [chaptersLocal, setChaptersLocal] = useState<ChapterListDto[]>([]);
  const filterAppUsers = useAppUserStore((s) => s.filterAppUsers);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(
    null
  );
  const [modalChapter, setModalChapter] = useState<ChapterListDto | undefined>(
    undefined
  );
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [chapterModalSaving, setChapterModalSaving] = useState(false);
  const [modalChapterMode, setModalChapterMode] = useState<"view" | "edit">(
    "view"
  );

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
        setStatus(undefined);
        setIsFeatured(false);
        setChaptersLocal([]);
      }
    }
    return () => {
      mounted = false;
    };
  }, [courseId, selectedCourse]);

  useEffect(() => {
    if (!selectedCourse) return;
    setName(selectedCourse.name ?? "");
    setInformation(selectedCourse.information ?? "");
    setPrice(selectedCourse.price ?? undefined);
    setSubjectId(selectedCourse.subjectId ?? "");
    setGradeId(
      (selectedCourse as any).gradeId ?? (selectedCourse as any).grade ?? ""
    );
    setStatus(selectedCourse.status ?? undefined);
    setIsFeatured((selectedCourse as any).isFeatured ?? false);
    setSelectedInstructor(
      selectedCourse.updatedBy ?? selectedCourse.createdBy ?? ""
    );
  }, [selectedCourse]);

  useEffect(() => {
    // load teachers for instructor selection
    const loadTeachers = async () => {
      try {
        const res = await filterAppUsers("role=Teacher&page=1&limit=200");
        const items = res?.users ?? [];
        setTeachers(items);
      } catch (err) {
        console.error("Failed to load teachers", err);
      }
    };
    loadTeachers();
  }, [filterAppUsers]);

  const formatDate = (d?: string | null) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return "-";
      return dt.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (_e) {
      return "-";
    }
  };

  useEffect(() => {
    if (chaptersFromStore && chaptersFromStore.length > 0) {
      const belongsToCurrent = chaptersFromStore.every(
        (c: any) => c.courseId === courseId
      );
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

  const updateChapterName = (chapterId: number, name: string) => {
    setChaptersLocal((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, name } : ch))
    );
  };

  const updateLessonName = (
    chapterId: number,
    lessonId: number,
    name: string
  ) => {
    setChaptersLocal((prev) =>
      prev.map((ch) => {
        if (ch.id !== chapterId) return ch;
        return {
          ...ch,
          lessons: (ch.lessons ?? []).map((ls: LessonListDto) =>
            ls.id === lessonId ? { ...ls, name } : ls
          ),
        } as ChapterListDto;
      })
    );
  };

  const handleAddChapter = async () => {
    if (!courseId)
      return alert("Mở trang này từ một khóa học để thêm một phần.");
    const tempId = -Date.now();
    const temp: any = {
      id: tempId,
      courseId,
      name: "New Section",
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

  const handleDeleteChapter = async (id: number) => {
    const ok = confirm("Delete this section and all its lessons?");
    if (!ok) return;
    try {
      const res = deleteChapterStore ? await deleteChapterStore(id) : false;
      if (res) {
        setChaptersLocal((prev) => prev.filter((c) => c.id !== id));
        if (fetchChaptersRef.current) await fetchChaptersRef.current(courseId);
      } else alert("Xóa thất bại");
    } catch (err) {
      console.error("delete chapter failed", err);
      alert("Xóa thất bại");
    }
  };

  const handleAddLessonToChapter = async (chapterId: number) => {
    const qp = new URLSearchParams();
    if (courseId) qp.set("courseId", String(courseId));
    if (chapterId) qp.set("chapterId", String(chapterId));
    qp.set("type", "video");
    navigate(`/course/teacher/add-lecture?${qp.toString()}`);
  };

  const deleteLesson = async (lessonId: number) => {
    console.log("delete lesson", lessonId);
    const ok = confirm("Delete this lesson?");
    if (!ok) return;
    if (!deleteLessonStore) {
      alert("Xóa không khả dụng");
      return;
    }
    try {
      const res = await deleteLessonStore(lessonId);
      if (res) {
        setChaptersLocal((prev) =>
          prev.map((ch) => ({
            ...ch,
            lessons: (ch.lessons || []).filter((ls) => ls.id !== lessonId),
          }))
        );
        alert("Xóa bài giảng thành công");
      } else {
        alert("Xóa thất bại");
      }
    } catch (err) {
      console.error("delete lesson failed", err);
      alert("Xóa thất bại");
    }
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
    if (!updateChapterStore) return alert("Lưu không khả dụng");
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
          alert("Tạo không khả dụng");
          return;
        }
        const created = await createChapter(dto);
        if (created && created.id) {
          setChaptersLocal((prev) =>
            prev.map((c) => (c.id === (modalChapter as any).id ? created : c))
          );
          alert("Lưu Chương thành công");
          closeChapterModal();
        } else {
          alert("Tạo thất bại");
        }
      } else {
        const updated = await updateChapterStore(modalChapter.id, dto);
        if (updated) {
          setChaptersLocal((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
          alert("Lưu Chương thành công");
          closeChapterModal();
        } else {
          alert("Lưu thất bại");
        }
      }
    } catch (err) {
      console.error("save chapter failed", err);
      alert("Lưu thất bại");
    } finally {
      setChapterModalSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-[#525252] mb-3">
          Khóa học / Chỉnh sửa khóa học
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/course/teacher/courses")}
              className="w-8 h-8 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 text-[#525252]" />
            </button>

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
                setSaving(true);
                try {
                  if (!updateCourse) return;
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

                  const dto: any = {
                    name,
                    information,
                    imageUrl:
                      thumbnailPreview ?? selectedCourse?.imageUrl ?? null,
                    price: price ?? 0,
                    category:
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
                    createdAt: selectedCourse?.createdAt ?? new Date(),
                    updatedAt: new Date().toISOString(),
                    updatedBy: selectedInstructor,
                  };

                  console.log("Updating course with data:", dto);
                  await updateCourse(courseId, dto);
                  alert("Cập nhật khóa học thành công");
                  navigate(`/course/teacher/courses`);
                } catch (err) {
                  console.error("Update failed", err);
                  alert("Cập nhật không thành công");
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

        <div className="grid grid-cols-12 gap-8">
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
                        <div className="flex items-center justify-between mb-3">
                          <input
                            value={ch.name}
                            onChange={(e) =>
                              updateChapterName(ch.id, e.target.value)
                            }
                            className="text-base w-full text-[#171717] font-medium border-b pb-1"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openChapterModal(ch.id, "edit")}
                              className="p-2 border rounded-md hover:bg-muted transition-colors"
                              title="Edit section"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => openChapterModal(ch.id, "view")}
                              className="p-2 border rounded-md hover:bg-muted transition-colors"
                              title="View section"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteChapter(ch.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Trash2 className="w-3.5 h-4 text-[#A3A3A3]" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {(ch.lessons ?? []).map((l, idx) => (
                            <div
                              key={`${String(l.id ?? "new")}-${String(
                                ch.id ?? "new"
                              )}-${idx}`}
                              className="bg-[#FAFAFA] rounded h-9 px-2 gap-2 flex items-center justify-between"
                            >
                              <div className="flex-1 flex items-center gap-2">
                                <div className="w-2 h-2  rounded-full bg-[#D9D9D9]" />
                                <input
                                  value={l.name}
                                  onChange={(e) =>
                                    updateLessonName(
                                      ch.id,
                                      l.id,
                                      e.target.value
                                    )
                                  }
                                  className="text-sm text-[#404040] bg-transparent w-full"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[#8A8A8A] mr-3">
                                  {l.type}
                                </span>
                                <button
                                  title="View"
                                  onClick={() =>
                                    navigate(`/course/teacher/lecture/${l.id}`)
                                  }
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <Eye className="w-4 h-4 text-[#525252]" />
                                </button>

                                <button
                                  title="Edit"
                                  onClick={() =>
                                    navigate(
                                      `/course/teacher/edit-lecture/${l.id}`
                                    )
                                  }
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <Edit2 className="w-4 h-4 text-[#525252]" />
                                </button>
                                <button
                                  title="Delete"
                                  onClick={() => deleteLesson(l.id)}
                                  className="p-1 hover:bg-gray-100 rounded text-rose-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => handleAddLessonToChapter(ch.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ")
                                handleAddLessonToChapter(ch.id);
                            }}
                            className="w-full h-[38px] border border-dashed border-[#D4D4D4] rounded flex items-center justify-center gap-2 text-sm text-[#525252] hover:bg-gray-50 cursor-pointer"
                          >
                            <Plus className="w-3 h-3.5" /> Thêm bài học
                          </div>
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
                      {/* Input ẩn + label tùy chỉnh */}
                      <input
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

                      <label
                        htmlFor="thumbnail-upload"
                        className="cursor-pointer inline-flex items-center justify-center px-4 py-2 
                   bg-[#f28d3d] text-white text-sm font-medium rounded-lg 
                   hover:bg-[#e77c1e] transition shadow-sm"
                      >
                        Chọn ảnh
                      </label>

                      <Button
                        variant="outline"
                        className="border-[#f28d3d] text-[#f28d3d] hover:bg-[#f28d3d] hover:text-white 
                   transition font-medium"
                        onClick={async () => {
                          if (!thumbnailFile)
                            return alert("Vui lòng chọn ảnh trước");
                          if (!uploadThumbnail)
                            return alert("Upload không khả dụng");
                          try {
                            const url = await uploadThumbnail(thumbnailFile);
                            setThumbnailPreview(url);
                            alert("Tải lên thành công!");
                          } catch (err) {
                            console.error("Upload failed", err);
                            alert("Upload hình thất bại");
                          }
                        }}
                      >
                        Tải lên hình ảnh mới
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
                      <Label className="font-medium text-base text-gray-800">
                        Giá khóa học
                      </Label>
                      <div className="relative mt-1 w-full flex items-center">
                        <span className="absolute left-3 text-gray-500 text-sm top-1/2 -translate-y-1/2">
                          VNĐ
                        </span>

                        <Input
                          type="number"
                          min={0}
                          step={1000}
                          placeholder="0"
                          className="pl-14 pr-3 py-2 text-right text-base font-semibold text-gray-800 tracking-wide"
                          value={price || ""}
                          onChange={(e) => setPrice(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="featured"
                        type="checkbox"
                        className="w-4 h-4"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                      />
                      <Label>Khóa học nổi bật</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Trạng thái</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label>Trạng thái xuất bản</Label>
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Đã xuất bản" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Nháp</SelectItem>
                        <SelectItem value="published">Đã xuất bản</SelectItem>
                      </SelectContent>
                    </Select>

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
                          {formatDate(selectedCourse?.createdAt ?? null)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Giảng viên</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <Label>Giảng viên chính</Label>
                      <Select
                        value={selectedInstructor ?? ""}
                        onValueChange={(v) => setSelectedInstructor(v || null)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn giảng viên" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.fullname ?? t.username ?? t.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedInstructor ? (
                      <div className="bg-[#FAFAFA] rounded-lg p-3 flex items-center gap-3">
                        <img
                          src={
                            teachers.find(
                              (t) => String(t.id) === selectedInstructor
                            )?.avatarUrl ??
                            "https://api.builder.io/api/v1/image/assets/TEMP/ad7da240b72ac1157e7a1043cd1b1821bb4369b1?width=80"
                          }
                          alt="Instructor"
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="text-sm text-[#171717]">
                            {teachers.find(
                              (t) => String(t.id) === selectedInstructor
                            )?.fullname ?? "Giảng viên"}
                          </div>
                          <div className="text-xs text-[#737373]">
                            {teachers.find(
                              (t) => String(t.id) === selectedInstructor
                            )?.bio ?? "Giảng viên"}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#FAFAFA] rounded-lg p-3 flex items-center gap-3">
                        <img
                          src="https://api.builder.io/api/v1/image/assets/TEMP/ad7da240b72ac1157e7a1043cd1b1821bb4369b1?width=80"
                          alt="Chọn giảng viên"
                          className="w-10 h-10 rounded-full opacity-70"
                        />
                        <div>
                          <div className="text-sm font-medium text-[#171717]">
                            Hãy chọn giảng viên
                          </div>
                          <div className="text-xs text-[#737373]">
                            Chưa có giảng viên được chọn
                          </div>
                        </div>
                      </div>
                    )}
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
                        <button
                          onClick={() =>
                            navigate(`/course/teacher/lecture/${ls.id}`)
                          }
                          className="text-sm"
                        >
                          Xem
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/course/teacher/edit-lecture/${ls.id}`)
                          }
                          className="text-sm"
                        >
                          Chỉnh sửa
                        </button>
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
    </div>
  );
};

export default EditCourse;
