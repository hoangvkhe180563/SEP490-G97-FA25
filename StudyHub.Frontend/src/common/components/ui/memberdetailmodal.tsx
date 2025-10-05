import React from "react";
import type { Person } from "@/common/components/ui/listeveryone";

type Props = {
  open: boolean;
  member?: Person | null;
  onClose: () => void;
};

const MemberDetailModal: React.FC<Props> = ({ open, member, onClose }) => {
  if (!open || !member) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {member.role === "teacher"
                ? "Teacher Information"
                : member.role === "student"
                ? "Student Information"
                : member.role === "parent"
                ? "Parent Information"
                : "Member Information"}
            </h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>

        <div className="p-6">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex gap-6">
              <img src={member.avatarUrl ?? "/vite.svg"} alt="avatar" className="w-20 h-20 rounded-full" />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-medium">{member.name}</div>
                    {member.subtitle && <div className="text-sm text-gray-400">{member.subtitle}</div>}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <div className="text-xs text-gray-400">Name</div>
                    <div className="mt-1">{member.name}</div>
                  </div>

                  {member.subtitle && (
                    <div>
                      <div className="text-xs text-gray-400">Info</div>
                      <div className="mt-1">{member.subtitle}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MemberDetailModal;