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
  teachers?: ClassMemberDto[];
  students: ClassMemberDto[];
  parents: ClassMemberDto[];
  onMail?: (p: ClassMemberDto) => void;
  onSelect?: (p: ClassMemberDto) => void;
  onAddMember?: () => void;
  classId?: number | string;
};


function openGmailCompose({ to, subject, body }: { to?: string; subject?: string; body?: string }) {
  const base = "https://mail.google.com/mail/";
  const params = new URLSearchParams();
  params.set("view", "cm");
  params.set("fs", "1"); // compose in full-screen
  if (to) params.set("to", to);
  if (subject) params.set("su", subject);
  if (body) params.set("body", body);
  // open in a new tab/window
  const url = `${base}?${params.toString()}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

const EveryoneTab: React.FC<Props> = ({
  teachers = [],
  students,
  parents,
  onSelect,
  onAddMember,
  classId,
}) => {
  const [selectedMemberLocal, setSelectedMemberLocal] = useState<ClassMemberDto | null>(null);
  const [openAddLocal, setOpenAddLocal] = useState(false);

  const { user } = useAuthStore();
  const coarseRole = mapToCoarseRole(user?.roles);
  const isTeacher = coarseRole === "teacher";

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

  const getEmail = (m: ClassMemberDto) => {
    return (m as any).email ?? (m as any).userEmail ?? (m as any).emailAddress ?? (m as any).mail ?? "";
  };

  const getDisplayName = (m: ClassMemberDto) =>
    (m as any).fullname ?? (m as any).fullName ?? (m as any).displayName ?? (m as any).name ?? "";

  // click handler to open Gmail compose for member
  const handleOpenGmail = (member: ClassMemberDto) => {
    const email = getEmail(member);
    const name = getDisplayName(member);
    const subject = ""; // optionally set default subject here
    const body = `Hi ${name || ""},%0D%0A%0D%0A`; // simple prefilled greeting (url encoded newline)
    openGmailCompose({ to: email, subject, body });
  };

  // capture phase handler to prevent inner mailto anchors and route to Gmail
  const onRowClickCapture = (e: React.MouseEvent, member: ClassMemberDto) => {
    e.preventDefault();
    e.stopPropagation();
    handleOpenGmail(member);
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
                <div
                  key={t.userId ?? `t-${Math.random()}`}
                  role="button"
                  tabIndex={0}
                  onClickCapture={(e) => onRowClickCapture(e, t)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenGmail(t);
                    }
                  }}
                  className="block w-full text-left focus:outline-none"
                >
                  <MemberRowSimple m={t} onSelect={handleSelect} roleLabel="Giáo viên" />
                </div>
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
                <div
                  key={s.userId ?? `s-${Math.random()}`}
                  role="button"
                  tabIndex={0}
                  onClickCapture={(e) => onRowClickCapture(e, s)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenGmail(s);
                    }
                  }}
                  className="block w-full text-left focus:outline-none"
                >
                  <MemberRowSimple m={s} onSelect={handleSelect} roleLabel="Học sinh" />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <MemberDetailModal
        open={!!selectedMemberLocal}
        member={selectedMemberLocal}
        onClose={() => setSelectedMemberLocal(null)}
      />

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