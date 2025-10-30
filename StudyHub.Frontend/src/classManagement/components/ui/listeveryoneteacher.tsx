import React from "react";
import type { ClassMemberDto } from "@/classManagement/interfaces/class";

type Props = {
  teacher?: ClassMemberDto | null;
  students?: ClassMemberDto[];
  parents?: ClassMemberDto[];
  onMail?: (member: ClassMemberDto) => void;
  onAddPerson?: (role: "teacher" | "student" | "parent") => void;
  onAddParent?: (student: ClassMemberDto) => void;
  onSelect?: (member: ClassMemberDto) => void;
};

const SectionHeader: React.FC<{ label: string; icon?: React.ReactNode; onAdd?: () => void }> = ({
  label,
  icon,
  onAdd,
}) => (
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
      </button>
    )}
  </div>
);

const PersonRow: React.FC<{
  m: ClassMemberDto;
  onClick: () => void;
  onMail?: (m: ClassMemberDto) => void;
  onAddParent?: (m: ClassMemberDto) => void;
}> = ({ m, onClick, onMail }) => (
  <div
    className="py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 rounded-lg"
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      <img src={"/vite.svg"} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
      <div>
        <div className="font-medium">{m.fullname}</div>
        <div className="text-xs text-gray-400">
          {`Tham gia: ${new Date(m.joinDate).toLocaleDateString()}`}
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMail?.(m);
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

const EveryoneListTC: React.FC<Props> = ({
  teacher,
  students = [],
  parents = [],
  onMail,
  onAddPerson,
  onSelect,
}) => {
  // Removed internal modal handling — parent (DetailedClassTeacher) will open modal via onSelect
  const handleClick = (m: ClassMemberDto) => {
    onSelect?.(m);
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
            <PersonRow m={teacher} onClick={() => handleClick(teacher)} onMail={onMail} />
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
                <PersonRow key={s.userId} m={s} onClick={() => handleClick(s)} onMail={onMail} />
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
                <path
                  d="M7 12a4 4 0 100-8 4 4 0 000 8zM17 12a4 4 0 100-8 4 4 0 000 8z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M3 20v-1a4 4 0 014-4h10a4 4 0 014 4v1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            }
            onAdd={() => onAddPerson?.("parent")}
          />
          <SectionCard>
            <div className="space-y-3">
              {parents.map((p) => (
                <PersonRow key={p.userId} m={p} onClick={() => handleClick(p)} onMail={onMail} />
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
};

export default EveryoneListTC;
