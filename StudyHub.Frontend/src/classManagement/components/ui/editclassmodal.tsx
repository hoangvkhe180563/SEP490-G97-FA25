import React, { useEffect, useState } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";

export type EditClassPayload = {
  id: number | string;
  title: string;
  description?: string;
};

type Props = {
  open: boolean;
  classItem?: { id: number; title: string; description?: string };
  onClose: () => void;
};

export const EditClassModal: React.FC<Props> = ({ open, classItem, onClose }) => {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<number>(0);
  const [description, setDescription] = useState("");

  const { subjects, getAllSubjects, updateClass } = useClassStore();

  useEffect(() => {
    if (open) {
      getAllSubjects();
    }
  }, [open, getAllSubjects]);

  useEffect(() => {
    if (open && classItem) {
      setTitle(classItem.title ?? "");
      setDescription(classItem.description ?? "");
    }
  }, [open, classItem, subjects]);

  if (!open) return null;

  const valid = title.trim() !== "" && subject !== 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classItem) return;

    await updateClass({
      id: classItem.id,
      title: title.trim(),
      description: description.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <form
        onSubmit={submit}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">Chỉnh sửa lớp học</h3>
          <button type="button" onClick={onClose} className="text-gray-500">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-sm block mb-1">
              Tên lớp học <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên lớp học"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm block mb-1">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả lớp học (nếu có)"
              className="w-full border rounded px-3 py-2 h-28"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2">
            Hủy
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="px-4 py-2 bg-slate-900 text-white rounded disabled:opacity-50"
          >
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditClassModal;
