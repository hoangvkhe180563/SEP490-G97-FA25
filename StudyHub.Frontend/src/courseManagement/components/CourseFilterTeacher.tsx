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
import { documentService } from "@/documentManagement/services/documentService";
import { useAuthStore } from "@/auth/stores/useAuthStore";

const CourseFilterTeacher: React.FC = () => {
  const [q, setQ] = useState("");
  const [subjectList, setSubjectList] = useState<
    { id: number; name: string }[]
  >([]);
  const [subjects, setSubjects] = useState<string>("all");
  // status holds a statusKey that maps to backend params:
  // "Open" => status: "Mở", isApproved: true
  // "Requested" => status: "Mở", isApproved: false
  // "Closed" => status: "Đóng", isApproved: true
  // "Rejected" => status: "Đóng", isApproved: false
  // "Draft" => status: "Nháp" (no isApproved filter)
  const [status, setStatus] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [length, setLength] = useState<string>("all");

  const fetchCourses = useCourseStore((s) => s.fetchCourses);
  const authUser = useAuthStore((s) => s.user);

  const fetchSubjects = async () => {
    const res = await documentService.getSubjects();
    if (Array.isArray(res)) {
      setSubjectList(res.map((s: any) => ({ id: s.id, name: s.name })));
    }
  };

  useEffect(() => {
    fetchSubjects();

    const handler = setTimeout(() => {
      if (!authUser?.schoolId) return;

      // Translate status key into backend params
      let statusParam: string | undefined = undefined;
      let isApprovedParam: boolean | undefined = undefined;

      switch (status) {
        case "Open":
          statusParam = "Mở";
          isApprovedParam = true;
          break;
        case "Requested":
          statusParam = "Mở";
          isApprovedParam = false;
          break;
        case "Closed":
          statusParam = "Đóng";
          isApprovedParam = true;
          break;
        case "Draft":
          statusParam = "Nháp";
          isApprovedParam = true;
          break;
        default:
          statusParam = undefined;
          isApprovedParam = undefined;
      }

      fetchCourses({
        page: 1,
        pageSize: 6,
        q: q.trim() || undefined,
        subjectId: subjects !== "all" ? Number(subjects) : undefined,
        schoolId: authUser?.schoolId,
        status: statusParam,
        isApproved: isApprovedParam,
        difficulty: difficulty !== "all" ? difficulty : undefined,
        length: length !== "all" ? length : undefined,
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [
    q,
    subjects,
    status,
    difficulty,
    length,
    fetchCourses,
    authUser?.schoolId,
  ]);

  return (
    <div className="bg-white rounded-md shadow-sm p-4 mb-4">
      <form className="flex items-center gap-4">
        {/* Ô tìm kiếm */}
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm kiếm khóa học..."
          className="max-w-md"
        />

        {/* Chọn môn học */}
        <Select value={subjects} onValueChange={(v) => setSubjects(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tất cả môn học" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả môn học</SelectItem>
            {subjectList.map((opt) => (
              <SelectItem key={opt.id} value={String(opt.id)}>
                {opt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Chọn trạng thái */}
        <Select value={status} onValueChange={(v) => setStatus(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Draft">Nháp</SelectItem>
            <SelectItem value="Open">Đang mở</SelectItem>
            <SelectItem value="Requested">Đợi duyệt</SelectItem>
            <SelectItem value="Closed">Đã đóng</SelectItem>
          </SelectContent>
        </Select>

        {/* Chọn mức độ */}
        <Select value={difficulty} onValueChange={(v) => setDifficulty(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tất cả mức độ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả mức độ</SelectItem>
            <SelectItem value="Beginner">Cơ bản</SelectItem>
            <SelectItem value="Intermediate">Trung cấp</SelectItem>
            <SelectItem value="Advanced">Nâng cao</SelectItem>
          </SelectContent>
        </Select>

        {/* Chọn độ dài */}
        <Select value={length} onValueChange={(v) => setLength(v)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Tất cả độ dài" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả độ dài</SelectItem>
            <SelectItem value="Short">Ngắn</SelectItem>
            <SelectItem value="Medium">Trung bình</SelectItem>
            <SelectItem value="Long">Dài</SelectItem>
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
