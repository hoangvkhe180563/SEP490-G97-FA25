import React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/common/components/ui/alert-dialog";

export interface DialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  navigateTo?: string;
}

export const AppDialog: React.FC<{
  dialog: DialogProps;
  setDialog: React.Dispatch<React.SetStateAction<DialogProps>>;
}> = ({ dialog, setDialog }) => {
  const navigate = useNavigate();

  const handleConfirm = () => {
    // Đóng dialog
    setDialog((prev) => ({ ...prev, open: false }));

    // Gọi hàm nếu có
    if (dialog.onConfirm) {
      setTimeout(() => dialog.onConfirm?.(), 150);
    }

    // Navigate nếu có
    if (dialog.navigateTo) {
      setTimeout(() => navigate(dialog.navigateTo!), 200);
    }
  };

  const handleCancel = () => {
    // Đóng dialog
    setDialog((prev) => ({ ...prev, open: false }));

    // Gọi hàm nếu có
    if (dialog.onCancel) {
      setTimeout(() => dialog.onCancel?.(), 150);
    }
  };

  return (
    <AlertDialog
      open={dialog.open}
      onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
          <AlertDialogDescription>{dialog.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {dialog.showCancel && (
            <AlertDialogCancel onClick={handleCancel}>Hủy</AlertDialogCancel>
          )}
          <AlertDialogAction onClick={handleConfirm}>
            Xác nhận
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
