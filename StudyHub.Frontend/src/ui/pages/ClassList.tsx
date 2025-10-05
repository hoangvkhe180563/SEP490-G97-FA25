import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClassCard from "@/common/components/ui/classcard";
import CreateClassModal from "@/common/components/ui/createclassmodal";
import EditClassModal from "@/common/components/ui/editclassmodal";

type ClassItem = {
  id: number;
  title: string;
  teacher: string;
  subject: string;
  description?: string;
};

export const ClassList: React.FC = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<ClassItem | undefined>(undefined);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const [classes, setClasses] = useState<ClassItem[]>([
    { id: 1, title: "Mathematics 101", teacher: "Dr. Sarah Johnson", subject: "Toán" },
    { id: 2, title: "Literial 101", teacher: "Dr. Sarah Johnson", subject: "Văn" },
    { id: 3, title: "English 101", teacher: "Dr. Sarah Johnson", subject: "Anh" },
    { id: 4, title: "Mathematics 101", teacher: "Dr. Sarah Johnson", subject: "Toán" },
    { id: 5, title: "Mathematics 101", teacher: "Dr. Sarah Johnson", subject: "Toán" },
    { id: 6, title: "Mathematics 101", teacher: "Dr. Sarah Johnson", subject: "Toán" },
    { id: 7, title: "Mathematics 101", teacher: "Dr. Sarah Johnson", subject: "Toán" },
    { id: 8, title: "Mathematics 101", teacher: "Dr. Sarah Johnson", subject: "Toán" },
    { id: 9, title: "Mathematics 101", teacher: "Dr. Sarah Johnson", subject: "Toán" },
    { id: 10, title: "Mathematics 101", teacher: "Dr. Sarah Johnson", subject: "Toán" },
    { id: 11, title: "Mathematics 101", teacher: "Dr. Sarah Johnson", subject: "Toán" },
    { id: 12, title: "Mathematics 101", teacher: "Dr. Sarah Johnson", subject: "Toán" },
  ]);

  const filtered = useMemo(() => {
    return classes.filter((c) => {
      const q = query.trim().toLowerCase();
      if (q && !c.title.toLowerCase().includes(q)) return false;
      if (subject && subject !== "all" && c.subject !== subject) return false;
      if (status && status !== "all") {
        // placeholder: if you have status on items, filter here
      }
      return true;
    });
  }, [classes, query, subject, status]);

  // reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, subject, status, pageSize]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // clamp currentPage
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // navigate to class details page
  const handleView = (id: number | string) => {
    navigate(`/classes/${id}`);
  };

  const handleMenu = (action: "viewClassworks" | "viewStudents" | "edit", id: number | string) => {
    if (action === "edit") {
      const item = classes.find((c) => c.id === id);
      if (item) {
        setEditing(item);
        setShowEdit(true);
      }
      return;
    }
    console.log(action, id);
  };

  const handleCreate = (payload: { title: string; subject: string; description?: string }) => {
    const nextId = classes.length ? Math.max(...classes.map((c) => c.id)) + 1 : 1;
    setClasses((prev) => [
      { id: nextId, title: payload.title, teacher: "Dr. Sarah Johnson", subject: payload.subject, description: payload.description },
      ...prev,
    ]);
    setCurrentPage(1);
  };

  const handleSaveEdit = (payload: { id: number | string; title: string; subject: string; description?: string }) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === payload.id ? { ...c, title: payload.title, subject: payload.subject, description: payload.description } : c))
    );
  };

  const gotoPage = (p: number) => {
    if (p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setCurrentPage(p);
  };

  return (
    <div className="p-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mb-4">
        <div className="flex-1 flex gap-3 items-center">
          <input
            type="text"
            placeholder="Search class name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border rounded-md px-3 py-2 focus:outline-none"
          />
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">All Subject</option>
            <option value="Toán">Toán</option>
            <option value="Văn">Văn</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="mt-3 sm:mt-0 ml-auto">
          <button onClick={() => setShowCreate(true)} className="bg-black text-white px-4 py-2 rounded-md">+ Add Class</button>
        </div>
      </div>

      {/* Cards container with blue outline like hình */}
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
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded-md px-2 py-1"
            >
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={9}>9</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((c) => (
            <ClassCard
              key={c.id}
              id={c.id}
              title={c.title}
              teacher={c.teacher}
              subject={c.subject}
              onView={handleView}
              onMenu={handleMenu}
            />
          ))}

          {paginated.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">No classes found</div>
          )}
        </div>

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
              className={`px-3 py-1 border rounded ${p === currentPage ? "bg-slate-900 text-white" : ""}`}
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

      <CreateClassModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      <EditClassModal open={showEdit} classItem={editing} onClose={() => setShowEdit(false)} onSave={handleSaveEdit} />
    </div>
  );
};

export default ClassList;