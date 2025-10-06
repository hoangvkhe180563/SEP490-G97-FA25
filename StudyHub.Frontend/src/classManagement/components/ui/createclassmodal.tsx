import React, { useEffect, useState } from "react";

export type CreateClassPayload = {
  title: string;
  subject: string;
  description?: string;
  teacher?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateClassPayload) => void;
};

export const CreateClassModal: React.FC<Props> = ({ open, onClose, onCreate }) => {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) {
      setTitle("");
      setSubject("");
      setDescription("");
    }
  }, [open]);

  if (!open) return null;

  const valid = title.trim() !== "" && subject.trim() !== "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onCreate({ title: title.trim(), subject: subject.trim(), description: description.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
        aria-modal="true"
        role="dialog"
      >
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Create class</h3>
            <button type="button" onClick={onClose} className="text-gray-500">✕</button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="text-sm block mb-1">Class name <span className="text-red-500">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Class name"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm block mb-1">Subject <span className="text-red-500">*</span></label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Subject</option>
              <option value="Toán">Toán</option>
              <option value="Văn">Văn</option>
              <option value="Anh">Anh</option>
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
          <button type="button" onClick={onClose} className="px-4 py-2">Cancel</button>
          <button type="submit" disabled={!valid} className="px-4 py-2 bg-slate-900 text-white rounded disabled:opacity-50">
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateClassModal;