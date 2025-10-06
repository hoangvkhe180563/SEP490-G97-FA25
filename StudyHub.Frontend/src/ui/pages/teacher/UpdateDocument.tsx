import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Textarea } from "@/common/components/ui/textarea";
import { Badge } from "@/common/components/ui/badge";
import { Card } from "@/common/components/ui/card";
import { Separator } from "@/common/components/ui/separator";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/common/components/ui/select";
import { CloudUpload, FileText, Download, Eye } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/common/components/ui/form";

// Validation schema
const schema = z
  .object({
    name: z.string().min(1, "Tên tài liệu là bắt buộc"),
    subjectId: z.string().min(1, "Môn học là bắt buộc"),
    gradeId: z.string().min(1, "Khối lớp là bắt buộc"),
    documentCategoryId: z.string().min(1, "Loại tài liệu là bắt buộc"),
    accessibilityId: z.string().min(1, "Quyền truy cập là bắt buộc"),
    description: z.string().optional(),
    isFree: z.boolean().optional(),
    price: z.string().optional(),
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

const UpdateDocument = () => {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "Bài giảng Hàm số bậc 2 - Chương 3",
      subjectId: "1",
      gradeId: "10",
      documentCategoryId: "1",
      accessibilityId: "2",
      description:
        "Bài giảng về hàm số bậc 2, bao gồm định nghĩa, tính chất, cách vẽ đồ thị và các dạng bài tập thường gặp. Phù hợp cho học sinh lớp 10.",
      isFree: false,
      price: "50000",
    },
  });

  const isFree = form.watch("isFree");

  const onSubmit = async (data: FormValues) => {
    console.log("submit", data);
    return new Promise((res) => setTimeout(res, 500));
  };

  return (
    <div  className="p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pr-4">
          {/* LEFT SIDE - Update Form (3 columns) */}
          <div className="lg:col-span-4">
            <Card className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Document Name Field */}
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

                  {/* Subject and Grade Fields - Two Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="subjectId"
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
                              <SelectItem value="1">Toán học</SelectItem>
                              <SelectItem value="2">Vật lý</SelectItem>
                              <SelectItem value="3">Hóa học</SelectItem>
                              <SelectItem value="4">Sinh học</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gradeId"
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

                  {/* Document Type and Access Rights - Two Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="documentCategoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loại tài liệu</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn loại tài liệu" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">Bài giảng</SelectItem>
                              <SelectItem value="2">Bài tập</SelectItem>
                              <SelectItem value="3">Đề thi</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accessibilityId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quyền truy cập</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn quyền truy cập" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">Công khai</SelectItem>
                              <SelectItem value="2">Nội bộ trường</SelectItem>
                              <SelectItem value="3">Riêng tư</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Free Checkbox */}
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

                  {/* Price Field - Conditionally Rendered */}
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

                  {/* Description Field */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả tài liệu</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Nhập mô tả tài liệu" className="min-h-[80px] resize-none" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Current Document File Section */}
                  <div className="space-y-2">
                    <FormLabel>Tập tài liệu hiện tại</FormLabel>
                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Bài giảng Hàm số bậc 2 - Chương 3.pdf</p>
                            <p className="text-xs text-gray-500">2.4 MB • Tải lên 15/03/2024 10:30</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" type="button">
                            <Eye className="w-4 h-4 mr-1" />
                            Xem trước
                          </Button>
                          <Button variant="outline" size="sm" type="button">
                            <Download className="w-4 h-4 mr-1" />
                            Tải về
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* File Upload Section - Replace Document */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Tập tài liệu mới (thay thế)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <CloudUpload className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Kéo thả tệp vào đây</span> hoặc nhấp để chọn
                        </div>
                        <div className="text-xs text-gray-500">PDF, DOC, DOCX, PPT, PPTX - Tối đa 50MB</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button variant="outline" type="button" className="flex-1">
                      Hủy bỏ
                    </Button>
                    <Button variant="outline" type="button" className="text-red-600 bg-transparent">
                      Xóa tài liệu
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gray-800 hover:bg-gray-900"
                      disabled={form.formState.isSubmitting}
                    >
                      Lưu thay đổi
                    </Button>
                  </div>
                </form>
              </Form>
            </Card>
          </div>

          {/* RIGHT SIDE - Document Information Panel (2 columns) */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              {/* Panel Title */}
              <h3 className="text-base font-semibold mb-4">Thông tin tài liệu</h3>

              <Separator className="mb-4" />

              {/* Status Section */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-3">Trạng thái</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tình trạng:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Đã xuất bản
                  </Badge>
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Details Section */}
              <div>
                <h4 className="text-sm font-medium mb-3">Chi tiết</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tạo lúc:</span>
                    <span className="text-sm font-medium">15/03/2024</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cập nhật:</span>
                    <span className="text-sm font-medium">20/03/2024</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateDocument;