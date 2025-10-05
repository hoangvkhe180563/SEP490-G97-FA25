import React, { useState } from "react";
import MemberDetailModal from "@/common/components/ui/memberdetailmodal";
export type Person = {
  id: number | string;
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  role?: "teacher" | "student" | "parent";
  hasParent?: boolean; // optional flag to indicate if student already has parent
};

type Props = {
  teacher?: Person | null;
  students?: Person[];
  parents?: Person[];
  onMail?: (p: Person) => void;
  onAddPerson?: (role: Person["role"]) => void; // add new person to section
  onAddParent?: (student: Person) => void; // add parent for a student
  onSelect?: (person: Person) => void;
};

const SectionHeader: React.FC<{ label: string; icon?: React.ReactNode; onAdd?: () => void }> = ({ label, icon, onAdd }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-3">
      <div className="text-gray-600">{icon}</div>
      <div className="font-medium">{label}</div>
    </div>
    {onAdd && (
      <button
        onClick={onAdd}
        className="flex items-center gap-2 text-sm text-gray-600 bg-white border rounded px-2 py-1 hover:shadow-sm"
        aria-label={`Add ${label}`}
      >
        {/* user-plus icon (fixed aspect, no distortion) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M20 8v6" />
          <path d="M23 11h-6" />
        </svg>
        <span className="sr-only">Invite</span>
      </button>
    )}
  </div>
);

const PersonRow: React.FC<{
  p: Person;
  onClick: () => void;
  onMail?: (p: Person) => void;
  onAddParent?: (p: Person) => void;
}> = ({ p, onClick, onMail, onAddParent }) => (
  <div
    className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 rounded-lg"
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      <img src={p.avatarUrl ?? "/vite.svg"} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
      <div>
        <div className="font-medium">{p.name}</div>
        {p.subtitle && <div className="text-xs text-gray-400">{p.subtitle}</div>}
      </div>
    </div>

    <div className="flex items-center gap-2">
      {/* Add Parent button for student without parent */}
      {p.role === "student" && !p.hasParent && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddParent?.(p);
          }}
          className="bg-white border rounded px-3 py-1 text-sm hover:shadow-sm"
        >
          + Add Parent
        </button>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation(); // tránh click mở modal khi nhấn Mail
          onMail?.(p);
        }}
        className="flex items-center gap-2 bg-white border rounded px-3 py-1 text-sm hover:shadow-sm"
      >
        <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none">
          <path d="M3 8.5l9 6 9-6" stroke="currentColor" strokeWidth="1.5" />
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span>Mail</span>
      </button>
    </div>
  </div>
);

const SectionCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-gray-50 border rounded-lg p-4 mb-4">{children}</div>
);

const EveryoneListTC: React.FC<Props> = ({ teacher, students = [], parents = [], onMail, onAddPerson, onAddParent }) => {
  const [selectedMember, setSelectedMember] = useState<Person | null>(null);
  const [open, setOpen] = useState(false);

  const handleClick = (person: Person) => {
    setSelectedMember(person);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Teacher */}
      {teacher && (
        <>
          <SectionHeader
            label="Teacher"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 20v-1a4 4 0 014-4h8a4 4 0 014 4v1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            }
            onAdd={() => onAddPerson?.("teacher")}
          />
          <SectionCard>
            <PersonRow p={{ ...teacher, role: "teacher" }} onClick={() => handleClick({ ...teacher, role: "teacher" })} onMail={onMail} onAddParent={onAddParent} />
          </SectionCard>
        </>
      )}

      {/* Students */}
      {students.length > 0 && (
        <>
          <SectionHeader
            label="Students"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 20v-1a4 4 0 014-4h10a4 4 0 014 4v1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            }
            onAdd={() => onAddPerson?.("student")}
          />
          <SectionCard>
            <div className="space-y-3">
              {students.map((s) => (
                <PersonRow
                  key={s.id}
                  p={{ ...s, role: "student" }}
                  onClick={() => handleClick({ ...s, role: "student" })}
                  onMail={onMail}
                  onAddParent={onAddParent}
                />
              ))}
            </div>
          </SectionCard>
        </>
      )}

      {/* Parents */}
      {parents.length > 0 && (
        <>
          <SectionHeader
            label="Parents"
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M7 12a4 4 0 100-8 4 4 0 000 8zM17 12a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 20v-1a4 4 0 014-4h10a4 4 0 014 4v1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            }
            onAdd={() => onAddPerson?.("parent")}
          />
          <SectionCard>
            <div className="space-y-3">
              {parents.map((p) => (
                <PersonRow key={p.id} p={{ ...p, role: "parent" }} onClick={() => handleClick({ ...p, role: "parent" })} onMail={onMail} onAddParent={onAddParent} />
              ))}
            </div>
          </SectionCard>
        </>
      )}

      {/* ✅ Modal hiển thị chi tiết */}
      <MemberDetailModal open={open} member={selectedMember} onClose={() => setOpen(false)} />
    </div>
  );
};

export default EveryoneListTC;