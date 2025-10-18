import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ClassCard from "@/classManagement/components/ui/classcard";
import type { UserRole } from "@/classManagement/components/ui/classcard";
import CreateClassModal from "@/classManagement/components/ui/createclassmodal";
import EditClassModal from "@/classManagement/components/ui/editclassmodal";

import { useClassStore } from "@/classManagement/stores/useClassStore";
import type { ClassListDto } from "@/classManagement/interfaces/class";

type ClassItem = ClassListDto & {
  title: string;
  teacher: string;
  subject: number;
  description?: string;
};

export const ClassList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Zustand store
  const {
    classes: apiClasses,
    isLoading,
    getClasses,
    addClass,
    meta,
    getAllSubjects,
    subjects,
  } = useClassStore();

  // Filter states
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<ClassItem | undefined>(undefined);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Lấy vai trò người dùng từ URL
  const userRole: UserRole = useMemo(() => {
    if (location.pathname.includes("/student")) return "student";
    return "teacher";
  }, [location.pathname]);

  // Hàm build query string
  const buildQuery = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.append("query", query.trim());
    if (subject && subject !== "all") params.append("subject", subject);
    params.append("page", currentPage.toString());
    params.append("limit", pageSize.toString());
    return params.toString();
  };

  // Gọi API mỗi khi filter hoặc pagination thay đổi
  useEffect(() => {
    getClasses(buildQuery());
  }, [query, subject, currentPage, pageSize, getClasses]);

  // Map dữ liệu DTO sang UI model
  const classItems: ClassItem[] = useMemo(
    () =>
      apiClasses.map((c) => ({
        ...c,
        title: c.name,
        teacher: c.instructorName,
        subject: c.subjectId,
      })),
    [apiClasses]
  );

  // Total pages
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;

  // Reset trang nếu totalPages nhỏ hơn currentPage
  useEffect(() => {
    if (currentPage > totalPages && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);
  useEffect(() => {
    getAllSubjects(); // ✅ load danh sách subject khi vào trang
  }, [getAllSubjects]);
  // Handlers
  const handleView = (id: number | string, role: UserRole) => {
    navigate(`/class/${role}/${id}`);
  };

  const handleMenu = (
  action: "viewClassworks" | "viewStudents" | "edit",
  id: number | string
) => {
  if (action === "edit") {
    const item = classItems.find((c) => c.id === id);
    if (item) {
      setEditing({ ...item, subject: Number(item.subject) });
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


  const handleCreate = async (payload: {
    title: string;
    subject: number;
    description?: string;
  }) => {
    console.log("Tạo lớp", payload);
    const created = await addClass(payload);
    if (created) {
      setShowCreate(false);
      setCurrentPage(1);
      getClasses(buildQuery());
    }
  };

  const gotoPage = (p: number) => {
    if (p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setCurrentPage(p);
  };

  // RENDER
  return (
    <div className="p-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mb-4">
        <div className="flex-1 flex gap-3 items-center">
          <input
            type="text"
            placeholder="Tìm tên lớp..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 border rounded-md px-3 py-2 focus:outline-none"
          />
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
            }}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">All Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 sm:mt-0 ml-auto">
          {userRole === "teacher" && (
            <button
              onClick={() => setShowCreate(true)}
              className="bg-black text-white px-4 py-2 rounded-md"
            >
              + Tạo Lớp
            </button>
          )}
        </div>
      </div>

      {/* Cards container */}
      <div className="border-2 border-blue-400 rounded-md p-4 min-h-[260px]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">
            Showing {total === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, total)} of {total}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Per page</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded-md px-2 py-1"
            >
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={9}>9</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="col-span-full text-center py-8 text-blue-500">
            Đang tải danh sách lớp...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classItems.map((c) => (
              <ClassCard
                key={c.id}
                id={c.id}
                title={c.title}
                teacher={c.teacher}
                subject={c.subjectName}
                userRole={userRole}
                onView={handleView}
                onMenu={handleMenu}
              />
            ))}

            {classItems.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                Không tìm thấy lớp học nào
              </div>
            )}
          </div>
        )}

        {/* Pagination controls */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => gotoPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => gotoPage(p)}
              className={`px-3 py-1 border rounded ${
                p === currentPage ? "bg-slate-900 text-white" : ""
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => gotoPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modals */}
      <CreateClassModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
      <EditClassModal
        open={showEdit}
        classItem={editing}
        onClose={() => {
          getClasses(buildQuery());
          setShowEdit(false);
        }}
      />
    </div>
  );
};

export default ClassList;
