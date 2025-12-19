import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { mapToCoarseRole } from "@/classManagement/utils/roleutil";

import { Card } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Avatar, AvatarFallback } from "@/common/components/ui/avatar";
import { Separator } from "@/common/components/ui/separator";
import { Label } from "@/common/components/ui/label";

const ConfirmInvite: React.FC = () => {
  const { id: classIdParam } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const {
    getClassInfo,
    currentClass,
    getClassMembers,
    confirmMember,
    declineMember,
  } = useClassStore();
  const { user: authUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const queryUserId = searchParams.get("userId") ?? undefined;
  const storedUserIdFallback =
    localStorage.getItem("currentUserId") ?? undefined;

  const appUserId =
    (authUser && authUser.id) ?? queryUserId ?? storedUserIdFallback ?? "";

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
      setError(
        "Bạn chưa đăng nhập. Vui lòng đăng nhập hoặc đăng ký để chấp nhận lời mời."
      );
      setActionLoading(false);
      return;
    }

    if (!classIdParam) {
      setError("ClassId không hợp lệ.");
      setActionLoading(false);
      return;
    }

    try {
      const result = await confirmMember(
        Number(classIdParam),
        String(appUserId)
      );

      if (result === true) {
        setSuccessMessage("Bạn đã tham gia lớp thành công.");
        try {
          await getClassMembers(Number(classIdParam));
        } catch {
          // ignore refresh errors
        }
        setTimeout(() => {
          navigate(`/class/${redirectRole}/${classIdParam}`);
        }, 900);
      } else if (result === false) {
        setError("Không thể xác nhận lời mời. Vui lòng thử lại sau.");
      } else {
        setError("Lỗi: không thể xử lý yêu cầu xác nhận. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("accept invite error", err);
      setError(err?.response?.data?.message ?? "Lỗi khi xác nhận lời mời.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setError(null);
    setActionLoading(true);

    if (!appUserId) {
      setError(
        "Bạn chưa đăng nhập. Vui lòng đăng nhập hoặc đăng ký để từ chối lời mời."
      );
      setActionLoading(false);
      return;
    }

    if (!classIdParam) {
      setError("ClassId không hợp lệ.");
      setActionLoading(false);
      return;
    }

    try {
      const result = await declineMember(
        Number(classIdParam),
        String(appUserId)
      );

      if (result === true) {
        setSuccessMessage("Bạn đã từ chối lời mời.");
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 700);
      } else if (result === false) {
        setError("Không thể từ chối lời mời. Vui lòng thử lại sau.");
      } else {
        setError("Lỗi: không thể xử lý yêu cầu từ chối. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("decline invite error", err);
      setError(err?.response?.data?.message ?? "Lỗi khi từ chối lời mời.");
    } finally {
      setActionLoading(false);
    }
  };

  const classInfo = currentClass?.data?.classInfo ?? null;
  const teacher = currentClass?.data?.teachers ?? null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12 bg-emerald-600">
            <AvatarFallback className="text-white text-lg">👋</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold">
              Xác nhận lời mời tham gia lớp
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isLoading
                ? "Đang tải thông tin lớp..."
                : classInfo
                ? `Lớp: ${classInfo.name}`
                : "Không tìm thấy thông tin lớp."}
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="bg-slate-50 rounded-md border p-4">
          <div className="text-sm text-slate-700 mb-3 font-medium">
            Chi tiết lời mời
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tên lớp</Label>
              <div className="mt-1 font-medium">{classInfo?.name ?? "-"}</div>
            </div>

            <div>
              <Label className="text-xs">Người mời</Label>
              <div className="mt-1 font-medium">
                {teacher?.at(1)?.fullname ?? "Giáo viên"}
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs">Mô tả</Label>
              <div className="mt-1 text-sm text-slate-700">
                {classInfo?.description ?? "-"}
              </div>
            </div>

            <div>
              <Label className="text-xs">Bạn sẽ được thêm với vai trò</Label>
              <div className="mt-1 font-medium">Học sinh</div>
            </div>
          </div>
        </div>

        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

        {successMessage && (
          <div className="mt-4 text-sm text-emerald-700">{successMessage}</div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button
            onClick={handleAccept}
            disabled={actionLoading}
            className="bg-blue-600"
          >
            {actionLoading ? "Đang xử lý..." : "Chấp nhận lời mời"}
          </Button>

          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={actionLoading}
          >
            {actionLoading ? "Đang xử lý..." : "Từ chối"}
          </Button>
        </div>

        {!appUserId && (
          <div className="mt-4 text-sm text-slate-600">
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
      </Card>
    </div>
  );
};

export default ConfirmInvite;
