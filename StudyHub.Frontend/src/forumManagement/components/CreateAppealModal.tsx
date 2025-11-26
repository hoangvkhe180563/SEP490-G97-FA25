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
import { Loader2, AlertCircle } from "lucide-react";

interface CreateAppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<{ success: boolean; message?: string }>;
  isLoading?: boolean;
}

export const CreateAppealModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateAppealModalProps) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedReason = reason.trim();

    if (trimmedReason.length < 10) {
      setError("Lý do kháng cáo phải có ít nhất 10 ký tự");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const result = await onSubmit(trimmedReason);

      if (result?.success) {
        setReason("");
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting && !isLoading) {
      setReason("");
      setError("");
      onClose();
    }
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReason(e.target.value);
    if (error && e.target.value.trim().length >= 10) {
      setError("");
    }
  };

  const isValid = reason.trim().length >= 10;
  const isProcessing = submitting || isLoading;

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
                <span className="text-gray-500 font-normal ml-2">
                  (Tối thiểu 10 ký tự)
                </span>
              </label>
              <Textarea
                placeholder="Mô tả chi tiết lý do bạn muốn kháng cáo..."
                value={reason}
                onChange={handleReasonChange}
                className={`min-h-[150px] resize-none ${
                  error ? "border-red-500" : ""
                }`}
                maxLength={2000}
                required
                disabled={isProcessing}
              />
              <div className="flex justify-between items-center mt-1">
                <div>
                  {error && (
                    <div className="flex items-center gap-1 text-red-500 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
                <div
                  className={`text-xs ${
                    reason.trim().length < 10 ? "text-red-500" : "text-gray-500"
                  }`}
                >
                  {reason.length}/2000 ký tự
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={!isValid || isProcessing}>
              {isProcessing ? (
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
