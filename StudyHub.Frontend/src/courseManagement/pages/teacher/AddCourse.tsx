import React, { useEffect, useState, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parse } from "date-fns";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, Loader2, Upload, HelpCircle, Calendar } from "lucide-react";
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
import { documentService } from "@/documentManagement/services/documentService";
import type { DialogProps } from "@/courseManagement/components/AppDialog";
import { AppDialog } from "@/courseManagement/components/AppDialog";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { formatISO } from "date-fns";

const AddCourse: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<DialogProps>({
    open: false,
    title: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createCourse = useCourseStore((s) => s.createCourse);
  const uploadThumbnail = useCourseStore((s) => s.uploadThumbnail);
  const authUser = useAuthStore((s) => s.user);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [grade, setGrade] = useState<number | "">("");
  const [SubjectId, setSubjectId] = useState<number | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<string | "">("");
  const [difficulty, setDifficulty] = useState<
    "" | "Beginner" | "Intermediate" | "Advanced"
  >("");
  const [length, setLength] = useState<"" | "Short" | "Medium" | "Long">("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [selectedStart, setSelectedStart] = useState<Date | undefined>(
    undefined
  );
  const [selectedEnd, setSelectedEnd] = useState<Date | undefined>(undefined);

  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);

  const load = async () => {
    try {
      const s = await documentService.getSubjects();
      setSubjects(s || []);
    } catch (err) {
      console.error("Failed to load subjects", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // initialize date pickers if values already present (accept dd/MM/yyyy or ISO)
  useEffect(() => {
    if (startAt) {
      try {
        const d = parse(String(startAt), "dd/MM/yyyy", new Date());
        if (!isNaN(d.getTime())) setSelectedStart(d);
        else {
          const d2 = new Date(startAt);
          if (!isNaN(d2.getTime())) setSelectedStart(d2);
        }
      } catch (e) {
        /* ignore */
      }
    }

    if (endAt) {
      try {
        const d = parse(String(endAt), "dd/MM/yyyy", new Date());
        if (!isNaN(d.getTime())) setSelectedEnd(d);
        else {
          const d2 = new Date(endAt);
          if (!isNaN(d2.getTime())) setSelectedEnd(d2);
        }
      } catch (e) {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    const newErrors: Record<string, string> = {};
    if (!title || !title.trim()) newErrors.title = "Tên khóa học là bắt buộc.";
    if (!description || !String(description).trim())
      newErrors.description = "Mô tả khóa học là bắt buộc.";
    else if (description.length > 1000)
      newErrors.description = "Độ dài mô tả khóa học không quá 1000 ký tự.";
    if (!SubjectId) newErrors.subjectId = "Vui lòng chọn môn học.";
    if (!authUser?.id) newErrors.auth = "Bạn phải đăng nhập để tạo khóa học.";

    if (price === null || price === undefined) {
      newErrors.price = "Vui lòng nhập giá khóa học.";
    } else if (isNaN(Number(price)) || Number(price) < 0) {
      newErrors.price = "Giá phải là số >= 0.";
    }

    if (grade === "" || isNaN(Number(grade)))
      newErrors.grade = "Vui lòng chọn khối lớp hợp lệ.";
    else if (Number(grade) < 1 || Number(grade) > 12)
      newErrors.grade = "Khối lớp phải trong khoảng 1 - 12.";

    if (!status || !String(status).trim())
      newErrors.status = "Vui lòng chọn trạng thái.";

    if (!difficulty || !String(difficulty).trim())
      newErrors.difficulty = "Vui lòng chọn độ khó.";
    if (!length || !String(length).trim())
      newErrors.length = "Vui lòng chọn độ dài.";

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (!startAt || !String(startAt).trim()) {
      newErrors.startAt = "Vui lòng chọn Ngày bắt đầu.";
    } else {
      try {
        startDate = parse(String(startAt), "dd/MM/yyyy", new Date());
        if (isNaN(startDate.getTime())) {
          const alt = new Date(startAt);
          if (!isNaN(alt.getTime())) startDate = alt;
          else newErrors.startAt = "Ngày bắt đầu không hợp lệ.";
        }
      } catch (e) {
        newErrors.startAt = "Ngày bắt đầu không hợp lệ.";
      }
    }

    if (!endAt || !String(endAt).trim()) {
      newErrors.endAt = "Vui lòng chọn Ngày kết thúc.";
    } else {
      try {
        endDate = parse(String(endAt), "dd/MM/yyyy", new Date());
        if (isNaN(endDate.getTime())) {
          const alt = new Date(endAt);
          if (!isNaN(alt.getTime())) endDate = alt;
          else newErrors.endAt = "Ngày kết thúc không hợp lệ.";
        }
      } catch (e) {
        newErrors.endAt = "Ngày kết thúc không hợp lệ.";
      }
    }

    if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
      newErrors.endAt =
        "Ngày kết thúc phải sau hoặc cùng ngày với ngày bắt đầu.";
    }

    if (thumbnailFile && thumbnailFile.size > 5 * 1024 * 1024)
      newErrors.thumbnailFile = "Kích thước ảnh thu nhỏ tối đa 5MB.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    try {
      const dto = {
        name: title.trim(),
        information: description || null,
        imageUrl: thumbnailPreview ?? null,
        difficulty: difficulty as "Beginner" | "Intermediate" | "Advanced",
        length: length as "Short" | "Medium" | "Long",
        price: price === null ? 0 : Number(price),
        grade: grade === "" ? 0 : Number(grade),
        SubjectId: Number(SubjectId),
        schoolId: authUser?.schoolId ?? null,
        isFeatured: isFeatured,
        status: status,
        createdAt: formatISO(new Date()),
        startAt: startDate ? formatISO(startDate) : formatISO(new Date()),
        endAt: endDate ? formatISO(endDate) : formatISO(new Date()),
        createdBy: authUser?.id ?? "",
        isApproved: true,
      };

      const created = await createCourse(dto);
      if (created && created.id) {
        setDialog({
          open: true,
          title: "Thành công",
          message: "Tạo khóa học thành công.",
          navigateTo: "/course/teacher/courses",
        });
      } else {
        setDialog({
          open: true,
          title: "Thất bại",
          message: "Tạo khóa học thất bại. Vui lòng thử lại.",
        });
      }
    } catch (err) {
      console.error("create course failed", err);
      setDialog({
        open: true,
        title: "Lỗi hệ thống",
        message: (err as any)?.message || "Có lỗi xảy ra khi tạo khóa học.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-6 h-full flex flex-col">
      <div>
        <Breadcrumb>
          <BreadcrumbList className="text-[#525252] mb-3">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <a href="/course/teacher/courses">Khóa học</a>
              </BreadcrumbLink>
              <BreadcrumbSeparator />
            </BreadcrumbItem>

            <BreadcrumbItem>
              <BreadcrumbPage>Thêm khóa học</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

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
                Thêm khóa học
              </h1>
              <p className="text-sm text-[#525252]">
                Thêm khóa học mới cho học sinh của bạn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/course/teacher/courses")}
            >
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Đang tạo..." : "Tạo khóa học"}
            </Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-8 overflow-y-auto flex-1 scrollbar-hide">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8">
          <Card className="shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#171717]">
                🧾 Thông tin cơ bản
              </CardTitle>
              <CardDescription>
                Vui lòng điền đầy đủ các trường bên dưới
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                {/* Tên khóa học */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Tên khóa học <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) setErrors((s) => ({ ...s, title: "" }));
                    }}
                    placeholder="Nhập tên khóa học..."
                    className={`h-10 ${
                      errors.title ? "border-red-500 ring-1 ring-red-500" : ""
                    }`}
                  />
                  {errors.title && (
                    <div className="text-sm text-red-600 mt-1">
                      {errors.title}
                    </div>
                  )}
                </div>

                {/* Mô tả */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Mô tả <span className="text-red-600">*</span>
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description)
                        setErrors((s) => ({ ...s, description: "" }));
                    }}
                    placeholder="Viết mô tả ngắn gọn về khóa học..."
                    className={`min-h-[100px] ${
                      errors.description
                        ? "border-red-500 ring-1 ring-red-500"
                        : ""
                    }`}
                  />
                  {errors.description && (
                    <div className="text-sm text-red-600 mt-1">
                      {errors.description}
                    </div>
                  )}
                </div>

                {/* Môn học + Khối lớp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Môn học <span className="text-red-600">*</span>
                    </Label>
                    <Select
                      value={SubjectId ? String(SubjectId) : ""}
                      onValueChange={(v) => {
                        setSubjectId(Number(v));
                        if (errors.subjectId)
                          setErrors((s) => ({ ...s, subjectId: "" }));
                      }}
                    >
                      <SelectTrigger
                        className={`w-full ${
                          errors.subjectId
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Chọn môn học" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subjectId && (
                      <div className="text-sm text-red-600 mt-1">
                        {errors.subjectId}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Khối lớp <span className="text-red-600">*</span>
                    </Label>
                    <Select
                      value={String(grade)}
                      onValueChange={(v) => {
                        setGrade(v === "" ? "" : Number(v));
                        if (errors.grade)
                          setErrors((s) => ({ ...s, grade: "" }));
                      }}
                    >
                      <SelectTrigger
                        className={`w-full ${
                          errors.grade
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Chọn khối lớp" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                          <SelectItem key={g} value={String(g)}>
                            Lớp {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.grade && (
                      <div className="text-sm text-red-600 mt-1">
                        {errors.grade}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ngày bắt đầu / kết thúc */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Ngày bắt đầu <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="dd/MM/yyyy"
                        value={startAt}
                        readOnly
                        onClick={() => {
                          setStartOpen((s) => !s);
                          if (errors.startAt)
                            setErrors((s) => ({ ...s, startAt: "" }));
                        }}
                        className={`w-full ${
                          errors.startAt
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() => setStartOpen((s) => !s)}
                        className="absolute right-2 top-2 p-1"
                        aria-label="Open calendar"
                      >
                        <Calendar size={16} />
                      </button>

                      {startOpen && (
                        <div className="absolute z-50 mt-2 bg-white rounded-md shadow p-2">
                          <DayPicker
                            mode="single"
                            selected={selectedStart}
                            onSelect={(d) => {
                              if (d) {
                                setSelectedStart(d);
                                const s = format(d, "dd/MM/yyyy");
                                setStartAt(s);
                                if (errors.startAt)
                                  setErrors((s) => ({ ...s, startAt: "" }));
                              }
                              setStartOpen(false);
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {errors.startAt && (
                      <div className="text-sm text-red-600 mt-1">
                        {errors.startAt}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Ngày kết thúc <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="dd/MM/yyyy"
                        value={endAt}
                        readOnly
                        onClick={() => {
                          setEndOpen((s) => !s);
                          if (errors.endAt)
                            setErrors((s) => ({ ...s, endAt: "" }));
                        }}
                        className={`w-full ${
                          errors.endAt
                            ? "border-red-500 ring-1 ring-red-500"
                            : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setEndOpen((s) => !s)}
                        className="absolute right-2 top-2 p-1"
                        aria-label="Open calendar"
                      >
                        <Calendar size={16} />
                      </button>

                      {endOpen && (
                        <div className="absolute z-50 mt-2 bg-white rounded-md shadow p-2">
                          <DayPicker
                            mode="single"
                            selected={selectedEnd}
                            onSelect={(d) => {
                              if (d) {
                                setSelectedEnd(d);
                                const s = format(d, "dd/MM/yyyy");
                                setEndAt(s);
                                if (errors.endAt)
                                  setErrors((s) => ({ ...s, endAt: "" }));
                              }
                              setEndOpen(false);
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {errors.endAt && (
                      <div className="text-sm text-red-600 mt-1">
                        {errors.endAt}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Phương tiện truyền thông khóa học</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="font-semibold text-base text-gray-800">
                      Hình thu nhỏ khóa học{" "}
                    </Label>

                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          aria-label="Hướng dẫn tải ảnh"
                          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[300px] p-3">
                        <div className="text-sm text-gray-700">
                          <div className="font-medium mb-2">
                            Hướng dẫn tải ảnh
                          </div>
                          <ol className="list-decimal pl-5 space-y-1">
                            <li>
                              Nhấn nút "Chọn ảnh" và chọn file từ máy tính.
                            </li>
                            <li>
                              Sau khi đã chọn ảnh, nhấn nút "Tải lên" để gửi ảnh
                              lên server.
                            </li>
                            <li>
                              Chờ thông báo popup "Tải lên hình ảnh thành công"
                              trước khi tiếp tục các thao tác khác.
                            </li>
                          </ol>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Vùng xem trước ảnh */}
                  <div
                    className={`mt-3 relative flex items-center justify-center rounded-xl border-2 border-dashed 
                                ${
                                  thumbnailPreview
                                    ? "border-transparent"
                                    : "border-gray-300"
                                } 
                                bg-gray-50 hover:bg-gray-100 transition h-52 overflow-hidden`}
                  >
                    {thumbnailPreview ? (
                      <>
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="h-full w-full object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition flex items-center justify-center">
                          <p className="text-white text-sm font-medium">
                            Nhấn “Tải lên hình ảnh mới” để thay đổi
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                        <p className="text-gray-600 font-medium">
                          Chưa có hình thu nhỏ
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          (JPG, PNG, tối đa 5MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Input + Button */}
                  <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Hidden native file input; triggered by the Choose button */}
                    <input
                      ref={fileInputRef}
                      id="thumbnailInput"
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
                      variant="outline"
                      className="border-[#f28d3d] text-[#f28d3d] hover:bg-[#f28d3d] hover:text-white font-medium transition-all"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Chọn ảnh
                    </Button>

                    <div className="flex-1 text-sm text-gray-700 break-words">
                      {thumbnailFile ? thumbnailFile.name : "Chưa chọn ảnh"}
                    </div>

                    {errors.thumbnailFile && (
                      <div className="text-sm text-red-600 mt-1">
                        {errors.thumbnailFile}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="border-[#f28d3d] text-[#f28d3d] hover:bg-[#f28d3d] hover:text-white font-medium transition-all"
                      onClick={async () => {
                        if (!thumbnailFile)
                          return setDialog({
                            open: true,
                            title: "Quên chưa chọn ảnh",
                            message: "Vui lòng chọn ảnh trước khi tải lên.",
                          });
                        try {
                          setThumbnailUploading(true);
                          const url = await uploadThumbnail(thumbnailFile);
                          setThumbnailPreview(url);
                          setDialog({
                            open: true,
                            title: "Thành công",
                            message: "Tải lên hình ảnh thành công.",
                          });
                        } catch (err) {
                          console.error("Upload failed", err);
                          setDialog({
                            open: true,
                            title: "Thất bại",
                            message: "Có lỗi xảy ra khi tải lên hình ảnh.",
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt khóa học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Giá khóa học <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={price === null ? "" : price}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setPrice(null);
                      } else {
                        setPrice(parseFloat(value));
                      }
                      if (errors.price) setErrors((s) => ({ ...s, price: "" }));
                    }}
                    placeholder="Nhập giá"
                    className={
                      errors.price ? "border-red-500 ring-1 ring-red-500" : ""
                    }
                  />
                  {errors.price && (
                    <div className="text-sm text-red-600 mt-1">
                      {errors.price}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>
                    Độ khó <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={difficulty}
                    onValueChange={(v) => {
                      setDifficulty(v as any);
                      if (errors.difficulty)
                        setErrors((s) => ({ ...s, difficulty: "" }));
                    }}
                  >
                    <SelectTrigger
                      className={`w-full ${
                        errors.difficulty
                          ? "border-red-500 ring-1 ring-red-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Chọn độ khó" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Cơ bản</SelectItem>
                      <SelectItem value="Intermediate">Trung cấp</SelectItem>
                      <SelectItem value="Advanced">Nâng cao</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.difficulty && (
                    <div className="text-sm text-red-600 mt-1">
                      {errors.difficulty}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Độ dài <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={length}
                    onValueChange={(v) => {
                      setLength(v as any);
                      if (errors.length)
                        setErrors((s) => ({ ...s, length: "" }));
                    }}
                  >
                    <SelectTrigger
                      className={`w-full ${
                        errors.length
                          ? "border-red-500 ring-1 ring-red-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Chọn độ dài" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Short">Ngắn</SelectItem>
                      <SelectItem value="Medium">Trung bình</SelectItem>
                      <SelectItem value="Long">Dài</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.length && (
                    <div className="text-sm text-red-600 mt-1">
                      {errors.length}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>
                    Trạng thái <span className="text-red-600">*</span>
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(v) => {
                      setStatus(v);
                      if (errors.status)
                        setErrors((s) => ({ ...s, status: "" }));
                    }}
                  >
                    <SelectTrigger
                      className={`w-full ${
                        errors.status
                          ? "border-red-500 ring-1 ring-red-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nháp">Nháp</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <div className="text-sm text-red-600 mt-1">
                      {errors.status}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="featured"
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  <Label htmlFor="featured">Khóa học nổi bật</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
      <AppDialog dialog={dialog} setDialog={setDialog} />
    </div>
  );
};

export default AddCourse;
