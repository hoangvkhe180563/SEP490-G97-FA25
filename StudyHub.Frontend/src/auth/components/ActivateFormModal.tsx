import * as React from "react";
import { useAuthStore } from "../stores/useAuthStore";
import { axiosMessageErrorHandler } from "@/lib/axios";
import useAccountRecoveryStore from "@/user/stores/useAccountRecoveryStore";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/common/components/ui/alert-dialog";

const ActivateFormModal: React.FC = () => {
  const { activateFormOpen, setActivateFormOpen } = useAuthStore();
  const [identifier, setIdentifier] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<{
    identifier?: string;
    reason?: string;
  }>({});

  const onClose = () => {
    setActivateFormOpen(false);
    setMessage(null);
    setIdentifier("");
    setReason("");
  };

  const createRequest = useAccountRecoveryStore((s) => s.createRequest);

  const onSubmit = async () => {
    // client-side validation
    const nextErrors: typeof errors = {};
    if (!identifier || identifier.trim().length === 0) {
      nextErrors.identifier = "Vui lòng nhập email hoặc tên đăng nhập.";
    }
    if (!reason || reason.trim().length < 10) {
      nextErrors.reason = "Vui lòng nhập lý do (ít nhất 10 ký tự).";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setMessage(null);
    try {
      // Use the centralized account recovery store to create the request.
      await createRequest({
        identifier: identifier.trim(),
        reason: reason.trim(),
      });
      setMessage("Đã gửi yêu cầu. Vui lòng kiểm tra email và chờ phản hồi.");
      // close form after a short delay
      setTimeout(() => onClose(), 1200);
    } catch (err: unknown) {
      const msg = axiosMessageErrorHandler(err);
      setMessage(msg || "Gửi yêu cầu thất bại. Vui lòng thử lại sau.");
      console.log("activate request error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog
      open={activateFormOpen}
      onOpenChange={(o) => setActivateFormOpen(o)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Yêu cầu khôi phục tài khoản</AlertDialogTitle>
          <AlertDialogDescription>
            Điền email hoặc tên đăng nhập và lý do bạn muốn khôi phục tài khoản.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700">
            Email hoặc tên đăng nhập
          </label>
          <input
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (errors.identifier)
                setErrors((s) => ({ ...s, identifier: undefined }));
            }}
            aria-invalid={!!errors.identifier}
            aria-describedby={
              errors.identifier ? "identifier-error" : undefined
            }
            className={`mt-1 block w-full rounded border px-3 py-2 ${
              errors.identifier ? "border-red-500" : ""
            }`}
            placeholder="Email hoặc tên đăng nhập"
          />
          {errors.identifier && (
            <p id="identifier-error" className="mt-1 text-sm text-red-600">
              {errors.identifier}
            </p>
          )}

          <label className="block text-sm font-medium text-gray-700 mt-3">
            Lý do xin khôi phục
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errors.reason)
                setErrors((s) => ({ ...s, reason: undefined }));
            }}
            aria-invalid={!!errors.reason}
            aria-describedby={errors.reason ? "reason-error" : undefined}
            className={`mt-1 block w-full rounded border px-3 py-2 ${
              errors.reason ? "border-red-500" : ""
            }`}
            rows={4}
            placeholder="Mô tả ngắn lý do và thông tin bổ sung nếu cần"
          />
          {errors.reason && (
            <p id="reason-error" className="mt-1 text-sm text-red-600">
              {errors.reason}
            </p>
          )}

          {message && (
            <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-2 rounded">
              {message}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Đóng</AlertDialogCancel>
          <AlertDialogAction onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ActivateFormModal;
