// src/documentManagement/pages/teacher/UpdateDocument.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { Badge } from "@/common/components/ui/badge";
import { Separator } from "@/common/components/ui/separator";
import {
  Upload,
  X,
  Check,
  Loader2,
  FileText,
  Eye,
  Download,
  AlertCircle,
} from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/common/components/ui/form";
import { useDocumentStore } from "@/documentManagement/stores/useDocumentStore";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { Alert, AlertDescription } from "@/common/components/ui/alert";

const schema = z.object({
  name: z.string().min(1, "Tên tài liệu là bắt buộc"),
  subject: z.string().min(1, "Vui lòng chọn môn học"),
  grade: z.string().min(1, "Vui lòng chọn khối lớp"),
  type: z.string().min(1, "Vui lòng chọn loại tài liệu"),
  access: z.string().min(1, "Vui lòng chọn quyền truy cập"),
  description: z.string().optional(),
  classes: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof schema>;

interface ClassDto {
  id: number;
  name: string;
}

interface ToastMessage {
  id: string;
  type: "success" | "error";
  message: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function UpdateDocument() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    getDocumentById,
    document,
    categories,
    subjects,
    getCategories,
    getSubjects,
  } = useDocumentStore();

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [classSearch, setClassSearch] = useState("");
  const [localClasses, setLocalClasses] = useState<ClassDto[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      subject: "",
      grade: "",
      type: "",
      access: "",
      description: "",
      classes: [],
    },
  });

  const accessValue = form.watch("access");

  const showToast = (type: "success" | "error", message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const onDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      showToast("error", "Kích thước file không được vượt quá 10MB");
      e.target.value = "";
      return;
    }

    setDocumentFile(file);
  };

  const onThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const onSubmit = async (data: FormValues) => {
    if (!id) return;

    if (isReadOnly) {
      showToast("error", "Không thể chỉnh sửa tài liệu đã được phê duyệt");
      return;
    }

    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("Id", id);
      formData.append("Name", data.name);
      formData.append("SubjectId", data.subject);
      formData.append("Grade", data.grade);
      formData.append("DocumentCategoryId", data.type);

      if (documentFile) {
        formData.append("DocumentFile", documentFile);
      }

      if (data.description) {
        formData.append("Description", data.description);
      }

      if (thumbnailFile) {
        formData.append("ThumbnailFile", thumbnailFile);
      }

      if (data.access === "school" && user?.schoolId) {
        formData.append("SchoolId", user.schoolId.toString());
        formData.append("IsInClass", "false");
      } else if (data.access === "class" && user?.schoolId) {
        formData.append("SchoolId", user.schoolId.toString());
        formData.append("IsInClass", "true");
      } else if (data.access === "public") {
        formData.append("IsInClass", "false");
      }

      if (data.classes && data.classes.length > 0) {
        data.classes.forEach((classId) => {
          const classData = localClasses.find((c) => c.id === classId);
          const classObj = classData
            ? {
                id: classData.id,
                name: classData.name,
                subjectName: null,
                instructorName: null,
                description: null,
                subjectId: null,
              }
            : { id: classId };
          formData.append("classes", JSON.stringify(classObj));
        });
      }

      await axiosInstance.put(`/Document/update/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("success", "Cập nhật tài liệu thành công");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        err.response?.data?.message || "Không thể cập nhật tài liệu"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) return;

    if (isReadOnly) {
      showToast("error", "Không thể xóa tài liệu đã được phê duyệt");
      return;
    }

    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/Document/${id}`);
      showToast("success", "Xóa tài liệu thành công");
      setTimeout(() => {
        navigate("/documents");
      }, 1500);
    } catch (error) {
      showToast("error", "Không thể xóa tài liệu");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = () => {
    if (!document?.id) return;
    window.open(`/document/student/doc-info/${document.id}`, "_blank");
  };

  const handleDownload = async () => {
    if (!document?.id) return;
    setIsDownloading(true);
    try {
      const blob = await useDocumentStore
        .getState()
        .downloadDocument(document.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement("a");
        a.href = url;
        a.download = document.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      showToast("error", "Không thể tải xuống tài liệu");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    getCategories(() => {});
    getSubjects(() => {});
  }, [getCategories, getSubjects]);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;
      setIsLoadingDocument(true);
      try {
        const docData = await getDocumentById(parseInt(id));
        if (docData) {
          let accessType = "public";
          if (docData.schoolId && docData.isInClass) {
            accessType = "class";
          } else if (docData.schoolId) {
            accessType = "school";
          }

          const canEdit = docData.isApproved !== true;
          setIsReadOnly(!canEdit);

          form.reset({
            name: docData.name,
            subject: docData.subjectId.toString(),
            grade: docData.grade.toString(),
            type: docData.documentCategoryId.toString(),
            access: accessType,
            description: docData.description || "",
            classes: docData.classes?.map((c) => c.id) || [],
          });

          if (docData.thumbnail) {
            setThumbnailPreview(docData.thumbnail);
          }
        }
      } catch (error) {
        showToast("error", "Không thể tải thông tin tài liệu");
      } finally {
        setIsLoadingDocument(false);
      }
    };

    fetchDocument();
  }, [id, getDocumentById, form]);

  useEffect(() => {
    const fetchClasses = async () => {
      if (accessValue === "class" && user?.id) {
        setIsLoadingClasses(true);
        try {
          const response = await axiosInstance.get(
            `/Document/my-class/${user.id}`
          );
          const classesData = response.data?.data || response.data || [];
          setLocalClasses(Array.isArray(classesData) ? classesData : []);
        } catch (error) {
          console.error("Error fetching classes:", error);
          setLocalClasses([]);
        } finally {
          setIsLoadingClasses(false);
        }
      }
    };
    fetchClasses();
  }, [accessValue, user?.id]);

  const Toast = ({ toast }: { toast: ToastMessage }) => (
    <div
      className={`flex items-center gap-3 px-4 py-3 shadow-lg animate-in slide-in-from-right ${
        toast.type === "success"
          ? "bg-green-50 border border-green-200"
          : "bg-red-50 border border-red-200"
      }`}
    >
      <div
        className={toast.type === "success" ? "text-green-600" : "text-red-600"}
      >
        {toast.type === "success" ? (
          <Check className="h-5 w-5" />
        ) : (
          <X className="h-5 w-5" />
        )}
      </div>
      <p
        className={`text-sm font-medium ${
          toast.type === "success" ? "text-green-800" : "text-red-800"
        }`}
      >
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        className="ml-2 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  const FileUploadZone = ({
    id,
    accept,
    onChange,
    file,
    title,
    subtitle,
    disabled = false,
  }: {
    id: string;
    accept: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    file?: File | null;
    title: string;
    subtitle: string;
    disabled?: boolean;
  }) => (
    <div className="relative">
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={disabled}
      />
      <div
        className={`border-2 border-dashed border-gray-300 p-6 text-center ${
          !disabled && "hover:border-blue-400 hover:bg-blue-50/50"
        } transition-all ${!disabled && "cursor-pointer"} ${
          disabled && "opacity-50 cursor-not-allowed bg-gray-50"
        }`}
      >
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        {file ? (
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-900">{file.name}</div>
            <div className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-600">{title}</div>
            <div className="text-xs text-gray-500">{subtitle}</div>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoadingDocument || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        {isReadOnly && (
          <Alert className="mb-4 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Tài liệu đã được phê duyệt. Bạn chỉ có thể xem, không thể chỉnh
              sửa.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
          <div className="lg:col-span-4">
            <Card className="p-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên tài liệu</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Nhập tên tài liệu"
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-medium">
                          Ảnh thu nhỏ
                        </label>
                        {thumbnailPreview ? (
                          <div className="relative border overflow-hidden aspect-[3/4]">
                            <img
                              src={thumbnailPreview}
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                            {!isReadOnly && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6"
                                onClick={removeThumbnail}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="relative aspect-[3/4]">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={onThumbnailFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              disabled={isReadOnly}
                            />
                            <div
                              className={`border-2 border-dashed border-gray-300 text-center ${
                                !isReadOnly &&
                                "hover:border-blue-400 hover:bg-blue-50/50"
                              } transition-all ${
                                !isReadOnly && "cursor-pointer"
                              } h-full flex flex-col items-center justify-center ${
                                isReadOnly &&
                                "opacity-50 cursor-not-allowed bg-gray-50"
                              }`}
                            >
                              <Upload className="h-6 w-6 text-gray-400 mb-2" />
                              <span className="text-xs text-gray-600">
                                Chọn ảnh
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                      <div className="grid grid-cols-2 gap-6 items-start">
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Môn học</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isReadOnly}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn môn học" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {subjects.map((subject) => (
                                    <SelectItem
                                      key={subject.id}
                                      value={subject.id.toString()}
                                    >
                                      {subject.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="grade"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Khối lớp</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isReadOnly}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn khối" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from(
                                    { length: 12 },
                                    (_, i) => i + 1
                                  ).map((grade) => (
                                    <SelectItem
                                      key={grade}
                                      value={grade.toString()}
                                    >
                                      Lớp {grade}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6 items-start">
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Loại tài liệu</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isReadOnly}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn loại" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.id.toString()}
                                    >
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="access"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quyền truy cập</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={isReadOnly}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn quyền" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="public">
                                    Công khai
                                  </SelectItem>
                                  <SelectItem value="school">Trường</SelectItem>
                                  <SelectItem value="class">Lớp</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {accessValue === "class" && (
                        <FormField
                          control={form.control}
                          name="classes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Chọn lớp</FormLabel>
                              <div className="border p-4">
                                {isLoadingClasses ? (
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang tải...
                                  </div>
                                ) : localClasses.length === 0 ? (
                                  <div className="text-sm text-gray-500">
                                    Không có lớp nào
                                  </div>
                                ) : (
                                  <>
                                    <Input
                                      placeholder="Tìm kiếm lớp..."
                                      value={classSearch}
                                      onChange={(e) =>
                                        setClassSearch(e.target.value)
                                      }
                                      className="mb-3"
                                      disabled={isReadOnly}
                                    />
                                    <div className="max-h-[100px] overflow-y-auto flex flex-wrap gap-2">
                                      {localClasses
                                        .filter((cls) =>
                                          cls.name
                                            .toLowerCase()
                                            .includes(classSearch.toLowerCase())
                                        )
                                        .map((cls) => (
                                          <Button
                                            key={cls.id}
                                            type="button"
                                            variant={
                                              field.value?.includes(cls.id)
                                                ? "default"
                                                : "outline"
                                            }
                                            size="sm"
                                            className={`transition-all ${
                                              field.value?.includes(cls.id)
                                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                : "hover:border-blue-400"
                                            }`}
                                            onClick={() => {
                                              if (!isReadOnly) {
                                                const current =
                                                  field.value || [];
                                                field.onChange(
                                                  current.includes(cls.id)
                                                    ? current.filter(
                                                        (id) => id !== cls.id
                                                      )
                                                    : [...current, cls.id]
                                                );
                                              }
                                            }}
                                            disabled={isReadOnly}
                                          >
                                            {cls.name}
                                          </Button>
                                        ))}
                                    </div>
                                  </>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả tài liệu</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Nhập mô tả tài liệu"
                            className="resize-none h-24"
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {document && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Tập tài liệu hiện tại
                      </label>
                      <Card className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {document.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Tải lên{" "}
                                {new Date(
                                  document.createdAt
                                ).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={handlePreview}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Xem trước
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={handleDownload}
                              disabled={isDownloading}
                            >
                              {isDownloading ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4 mr-1" />
                              )}
                              Tải về
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  {!isReadOnly && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Tập tài liệu mới (thay thế)
                      </label>
                      <FileUploadZone
                        id="document"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        onChange={onDocumentFileChange}
                        file={documentFile}
                        title="Chọn tệp tài liệu"
                        subtitle="PDF, DOC, DOCX, PPT, PPTX - Tối đa 10MB"
                        disabled={isReadOnly}
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      type="button"
                      className="flex-1"
                      onClick={() => navigate(-1)}
                    >
                      {isReadOnly ? "Quay lại" : "Hủy bỏ"}
                    </Button>
                    {!isReadOnly && (
                      <>
                        <Button
                          variant="outline"
                          type="button"
                          className="text-red-600 bg-transparent hover:bg-red-50"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang xóa...
                            </>
                          ) : (
                            "Xóa tài liệu"
                          )}
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 bg-gray-800 hover:bg-gray-900"
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang lưu...
                            </>
                          ) : (
                            "Lưu thay đổi"
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </form>
              </Form>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="p-4">
              <h3 className="text-base font-semibold mb-4">
                Thông tin tài liệu
              </h3>
              <Separator className="mb-4" />
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-3">Trạng thái</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tình trạng:</span>
                  <Badge
                    variant="secondary"
                    className={
                      document?.isApproved
                        ? "bg-green-100 text-green-700"
                        : document?.isApproved === false
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  >
                    {document?.isApproved
                      ? "Đã phê duyệt"
                      : document?.isApproved === false
                      ? "Đã từ chối"
                      : "Chờ phê duyệt"}
                  </Badge>
                </div>
              </div>
              <Separator className="mb-4" />
              <div>
                <h4 className="text-sm font-medium mb-3">Chi tiết</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tạo lúc:</span>
                    <span className="text-sm font-medium">
                      {document?.createdAt
                        ? new Date(document.createdAt).toLocaleDateString(
                            "vi-VN"
                          )
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cập nhật:</span>
                    <span className="text-sm font-medium">
                      {document?.updatedAt
                        ? new Date(document.updatedAt).toLocaleDateString(
                            "vi-VN"
                          )
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Người tạo:</span>
                    <span className="text-sm font-medium">
                      {document?.uploaderFullname ||
                        document?.uploaderName ||
                        "-"}
                    </span>
                  </div>
                  {document?.schoolName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Trường:</span>
                      <span className="text-sm font-medium">
                        {document.schoolName}
                      </span>
                    </div>
                  )}
                  {document?.classes && document.classes.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-2">
                        Lớp học:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {document.classes.map((cls) => (
                          <Badge
                            key={cls.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {cls.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
