import React, { useEffect, useState } from "react";
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
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { documentService } from "@/documentManagement/services/documentService";
import type { DialogProps } from "@/courseManagement/components/AppDialog";
import { AppDialog } from "@/courseManagement/components/AppDialog";
import { useAuthStore } from "@/auth/stores/useAuthStore";

const AddCourse: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<DialogProps>({
    open: false,
    title: "",
    message: "",
  });
  const createCourse = useCourseStore((s) => s.createCourse);
  const uploadThumbnail = useCourseStore((s) => s.uploadThumbnail);
  const authUser = useAuthStore((s) => s.user);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [price, setPrice] = useState<number | "">("");
  const [grade, setGrade] = useState<number | "">("");
  const [SubjectId, setSubjectId] = useState<number | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<string | "">("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  // const [createdBy, setCreatedBy] = useState("");

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

  const handleCreate = async () => {
    // Validate inputs
    const errors: string[] = [];

    if (!title || !title.trim()) errors.push("Tên khóa học là bắt buộc.");
    if (!SubjectId) errors.push("Vui lòng chọn môn học.");
    if (!authUser?.id) errors.push("Bạn phải đăng nhập để tạo khóa học.");

    // price: allow empty -> treat as 0, otherwise must be number >= 0
    if (price !== "" && (isNaN(Number(price)) || Number(price) < 0))
      errors.push("Giá phải là số >= 0.");

    // grade: must be number between 1-12
    if (grade === "" || isNaN(Number(grade)))
      errors.push("Vui lòng chọn khối lớp hợp lệ.");
    else if (Number(grade) < 1 || Number(grade) > 12)
      errors.push("Khối lớp phải trong khoảng 1 - 12.");

    // status required
    if (!status || !String(status).trim())
      errors.push("Vui lòng chọn trạng thái.");

    // start/end dates: if provided, must be valid and start <= end
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    if (startAt) {
      startDate = new Date(startAt);
      if (isNaN(startDate.getTime())) errors.push("Ngày bắt đầu không hợp lệ.");
    }
    if (endAt) {
      endDate = new Date(endAt);
      if (isNaN(endDate.getTime())) errors.push("Ngày kết thúc không hợp lệ.");
    }
    if (startDate && endDate && startDate.getTime() > endDate.getTime())
      errors.push("Ngày kết thúc phải sau hoặc cùng ngày với ngày bắt đầu.");

    // thumbnail file size limit (optional): 5MB
    if (thumbnailFile && thumbnailFile.size > 5 * 1024 * 1024)
      errors.push("Kích thước ảnh thu nhỏ tối đa 5MB.");

    if (errors.length > 0)
      return setDialog({
        open: true,
        title: "Lỗi nhập liệu",
        message: errors.join(" \n"),
      });

    setSaving(true);
    try {
      const dto = {
        name: title.trim(),
        information: description || null,
        imageUrl: thumbnailPreview ?? null,
        price: price === "" ? 0 : Number(price),
        grade: grade === "" ? 0 : Number(grade),
        SubjectId: Number(SubjectId),
        schoolId: authUser?.schoolId ?? null,
        isFeatured: isFeatured,
        status: status,
        createdAt: new Date().toISOString(),
        startAt: startDate ? startDate.toISOString() : new Date().toISOString(),
        endAt: endDate ? endDate.toISOString() : new Date().toISOString(),
        createdBy: authUser?.id ?? "",
        isApproved: status === "Mở" ? false : true,
      };

      const created = await createCourse(dto);
      if (created && created.id) {
        setDialog({
          open: true,
          title: "Thành công",
          message: "Tạo khóa học thành công.",
          navigateTo: "/course/teacher/courses", // chỉ định trang chuyển hướng
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
        {/* Breadcrumb */}
        <div className="text-sm text-[#525252] mb-3">
          Khóa học / Thêm khóa học
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
                  <Label className="text-sm font-medium">Tên khóa học</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tên khóa học..."
                    className="h-10"
                  />
                </div>

                {/* Mô tả */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mô tả</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Viết mô tả ngắn gọn về khóa học..."
                    className="min-h-[100px]"
                  />
                </div>

                {/* Môn học + Khối lớp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Môn học</Label>
                    <Select
                      value={SubjectId ? String(SubjectId) : ""}
                      onValueChange={(v) => setSubjectId(Number(v))}
                    >
                      <SelectTrigger className="w-full">
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
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Khối lớp</Label>
                    <Select
                      value={String(grade)}
                      onValueChange={(v) => setGrade(v === "" ? "" : Number(v))}
                    >
                      <SelectTrigger className="w-full">
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
                  </div>
                </div>

                {/* Ngày bắt đầu / kết thúc */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ngày bắt đầu</Label>
                    <Input
                      type="date"
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ngày kết thúc</Label>
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
              <CardTitle>Phương tiện truyền thông khóa học</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="font-semibold text-base text-gray-800">
                    Hình thu nhỏ khóa học
                  </Label>

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
                    <input
                      type="file"
                      accept="image/*"
                      id="thumbnailInput"
                      className="block w-full text-sm text-gray-700
                                  file:mr-4 file:py-2.5 file:px-4
                                  file:rounded-lg file:border-0
                                  file:font-medium file:bg-[#f28d3d] file:text-white
                                  hover:file:bg-[#e77c1e] cursor-pointer
                                  file:transition-all"
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
                  <Label>Giá khóa học</Label>
                  <Input
                    type="number"
                    value={price || ""}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mở">Đang mở</SelectItem>
                      <SelectItem value="Nháp">Nháp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label>Khóa học nổi bật</Label>
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
