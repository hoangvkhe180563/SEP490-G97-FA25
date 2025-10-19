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
  Video,
  Plus,
  Eye,
  Edit2,
  Pencil,
} from "lucide-react";
// AddLessonButton replaced with inline clickable element to avoid nested button issues
import { documentService } from "@/documentManagement/services/documentService";
import { useLectureStore } from "@/courseManagement/stores/useLectureStore";
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

  // form state
  const [name, setName] = useState("");
  const [information, setInformation] = useState("");
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [gradeId, setGradeId] = useState<number | "">("");
  const [status, setStatus] = useState<boolean | undefined>(undefined);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  // Lecture state: fetch chapters and keep a local editable copy
  const fetchChapters = useLectureStore((s) => s.fetchChapters);
  const chaptersFromStore = useLectureStore((s) => s.chapters);
  const createChapter = useLectureStore((s) => s.createChapter);
  const fetchCourseById = useCourseStore((s) => s.fetchCourseById);

  // stabilize store function references to avoid re-triggering effects
  const fetchCourseByIdRef = useRef(fetchCourseById);
  const fetchChaptersRef = useRef(fetchChapters);

  useEffect(() => {
    fetchCourseByIdRef.current = fetchCourseById;
  }, [fetchCourseById]);

  useEffect(() => {
    fetchChaptersRef.current = fetchChapters;
  }, [fetchChapters]);
  const deleteChapterStore = useLectureStore((s) => s.deleteChapter);
  // createLessonStore not used here anymore; AddLecture page handles creation
  const updateChapterStore = useLectureStore((s) => s.updateChapter);
  const fetchChapter = useLectureStore((s) => s.fetchChapter);
  const deleteLessonStore = useLectureStore((s) => s.deleteLesson);
  // lesson delete is handled here via store
  const [chaptersLocal, setChaptersLocal] = useState<ChapterListDto[]>([]);
  // chapter modal (repurposed) state
  const [modalChapter, setModalChapter] = useState<ChapterListDto | undefined>(
    undefined
  );
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [chapterModalSaving, setChapterModalSaving] = useState(false);
  const [modalChapterMode, setModalChapterMode] = useState<"view" | "edit">(
    "view"
  );

  // keep a ref to modalChapter so sync effects can read its latest value
  // without including it in dependency arrays (which would overwrite user edits)
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
    }

    if (!chaptersLen || chaptersLen === 0) {
      fetchChaptersRef.current(courseId);
    }
    // depend on courseId, selectedCourse id and chapters length only
  }, [courseId, selectedId, chaptersLen]);

  // if navigating to edit a different course, clear local form while new course loads
  useEffect(() => {
    let mounted = true;
    if (!courseId) return;
    if (!selectedCourse || (selectedCourse as any).id !== courseId) {
      // clear form so stale values from previous course aren't shown
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
    setSubjectId(selectedCourse.category ?? "");
    setGradeId(
      (selectedCourse as any).gradeId ?? (selectedCourse as any).grade ?? ""
    );
    setStatus(selectedCourse.status ?? undefined);
    setIsFeatured((selectedCourse as any).isFeatured ?? false);
  }, [selectedCourse]);

  // When the store chapters change (from API), populate local editable copy
  useEffect(() => {
    if (chaptersFromStore && chaptersFromStore.length > 0) {
      setChaptersLocal(chaptersFromStore);
    } else if (selectedCourse?.chapters) {
      setChaptersLocal(selectedCourse.chapters as ChapterListDto[]);
    } else {
      setChaptersLocal([]);
    }
  }, [chaptersFromStore, selectedCourse]);

  // if chaptersLocal changes (e.g. lesson added/removed), keep modalChapter in sync
  // NOTE: don't include modalChapter in the dependency list — updating modalChapter
  // from inputs would retrigger this effect and overwrite user edits. Instead,
  // only sync when the chapter's lessons length changed (so the read-only
  // numberOfLessons stays up-to-date when lessons are added/removed elsewhere).
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
    // only run when chaptersLocal changes
  }, [chaptersLocal]);

  const updateChapterName = (chapterId: number, name: string) => {
    setChaptersLocal((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, name } : ch))
    );
  };

  // chapter saving is now handled via the chapter modal saveModalChapter

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
      return alert("Open this page from a course to add a section.");
    // create a local, temporary chapter object (no server call yet)
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
        // remove locally
        setChaptersLocal((prev) => prev.filter((c) => c.id !== id));
        // refresh from server to ensure consistency
        if (fetchChaptersRef.current) await fetchChaptersRef.current(courseId);
      } else alert("Delete failed");
    } catch (err) {
      console.error("delete chapter failed", err);
      alert("Delete failed");
    }
  };

  const handleAddLessonToChapter = async (chapterId: number) => {
    // Navigate to the Add Lecture page with courseId and chapterId
    // so the creation flow is handled in AddLecture and returns a proper id.
    const qp = new URLSearchParams();
    if (courseId) qp.set("courseId", String(courseId));
    if (chapterId) qp.set("chapterId", String(chapterId));
    qp.set("type", "video");
    navigate(`/course/teacher/add-lecture?${qp.toString()}`);
  };

  // Lessons are edited/viewed on their own pages now (EditLecture / LectureDetails)

  const deleteLesson = async (lessonId: number) => {
    console.log("delete lesson", lessonId);
    const ok = confirm("Delete this lesson?");
    if (!ok) return;
    if (!deleteLessonStore) {
      alert("Delete unavailable");
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
        alert("Lesson deleted");
      } else {
        alert("Delete failed");
      }
    } catch (err) {
      console.error("delete lesson failed", err);
      alert("Delete failed");
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
    // if the modal was opened for a temporary (unsaved) chapter, remove it
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
    if (!updateChapterStore) return alert("Save unavailable");
    setChapterModalSaving(true);
    try {
      const dto: any = {
        name: modalChapter.name,
        courseId: modalChapter.courseId,
        status: modalChapter.status ?? true,
        // new chapter fields
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
          status: l.status ?? null,
          type: l.type ?? "Video",
          videoUrl: (l as any).videoUrl ?? null,
          readingContent: (l as any).readingContent ?? null,
        })),
      };
      // if this is a temporary chapter (negative id), create it on the server
      if ((modalChapter as any).id < 0) {
        if (!createChapter) {
          alert("Create unavailable");
          return;
        }
        const created = await createChapter(dto);
        if (created && created.id) {
          // replace temp with created
          setChaptersLocal((prev) =>
            prev.map((c) => (c.id === (modalChapter as any).id ? created : c))
          );
          alert("Section created");
          closeChapterModal();
        } else {
          alert("Create failed");
        }
      } else {
        const updated = await updateChapterStore(modalChapter.id, dto);
        if (updated) {
          setChaptersLocal((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
          alert("Section saved");
          closeChapterModal();
        } else {
          alert("Save failed");
        }
      }
    } catch (err) {
      console.error("save chapter failed", err);
      alert("Save failed");
    } finally {
      setChapterModalSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-[#525252] mb-3">Courses / Edit Course</div>

        {/* Page Header */}
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
                Edit Course
              </h1>
              <p className="text-sm text-[#525252]">
                Modify course details and content
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setSaving(true);
                try {
                  if (!updateCourse) return;
                  const chaptersPayload = (chaptersLocal || []).map((ch) => ({
                    name: ch.name,
                    courseId: ch.courseId ?? courseId,
                    status: ch.status ?? null,
                    // include new chapter-level fields
                    description: (ch as any).description ?? null,
                    numberOfLessons:
                      (ch as any).numberOfLessons ??
                      (ch.lessons || []).length ??
                      0,
                    duration: (ch as any).duration ?? null,
                    postDate: (ch as any).postDate ?? null,
                    difficultyLevel: (ch as any).difficultyLevel ?? null,
                    resourceUrl: (ch as any).resourceUrl ?? null,
                    lessons: (ch.lessons || []).map((l) => ({
                      name: l.name,
                      chapterId: ch.id,
                      status: l.status ?? null,
                      type: l.type ?? "Video",
                      videoUrl: (l as any).videoUrl ?? null,
                      readingContent: (l as any).readingContent ?? null,
                    })),
                  }));

                  const dto: any = {
                    name,
                    information,
                    imageUrl: selectedCourse?.imageUrl ?? null,
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
                  };

                  await updateCourse(courseId, dto);
                  alert("Course updated successfully");
                  navigate(`/course/teacher/courses`);
                } catch (err) {
                  console.error("Update failed", err);
                  alert("Update failed");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Course title, description and meta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label>Course Title</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter course title"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Textarea
                      value={information}
                      onChange={(e) => setInformation(e.target.value)}
                      rows={4}
                      placeholder="Enter short description..."
                    />
                  </div>

                  {/* Subject & Grade */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select
                        value={String(subjectId)}
                        onValueChange={(v) =>
                          setSubjectId(v === "" ? "" : Number(v))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select subject" />
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
                      <Label>Grade</Label>
                      <Select
                        value={String(gradeId)}
                        onValueChange={(v) =>
                          setGradeId(v === "" ? "" : Number(v))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select grade" />
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
                    <CardTitle>Course Content</CardTitle>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={handleAddChapter}
                    >
                      <Plus className="w-3 h-3" /> Add Section
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
                            <Plus className="w-3 h-3.5" /> Add Lesson
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">
                      No modules yet. Use Add Lesson to create content.
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
                  <CardTitle>Course Thumbnail</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-36 bg-[#D9D9D9] rounded flex flex-col items-center justify-center text-sm text-[#666]">
                      <Upload className="w-6 h-6 text-[#666] mb-2" />
                      <div>Course Thumbnail</div>
                    </div>
                    <Button variant="outline">Upload New Image</Button>
                    <div className="mt-3 border-2 border-dashed border-[#D4D4D4] rounded-lg h-[120px] flex flex-col items-center justify-center">
                      <Video className="w-6 h-6 text-[#A3A3A3] mb-2" />
                      <div className="text-sm text-[#525252]">
                        Preview Video
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Course Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-base text-[#737373]">
                          $
                        </span>
                        <Input
                          className="pl-8"
                          value={price ?? ""}
                          onChange={(e) =>
                            setPrice(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
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
                      <Label>Featured Course</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label>Publication Status</Label>
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Published" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="text-xs text-[#8A8A8A]">
                      <div>
                        Last Updated{" "}
                        <span className="float-right">Jan 15, 2025</span>
                      </div>
                      <div>
                        Created <span className="float-right">Dec 1, 2024</span>
                      </div>
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
                <Label>Section Title</Label>
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
                  <Label>Description</Label>
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
                    <Label>Number of Lessons</Label>
                    <div className="text-sm text-[#404040] py-2">
                      {(modalChapter?.lessons || []).length ?? 0}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label>Post Date</Label>
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
                <Label>Lessons</Label>
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
                          View
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/course/teacher/edit-lecture/${ls.id}`)
                          }
                          className="text-sm"
                        >
                          Edit
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
                  Close
                </Button>
                {modalChapterMode === "edit" && (
                  <Button
                    onClick={saveModalChapter}
                    disabled={chapterModalSaving}
                  >
                    {chapterModalSaving ? "Saving..." : "Save Section"}
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
