import React from "react";
import type { ClassWork } from "@/classManagement/interfaces/class";

/* shadcn components */
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/common/components/ui/dialog";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { Separator } from "@/common/components/ui/separator";
import { X } from "lucide-react";

const toLocaleDateTime = (v?: string) => {
  if (!v) return "Không xác định";
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return d.toLocaleString("vi-VN");
  } catch {
    return String(v);
  }
};

const ClassWorkModal: React.FC<{
  open: boolean;
  work: ClassWork |undefined;
  onClose: () => void;
}> = ({ open, work, onClose }) => {
  if (!open || !work) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-md w-full">
        {/* Close button (single) */}
        <DialogClose asChild>
          <Button variant="ghost" size="sm" aria-label="Đóng" className="absolute right-3 top-3 h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogClose>

        <DialogHeader className="pt-6 pb-2">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-lg">{work.title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-500">
            Thông tin chi tiết về bài tập
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-4">
          <div className="text-sm text-slate-700 mb-3 break-words">
            {work.description ?? <span className="text-slate-400">Không có mô tả</span>}
          </div>

          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-400">Hạn nộp</div>
              <Badge className="bg-slate-100 text-slate-700">{toLocaleDateTime(work.deadline??undefined)}</Badge>
            </div>

            {work.classId && (
              <div className="text-xs text-slate-400">
                Mã lớp: <span className="font-medium text-slate-700">{String(work.classId)}</span>
              </div>
            )}
          </div>

          <Separator className="my-2" />

          {/* Add any other fields here if exist on ClassWork */}
          <div className="text-xs text-slate-500 mt-2">
            {/* placeholder for extra metadata */}
          </div>
        </div>

        <DialogFooter>
          <div className="w-full flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Đóng</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClassWorkModal;