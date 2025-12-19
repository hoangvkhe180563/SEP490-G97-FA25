import React from "react";
import type { ClassMemberDto } from "@/classManagement/interfaces/class";

/* shadcn components */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/common/components/ui/dialog";
import { Button } from "@/common/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/common/components/ui/avatar";
import { Badge } from "@/common/components/ui/badge";

type Props = {
  open: boolean;
  member?: ClassMemberDto | any | null;
  onClose: () => void;
};

const InfoRow: React.FC<{ label: string; value?: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex items-start gap-4 py-2 border-b last:border-b-0">
    <div className="w-44 text-xs text-slate-500">{label}</div>
    <div className="flex-1 text-sm text-slate-700 break-words">
      {value ?? "-"}
    </div>
  </div>
);

const normalizeGender = (g: any): string | null => {
  if (g === undefined || g === null) return null;
  if (typeof g === "boolean") return g ? "Nam" : "Nữ";
  const s = String(g).toLowerCase();
  if (s === "true" || s === "1" || s === "nam" || s === "male") return "Nam";
  if (s === "false" || s === "0" || s === "nữ" || s === "nu" || s === "female")
    return "Nữ";
  return null;
};

const toLocaleDateTime = (v?: string) => {
  if (!v) return "-";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return v;
  }
};

const safeString = (v: any) =>
  v === undefined || v === null ? "-" : String(v);

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

const MemberDetailModal: React.FC<Props> = ({ open, member, onClose }) => {
  if (!open || !member) return null;

  const roles: string[] =
    member.roles && Array.isArray(member.roles)
      ? member.roles.map(String)
      : member.role
      ? [String(member.role)]
      : [];

  // const userId = member.userId ?? "";
  const fullname = member.fullname ?? "";
  const joinDate = member.joinDate ?? "";
  const gender = normalizeGender(member.gender);
  // const schoolId = member.schoolId ?? null;
  const schoolName = member.schoolName ?? null;
  const communes = member.communes ?? null;
  const address = member.address ?? null;
  const communeId = member.communeId ?? null;
  const phoneNumber = member.phoneNumber ?? null;
  const email = member.email ?? null;
  const avatarUrl = member.avatarUrl ?? null;

  const initials =
    fullname && fullname.length > 0
      ? fullname
          .split(" ")
          .filter(Boolean)
          .slice(-2)
          .map((s: string) => s[0])
          .join("")
          .toUpperCase()
      : "U";

  const emailGuess =
    email ??
    (fullname
      ? `${fullname.replace(/\s+/g, ".").toLowerCase()}@example.com`
      : "");

  const handleOpenGmail = () => {
    if (!emailGuess) return;
    const subject = "";
    const body = `Hi ${fullname || ""},..........`;
    openGmailCompose({ to: emailGuess, subject, body });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) onClose();
      }}
    >
      <DialogContent className="sm:max-w-3xl w-full">
        {/* Close button in top-right */}
        <DialogClose asChild>
          {/* keep empty so shadcn renders close icon in default spot if desired */}
          <button aria-label="Close" className="sr-only">
            Close
          </button>
        </DialogClose>

        <DialogHeader className="pt-6 pb-2">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle>Chi tiết thành viên</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-500">
            Thông tin chi tiết về thành viên của lớp
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          <div className="flex gap-6">
            <div className="w-28 flex-shrink-0">
              {avatarUrl ? (
                <Avatar className="h-28 w-28">
                  <AvatarImage src={avatarUrl} alt={fullname || "avatar"} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center text-2xl text-slate-500">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="text-xl font-semibold text-slate-900 truncate">
                    {fullname || "Không rõ"}
                  </div>

                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {roles.length ? (
                      roles.map((r) => (
                        <Badge key={r} className="bg-slate-100 text-slate-700">
                          {r}
                        </Badge>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500">
                        Không có vai trò
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-slate-400 mt-2">
                    Tham gia: {toLocaleDateTime(joinDate)}
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-slate-50 rounded-md p-4">
                <InfoRow label="Họ và tên" value={fullname || "-"} />
                <InfoRow
                  label="Ngày tham gia"
                  value={toLocaleDateTime(joinDate)}
                />
                <InfoRow label="Giới tính" value={gender ?? "-"} />
                <InfoRow
                  label="Số điện thoại"
                  value={safeString(phoneNumber)}
                />
                <InfoRow
                  label="Email"
                  value={
                    emailGuess ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenGmail();
                        }}
                        className="text-sky-600 hover:underline text-sm"
                        aria-label={`Gửi email tới ${emailGuess}`}
                      >
                        {emailGuess}
                      </button>
                    ) : (
                      "-"
                    )
                  }
                />
                <InfoRow label="Địa chỉ" value={safeString(address)} />
                <InfoRow
                  label="Phường/Xã (commune)"
                  value={communes ?? communeId ?? "-"}
                />
                <InfoRow label="Tên trường" value={schoolName ?? "-"} />
              </div>

              <div className="mt-4 flex gap-2 justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenGmail();
                  }}
                  disabled={!emailGuess}
                >
                  Gửi email
                </Button>

                <Button variant="ghost" size="sm" onClick={onClose}>
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberDetailModal;
