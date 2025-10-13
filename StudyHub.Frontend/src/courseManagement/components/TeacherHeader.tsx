import { useLocation } from "react-router-dom";
import { User } from "lucide-react";

const TITLE_MAP: Array<[string, string]> = [
  ["/dashboard", "Dashboard"],
  ["/teacher/courses", "Courses"],
  ["/teacher/lessons", "Lessons"],
  ["/teacher/assignments", "Assignments"],
  ["/teacher/students", "Students"],
  ["/teacher/instructors", "Instructors"],
  ["/teacher/courses/:id", "Course Detail"],
  ["/teacher/add-course", "Add New Course"],
  ["/teacher/edit-course", "Edit Course"],
  ["/teacher/add-lecture", "Add New Lecture"],
  ["/teacher/edit-lecture", "Edit Lecture"],
  ["/teacher/lecture/:id", "Lecture Detail"],
  ["/teacher/profile", "Teacher Profile"],
  ["/settings", "System"],
  ["/analytics", "Analytics"],
  ["/teacher", "Teacher Dashboard"],
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
