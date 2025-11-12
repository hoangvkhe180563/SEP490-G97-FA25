// src/forumManagement/components/ReportModal.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { Button } from "@/common/components/ui/button";
import { Textarea } from "@/common/components/ui/textarea";
import { Alert, AlertDescription } from "@/common/components/ui/alert";
import { useForumStore } from "../stores/useForumStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

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
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { rules, loadRules, createReport, isLoading } = useForumStore();
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

    const result = await createReport(
      targetId,
      targetType,
      selectedRuleId,
      content.trim()
    );

    if (result?.success) {
      setSuccess("Báo cáo của bạn đã được gửi");
      setTimeout(() => {
        onOpenChange(false);
        setContent("");
        setSelectedRuleId(null);
        setSuccess("");
      }, 1500);
    } else {
      setError(result?.message || "Báo cáo thất bại");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Báo cáo vi phạm</DialogTitle>
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
              Chọn quy tắc bị vi phạm
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedRuleId || ""}
              onChange={(e) => setSelectedRuleId(Number(e.target.value))}
            >
              <option value="">-- Chọn quy tắc --</option>
              {rules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.content}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Nội dung báo cáo
            </label>
            <Textarea
              placeholder="Mô tả chi tiết về vi phạm (tối thiểu 10 ký tự)..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              minLength={10}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Gửi báo cáo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
