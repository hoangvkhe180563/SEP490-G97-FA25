import React, { useState, useEffect } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useNavigate, useParams } from "react-router-dom";

const AddEditClassworkForm: React.FC = () => {
  const { id, classworkId } = useParams<{ id?: string; classworkId?: string }>();
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
    if (isEdit && classworkId) {
      await editClasswork({
        id: Number(classworkId),
        classId: Number(id),
        title,
        description,
        deadline,
      });
    } else {
      await createClasswork({
        classId: Number(id),
        title,
        description,
        deadline,
      });
    }
    await getClassWorks(Number(id));
    setLoading(false);
    navigate(`/class/${id}?tab=exercise`);
  };

  return (
    <div className="max-w-lg mx-auto mt-8 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">{isEdit ? "Sửa bài tập" : "Thêm bài tập mới"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Tiêu đề</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full border rounded px-2 py-1" />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Mô tả</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Hạn nộp</label>
          <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {isEdit ? "Cập nhật" : "Thêm mới"}
        </button>
      </form>
    </div>
  );
};

export default AddEditClassworkForm;