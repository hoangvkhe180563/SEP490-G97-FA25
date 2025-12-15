// src/forumManagement/components/MuteAlert.tsx
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/common/components/ui/alert";

interface MuteAlertProps {
  muteUntil: string;
  onClose?: () => void;
}

export const MuteAlert = ({ muteUntil }: MuteAlertProps) => {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Tài khoản bị cấm</AlertTitle>
      <AlertDescription>
        Bạn đã bị cấm tương tác đến{" "}
        {new Date(muteUntil).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </AlertDescription>
    </Alert>
  );
};
