import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ClassCard from "@/classManagement/components/ui/classcard";
import type { UserRole } from "@/classManagement/components/ui/classcard";
import CreateClassModal from "@/classManagement/components/ui/createclassmodal";
import EditClassModal from "@/classManagement/components/ui/editclassmodal";

import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { mapToCoarseRole } from "@/classManagement/utils/roleutil";
import type { ClassListDto } from "@/classManagement/interfaces/class";

/* shadcn UI components */
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import { Card } from "@/common/components/ui/card";

type ClassItem = ClassListDto & {
  title: string;
  teacher: string;
  description?: string;
};

const ClassList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Zustand stores
  const {
    classes: apiClasses,
    isLoading,
    getClasses,
    addClass,
    meta,
    getAllSubjects,
    subjects,
  } = useClassStore();

  const { user } = useAuthStore();

  // current user id from auth store (assume GUID or string)
  const currentUserId = user?.id ?? "";

  // UI state
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<ClassItem | undefined>(undefined);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // derive coarse role from stored user roles (if available), otherwise fallback to path heuristic
  const userRoleFromPath: UserRole = useMemo(() => {
    if (location.pathname.includes("/student")) return "student";
    return "teacher";
  }, [location.pathname]);

  const coarseRole = mapToCoarseRole(user?.roles);
  const userRole: UserRole = (coarseRole === "student" ? "student" : userRoleFromPath) as UserRole;

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.append("query", query.trim());
    if (subject && subject !== "all") params.append("subject", subject);
    params.append("page", currentPage.toString());
    params.append("limit", pageSize.toString());
    return params.toString();
  };

  // Fetch classes when filters/paging or auth info changes
  useEffect(() => {
    const q = buildQuery();
    const memberIdToPass = currentUserId ? currentUserId : undefined;
    getClasses(q, memberIdToPass);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, subject, currentPage, pageSize, getClasses, userRole, currentUserId]);

  // Map API classes for UI
  const classItems: ClassItem[] = useMemo(
    () =>
      apiClasses.map((c) => ({
        ...c,
        title: c.name,
        teacher: c.instructorName,
      })),
    [apiClasses]
  );

  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;

  useEffect(() => {
    if (currentPage > totalPages && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    getAllSubjects();
  }, [getAllSubjects]);

  const handleView = (id: number | string, roleParam: UserRole) => {
    navigate(`/class/${roleParam}/${id}`);
  };

  const handleMenu = (action: "viewClassworks" | "viewStudents" | "edit", id: number | string) => {
    if (action === "edit") {
      const item = classItems.find((c) => c.id === id);
      if (item) {
        setEditing({ ...item });
        setShowEdit(true);
      }
      return;
    }

    if (action === "viewClassworks") {
      navigate(`/class/${userRole}/${id}?tab=exercise`);
    } else if (action === "viewStudents") {
      navigate(`/class/${userRole}/${id}?tab=everyone`);
    }
  };

  const handleCreate = async (payload: { title: string; description?: string }) => {
    // pass createdBy from auth store
    const created = await addClass({ ...payload, createdBy: currentUserId });
    if (created) {
      setShowCreate(false);
      setCurrentPage(1);
      const q = buildQuery();
      const memberIdToPass = userRole === "student" && currentUserId ? currentUserId : undefined;
      getClasses(q, memberIdToPass);
    }
  };

  const gotoPage = (p: number) => {
    if (p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setCurrentPage(p);
  };

  const closeCreate = () => {
    const q = buildQuery();
    getClasses(q, currentUserId);
    setShowCreate(false);
  };

  const closeEdit = () => {
    const q = buildQuery();
    getClasses(q, currentUserId);
    setShowEdit(false);
  };

  return (
    <div className="p-8">
      {/* Filters & create */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-6">
        <div className="flex-1 flex gap-3 items-center">
          <Input
            placeholder="Tìm theo tên lớp..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="text-lg"
          />

          
        </div>

        <div className="mt-3 sm:mt-0 ml-auto">
          {userRole === "teacher" && (
            <Button onClick={() => setShowCreate(true)} className="text-lg">
              + Tạo lớp học
            </Button>
          )}
        </div>
      </div>

      {/* Class grid */}
      <Card className="border rounded-xl p-6 min-h-[300px] bg-slate-50">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-slate-600">
            Hiển thị {total === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} trên tổng số {total} lớp
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-600">Số lớp / trang</div>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="9">9</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="col-span-full text-center py-12 text-blue-600 font-medium">Đang tải danh sách lớp học...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classItems.map((c) => (
              <div key={c.id} className="transform hover:scale-[1.01] transition">
                <ClassCard id={c.id} title={c.title} teacher={c.teacher}  userRole={userRole} onView={handleView} onMenu={handleMenu} />
              </div>
            ))}

            {classItems.length === 0 && <div className="col-span-full text-center py-12 text-slate-500">Không tìm thấy lớp học nào.</div>}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => gotoPage(currentPage - 1)} disabled={currentPage === 1}>
            Trước
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "ghost"}
              onClick={() => gotoPage(p)}
            >
              {p}
            </Button>
          ))}

          <Button variant="outline" onClick={() => gotoPage(currentPage + 1)} disabled={currentPage === totalPages}>
            Sau
          </Button>
        </div>
      </Card>

      <CreateClassModal open={showCreate} onClose={closeCreate} onCreate={handleCreate} />
      <EditClassModal open={showEdit} classItem={editing} onClose={closeEdit} />
    </div>
  );
};

export default ClassList;