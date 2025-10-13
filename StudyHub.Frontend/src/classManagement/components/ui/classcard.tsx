import React, { useState } from "react";

// Add a Role type to make the props cleaner
export type UserRole = "teacher" | "student";

export type ClassCardProps = {
  id: string | number;
  title: string;
  teacher: string;
  subject?: string;
  // MODIFIED: onView now includes the role, or you can add a separate 'role' prop
  onView: (id: string | number, role: UserRole) => void;
  onMenu?: (
    action: "viewClassworks" | "viewStudents" | "edit",
    id: string | number
  ) => void;
  // NEW: Prop to specify the role of the user viewing the card
  userRole: UserRole;
};

export const ClassCard: React.FC<ClassCardProps> = ({
  id,
  title,
  teacher,
  subject,
  onView, // Note: No longer optional based on the requirement
  onMenu,
  userRole, // Destructure the new prop
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 relative">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{teacher}</p>
        </div>

        <div className="text-sm text-gray-600">
          <span className="block">Môn:</span>
          <span className="font-medium text-right">{subject ?? "---"}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          className="bg-slate-900 text-white px-6 py-2 rounded-md text-sm hover:opacity-95"
          // MODIFIED: Call onView with both id and userRole
          onClick={() => onView(id, userRole)}
        >
          View details...
        </button>

        <div className="relative ml-3">
          <button
            aria-haspopup="true"
            aria-expanded={open}
            onClick={() => setOpen((s) => !s)}
            className="w-8 h-8 flex items-center justify-center rounded-full border text-gray-600 hover:bg-gray-50"
          >
            ⋮
          </button>

          {open && (
            <div
              className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-20"
              onMouseLeave={() => setOpen(false)}
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