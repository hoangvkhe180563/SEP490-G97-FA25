import React, { useEffect, useState } from "react";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { Link } from "react-router-dom";

const CATEGORY_OPTIONS = [
  { value: "1", label: "Toán học" },
  { value: "2", label: "Ngữ văn" },
  { value: "3", label: "Tiếng Anh" },
  { value: "4", label: "Vật lý" },
  { value: "5", label: "Hóa học" },
  { value: "6", label: "Sinh học" },
  { value: "7", label: "Lịch sử" },
  { value: "8", label: "Địa lý" },
  { value: "9", label: "Giáo dục công dân" },
  { value: "10", label: "Công nghệ" },
  { value: "11", label: "Tin học" },
  { value: "12", label: "Giáo dục thể chất" },
];

const CourseFilterTeacher: React.FC = () => {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const fetchCourses = useCourseStore((s) => s.fetchCourses);

  // Debounce typing so we don't call the API on every keystroke immediately
  useEffect(() => {
    const handler = setTimeout(() => {
      const statusBool =
        status === "all" ? undefined : status === "published" ? true : false;
      fetchCourses({
        page: 1,
        pageSize: 12,
        q,
        status: statusBool,
        // backend expects subjectId for filtering by subject/category
        subjectId: category === "all" ? undefined : Number(category),
      });
    }, 350);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, status]);

  return (
    <div className="bg-white rounded-md shadow-sm p-4 mb-4">
      <form className="flex items-center gap-4">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses..."
          className="max-w-md"
        />

        <Select value={category} onValueChange={(v) => setCategory(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tất cả môn học" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả môn học</SelectItem>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => setStatus(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="draft">Nháp</SelectItem>
            <SelectItem value="published">Đã xuất bản</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center">
          <Button className="ml-2">
            <Link to="/course/teacher/add-course">+ Thêm khóa học</Link>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CourseFilterTeacher;
