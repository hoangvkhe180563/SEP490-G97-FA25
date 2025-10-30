import React, { useEffect, useState } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";

export const CreateClassModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreate: (payload: { title: string; description?: string }) => Promise<void>;
}> = ({ open, onClose, onCreate }) => {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { subjects, getAllSubjects } = useClassStore();

  useEffect(() => {
    if (open) {
      getAllSubjects();
    } else {
      setTitle("");
      setSubject(0);
      setDescription("");
    }
  }, [open, getAllSubjects]);

  if (!open) return null;

  const valid = title.trim() !== "" && subject !== 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;

    setSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">Tạo lớp học</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
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
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-black"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={!valid || submitting}
            className="px-4 py-2 bg-slate-900 text-white rounded disabled:opacity-50"
          >
            {submitting ? "Đang tạo..." : "Tạo"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateClassModal;
