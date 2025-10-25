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
import { ArrowLeft, Upload } from "lucide-react";
import { documentService } from "@/documentManagement/services/documentService";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/common/components/ui/alert-dialog";

const AddCourse: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    message: "",
  });
  const createCourse = useCourseStore((s) => s.createCourse);
  const uploadThumbnail = useCourseStore((s) => s.uploadThumbnail);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [price, setPrice] = useState<number | "">("");
  const [grade, setGrade] = useState<number | "">("");
  const [SubjectId, setSubjectId] = useState<number | null>(null);
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<string>("draft");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [createdBy, setCreatedBy] = useState("");

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
    if (!title)
      return setDialog({
        open: true,
        title: "Thiếu thông tin",
        message: "Vui lòng nhập tên khóa học.",
      });

    if (!SubjectId)
      return setDialog({
        open: true,
        title: "Thiếu thông tin",
        message: "Vui lòng chọn môn học.",
      });

    setSaving(true);
    try {
      const dto = {
        name: title,
        information: description || null,
        imageUrl: thumbnailPreview ?? null,
        price: price ? Number(price) : 0,
        grade: grade ? Number(grade) : 0,
        SubjectId: SubjectId,
        schoolId: schoolId ?? null,
        isFeatured: isFeatured,
        status: status,
        createdAt: new Date().toISOString(),
        startAt: startAt
          ? new Date(startAt).toISOString()
          : new Date().toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : new Date().toISOString(),
        createdBy: createdBy || "unknown",
      };

      const created = await createCourse(dto);
      if (created && created.id) {
        navigate(`/course/teacher/courses`);
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
        message: "Có lỗi xảy ra khi tạo khóa học.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
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
                Chỉnh sửa thông tin và nội dung khóa học
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
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
                <CardDescription>Điền các trường yêu cầu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Tên khóa học</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Subject + Grade */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Môn học</Label>
                      <Select
                        value={SubjectId ? String(SubjectId) : ""}
                        onValueChange={(v) => setSubjectId(Number(v))}
                      >
                        <SelectTrigger>
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

                    <div>
                      <Label>Khối lớp</Label>
                      <Select
                        value={String(grade)}
                        onValueChange={(v) =>
                          setGrade(v === "" ? "" : Number(v))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn khối lớp" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                            <SelectItem key={g} value={String(g)}>
                              {g}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Start / End Date */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Ngày bắt đầu</Label>
                      <Input
                        type="date"
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Ngày kết thúc</Label>
                      <Input
                        type="date"
                        value={endAt}
                        onChange={(e) => setEndAt(e.target.value)}
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
                            return alert(
                              "Vui lòng chọn ảnh trước khi tải lên."
                            );
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
                  <div>
                    <Label>Giá khóa học</Label>
                    <Input
                      type="number"
                      value={price || ""}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label>Trạng thái</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mở">Đang mở</SelectItem>
                        <SelectItem value="Đóng">Đã đóng</SelectItem>
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
          <AlertDialog
            open={dialog.open}
            onOpenChange={(open) => setDialog({ ...dialog, open })}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {dialog.message}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction
                  onClick={() => setDialog({ ...dialog, open: false })}
                >
                  OK
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default AddCourse;
