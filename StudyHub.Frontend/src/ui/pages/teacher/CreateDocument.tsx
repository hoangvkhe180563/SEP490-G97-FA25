import { useState } from "react";
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
import { Upload, Copy, Trash2, FileText, Image } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/common/components/ui/form";

const schema = z
  .object({
    name: z.string().min(1, "Tên tài liệu là bắt buộc"),
    subject: z.string().min(1, "Vui lòng chọn môn học"),
    grade: z.string().min(1, "Vui lòng chọn khối lớp"),
    type: z.string().min(1, "Vui lòng chọn loại tài liệu"),
    access: z.string().min(1, "Vui lòng chọn quyền truy cập"),
    isFree: z.boolean().optional(),
    price: z.string().optional(),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.isFree && !data.price) return false;
      return true;
    },
    {
      message: "Vui lòng nhập giá",
      path: ["price"],
    }
  );

type FormValues = z.infer<typeof schema>;

export default function CreateDocument() {
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      subject: "",
      grade: "",
      type: "",
      access: "",
      isFree: false,
      price: "",
      description: "",
    },
  });

  const isFree = form.watch("isFree");

  const mockDocuments = [
    {
      id: 1,
      name: "Bài giảng Hàm số bậc 2",
      subject: "Toán học",
      grade: "Lớp 10",
      type: "Bài giảng",
      status: "Chờ duyệt",
      fileType: "pdf",
    },
    {
      id: 2,
      name: "Slide bài tập",
      subject: "Toán học",
      grade: "Lớp 11",
      type: "Bài tập",
      status: "Đã duyệt",
      fileType: "ppt",
    },
    {
      id: 3,
      name: "Đề thi giữa kì",
      subject: "Toán học",
      grade: "Lớp 12",
      type: "Đề thi",
      status: "Lỗi tải",
      fileType: "doc",
    },
  ];

  const getFileIcon = (fileType: string) => {
    if (fileType === "jpg" || fileType === "jpeg" || fileType === "png") {
      return <Image className="h-4 w-4 text-gray-600" />;
    }
    return <FileText className="h-4 w-4 text-gray-600" />;
  };

  const onSubmit = async (data: FormValues) => {
    console.log("submit", data, file);
    return new Promise((res) => setTimeout(res, 500));
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <Card className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Môn học</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn môn học" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="math">Toán học</SelectItem>
                              <SelectItem value="literature">Ngữ văn</SelectItem>
                              <SelectItem value="english">Tiếng Anh</SelectItem>
                              <SelectItem value="physics">Vật lý</SelectItem>
                              <SelectItem value="chemistry">Hóa học</SelectItem>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn khối lớp" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="10">Lớp 10</SelectItem>
                              <SelectItem value="11">Lớp 11</SelectItem>
                              <SelectItem value="12">Lớp 12</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loại tài liệu</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn loại" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="lecture">Bài giảng</SelectItem>
                              <SelectItem value="exercise">Bài tập</SelectItem>
                              <SelectItem value="exam">Đề thi</SelectItem>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn quyền" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="school">Nội bộ trường</SelectItem>
                              <SelectItem value="public">Công khai</SelectItem>
                              <SelectItem value="private">Riêng tư</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">Miễn phí</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {!isFree && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Giá (VNĐ)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="Nhập giá" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

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
                            className="min-h-[80px] resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Tập tài liệu *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Upload className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Kéo thả tệp vào đây</span> hoặc nhấp để chọn
                        </div>
                        <div className="text-xs text-gray-500">PDF, DOC, DOCX, PPT, PPTX - Tối đa 50MB</div>
                      </div>
                      <div className="mt-4">
                        <input
                          id="document"
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx"
                          onChange={onFileChange}
                          className="hidden"
                        />
                        <label htmlFor="document" className="inline-block">
                          <Button type="button">Chọn tệp</Button>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button variant="outline" type="button" className="flex-1">
                      Hủy bỏ
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gray-800 hover:bg-gray-900"
                      disabled={form.formState.isSubmitting}
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
                <h2 className="text-base font-semibold text-gray-900">Danh sách tài liệu</h2>
                <Badge
                  variant="secondary"
                  className="bg-gray-800 text-white rounded-full h-6 w-6 flex items-center justify-center p-0"
                >
                  {mockDocuments.length}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="select-all" />
                    <label htmlFor="select-all" className="text-sm cursor-pointer">
                      Chọn tất cả
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-xs text-gray-500 uppercase hover:text-gray-700"
                    >
                      XÓA
                    </Button>
                    <Button variant="default" size="sm" className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white">
                      Tải lên
                    </Button>
                  </div>
                </div>

                {mockDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox id={`doc-${doc.id}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          {getFileIcon(doc.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h3>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <span>{doc.subject}</span>
                            <span>•</span>
                            <span>{doc.grade}</span>
                            <span>•</span>
                            <span>{doc.type}</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={doc.status === "Đã duyệt" ? "default" : "secondary"}
                        className={`text-xs mt-1 ${
                          doc.status === "Đã duyệt"
                            ? "bg-gray-800 text-white"
                            : doc.status === "Lỗi tải"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {doc.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Upload className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}