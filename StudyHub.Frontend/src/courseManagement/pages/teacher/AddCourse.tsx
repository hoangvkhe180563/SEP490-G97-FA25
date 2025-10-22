import React, { useState } from "react";
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
import { useAppUserStore } from "@/user/stores/useAppUserStore";

const AddCourse: React.FC = () => {
  const navigate = useNavigate();
  const [isPublished, setIsPublished] = useState(false);
  const createCourse = useCourseStore((s) => s.createCourse);
  const uploadThumbnail = useCourseStore((s) => s.uploadThumbnail);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [price, setPrice] = useState<number | "">("");
  const [gradeId, setGradeId] = useState<number | "">("");
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [teachers, setTeachers] = React.useState<any[]>([]);
  const [selectedInstructor, setSelectedInstructor] = React.useState<
    string | null
  >(null);
  const filterAppUsers = useAppUserStore((s) => s.filterAppUsers);

  React.useEffect(() => {
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

  React.useEffect(() => {
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
            <Button
              onClick={async () => {
                if (!title)
                  return alert("Vui lòng cung cấp tiêu đề cho khóa học.");
                if (!selectedInstructor)
                  return alert("Vui lòng chọn giảng viên cho khóa học.");
                setSaving(true);
                try {
                  const dto: any = {
                    name: title,
                    information: description,
                    imageUrl: thumbnailPreview ?? "none",
                    price: price,
                    grade: gradeId ? Number(gradeId) : 0,
                    category: subjectId ? Number(subjectId) : 0, // backend dùng "category" thay vì "subjectId"
                    schoolId: 0,
                    isFeatured: isFeatured,
                    status: isPublished,
                    createdAt: new Date().toISOString(),
                    instructorName: selectedInstructor, // selected instructor id (guid)
                    updatedAt: new Date().toISOString(),
                    updatedBy: selectedInstructor,
                    deletedAt: new Date().toISOString(),
                    chapters: [],
                  };

                  const created = createCourse
                    ? await createCourse(dto)
                    : undefined;

                  if (created && created.id) {
                    navigate(`/course/teacher/courses`);
                  } else {
                    alert("Tạo khóa học thất bại");
                  }
                } catch (err) {
                  console.error("create course failed", err);
                  alert("Tạo khóa học thất bại");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
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
                <CardDescription>
                  Nhập các chi tiết cốt lõi của khóa học
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Course Title */}
                  <div className="space-y-2">
                    <Label>Tên khóa học</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Nhập tên khóa học"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Mô tả ngắn</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Mô tả những gì học sinh sẽ học trong khóa học này"
                      rows={4}
                    />
                  </div>

                  {/* Subject & Grade */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Chủ đề</Label>
                      <Select
                        value={subjectId ? String(subjectId) : ""}
                        onValueChange={(value) => setSubjectId(Number(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Chọn chủ đề" />
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
                              {g}
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
        ${thumbnailPreview ? "border-transparent" : "border-gray-300"} 
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
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-4">
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
                        type="checkbox"
                        className="w-4 h-4"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                      />
                      <Label>Khóa học nổi bật</Label>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-[#404040]">
                        Đã xuất bản
                      </span>
                      <button
                        onClick={() => setIsPublished(!isPublished)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          isPublished ? "bg-[#171717]" : "bg-[#D4D4D4]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            isPublished ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
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
    </div>
  );
};

export default AddCourse;

// small helper used in page to navigate to add-lecture
