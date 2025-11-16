// src/forumManagement/components/HidePostModal.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { Button } from "@/common/components/ui/button";
import { Textarea } from "@/common/components/ui/textarea";
import { Input } from "@/common/components/ui/input";
import { Alert, AlertDescription } from "@/common/components/ui/alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface HidePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: number;
  onSuccess: () => void;
  onHide: (
    postId: number,
    violationScore: number,
    reason: string
  ) => Promise<any>;
}

export const HidePostModal = ({
  open,
  onOpenChange,
  postId,
  onSuccess,
  onHide,
}: HidePostModalProps) => {
  const [violationScore, setViolationScore] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setError("");
      setSuccess("");
      setViolationScore(0);
      setReason("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (violationScore <= 0) {
      setError("Điểm vi phạm phải lớn hơn 0");
      return;
    }

    if (!reason.trim() || reason.trim().length < 10) {
      setError("Lý do phải có ít nhất 10 ký tự");
      return;
    }

    setIsLoading(true);
    const result = await onHide(postId, violationScore, reason.trim());

    if (result?.success) {
      setSuccess("Đã ẩn bài viết thành công");
      setTimeout(() => {
        onOpenChange(false);
        onSuccess();
        setSuccess("");
      }, 1500);
    } else {
      setError(result?.message || "Ẩn bài viết thất bại");
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ẩn bài viết vi phạm</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">
              Điểm vi phạm
            </label>
            <Input
              type="number"
              min="1"
              max="100"
              placeholder="Nhập điểm vi phạm (1-100)"
              value={violationScore || ""}
              onChange={(e) => setViolationScore(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Lý do ẩn bài
            </label>
            <Textarea
              placeholder="Mô tả chi tiết lý do ẩn bài (tối thiểu 10 ký tự)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              minLength={10}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xác nhận ẩn
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
