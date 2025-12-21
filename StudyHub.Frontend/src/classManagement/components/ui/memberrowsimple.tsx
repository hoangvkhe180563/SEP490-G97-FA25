import React from "react";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { Button } from "@/common/components/ui/button";
import type { ClassMemberDto } from "@/classManagement/interfaces/class";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/auth/stores/useAuthStore";

type Props = {
  m: ClassMemberDto;
  classId?: number; // add classId so component can call kick endpoint if needed
  onMail?: (p: ClassMemberDto) => void;
  onSelect?: (p: ClassMemberDto) => void;
  onKick?: (p: ClassMemberDto) => Promise<boolean | void> | void; // optional callback
  roleLabel?: string;
  /**
   * Optional: list of roles of the CURRENT user (not the listed member `m`).
   * If provided, the component will allow kicking only when the current user
   * has a "Homeroom Teacher" role (case-insensitive).
   *
   * If not provided, the Kick button will be hidden (safer default).
   *
   * Parent components should pass the current user's roles (e.g. from a store).
   */
  currentUserRoles?: string[] | null;
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

const MemberRowSimple: React.FC<Props> = ({ m, classId, onMail, onSelect, onKick, roleLabel, currentUserRoles = null }) => {
  const { user } = useAuthStore();
  const currentUserId = user?.id ?? null;

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

  // Determine whether the current user can kick.
  // Only allow if their roles array contains a role matching "Homeroom Teacher" (case-insensitive).
  const isHomeroomTeacher = (() => {
    if (!Array.isArray(currentUserRoles)) return false;
    try {
      return currentUserRoles.some((r) =>
        /homeroom\s*teacher/i.test(String(r ?? ""))
      );
    } catch {
      return false;
    }
  })();

  // If this row represents the current user, treat as self and do not show Kick button
  const isSelf = (() => {
    try {
      if (!currentUserId) return false;
      // compare as strings (handles Guid/string)
      return String(currentUserId).toLowerCase() === String(m.userId ?? "").toLowerCase();
    } catch {
      return false;
    }
  })();

  const handleKickClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // If trying to kick self, block (defense-in-depth)
    if (isSelf) {
      window.alert("Bạn không thể loại chính bạn khỏi lớp.");
      return;
    }

    // if parent provided a handler, prefer that (parent can perform authorization check too)
    if (typeof onKick === "function") {
      try {
        await onKick(m);
      } catch (err) {
        console.error("onKick handler error:", err);
      }
      return;
    }

    // If component determined current user isn't allowed, block action (defense-in-depth).
    if (!isHomeroomTeacher) {
      window.alert("Bạn không có quyền loại thành viên (chỉ Homeroom Teacher mới có quyền).");
      return;
    }

    // confirm user action
    const ok = window.confirm("Bạn có chắc muốn loại thành viên này khỏi lớp không?");
    if (!ok) return;

    if (!classId) {
      window.alert("classId không được cung cấp, không thể kick.");
      return;
    }

    try {
      // call server endpoint (POST /ClassMember/{userId}/kick?classId=...)
      const url = `/ClassMember/${encodeURIComponent(m.userId || "")}/kick?classId=${encodeURIComponent(classId)}`;
      const res = await axiosInstance.post(url);
      const raw = res?.data ?? null;
      if (!raw || raw.success === false) {
        const msg = raw?.message ?? "Không thể kick thành viên.";
        window.alert(msg);
        return;
      }

      window.alert(raw?.message ?? "Thành viên đã bị kick.");
      // caller / parent component should refresh member list (or provide onKick to do so).
    } catch (err: any) {
      console.error("Kick API error:", err);
      const msg = err?.response?.data?.message ?? err?.message ?? "Lỗi khi kick thành viên.";
      window.alert(msg);
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

        {/* Show Kick only if current user is homeroom teacher AND the row is not the current user */}
        {isHomeroomTeacher && !isSelf && (
          <Button
            variant="destructive"
            size="sm"
            type="button"
            onClick={handleKickClick}
          >
            Kick
          </Button>
        )}
      </div>
    </div>
  );
};

export default MemberRowSimple;