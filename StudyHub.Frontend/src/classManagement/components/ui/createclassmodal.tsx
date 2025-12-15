import React, { useEffect, useState } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import useAllClassManagementStore from "@/classManagement/stores/useAllClassManagementStore";

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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";

export const CreateClassModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreate: (payload: { title: string; description?: string; createdBy?: string; grade?: number | null; homeroomTeacherId?: string | null }) => Promise<void>;
}> = ({ open, onClose, onCreate }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // store grade as string to avoid implicit Number("") -> 0 conversions
  const [gradeInput, setGradeInput] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);

  const { getAllSubjects } = useClassStore();
  const { user } = useAuthStore();

  // homeroom teachers (from store)
  const getAllHomeroomTeachers = useAllClassManagementStore((s) => s.getAllHomeroomTeachers);
  const teachersFromStore = useAllClassManagementStore((s) => s.homeroomTeachers);
  const teachersLoadingFromStore = useAllClassManagementStore((s) => s.isLoading);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  // validation errors (use shadcn-style error messages)
  const [errors, setErrors] = useState<{ title?: string; grade?: string }>({});

  // toast state
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Determine if current user is School Admin
  const isSchoolAdmin = (() => {
    if (!user?.roles || !Array.isArray(user.roles)) return false;
    return user.roles.some((r: any) => {
      if (!r) return false;
      const s = String(r).toLowerCase().replace(/[\s-_]/g, "");
      return s === "schooladmin" || s.includes("schooladmin") || String(r).toLowerCase() === "school admin";
    });
  })();

  // only fetch subjects when modal opens
  useEffect(() => {
    if (open) {
      getAllSubjects?.();
    }
  }, [open, getAllSubjects]);

  // fetch homeroom teachers from store when modal opens and user is School Admin
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!open || !isSchoolAdmin) return;
      try {
        await getAllHomeroomTeachers();
        if (!cancelled) {
          // no-op; teachersFromStore is read via hook
        }
      } catch (err) {
        console.error("getAllHomeroomTeachers error:", err);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, isSchoolAdmin, getAllHomeroomTeachers]);

  // reset fields when modal closed
  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setGradeInput("");
      setSubmitting(false);
      setSuccessMsg(null);
      setErrors({});
      setSelectedTeacherId(null);
    }
  }, [open]);

  const validate = (): boolean => {
    const next: { title?: string; grade?: string } = {};
    if (!title || title.trim() === "") {
      next.title = "Tên lớp học là bắt buộc";
    }
    // grade required and must be integer between 1 and 12
    if (gradeInput.trim() === "") {
      next.grade = "Khối là bắt buộc";
    } else {
      const n = Number(gradeInput);
      if (!Number.isFinite(n) || !Number.isInteger(n)) {
        next.grade = "Khối phải là số nguyên hợp lệ";
      } else if (n < 1 || n > 12) {
        next.grade = "Khối phải nằm trong khoảng 1 - 12";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // validate and show inline errors via shadcn style (text-red etc.)
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      // parse grade safely (validation already ensures integer 1-12)
      const grade = (() => {
        const n = Number(gradeInput);
        return Number.isFinite(n) ? n : null;
      })();

      // If a homeroom teacher is selected, pass its id into createdBy field per request.
      const createdByValue = selectedTeacherId ?? undefined;

      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        grade: grade,
        createdBy: createdByValue,
      } as any);

      // show success toast, then close modal shortly after
      setSuccessMsg("Tạo lớp thành công");
      // let user see the toast before closing the modal
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err) {
      // Optionally show error handling here
      console.error("CreateClassModal onCreate error:", err);
      // show generic error under title if desired
      setErrors({ ...errors, title: "Có lỗi khi tạo lớp (xem console)" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError?: boolean) =>
    `${hasError ? "border-red-500 ring-1 ring-red-200" : ""}`.trim();

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-md w-full">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Tạo lớp học</DialogTitle>
              {/* single close control */}
              <DialogClose asChild>
                {/* empty - close button markup is handled by DialogClose consumer if needed */}
                <button className="sr-only" aria-hidden />
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
              <Label className="text-sm">Khối <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={gradeInput}
                onChange={(e) => {
                  const v = e.target.value;
                  // allow empty or integer input (no decimals)
                  if (v === "" || /^-?\d*$/.test(v)) {
                    setGradeInput(v);
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

            {/* Show homeroom teacher select only for School Admin */}
            {isSchoolAdmin && (
              <div>
                <Label className="text-sm">Giáo viên chủ nhiệm</Label>
                <Select
                  value={selectedTeacherId ?? ""}
                  onValueChange={(val) => setSelectedTeacherId(val === "_none" ? null : val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={teachersLoadingFromStore ? "Đang tải..." : "Chọn giáo viên chủ nhiệm (tùy chọn)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {/* sentinel values used instead of empty string */}
                    <SelectItem value="_none">Không chọn</SelectItem>
                    {teachersLoadingFromStore ? (
                      <SelectItem value="_loading">Đang tải...</SelectItem>
                    ) : teachersFromStore.length === 0 ? (
                      <SelectItem value="_none_empty">Không có giáo viên</SelectItem>
                    ) : (
                      teachersFromStore.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.fullname}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-end gap-2">
            {/* Hủy là text button, không có icon */}
            <Button variant="ghost" onClick={onClose} type="button" disabled={submitting}>
              Hủy
            </Button>
            {/* Button is always enabled (unless submitting); errors shown inline */}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang tạo..." : "Tạo"}
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

export default CreateClassModal;