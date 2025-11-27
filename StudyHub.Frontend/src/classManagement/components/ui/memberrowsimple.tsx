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

const MemberRowSimple: React.FC<Props> = ({ m, onMail, onSelect, roleLabel }) => {
  const initials = m.fullname
    ? m.fullname.charAt(0).toUpperCase()
    : String(m.userId ?? "").charAt(0).toUpperCase();

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
          {m.email && <div className="text-sm text-slate-500">{m.email}</div>}
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
          onClick={(e) => {
            e.stopPropagation();
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            onMail && onMail(m);
          }}
        >
          Mail
        </Button>
      </div>
    </div>
  );
};

export default MemberRowSimple;