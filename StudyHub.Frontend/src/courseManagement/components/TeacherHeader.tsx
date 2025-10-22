import { useLocation } from "react-router-dom";
import { User } from "lucide-react";

const TITLE_MAP: Array<[string, string]> = [
  ["/course/teacher/dashboard", "Bảng điều khiển"],
  ["/course/teacher/courses", "Khóa học"],
  ["/course/teacher/lessons", "Bài học"],
  ["/course/teacher/assignments", "Bài tập"],
  ["/course/teacher/students", "Học viên"],
  ["/course/teacher/instructors", "Giảng viên"],
  ["/course/teacher/courses/:id", "Chi tiết khóa học"],
  ["/course/teacher/add-course", "Thêm khóa học mới"],
  ["/course/teacher/edit-course", "Chỉnh sửa khóa học"],
  ["/course/teacher/add-lecture", "Thêm bài giảng mới"],
  ["/course/teacher/edit-lecture", "Chỉnh sửa bài giảng"],
  ["/course/teacher/lecture", "Chi tiết bài giảng"],
  ["/course/teacher/profile", "Hồ sơ giảng viên"],
  ["/course/settings", "Hệ thống"],
  ["/course/analytics", "Phân tích"],
];

function resolveTitle(pathname: string) {
  // prefer exact or prefix matches from the map
  for (const [path, label] of TITLE_MAP) {
    if (
      pathname === path ||
      pathname.startsWith(path + "/") ||
      pathname.startsWith(path)
    ) {
      return label;
    }
  }

  // fallback: use the last non-empty segment and prettify
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "Home";
  const last = parts[parts.length - 1];
  return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TeacherHeader() {
  const location = useLocation();
  const title = resolveTitle(location.pathname);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#E5E5E5]">
      <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-normal text-[#171717]">{title}</h1>

        <div className="flex items-center gap-3">
          {/* Minimal avatar/icon on the right */}
          <div className="w-9 h-9 rounded-full bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center">
            <User className="w-5 h-5 text-[#171717]" />
          </div>
        </div>
      </div>
    </header>
  );
}
