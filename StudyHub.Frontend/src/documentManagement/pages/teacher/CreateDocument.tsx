// src/documentManagement/pages/teacher/CreateDocument.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Checkbox } from "@/common/components/ui/checkbox";
import { Badge } from "@/common/components/ui/badge";
import {
  Upload,
  Trash2,
  FileText,
  Image,
  X,
  Check,
  Loader2,
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
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { axiosInstance } from "@/lib/axios";

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

interface PendingDocument {
  id: string;
  name: string;
  subject: string;
  grade: string;
  type: string;
  access: string;
  description?: string;
  documentFile: File;
  thumbnailFile?: File;
  classes?: number[];
  subjectId: number;
  categoryId: number;
  schoolId?: number | null;
  isInClass?: boolean;
}

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

export default function CreateDocument() {
  const { user } = useAuthStore();
  const { categories, subjects, getCategories, getSubjects } =
    useDocumentStore();

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>(
    []
  );
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(
    new Set()
  );
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [classSearch, setClassSearch] = useState("");

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

  useEffect(() => {
    getCategories();
    getSubjects();
  }, [getCategories, getSubjects]);

  useEffect(() => {
    if (accessValue === "class" && user?.id) {
      fetchUserClasses();
    }
  }, [accessValue, user?.id]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-xl font-semibold text-red-600 mb-2">
            Vui lòng đăng nhập
          </div>
          <div className="text-gray-600">Bạn cần đăng nhập để tạo tài liệu</div>
        </div>
      </div>
    );
  }

  const fetchUserClasses = async () => {
    setIsLoadingClasses(true);
    try {
      const response = await axiosInstance.get(`/Document/my-class/${user.id}`);
      const classesData = response.data?.data || response.data || [];
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
      showToast("error", "Không thể tải danh sách lớp");
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    const imageTypes = ["jpg", "jpeg", "png", "gif", "webp"];
    return imageTypes.includes(fileType.toLowerCase()) ? (
      <Image className="h-4 w-4 text-gray-600" />
    ) : (
      <FileText className="h-4 w-4 text-gray-600" />
    );
  };

  const resetForm = () => {
    form.reset();
    setDocumentFile(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const onAddToList = (data: FormValues) => {
    if (!documentFile) {
      showToast("error", "Vui lòng chọn file tài liệu");
      return;
    }

    const subject = subjects.find((s) => s.id.toString() === data.subject);
    const category = categories.find((c) => c.id.toString() === data.type);

    let schoolId: string | null = null;
    let isInClass: boolean | undefined = undefined;

    if (data.access === "school") {
      schoolId = user?.schoolId || null;
      isInClass = false;
    } else if (data.access === "class") {
      schoolId = user?.schoolId || null;
      isInClass = true;
    }

    const accessLabel =
      data.access === "public"
        ? "Công khai"
        : data.access === "school"
        ? "Trường"
        : "Lớp";

    const newDocument: PendingDocument = {
      id: `${Date.now()}-${Math.random()}`,
      name: data.name,
      subject: subject?.name || "",
      grade: data.grade,
      type: category?.name || "",
      access: accessLabel,
      description: data.description,
      documentFile,
      thumbnailFile: thumbnailFile || undefined,
      classes: data.classes,
      subjectId: parseInt(data.subject),
      categoryId: parseInt(data.type),
      schoolId: schoolId ? parseInt(schoolId) : null,
      isInClass,
    };

    setPendingDocuments((prev) => [...prev, newDocument]);
    resetForm();
    showToast("success", "Đã thêm tài liệu vào danh sách");
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

  const toggleDocumentSelection = (id: string) => {
    setSelectedDocuments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDocuments.size === pendingDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(pendingDocuments.map((d) => d.id)));
    }
  };

  const removeDocument = (id: string) => {
    setPendingDocuments((prev) => prev.filter((d) => d.id !== id));
    setSelectedDocuments((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const deleteSelected = () => {
    setPendingDocuments((prev) =>
      prev.filter((d) => !selectedDocuments.has(d.id))
    );
    setSelectedDocuments(new Set());
    showToast("success", "Đã xóa các tài liệu đã chọn");
  };

  const uploadDocument = async (doc: PendingDocument) => {
    try {
      const formData = new FormData();
      formData.append("Name", doc.name);
      formData.append("SubjectId", doc.subjectId.toString());
      formData.append("Grade", doc.grade);
      formData.append("DocumentCategoryId", doc.categoryId.toString());
      formData.append("DocumentFile", doc.documentFile);

      if (doc.description) formData.append("Description", doc.description);
      if (doc.thumbnailFile)
        formData.append("ThumbnailFile", doc.thumbnailFile);
      if (doc.schoolId) formData.append("SchoolId", doc.schoolId.toString());
      if (doc.isInClass !== undefined)
        formData.append("IsInClass", doc.isInClass.toString());

      if (doc.classes && doc.classes.length > 0) {
        doc.classes.forEach((classId) => {
          const classData = classes.find((c) => c.id === classId);
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

      await axiosInstance.post("/Document/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return true;
    } catch (error) {
      console.error("Error uploading document:", error);
      return false;
    }
  };

  const uploadSelected = async () => {
    const docsToUpload = pendingDocuments.filter((d) =>
      selectedDocuments.has(d.id)
    );
    if (docsToUpload.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (const doc of docsToUpload) {
      const success = await uploadDocument(doc);
      if (success) {
        successCount++;
        removeDocument(doc.id);
      } else {
        failCount++;
      }
    }

    if (successCount > 0) {
      showToast("success", `Đã tải lên thành công ${successCount} tài liệu`);
    }
    if (failCount > 0) {
      showToast("error", `Có ${failCount} tài liệu tải lên thất bại`);
    }

    setIsUploading(false);
    setSelectedDocuments(new Set());
  };

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
    required = false,
  }: {
    id: string;
    accept: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    file?: File | null;
    title: string;
    subtitle: string;
    required?: boolean;
  }) => (
    <div className="relative">
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer">
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
            <div className="text-sm font-medium text-gray-600">
              {title} {required && "*"}
            </div>
            <div className="text-xs text-gray-500">{subtitle}</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <Card className="p-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onAddToList)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên tài liệu</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nhập tên tài liệu" />
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
                          <div className="relative border rounded-lg overflow-hidden aspect-[3/4]">
                            <img
                              src={thumbnailPreview}
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={removeThumbnail}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="relative aspect-[3/4]">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={onThumbnailFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer h-full flex flex-col items-center justify-center">
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
                              <div className="border rounded-md p-2">
                                {isLoadingClasses ? (
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang tải...
                                  </div>
                                ) : classes.length === 0 ? (
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
                                    />
                                    <div className="max-h-[60px] overflow-y-auto flex flex-wrap gap-1">
                                      {classes
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
                                              const current = field.value || [];
                                              field.onChange(
                                                current.includes(cls.id)
                                                  ? current.filter(
                                                      (id) => id !== cls.id
                                                    )
                                                  : [...current, cls.id]
                                              );
                                            }}
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Tập tài liệu *
                    </label>
                    <FileUploadZone
                      id="document"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      onChange={onDocumentFileChange}
                      file={documentFile}
                      title="Chọn tệp tài liệu"
                      subtitle="PDF, DOC, DOCX, PPT, PPTX - Tối đa 10MB"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      type="button"
                      className="flex-1"
                      onClick={resetForm}
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gray-800 hover:bg-gray-900"
                    >
                      Thêm vào danh sách
                    </Button>
                  </div>
                </form>
              </Form>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Danh sách tài liệu
                </h2>
                <Badge
                  variant="secondary"
                  className="bg-gray-800 text-white rounded-full h-6 w-6 flex items-center justify-center p-0"
                >
                  {pendingDocuments.length}
                </Badge>
              </div>

              <div className="space-y-3">
                {pendingDocuments.length > 0 && (
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={
                          selectedDocuments.size === pendingDocuments.length &&
                          pendingDocuments.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                      <label
                        htmlFor="select-all"
                        className="text-sm cursor-pointer"
                      >
                        Chọn tất cả
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs text-gray-500 uppercase hover:text-gray-700"
                        onClick={deleteSelected}
                        disabled={selectedDocuments.size === 0}
                      >
                        XÓA
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={uploadSelected}
                        disabled={selectedDocuments.size === 0 || isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Đang tải...
                          </>
                        ) : (
                          "Tải lên"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {pendingDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      id={`doc-${doc.id}`}
                      checked={selectedDocuments.has(doc.id)}
                      onCheckedChange={() => toggleDocumentSelection(doc.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          {getFileIcon(
                            doc.documentFile.name.split(".").pop() || ""
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {doc.name}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <span>{doc.subject}</span>
                            <span>•</span>
                            <span>Lớp {doc.grade}</span>
                            <span>•</span>
                            <span>{doc.type}</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs mt-1 bg-blue-100 text-blue-700"
                      >
                        {doc.access}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {pendingDocuments.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Chưa có tài liệu nào trong danh sách
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
