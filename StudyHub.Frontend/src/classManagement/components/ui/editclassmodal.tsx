import React, { useEffect, useState } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";

export type EditClassPayload = {
  id: number | string;
  title: string;
  subject: number;
  description?: string;
};

type Props = {
  open: boolean;
  classItem?: { id: number; title: string; subject?: number; description?: string };
  onClose: () => void;

};

export const EditClassModal: React.FC<Props> = ({ open, classItem, onClose }) => {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<number>(0);
  const [description, setDescription] = useState("");

  const { subjects, getAllSubjects,updateClass  } = useClassStore();

  // 🟡 Load subject list khi modal mở
  useEffect(() => {
    if (open) {
      getAllSubjects();
      console.log("🔹 Modal opened → fetching subjects");
    }
  }, [open, getAllSubjects]);

  // 🟡 Khi subject list và classItem thay đổi thì fill dữ liệu vào form
  useEffect(() => {
    if (open && classItem) {
      setTitle(classItem.title ?? "");
      setSubject(classItem.subject ?? 0);
      setDescription(classItem.description ?? "");
      console.log("✅ Set initial subject value from classItem:", classItem.subject);
    }
  }, [open, classItem, subjects]);

  // 🟡 Log giá trị subject mỗi khi thay đổi
  useEffect(() => {
    console.log("📌 Current subject state:", subject);
  }, [subject]);

  if (!open) return null;

  const valid = title.trim() !== "" && subject !== 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classItem) return;

    await updateClass({
      id: classItem.id,
      title: title.trim(),
      subject,
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
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">Edit class</h3>
          <button type="button" onClick={onClose} className="text-gray-500">✕</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-sm block mb-1">
              Class name <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Class name"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm block mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={subject}
              onChange={(e) => {
                const value = Number(e.target.value);
                console.log("✏️ onChange subject →", value);
                setSubject(value);
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value={0}>Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full border rounded px-3 py-2 h-28"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="px-4 py-2 bg-slate-900 text-white rounded disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditClassModal;
