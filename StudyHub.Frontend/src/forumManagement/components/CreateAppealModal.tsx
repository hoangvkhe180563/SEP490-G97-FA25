// src/forumManagement/components/CreateAppealModal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/common/components/ui/dialog";
import { Button } from "@/common/components/ui/button";
import { Textarea } from "@/common/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface CreateAppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const CreateAppealModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateAppealModalProps) => {
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    await onSubmit(reason);
    setReason("");
    onClose();
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo kháng cáo</DialogTitle>
          <DialogDescription>
            Vui lòng mô tả lý do kháng cáo của bạn. Moderator sẽ xem xét và phản
            hồi trong thời gian sớm nhất.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Lý do kháng cáo <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Mô tả chi tiết lý do bạn muốn kháng cáo..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[150px] resize-none"
                maxLength={500}
                required
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {reason.length}/500 ký tự
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={!reason.trim() || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi kháng cáo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
