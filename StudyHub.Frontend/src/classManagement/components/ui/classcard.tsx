import React, { useEffect, useRef, useState } from "react";

export type UserRole = "teacher" | "student";
export type MenuAction = "viewClassworks" | "viewStudents" | "edit";

export type ClassCardProps = {
  id: string | number;
  title: string;
  teacher: string;
  subject?: string;
  userRole: UserRole;
  onView: (id: string | number, role: UserRole) => void;
  onMenu?: (action: MenuAction, id: string | number) => void;
};

export const ClassCard: React.FC<ClassCardProps> = ({
  id,
  title,
  teacher,
  subject,
  userRole,
  onView,
  onMenu,
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 relative">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{teacher}</p>
        </div>
        <div className="text-sm text-gray-600 text-right">
          <span className="block">Môn:</span>
          <span className="font-medium">{subject ?? "---"}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          className="bg-slate-900 text-white px-6 py-2 rounded-md text-sm hover:opacity-90"
          onClick={() => onView(id, userRole)}
        >
          View details...
        </button>

        <div className="relative ml-3" ref={menuRef}>
          <button
            aria-haspopup="true"
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="w-8 h-8 flex items-center justify-center rounded-full border text-gray-600 hover:bg-gray-50"
          >
            ⋮
          </button>

          {open && (
            <div
              className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-md z-20 overflow-hidden"
              role="menu"
            >
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                onClick={() => {
                  setOpen(false);
                  onMenu?.("viewClassworks", id);
                }}
              >
                View classworks
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                onClick={() => {
                  setOpen(false);
                  onMenu?.("viewStudents", id);
                }}
              >
                View students list
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                onClick={() => {
                  setOpen(false);
                  onMenu?.("edit", id);
                }}
              >
                Edit class
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassCard;
