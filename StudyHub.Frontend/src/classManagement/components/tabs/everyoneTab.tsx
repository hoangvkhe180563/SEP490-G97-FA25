import React, { useState } from "react";
import { Card } from "@/common/components/ui/card";
import type { ClassMemberDto } from "@/classManagement/interfaces/class";
import MemberRowSimple from "@/classManagement/components/ui/memberrowsimple";
import MemberDetailModal from "@/classManagement/components/ui/memberdetailmodal";
import AddMemberModal from "@/classManagement/components/ui/addmembermodal";
import { Button } from "@/common/components/ui/button";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { mapToCoarseRole } from "@/classManagement/utils/roleutil";

type Props = {
  // now accept multiple teachers
  teachers?: ClassMemberDto[];
  students: ClassMemberDto[];
  parents: ClassMemberDto[];
  onMail?: (p: ClassMemberDto) => void;
  onSelect?: (p: ClassMemberDto) => void;
  onAddMember?: () => void; // optional parent handler
  classId?: number | string;
};

const EveryoneTab: React.FC<Props> = ({
  teachers = [],
  students,
  parents,
  onMail,
  onSelect,
  onAddMember,
  classId,
}) => {
  const [selectedMemberLocal, setSelectedMemberLocal] = useState<ClassMemberDto | null>(null);
  const [openAddLocal, setOpenAddLocal] = useState(false);

  const { user } = useAuthStore();
  const coarseRole = mapToCoarseRole(user?.roles);
  const isTeacher = coarseRole === "teacher";

  // Only teachers can open the add modal (and see the button)
  const openAdd = () => {
    if (!isTeacher) return;
    setOpenAddLocal(true);
    if (onAddMember) onAddMember();
  };

  const handleSelect = (p: ClassMemberDto) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    onSelect && onSelect(p);
    setSelectedMemberLocal(p);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {isTeacher && (
          <Button onClick={openAdd} className="mb-2">
            Thêm thành viên
          </Button>
        )}
      </div>

      <Card>
        <div className="p-4">
          <div className="mb-3">
            <div className="font-semibold text-lg">Giáo viên ({teachers.length})</div>
          </div>
          {teachers.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có giáo viên được gán cho lớp này.</div>
          ) : (
            <div className="space-y-2">
              {teachers.map((t) => (
                <MemberRowSimple key={t.userId} m={t} onMail={onMail} onSelect={handleSelect} roleLabel="Giáo viên" />
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="mb-3">
            <div className="font-semibold text-lg">Học sinh ({students.length})</div>
          </div>
          {students.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có học sinh.</div>
          ) : (
            <div className="space-y-2">
              {students.map((s) => (
                <MemberRowSimple key={s.userId} m={s} onMail={onMail} onSelect={handleSelect} roleLabel="Học sinh" />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Member detail modal (local fallback) */}
      <MemberDetailModal
        open={!!selectedMemberLocal}
        member={selectedMemberLocal}
        onClose={() => setSelectedMemberLocal(null)}
      />

      {/* Add member modal (local fallback) - only relevant when teacher */}
      <AddMemberModal
        open={openAddLocal}
        classId={classId ? Number(classId) : 0}
        onClose={() => setOpenAddLocal(false)}
        onInvited={() => {
          setOpenAddLocal(false);
        }}
      />
    </div>
  );
};

export default EveryoneTab;