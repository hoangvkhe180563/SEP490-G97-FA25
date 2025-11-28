/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useState } from "react";
import { Card } from "@/common/components/ui/card";
import type { ClassMemberDto } from "@/classManagement/interfaces/class";
import MemberRowSimple from "@/classManagement/components/ui/memberrowsimple";
import MemberDetailModal from "@/classManagement/components/ui/memberdetailmodal";
import AddMemberModal from "@/classManagement/components/ui/addmembermodal";
import { Button } from "@/common/components/ui/button";

type Props = {
  teacher: ClassMemberDto | null;
  students: ClassMemberDto[];
  parents: ClassMemberDto[];
  onMail?: (p: ClassMemberDto) => void;
  onSelect?: (p: ClassMemberDto) => void;
  onAddMember?: () => void; // optional parent handler
  classId?: number | string;
};

const EveryoneTab: React.FC<Props> = ({
  teacher,
  students,
  parents,
  onMail,
  onSelect,
  onAddMember,
  classId,
}) => {
  const [selectedMemberLocal, setSelectedMemberLocal] = useState<ClassMemberDto | null>(null);
  const [openAddLocal, setOpenAddLocal] = useState(false);

  // Always open local AddMemberModal (fallback) and also call parent's handler if provided.
  const openAdd = () => {
    setOpenAddLocal(true);
    if (onAddMember) onAddMember();
  };

  const handleSelect = (p: ClassMemberDto) => {
    onSelect && onSelect(p);
    setSelectedMemberLocal(p);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd} className="mb-2">
          Thêm thành viên
        </Button>
      </div>

      <Card>
        <div className="p-4">
          {/* Count moved into heading with parentheses as requested */}
          <div className="mb-3">
            <div className="font-semibold text-lg">Giáo viên ({teacher ? 1 : 0})</div>
          </div>
          {teacher ? (
            <MemberRowSimple m={teacher} onMail={onMail} onSelect={handleSelect} roleLabel="Giáo viên" />
          ) : (
            <div className="text-sm text-slate-500">Chưa có giáo viên được gán cho lớp này.</div>
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

      <Card>
        <div className="p-4">
          <div className="mb-3">
            <div className="font-semibold text-lg">Phụ huynh ({parents.length})</div>
          </div>
          {parents.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có phụ huynh.</div>
          ) : (
            <div className="space-y-2">
              {parents.map((p) => (
                <MemberRowSimple key={p.userId} m={p} onMail={onMail} onSelect={handleSelect} roleLabel="Phụ huynh" />
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

      {/* Add member modal (local fallback) */}
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