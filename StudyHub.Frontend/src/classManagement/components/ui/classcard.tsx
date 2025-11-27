import React from "react";

export type UserRole = "teacher" | "student";
export type MenuAction = "viewClassworks" | "viewStudents" | "edit";

export type ClassCardProps = {
  id: string | number;
  title: string;
  teacher: string;
  subject?: string;
  userRole: UserRole;
  unread?: number; // NEW: unread count for this class
  onView: (id: string | number, role: UserRole) => void;
  onMenu?: (action: MenuAction, id: string | number) => void;
};

/* shadcn UI components */
import { Card } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/common/components/ui/dropdown-menu";

export const ClassCard: React.FC<ClassCardProps> = ({
  id,
  title,
  teacher,
  subject,
  userRole,
  unread = 0,
  onView,
  onMenu,
}) => {
  return (
    <Card className="p-4 relative">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{teacher}</p>
        </div>

        {unread > 0 && (
          <div className="ml-3">
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold text-white bg-red-600 rounded-full">
              {unread > 99 ? "99+" : unread}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button onClick={() => onView(id, userRole)} className="px-6 py-2 rounded-md text-sm">
          Xem chi tiết
        </Button>

        <div className="relative ml-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-8 h-8 p-0">
                ⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="bottom" className="w-44">
              <DropdownMenuItem
                onSelect={() => {
                  onMenu?.("viewClassworks", id);
                }}
              >
                Xem bài tập
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  onMenu?.("viewStudents", id);
                }}
              >
                Danh sách học viên
              </DropdownMenuItem>
              {userRole === "teacher" && (
                <DropdownMenuItem
                  onSelect={() => {
                    onMenu?.("edit", id);
                  }}
                >
                  Chỉnh sửa lớp
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};

export default ClassCard;