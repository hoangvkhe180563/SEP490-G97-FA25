import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { Lock } from "lucide-react";

type RequireRoleProps = {
  allowedRoles: string[];
  children: React.ReactNode;
};

const RequireRole: React.FC<RequireRoleProps> = ({
  allowedRoles,
  children,
}) => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  //   if (!user) return <Navigate to="/auth/login" replace />;

  const userRoles = (user?.roles || []) as string[];

  // Case-insensitive comparison
  const userRolesNorm = userRoles.map((r) =>
    (r || "").toString().toLowerCase()
  );
  const allowedNorm = allowedRoles.map((r) =>
    (r || "").toString().toLowerCase()
  );
  const has = allowedNorm.some((r) => userRolesNorm.includes(r));

  if (!has) {
    const copyRoles = async () => {
      try {
        await navigator.clipboard.writeText(userRoles.join(", "));
      } catch {
        /* ignore */
      }
    };

    return (
      <div className="max-w-2xl mx-auto p-8 mt-12 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-50 rounded-full">
            <Lock className="w-6 h-6 text-rose-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold text-gray-900">
              Không có quyền truy cập
            </h3>
            <p className="mt-2 text-gray-600">
              Tài khoản của bạn hiện chưa có quyền vào trang này.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => navigate("/")}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-gray-900 text-white hover:opacity-95"
              >
                Về trang chủ
              </button>
              <button
                onClick={() =>
                  window.open(
                    "mailto:support@example.com?subject=Yêu+cầu+quyền",
                    "_blank"
                  )
                }
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
              >
                Yêu cầu quyền
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              <div>
                Quyền hiện tại của bạn:{" "}
                <strong className="text-gray-800">
                  {userRoles.join(", ") || "—"}
                </strong>
              </div>
              <div className="mt-1">
                Quyền cần có:{" "}
                <strong className="text-gray-800">
                  {allowedRoles.join(", ")}
                </strong>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={copyRoles}
                  className="text-sm text-gray-600 underline"
                >
                  Sao chép quyền để báo cáo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireRole;
