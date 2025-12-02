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
  grade?: number | null;
};

type Props = {
  open: boolean;
  classItem?: { id: number; title: string; description?: string; grade?: number | null };
  onClose: () => void;
};

export const EditClassModal: React.FC<Props> = ({ open, classItem, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // keep grade as number | "" | null in state to avoid Number("") -> 0
  const [grade, setGrade] = useState<number | "" | null>("");

  const { subjects, getAllSubjects, updateClass } = useClassStore();
  const { user } = useAuthStore();
  const currentUserId = user?.id ?? "";

  // toast state
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // validation errors (shadcn inline style)
  const [errors, setErrors] = useState<{ title?: string; grade?: string }>({});

  useEffect(() => {
    if (open) {
      getAllSubjects?.();
    }
  }, [open, getAllSubjects]);

  useEffect(() => {
    if (open && classItem) {
      setTitle(classItem.title ?? "");
      setDescription(classItem.description ?? "");
      // set grade to value or empty string if null/undefined
      setGrade(classItem.grade ?? "");
      setErrors({});
    }
    if (!open) {
      setTitle("");
      setDescription("");
      setGrade("");
      setErrors({});
    }
  }, [open, classItem]);

  // validation function — show inline errors instead of disabling the button
  const validate = (): boolean => {
    const next: { title?: string; grade?: string } = {};
    if (!title || title.trim() === "") {
      next.title = "Tên lớp học là bắt buộc";
    }

    // Grade is now required (as requested) and must be integer between 1 and 12
    if (grade === "" || grade === null || grade === undefined) {
      next.grade = "Khối là bắt buộc";
    } else {
      const n = Number(grade);
      if (!Number.isFinite(n) || !Number.isInteger(n)) {
        next.grade = "Khối phải là số nguyên hợp lệ";
      } else if (n < 1 || n > 12) {
        next.grade = "Khối phải nằm trong khoảng 1 - 12";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const inputClass = (hasError?: boolean) =>
    `${hasError ? "border-red-500 ring-1 ring-red-200" : ""}`.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classItem) return;

    // run validation and show inline errors
    if (!validate()) return;

    try {
      await updateClass({
        id: classItem.id,
        title: title.trim(),
        description: description.trim(),
        // use the correct param name expected by the store (updatedBy)
        updateBy: currentUserId,
        grade: grade === "" || grade === null ? undefined : Number(grade),
      });

      // show success toast and then close modal after short delay
      setSuccessMsg("Cập nhật lớp thành công");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("EditClassModal updateClass error:", err);
      // show generic error under title field
      setErrors((s) => ({ ...s, title: "Có lỗi khi cập nhật lớp (xem console)" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-md w-full">
        <form onSubmit={submit} className="space-y-4" noValidate>
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
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((s) => ({ ...s, title: undefined }));
                }}
                placeholder="Nhập tên lớp học"
                className={`mt-1 ${inputClass(!!errors.title)}`}
                aria-label="Tên lớp học"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "err-title" : undefined}
              />
              {errors.title && (
                <div id="err-title" className="text-red-600 text-sm mt-1">
                  {errors.title}
                </div>
              )}
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

            <div>
              <Label className="text-sm">Khối<span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={grade === null ? "" : grade}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    setGrade("");
                    if (errors.grade) setErrors((s) => ({ ...s, grade: undefined }));
                    return;
                  }
                  // accept only integers
                  if (/^-?\d*$/.test(v)) {
                    const n = Number(v);
                    if (Number.isNaN(n)) {
                      setGrade("");
                    } else {
                      setGrade(n);
                    }
                    if (errors.grade) setErrors((s) => ({ ...s, grade: undefined }));
                  }
                }}
                placeholder="Ví dụ: 6"
                className={`mt-1 ${inputClass(!!errors.grade)}`}
                aria-label="Khối"
                aria-invalid={!!errors.grade}
                aria-describedby={errors.grade ? "err-grade" : undefined}
              />
              {errors.grade && (
                <div id="err-grade" className="text-red-600 text-sm mt-1">
                  {errors.grade}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={onClose} type="button">
              Hủy
            </Button>
            {/* Button is enabled unless submitting; validation errors shown inline */}
            <Button type="submit">
              Lưu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Success toast */}
      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-6 top-6 z-[60] bg-white border px-4 py-2 rounded shadow-md text-sm text-green-700"
        >
          {successMsg}
        </div>
      )}
    </Dialog>
  );
};

export default EditClassModal;