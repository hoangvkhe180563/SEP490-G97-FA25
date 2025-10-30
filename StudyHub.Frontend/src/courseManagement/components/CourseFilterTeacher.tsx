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
  const [status, setStatus] = useState<string>("all");

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
      if (authUser?.schoolId)
        fetchCourses({
          page: 1,
          pageSize: 6,
          q: q.trim() || undefined,
          subjectId: subjects !== "all" ? Number(subjects) : undefined,
          schoolId: authUser?.schoolId,
          status: status !== "all" ? status : undefined,
          isApproved: true,
        });
    }, 300);

    return () => clearTimeout(handler);
  }, [q, subjects, status, fetchCourses, authUser?.schoolId]);

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
            <SelectItem value="Nháp">Nháp</SelectItem>
            <SelectItem value="Mở">Đang mở</SelectItem>
            <SelectItem value="Đóng">Đã đóng</SelectItem>
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
