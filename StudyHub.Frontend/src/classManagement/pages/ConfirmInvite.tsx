import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { mapToCoarseRole } from "@/classManagement/utils/roleutil";

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: any;
};

const ConfirmInvite: React.FC = () => {
  const { id: classIdParam } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { getClassInfo, currentClass, getClassMembers } = useClassStore();
  const { user: authUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const classId = classIdParam ? Number(classIdParam) : NaN;
  const queryUserId = searchParams.get("userId") ?? undefined;
  const storedUserIdFallback = localStorage.getItem("currentUserId") ?? undefined;

  // Determine appUserId preference:
  // 1) logged in user (zustand auth store)
  // 2) userId query param in invite link
  // 3) fallback localStorage (legacy)
  const appUserId =
    (authUser && (authUser.id)) ??
    queryUserId ??
    storedUserIdFallback ??
    "";

  // Determine current role (coarse) from auth user roles if available.
  // If user not logged in and we only have queryUserId, default to "student".
  const coarseRoleFromAuth = mapToCoarseRole(authUser?.roles ?? undefined);
  const redirectRole = coarseRoleFromAuth ?? "student";

  useEffect(() => {
    if (!classIdParam) return;
    setIsLoading(true);
    getClassInfo(Number(classIdParam))
      .catch(() => {
        /* ignore - store will be unchanged */
      })
      .finally(() => setIsLoading(false));
  }, [classIdParam, getClassInfo]);

  const handleAccept = async () => {
    setError(null);
    setActionLoading(true);

    if (!appUserId) {
      setError("Bạn chưa đăng nhập. Vui lòng đăng nhập hoặc đăng ký để chấp nhận lời mời.");
      setActionLoading(false);
      return;
    }

    if (!classIdParam) {
      setError("ClassId không hợp lệ.");
      setActionLoading(false);
      return;
    }

    try {
      // Call backend endpoint that sets class_members.status = 'joined'
      const url = `/Class/${classId}/members/${appUserId}/confirm`;
      // Controller expects POST without body
      const res = await axiosInstance.post<ApiResponse>(url);
      const payload = res?.data;

      if (!payload) {
        setError("Máy chủ không phản hồi. Vui lòng thử lại sau.");
        setActionLoading(false);
        return;
      }

      if (!payload.success) {
        setError(payload.message ?? "Không thể xác nhận lời mời.");
        setActionLoading(false);
        return;
      }

      setSuccessMessage(payload.message ?? "Bạn đã tham gia lớp thành công.");

      // Refresh class members in store (best-effort)
      try {
        await getClassMembers(Number(classIdParam));
      } catch {
        // ignore
      }

      // short delay so user sees success, then redirect to class detail with role in URL
      setTimeout(() => {
        navigate(`/class/${redirectRole}/${classIdParam}`);
      }, 900);
    } catch (err: any) {
      console.error("accept invite error", err);
      setError(err?.response?.data?.message ?? "Lỗi khi xác nhận lời mời.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = () => {
    // Option: send decline to backend (not implemented). For now, just navigate away.
    navigate("/");
  };

  const classInfo = currentClass?.data?.classInfo ?? null;
  const teacher = currentClass?.data?.teacher ?? null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white text-xl">
            👋
          </div>
          <div>
            <h2 className="text-xl font-semibold">Xác nhận lời mời tham gia lớp</h2>
            <div className="text-sm text-gray-500 mt-1">
              {isLoading ? "Đang tải thông tin lớp..." : classInfo ? `Lớp: ${classInfo.name}` : "Không tìm thấy thông tin lớp."}
            </div>
          </div>
        </div>

        <div className="mt-6 border rounded p-4 bg-gray-50">
          <div className="text-sm text-gray-700 mb-2">Chi tiết lời mời</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-400">Tên lớp</div>
              <div className="font-medium">{classInfo?.name ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Người mời</div>
              <div className="font-medium">{teacher?.fullname ?? "Giáo viên"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Mô tả</div>
              <div className="text-sm text-gray-700">{classInfo?.description ?? "-"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Bạn sẽ được thêm với vai trò</div>
              <div className="font-medium">Học sinh</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleAccept}
            disabled={actionLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {actionLoading ? "Đang xử lý..." : "Chấp nhận lời mời"}
          </button>

          <button
            onClick={handleDecline}
            className="px-4 py-2 rounded border text-gray-700"
          >
            Từ chối
          </button>

          <div className="ml-auto text-xs text-gray-400">
            {appUserId ? `Bạn đang xác nhận cho: ${appUserId}` : "Bạn chưa đăng nhập"}
          </div>
        </div>

        {!appUserId && (
          <div className="mt-4 text-sm text-gray-600">
            Bạn cần đăng nhập để chấp nhận lời mời.{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 underline"
            >
              Đăng nhập
            </button>{" "}
            hoặc{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-blue-600 underline"
            >
              tạo tài khoản
            </button>
            .
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmInvite;