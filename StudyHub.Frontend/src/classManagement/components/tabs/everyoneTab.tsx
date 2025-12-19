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

function openGmailCompose({
  to,
  subject,
  body,
}: {
  to?: string;
  subject?: string;
  body?: string;
}) {
  const base = "https://mail.google.com/mail/";
  const params = new URLSearchParams();
  params.set("view", "cm");
  params.set("fs", "1"); // compose in full-screen
  if (to) params.set("to", to);
  if (subject) params.set("su", subject);
  if (body) params.set("body", body);
  const url = `${base}?${params.toString()}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

const EveryoneTab: React.FC<Props> = ({
  teachers = [],
  students,
  onMail,
  onSelect,
  classId,
}) => {
  const [selectedMemberLocal, setSelectedMemberLocal] =
    useState<ClassMemberDto | null>(null);
  const [openAddLocal, setOpenAddLocal] = useState(false);

  const { user } = useAuthStore();
  const coarseRole = mapToCoarseRole(user?.roles);
  const isTeacher = coarseRole === "teacher";

  const openAdd = () => {
    if (!isTeacher) return;
    // 1) open modal first (so modal mounts)
    setOpenAddLocal(true);
    // 2) call parent callback deferred (avoid sync parent side-effects causing modal mount to be lost)
  };

  const handleSelect = (p: ClassMemberDto) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    onSelect && onSelect(p);
    setSelectedMemberLocal(p);
  };

  const getEmail = (m: ClassMemberDto) => {
    return (m as any).email ?? "";
  };

  const getDisplayName = (m: ClassMemberDto) => (m as any).fullname ?? "";

  const handleOpenGmail = (member: ClassMemberDto) => {
    const email = getEmail(member);
    if (!email) return;
    const name = getDisplayName(member);
    const subject = "";
    const body = `Hi ${name || ""},%0D%0A%0D%0A`;
    if (typeof onMail === "function") {
      onMail(member);
    } else {
      openGmailCompose({ to: email, subject, body });
    }
  };

  const onRowClickCapture = (e: React.MouseEvent, member: ClassMemberDto) => {
    try {
      const target = e.target as HTMLElement;
      const anchor =
        target.closest && (target.closest("a") as HTMLAnchorElement | null);
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      const isMailLink =
        href.startsWith("mailto:") ||
        anchor.dataset?.mail === "true" ||
        anchor.classList.contains("mail-link") ||
        /\bemail\b/i.test(anchor.className || "");
      if (isMailLink) {
        e.preventDefault();
        e.stopPropagation();
        handleOpenGmail(member);
      }
    } catch {
      // ignore
    }
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, member: ClassMemberDto) => {
    if (e.key === "Enter" || e.key === " ") {
      const target = e.target as HTMLElement;
      const anchor =
        target.closest && (target.closest("a") as HTMLAnchorElement | null);
      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        if (href.startsWith("mailto:")) {
          handleOpenGmail(member);
          return;
        }
      }
      e.preventDefault();
      handleSelect(member);
    }
  };

  const renderMemberRow = (m: ClassMemberDto, roleLabel?: string) => {
    const key = m.userId ?? `m-${Math.random()}`;
    return (
      <div
        key={key}
        role="button"
        tabIndex={0}
        onClickCapture={(e) => onRowClickCapture(e as React.MouseEvent, m)}
        onClick={() => handleSelect(m)}
        onKeyDown={(e) => handleRowKeyDown(e, m)}
        className="block w-full text-left focus:outline-none"
      >
        <MemberRowSimple m={m} onSelect={handleSelect} roleLabel={roleLabel} />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {isTeacher && (
          // ensure button type is explicit to avoid submitting a surrounding form
          <Button type="button" onClick={openAdd} className="mb-2">
            Thêm thành viên
          </Button>
        )}
      </div>

      <Card>
        <div className="p-4">
          <div className="mb-3">
            <div className="font-semibold text-lg">
              Giáo viên ({teachers.length})
            </div>
          </div>
          {teachers.length === 0 ? (
            <div className="text-sm text-slate-500">
              Chưa có giáo viên được gán cho lớp này.
            </div>
          ) : (
            <div className="space-y-2">
              {teachers.map((t) => renderMemberRow(t, "Giáo viên"))}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <div className="mb-3">
            <div className="font-semibold text-lg">
              Học sinh ({students.length})
            </div>
          </div>
          {students.length === 0 ? (
            <div className="text-sm text-slate-500">Chưa có học sinh.</div>
          ) : (
            <div className="space-y-2">
              {students.map((s) => renderMemberRow(s, "Học sinh"))}
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
        open={Boolean(openAddLocal)}
        classId={classId ? Number(classId) : 0}
        onClose={() => setOpenAddLocal(false)}
        onInvited={() => setOpenAddLocal(false)}
      />
    </div>
  );
};

export default EveryoneTab;
