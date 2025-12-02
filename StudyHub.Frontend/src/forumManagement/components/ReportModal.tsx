// ReportModal.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/common/components/ui/dialog";
import { Button } from "@/common/components/ui/button";
import { Textarea } from "@/common/components/ui/textarea";
import { Alert, AlertDescription } from "@/common/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { Label } from "@/common/components/ui/label";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { forumService } from "../services/ForumService";
import { useForumStore } from "../stores/useForumStore";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetId: number;
  targetType: "post" | "comment";
}

export const ReportModal = ({
  open,
  onOpenChange,
  targetId,
  targetType,
}: ReportModalProps) => {
  const [content, setContent] = useState("");
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { rules, loadRules } = useForumStore();
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || 1;

  useEffect(() => {
    if (open && rules.length === 0) {
      loadRules(schoolId);
    }
  }, [open, rules.length, schoolId, loadRules]);

  useEffect(() => {
    if (open) {
      setError("");
      setSuccess("");
      setContent("");
      setSelectedRuleId("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedRuleId) {
      setError("Vui lòng chọn quy tắc");
      return;
    }

    if (!content.trim() || content.trim().length < 10) {
      setError("Nội dung báo cáo phải có ít nhất 10 ký tự");
      return;
    }

    setIsLoading(true);
    try {
      const result = await forumService.createReport(
        targetId,
        targetType,
        Number(selectedRuleId),
        content.trim()
      );

      if (result?.success) {
        setSuccess(result.message || "Báo cáo của bạn đã được gửi thành công");
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      } else {
        setError(result?.message || "Gửi báo cáo thất bại. Vui lòng thử lại");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Có lỗi xảy ra khi gửi báo cáo");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            Báo cáo vi phạm
          </DialogTitle>
          <DialogDescription>
            Vui lòng cung cấp thông tin chi tiết về vi phạm bạn muốn báo cáo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="rule-select" className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Chọn quy tắc bị vi phạm
              <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedRuleId}
              onValueChange={setSelectedRuleId}
              disabled={isLoading || !!success}
            >
              <SelectTrigger id="rule-select">
                <SelectValue placeholder="-- Chọn quy tắc --" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="max-h-[200px] z-[100]"
                sideOffset={5}
                align="start"
                avoidCollisions={true}
              >
                {rules.map((rule) => (
                  <SelectItem key={rule.id} value={String(rule.id)}>
                    {rule.content}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="report-content"
              className="flex items-center gap-1.5"
            >
              Nội dung báo cáo
              <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="report-content"
              placeholder="Mô tả chi tiết về vi phạm (tối thiểu 10 ký tự)..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              minLength={10}
              disabled={isLoading || !!success}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {content.length >= 10 ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              {content.length}/10 ký tự tối thiểu
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {success ? "Đóng" : "Hủy"}
            </Button>
            {!success && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Gửi báo cáo
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
