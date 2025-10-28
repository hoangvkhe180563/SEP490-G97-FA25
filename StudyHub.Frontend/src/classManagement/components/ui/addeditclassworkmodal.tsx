import React, { useState, useEffect } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useNavigate, useParams } from "react-router-dom";
import type { UserRole } from "@/classManagement/components/ui/classcard";

const AddEditClassworkForm: React.FC = () => {
  // include role in params so navigation can produce /class/{role}/{id}
  const params = useParams<{ role?: string; id?: string; classworkId?: string }>();
  const { role: roleParam, id: idParam, classworkId } = params;
  // normalize role to UserRole (default to 'teacher' when missing/unknown)
  const role = (roleParam === "student" ? "student" : "teacher") as UserRole;

  const isEdit = !!classworkId;
  const { createClasswork, editClasswork, getClassWorks, currentClass } = useClassStore();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && classworkId && currentClass?.data?.works) {
      const cw = currentClass.data.works.find(w => String(w.id) === String(classworkId));
      if (cw) {
        setTitle(cw.title ?? "");
        setDescription(cw.description ?? "");
        setDeadline(cw.deadline ?? "");
      }
    }
  }, [isEdit, classworkId, currentClass?.data?.works]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit && classworkId) {
        await editClasswork({
          id: Number(classworkId),
          classId: Number(idParam),
          title,
          description,
          deadline,
        });
      } else {
        await createClasswork({
          classId: Number(idParam),
          title,
          description,
          deadline,
        });
      }
      await getClassWorks(Number(idParam));
      // navigate back to class list with role-aware URL
      navigate(`/class/${role}/${idParam}?tab=exercise`);
    } catch (err) {
      console.error("Error creating/updating classwork", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/class/${role}/${idParam}?tab=exercise`);
  };

  return (
    <div className="max-w-lg mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">{isEdit ? "Sửa bài tập" : "Thêm bài tập mới"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Tiêu đề</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Mô tả</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Hạn nộp</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {isEdit ? "Cập nhật" : "Thêm mới"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded border"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditClassworkForm;