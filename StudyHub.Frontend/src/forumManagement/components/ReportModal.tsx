// .../components/ReportModal.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { Button } from "@/common/components/ui/button";
import { Textarea } from "@/common/components/ui/textarea";
import { useForumStore } from "../stores/useForumStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { Loader2 } from "lucide-react";

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
  const { rules, loadRules, createReport, isLoading } = useForumStore();
  const { user } = useAuthStore();
  const schoolId = user?.schoolId || 1;

  useEffect(() => {
    if (open && rules.length === 0) {
      loadRules(schoolId);
    }
  }, [open, rules.length, schoolId, loadRules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedRuleId) {
      alert("Vui lòng chọn quy tắc và nhập nội dung báo cáo");
      return;
    }

    try {
      const result = await createReport(
        targetId,
        targetType,
        selectedRuleId,
        content
      );

      if (result?.success) {
        alert("Báo cáo thành công");
        onOpenChange(false);
        setContent("");
        setSelectedRuleId(null);
      } else {
        alert(result?.message || "Báo cáo thất bại");
      }
    } catch (error) {
      alert("Có lỗi xảy ra khi gửi báo cáo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Báo cáo vi phạm</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Mô tả chi tiết về vi phạm..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
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
