import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/common/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/common/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/common/components/ui/alert-dialog";
import { Button } from "@/common/components/ui/button";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";
import { format } from "date-fns";
import { documentService } from "@/documentManagement/services/documentService";
import { useAppUserStore } from "@/user/stores/useAppUserStore";

const ApproveCourses: React.FC = () => {
  const navigate = useNavigate();
  const fetchCourses = useCourseStore((s) => s.fetchCourses);
  const courses = useCourseStore((s) => s.courses);
  const loading = useCourseStore((s) => s.loading);
  const fetchCourseById = useCourseStore((s) => s.fetchCourseById);
  const updateCourse = useCourseStore((s) => s.updateCourse);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const currentUser = useAppUserStore((s) => s.appUser);

  const [query, setQuery] = useState("");
  const load = async () => {
    try {
      const s = await documentService.getSubjects();
      setSubjects(s || []);
    } catch (err) {
      console.error("Failed to load subjects", err);
    }
  };

  useEffect(() => {
    fetchCourses({ page: 1, pageSize: 50, isApproved: false, status: "Mở" });
    load();
  }, [fetchCourses]);

  // 🔍 Lọc động (không cần nút)
  const filteredCourses = useMemo(() => {
    const keyword = query.toLowerCase().trim();
    return courses.filter(
      (c: any) =>
        (c.isApproved === false ||
          c.isApproved === null ||
          c.isApproved === undefined) &&
        (!keyword || c.name.toLowerCase().includes(keyword))
    );
  }, [courses, query]);

  // ✅ Duyệt
  const handleApprove = async (id: number) => {
    try {
      await fetchCourseById(id);
      const selected = useCourseStore.getState().selectedCourse;
      if (!selected) return alert("Không tìm thấy khóa học!");

      const dto: any = {
        ...selected,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.id ?? null,
        isApproved: true,
      };

      await updateCourse(id, dto);
      await fetchCourses({
        page: 1,
        pageSize: 50,
        isApproved: false,
        status: "Mở",
      });
    } catch (err) {
      console.error("Approve failed", err);
      alert("❌ Duyệt thất bại!");
    }
  };

  // ❌ Từ chối
  const handleReject = async (id: number) => {
    try {
      await fetchCourseById(id);
      const selected = useCourseStore.getState().selectedCourse;
      if (!selected) return alert("Không tìm thấy khóa học!");

      const dto: any = {
        ...selected,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.id ?? null,
        isApproved: false,
        status: "Đóng",
      };

      await updateCourse(id, dto);
      await fetchCourses({
        page: 1,
        pageSize: 50,
        isApproved: false,
        status: "Mở",
      });
    } catch (err) {
      console.error("Reject failed", err);
      alert("❌ Từ chối thất bại!");
    }
  };

  // 📦 Render
  return (
    <div className="p-8 w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-800">
          Duyệt khóa học
        </h1>

        <Input
          placeholder="Tìm kiếm khóa học..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-80"
        />
      </div>

      {/* Loading */}
      {loading && <div className="text-gray-500">Đang tải dữ liệu...</div>}

      {/* No results */}
      {!loading && filteredCourses.length === 0 && (
        <Card className="text-center border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Không có khóa học chờ duyệt</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-600">
            Tất cả khóa học đã được duyệt hoặc không có khóa học mới.
          </CardContent>
        </Card>
      )}

      {/* Danh sách khóa học */}
      <div className="space-y-4">
        {filteredCourses.map((c: any) => (
          <Card
            key={c.id}
            className="border border-gray-200 hover:shadow-md transition-all duration-150"
          >
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Thông tin */}
                <div className="flex items-center gap-4">
                  <img
                    src={c.imageUrl ?? "/placeholder.jpg"}
                    className="w-20 h-14 object-cover rounded-lg shadow-sm"
                    alt="thumb"
                  />
                  <div
                    onClick={() => navigate(`/course/teacher/courses/${c.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="font-semibold text-lg text-gray-800 transition-colors">
                      {c.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {subjects.find((s: any) => s.id === c.subjectId)?.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      Tạo bởi: {c.createdBy ?? "—"} •{" "}
                      {c.createdAt
                        ? format(new Date(c.createdAt), "yyyy-MM-dd")
                        : ""}
                    </div>
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        Duyệt
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Xác nhận duyệt khóa học
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn duyệt khóa học <b>{c.name}</b>{" "}
                          không?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(c.id)}
                        >
                          Xác nhận
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Từ chối
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Xác nhận từ chối khóa học
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn <b>từ chối</b> khóa học{" "}
                          <b>{c.name}</b> không?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handleReject(c.id)}
                        >
                          Xác nhận
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ApproveCourses;
