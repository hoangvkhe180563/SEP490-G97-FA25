import React, { useEffect, useState } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";

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

export type EditClassPayload = {
  id: number | string;
  title: string;
  description?: string;
};

type Props = {
  open: boolean;
  classItem?: { id: number; title: string; description?: string };
  onClose: () => void;
};

export const EditClassModal: React.FC<Props> = ({ open, classItem, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { subjects, getAllSubjects, updateClass } = useClassStore();
  const { user } = useAuthStore();
  const currentUserId = user?.id ?? "";

  // fetch subjects only when modal opens
  useEffect(() => {
    if (open) {
      getAllSubjects?.();
    }
  }, [open, getAllSubjects]);

  // set initial values when modal opens or classItem changes,
  // but do NOT depend on subjects (avoids overwriting while editing)
  useEffect(() => {
    if (open && classItem) {
      setTitle(classItem.title ?? "");
      setDescription(classItem.description ?? "");
    }
    if (!open) {
      // optional: clear when closed
      setTitle("");
      setDescription("");
    }
  }, [open, classItem]);

  const valid = title.trim() !== "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classItem) return;
    if (!valid) return;

    await updateClass({
      id: classItem.id,
      title: title.trim(),
      description: description.trim(),
      updateBy: currentUserId,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-md w-full">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Chỉnh sửa lớp học</DialogTitle>
              <DialogClose asChild>
                
              </DialogClose>
            </div>
            <DialogDescription className="text-sm text-slate-500">
              Cập nhật thông tin lớp học.
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

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={onClose} type="button">
              Hủy
            </Button>
            <Button type="submit" disabled={!valid}>
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClassModal;