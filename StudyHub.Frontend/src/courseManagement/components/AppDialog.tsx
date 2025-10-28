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
} from "@/common/components/ui/alert-dialog";

export interface DialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm?: () => void;
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
          <AlertDialogAction onClick={handleConfirm}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
