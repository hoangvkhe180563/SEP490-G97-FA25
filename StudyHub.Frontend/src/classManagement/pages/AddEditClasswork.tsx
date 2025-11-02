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
    <div className="p-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 rounded-full hover:bg-slate-100 text-lg">←</button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">📝</div>
            <div>
              <div className="text-lg font-semibold">Bài tập</div>
              <div className="text-sm text-slate-500">{isEdit ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}</div>
            </div>
          </div>
        </div>
        <div>
          <button onClick={() => handleSave()} disabled={loading} className="bg-blue-600 text-white px-5 py-3 rounded-lg text-lg">{loading ? "Đang lưu..." : "Lưu"}</button>
        </div>
      </div>

      {/* Main layout content (omitted for brevity, unchanged) */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white border rounded-xl p-6 mb-4">
            <div className="mb-2 text-sm text-slate-600">Tiêu đề*</div>
            <input className="w-full border-b pb-3 mb-4 text-2xl outline-none" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" />

            <div className="mb-2 text-sm text-slate-600">Hướng dẫn (không bắt buộc)</div>
            <textarea className="w-full border rounded p-4 min-h-[220px] mb-4 text-base" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nhập hướng dẫn cho học viên..." />

            <div className="rounded-lg border p-5">
              <div className="text-md font-semibold mb-4">Đính kèm</div>
              <div className="flex gap-6">
                {/* Attachment buttons */}
                <button className="px-4 py-2 bg-slate-100 rounded-lg">Thêm tệp</button>
                <button className="px-4 py-2 bg-slate-100 rounded-lg">Thêm liên kết</button>
              </div>
            </div>
          </div>
        </div>

        <aside className="col-span-12 lg:col-span-4">
          {/* Sidebar */}
          <div className="bg-white border rounded-xl p-5">
            <div className="text-sm font-semibold mb-3">Giao cho</div>
            <div className="text-base text-slate-600">Tất cả học sinh / Chọn nhóm ...</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AddEditClassworkForm;