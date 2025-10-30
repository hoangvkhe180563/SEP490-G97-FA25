import React from "react";
import type { ClassMemberDto } from "@/classManagement/interfaces/class";

type Props = {
  open: boolean;
  member?: ClassMemberDto | any | null;
  onClose: () => void;
};

const InfoRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start gap-4 py-2 border-b last:border-b-0">
    <div className="w-44 text-xs text-gray-500">{label}</div>
    <div className="flex-1 text-sm text-gray-700 break-words">{value ?? "-"}</div>
  </div>
);

const normalizeGender = (g: any): string | null => {
  if (g === undefined || g === null) return null;
  if (typeof g === "boolean") return g ? "Nam" : "Nữ";
  const s = String(g).toLowerCase();
  if (s === "true" || s === "1" || s === "nam" || s === "male") return "Nam";
  if (s === "false" || s === "0" || s === "nữ" || s === "nu" || s === "female") return "Nữ";
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

const safeString = (v: any) => (v === undefined || v === null ? "-" : String(v));

const MemberDetailModal: React.FC<Props> = ({ open, member, onClose }) => {
  if (!open || !member) return null;

  const roles: string[] =
    member.roles && Array.isArray(member.roles)
      ? member.roles.map(String)
      : member.role
      ? [String(member.role)]
      : [];

  const userId = member.userId ?? member.id ?? "";
  const fullname = member.fullname ?? member.fullName ?? member.name ?? "";
  const joinDate = member.joinDate ?? member.joinedAt ?? member.createdAt ?? "";
  const gender = normalizeGender(member.gender ?? member.sex ?? member.isMale);
  const schoolId = member.schoolId ?? member.school_id ?? null;
  const schoolName = member.schoolName ?? member.school_name ?? null;
  const communes = member.communes ?? member.communeName ?? null;
  const address = member.address ?? member.addr ?? null;
  const communeId = member.communeId ?? member.commune_id ?? null;
  const phoneNumber = member.phoneNumber ?? member.phone ?? null;
  const email = member.email ?? null;
  const wallet = typeof member.wallet === "number" ? member.wallet : Number(member.wallet ?? 0);
  const avatarUrl = member.avatarUrl ?? member.avatar ?? member.imageUrl ?? null;

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
    email ?? (fullname ? `${fullname.replace(/\s+/g, ".").toLowerCase()}@example.com` : "");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium">Chi tiết thành viên</h3>
          <button onClick={onClose} className="text-gray-500 text-lg" aria-label="Đóng">
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-6">
            <div className="w-28 flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-28 h-28 rounded-full object-cover" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gray-100 flex items-center justify-center text-2xl text-gray-500">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xl font-semibold text-gray-800">{fullname || "Không rõ"}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {roles.length ? roles.join(", ") : "Không có vai trò"}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">Tham gia: {toLocaleDateTime(joinDate)}</div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-500">Mã</div>
                  <div className="text-sm font-medium text-gray-700 break-words">{safeString(userId)}</div>
                </div>
              </div>

              <div className="mt-6 bg-gray-50 rounded-md p-4">
                <InfoRow label="Họ và tên" value={fullname || "-"} />
                <InfoRow label="Vai trò" value={roles.length ? roles.join(", ") : "-"} />
                <InfoRow label="Ngày tham gia" value={toLocaleDateTime(joinDate)} />
                <InfoRow label="Giới tính" value={gender ?? "-"} />
                <InfoRow label="Số điện thoại" value={phoneNumber ?? "-"} />
                <InfoRow label="Email" value={emailGuess || "-"} />
                <InfoRow label="Địa chỉ" value={address || "-"} />
                <InfoRow label="Phường/Xã (commune)" value={communes ?? communeId ?? "-"} />
                <InfoRow label="Tên trường" value={schoolName ?? "-"} />
                <InfoRow
                  label="Số dư ví"
                  value={isNaN(Number(wallet)) ? safeString(member.wallet) : Number(wallet).toLocaleString()}
                />
              </div>

              <div className="mt-4 flex gap-2 justify-end">
                <a
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  href={`mailto:${emailGuess}`}
                >
                  Gửi email
                </a>
                <button
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText(String(userId ?? ""));
                    } catch {
                      // ignore
                    }
                  }}
                  title="Sao chép ID"
                  className="px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sao chép ID
                </button>
                <button
                  onClick={onClose}
                  className="px-3 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailModal;