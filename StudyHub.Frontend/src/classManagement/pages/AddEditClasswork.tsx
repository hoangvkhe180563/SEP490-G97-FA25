import React, { useState, useEffect } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useNavigate, useParams } from "react-router-dom";
import type { ClassInfo } from "@/classManagement/interfaces/class";

const AttachmentButton: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center text-xs text-gray-600">
    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
      {/* placeholder icon */}
      <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    </div>
    <div>{label}</div>
  </div>
);

const ClassInfoCard: React.FC<{ info: ClassInfo | null }> = ({ info }) => {
  if (!info) return null;
  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="text-sm font-medium mb-3">Giao cho</div>
      <div className="mb-4">
        <button className="w-full border rounded-full py-2 text-sm flex items-center justify-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M5 22v-2a4 4 0 0 1 4-4h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          Tất cả học viên
        </button>
      </div>

      <div className="text-sm font-medium mb-2">Điểm</div>
      <div className="mb-4">
        <select className="w-full border rounded px-3 py-2">
          <option>100</option>
          <option>10</option>
          <option>0</option>
        </select>
      </div>

      <div className="text-sm font-medium mb-2">Hạn nộp</div>
      <div className="mb-4">
        <input type="datetime-local" className="w-full border rounded px-3 py-2" />
      </div>

      <label className="flex items-start gap-2 mb-4">
        <input type="checkbox" defaultChecked />
        <div className="text-sm text-gray-600">Đóng tính năng nộp bài sau ngày đến hạn</div>
      </label>

      <div className="text-sm font-medium mb-2">Chủ đề</div>
      <div className="mb-4">
        <select className="w-full border rounded px-3 py-2 bg-gray-100">
          <option>Không có chủ đề</option>
        </select>
      </div>

      <div className="text-sm font-medium mb-2">Tiêu chí chấm điểm</div>
      <button className="w-full border rounded py-2 text-sm text-blue-600">
        + Tiêu chí chấm điểm
      </button>
    </div>
  );
};

const AddEditClassworkForm: React.FC = () => {
  const { id, classworkId } = useParams<{ id?: string; classworkId?: string }>();
  const isEdit = !!classworkId;
  const {
    createClasswork,
    editClasswork,
    getClassWorks,
    getClassInfo,
    currentClass,
  } = useClassStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit && classworkId && currentClass?.data?.works) {
      const cw = currentClass.data.works.find((w) => String(w.id) === String(classworkId));
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
  }, [isEdit, classworkId, currentClass?.data?.works]);

  useEffect(() => {
    if (id) getClassInfo(Number(id));
  }, [id, getClassInfo]);

  const handleCancel = () => navigate(`/class/${id}?tab=exercise`);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const deadlineIso = deadline ? new Date(deadline).toISOString() : undefined;
      if (isEdit && classworkId) {
        await editClasswork({
          id: Number(classworkId),
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
      navigate(`/class/${id}?tab=exercise`);
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setLoading(false);
    }
  };

  const classInfo = currentClass?.data?.classInfo ?? null;

  return (
    <div className="p-6">
      {/* Top bar similar to classroom: back icon + title + save button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
            ←
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white">📝</div>
            <div className="text-lg font-medium">Bài tập</div>
          </div>
        </div>
        <div>
          <button
            onClick={() => handleSave()}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Lưu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main content */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white border rounded-lg p-6 mb-4">
            <div className="mb-2 text-sm text-gray-600">Tiêu đề*</div>
            <input
              className="w-full border-b pb-2 mb-4 text-lg outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề"
            />

            <div className="mb-2 text-sm text-gray-600">Hướng dẫn (không bắt buộc)</div>
            <textarea
              className="w-full border rounded p-3 min-h-[160px] mb-4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập hướng dẫn cho học viên..."
            />

            <div className="rounded-lg border p-6">
              <div className="text-sm font-medium mb-4">Đính kèm</div>
              <div className="flex gap-6">
                <AttachmentButton label="Drive" />
                <AttachmentButton label="YouTube" />
                <AttachmentButton label="Tạo" />
                <AttachmentButton label="Tải lên" />
                <AttachmentButton label="Đường liên kết" />
                <AttachmentButton label="Khác" />
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="col-span-12 lg:col-span-4">
          <ClassInfoCard info={classInfo} />
        </aside>
      </div>
    </div>
  );
};

export default AddEditClassworkForm;