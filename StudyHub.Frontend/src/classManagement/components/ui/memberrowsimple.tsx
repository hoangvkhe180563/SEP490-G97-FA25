import React from "react";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { Button } from "@/common/components/ui/button";
import type { ClassMemberDto } from "@/classManagement/interfaces/class";

type Props = {
  m: ClassMemberDto;
  onMail?: (p: ClassMemberDto) => void;
  onSelect?: (p: ClassMemberDto) => void;
  roleLabel?: string;
};

function openGmailCompose({ to, subject, body }: { to?: string; subject?: string; body?: string }) {
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

const MemberRowSimple: React.FC<Props> = ({ m, onMail, onSelect, roleLabel }) => {
  const initials = m.fullname
    ? String(m.fullname).charAt(0).toUpperCase()
    : String(m.userId ?? "").charAt(0).toUpperCase();

  const getEmail = (member: ClassMemberDto) => (member as any).email ?? "";
  const getDisplayName = (member: ClassMemberDto) => (member as any).fullname ?? "";

  const handleOpenGmail = (member: ClassMemberDto) => {
    const email = getEmail(member);
    if (!email) return;
    const name = getDisplayName(member);
    const subject = "";
    const body = `Hi ${name || ""},......`;
    if (typeof onMail === "function") {
      onMail(member);
    } else {
      openGmailCompose({ to: email, subject, body });
    }
  };

  return (
    <div
      className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer"
      onClick={() => onSelect && onSelect(m)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          onSelect && onSelect(m);
        }
      }}
    >
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-slate-800">{m.fullname}</div>
          {m.email && (
            <div className="text-sm text-slate-500">
              {/* render as plain text (not anchor) so clicking name/email area opens detail;
                  mail action is handled by the Mail button */}
              {m.email}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {roleLabel && (
          <div className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600">
            {roleLabel}
          </div>
        )}
        <Button
          variant="link"
          size="sm"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleOpenGmail(m);
          }}
        >
          Mail
        </Button>
      </div>
    </div>
  );
};

export default MemberRowSimple;