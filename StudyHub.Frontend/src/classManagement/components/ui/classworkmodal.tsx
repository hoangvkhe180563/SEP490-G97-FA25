import React from "react";
import type { ClassWork } from "@/classManagement/interfaces/class";

const ClassWorkModal: React.FC<{
  open: boolean;
  work: ClassWork | null;
  onClose: () => void;
}> = ({ open, work, onClose }) => {
  if (!open || !work) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          onClick={onClose}
        >
          Đóng
        </button>
        <h2 className="text-xl font-semibold mb-2">{work.title}</h2>
        <div className="mb-2 text-gray-700">{work.description}</div>
        <div className="mb-2 text-gray-500">
          <span className="font-medium">Hạn nộp:</span>{" "}
          {work.deadline ? new Date(work.deadline).toLocaleString() : "Không xác định"}
        </div>
        {/* Nếu có các trường khác, có thể bổ sung hiển thị ở đây */}
        {work?.[ "classId" ] && (
          <div className="text-xs text-gray-400">Mã lớp: {work.classId}</div>
        )}
      </div>
    </div>
  );
};

export default ClassWorkModal;