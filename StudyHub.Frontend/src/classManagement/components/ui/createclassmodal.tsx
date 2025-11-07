import React, { useEffect, useState } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";

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
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import { Label } from "@/common/components/ui/label";
import { X } from "lucide-react";

export const CreateClassModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreate: (payload: { title: string; description?: string; createdBy?: string }) => Promise<void>;
}> = ({ open, onClose, onCreate }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { subjects, getAllSubjects } = useClassStore();

  // only fetch subjects when modal opens
  useEffect(() => {
    if (open) {
      getAllSubjects?.();
    }
  }, [open, getAllSubjects]);

  // reset fields when modal closed
  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setSubmitting(false);
    }
  }, [open]);

  const valid = title.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;

    setSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-md w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Tạo lớp học</DialogTitle>
              {/* single close control */}
              <DialogClose asChild>
               
              </DialogClose>
            </div>
            <DialogDescription className="text-sm text-slate-500">
              Tạo một lớp mới bằng cách điền thông tin bên dưới.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <div>
              <Label className="text-sm">Tên lớp học <span className="text-red-500">*</span></Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tên lớp học"
                required
                className="mt-1"
                aria-label="Tên lớp học"
              />
            </div>

            <div>
              <Label className="text-sm">Mô tả</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả lớp học (nếu có)"
                className="mt-1 h-28"
                aria-label="Mô tả lớp học"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            {/* Hủy là text button, không có icon */}
            <Button variant="ghost" onClick={onClose} type="button">
              Hủy
            </Button>
            <Button type="submit" disabled={!valid || submitting}>
              {submitting ? "Đang tạo..." : "Tạo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassModal;