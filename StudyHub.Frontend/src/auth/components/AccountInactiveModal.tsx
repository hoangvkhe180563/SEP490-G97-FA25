import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
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
// Button from alert-dialog's Action/Cancel used; no direct Button import needed

export function AccountInactiveModal() {
  const { accountInactiveOpen, setAccountInactiveOpen, logout } =
    useAuthStore();
  const { setActivateFormOpen } = useAuthStore();
  const navigate = useNavigate();

  const onLogout = async () => {
    // perform remote logout and clear local state
    try {
      await logout(true);
    } catch (e) {
      // best-effort
      console.warn("logout failed", e);
    } finally {
      setAccountInactiveOpen(false);
      // redirect to login
      navigate("/auth/login");
    }
  };

  return (
    <AlertDialog
      open={accountInactiveOpen}
      onOpenChange={(open) => setAccountInactiveOpen(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tài khoản bị vô hiệu hóa</AlertDialogTitle>
          <AlertDialogDescription>
            Tài khoản của bạn hiện đang bị vô hiệu hóa. Vui lòng liên hệ quản
            trị viên để biết thêm chi tiết.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActivateFormOpen(true)}
              className="inline-flex items-center px-3 py-1.5 rounded border bg-white text-sm text-gray-700 hover:bg-gray-50"
            >
              Yêu cầu kích hoạt
            </button>
            <AlertDialogCancel onClick={() => setAccountInactiveOpen(false)}>
              Đóng
            </AlertDialogCancel>
            <AlertDialogAction onClick={onLogout}>Đăng xuất</AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default AccountInactiveModal;
