import React, { useState, useEffect } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { mapToCoarseRole } from "@/classManagement/utils/roleutil";
import type { ClassInfo } from "@/classManagement/interfaces/class";
import type { UserRole } from "@/classManagement/components/ui/classcard";

// ... AttachmentButton, ClassInfoCard unchanged ...

const AddEditClassworkForm: React.FC = () => {
  const params = useParams<{ id?: string; classworkId?: string }>();
  const id = params.id ?? "";

  // determine role from auth store only
  const { user } = useAuthStore();
  const coarseRole = mapToCoarseRole(user?.roles);
  const role = coarseRole === "student" ? "student" : "teacher";

  const isEdit = !!params.classworkId;
  const { createClasswork, editClasswork, getClassWorks, getClassInfo, currentClass } = useClassStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  // only teachers allowed to access this page (check auth-derived role)
  useEffect(() => {
    if (role !== "teacher") {
      // redirect students back to class page (they shouldn't edit/create)
      navigate(`/class/${role}/${id}`);
    }
  }, [role, id, navigate]);

  useEffect(() => {
    if (isEdit && params.classworkId && currentClass?.data?.works) {
      const cw = currentClass.data.works.find((w) => String(w.id) === String(params.classworkId));
      if (cw) {
        setTitle(cw.title ?? "");
        setDescription(cw.description ?? "");
        if (cw.deadline) {
          const d = new Date(cw.deadline);
          const tzOffset = d.getTimezoneOffset() * 60000;
          const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0, -1);
          setDeadline(localISO.slice(0, 16));
        } else {
          setDeadline("");
        }
      }
    }
  }, [isEdit, params.classworkId, currentClass?.data?.works]);

  useEffect(() => {
    if (id) getClassInfo(Number(id));
  }, [id, getClassInfo]);

  const handleCancel = () => navigate(`/class/${role}/${id}?tab=exercise`);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const deadlineIso = deadline ? new Date(deadline).toISOString() : undefined;
      if (isEdit && params.classworkId) {
        await editClasswork({
          id: Number(params.classworkId),
          classId: Number(id),
          title: title.trim(),
          description: description?.trim(),
          deadline: deadlineIso,
        });
      } else {
        await createClasswork({
          classId: Number(id),
          title: title.trim(),
          description: description?.trim(),
          deadline: deadlineIso,
        });
      }
      await getClassWorks(Number(id));
      await getClassInfo(Number(id));
      navigate(`/class/${role}/${id}?tab=exercise`);
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setLoading(false);
    }
  };

  const classInfo = currentClass?.data?.classInfo ?? null;

  // ... render unchanged, using role from auth store ...
  return (
    <div className="p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">←</button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white">📝</div>
            <div className="text-lg font-medium">Bài tập</div>
          </div>
        </div>
        <div>
          <button onClick={() => handleSave()} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">Lưu</button>
        </div>
      </div>

      {/* Main layout content (omitted for brevity, unchanged) */}
      {/* You can paste rest of original JSX here - keep behavior same. */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white border rounded-lg p-6 mb-4">
            <div className="mb-2 text-sm text-gray-600">Tiêu đề*</div>
            <input className="w-full border-b pb-2 mb-4 text-lg outline-none" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" />

            <div className="mb-2 text-sm text-gray-600">Hướng dẫn (không bắt buộc)</div>
            <textarea className="w-full border rounded p-3 min-h-[160px] mb-4" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nhập hướng dẫn cho học viên..." />

            <div className="rounded-lg border p-6">
              <div className="text-sm font-medium mb-4">Đính kèm</div>
              <div className="flex gap-6">
                {/* Attachment buttons */}
              </div>
            </div>
          </div>
        </div>

        <aside className="col-span-12 lg:col-span-4">
          {/* Sidebar */}
          <div className="bg-white border rounded-lg p-4"> {/* simplified rendering */}
            <div className="text-sm font-medium mb-3">Giao cho</div>
            <div>...sidebar content...</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AddEditClassworkForm;