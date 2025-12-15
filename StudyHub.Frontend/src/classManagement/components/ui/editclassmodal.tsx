import React, { useEffect, useMemo, useState } from "react";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import useAllClassManagementStore from "@/classManagement/stores/useAllClassManagementStore";
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

type Props = {
  open: boolean;
  classItem?: {
    id: number;
    title: string;
    description?: string;
    grade?: number | null;
    instructorId?: string | null;
    instructor?: any;
    createdBy?: string | null;
    instructorName?: string | null;
    raw?: any;
  };
  onClose: () => void;
};

export const EditClassModal: React.FC<Props> = ({ open, classItem, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [grade, setGrade] = useState<number | "" | null>("");
  const { getAllSubjects, updateClass } = useClassStore();
  const { user } = useAuthStore();
  const currentUserId = user?.id ?? "";

  // homeroom teachers store (list + loader + fetcher)
  const getAllHomeroomTeachers = useAllClassManagementStore((s) => s.getAllHomeroomTeachers);
  const teachersFromStore = useAllClassManagementStore((s) => s.homeroomTeachers);
  const teachersLoadingFromStore = useAllClassManagementStore((s) => s.isLoading);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ title?: string; grade?: string }>({});

  // Determine if current user is School Admin
  const isSchoolAdmin = (() => {
    if (!user?.roles || !Array.isArray(user.roles)) return false;
    return user.roles.some((r: any) => {
      if (!r) return false;
      const s = String(r).toLowerCase().replace(/[\s-_]/g, "");
      return s === "schooladmin" || s.includes("schooladmin") || String(r).toLowerCase() === "school admin";
    });
  })();

  // load subjects when modal opens
  useEffect(() => {
    if (open) getAllSubjects?.();
  }, [open, getAllSubjects]);

  // Initialize form fields when opening modal
  useEffect(() => {
    if (open && classItem) {
      setTitle(classItem.title ?? "");
      setDescription(classItem.description ?? "");
      setGrade(classItem.grade ?? "");

      // Try multiple candidate fields for teacher id (createdBy, instructorId, instructor.id, raw.*)
      const initInstructorId =
        (classItem as any)?.instructorId ??
        (classItem as any)?.createdBy ??
        (classItem as any)?.instructor?.id ??
        (classItem as any)?.instructor?.userId ??
        (classItem as any)?.raw?.instructorId ??
        (classItem as any)?.raw?.createdBy ??
        null;

      // normalize to string or null
      setSelectedTeacherId(initInstructorId != null ? String(initInstructorId) : null);

      // If admin and teacher list not yet loaded, fetch it so Select can show label
      if (isSchoolAdmin && Array.isArray(teachersFromStore) && teachersFromStore.length === 0) {
        // don't await - fire-and-forget; SelectValue will update when teachersFromStore updates
        void getAllHomeroomTeachers?.();
      }

      setErrors({});
    }

    if (!open) {
      setTitle("");
      setDescription("");
      setGrade("");
      setErrors({});
      setSelectedTeacherId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, classItem]);

  // compute selected teacher's display name using store list first, fallback to classItem props/raw
  const selectedTeacherName = useMemo(() => {
    if (!selectedTeacherId) {
      // try classItem-provided names
      return (
        classItem?.instructorName ??
        classItem?.instructor?.fullname ??
        classItem?.instructor?.name ??
        classItem?.raw?.instructorName ??
        classItem?.raw?.instructor?.fullname ??
        null
      );
    }
    const found =
      Array.isArray(teachersFromStore) &&
      teachersFromStore.find((t: any) => {
        // match by stringified id for robustness
        return String(t?.id ?? t?.userId ?? t?.value ?? "") === String(selectedTeacherId);
      });
    if (found) return found.fullname;
    // fallback to any name present on classItem
    return (
      classItem?.instructorName 
    );
  }, [selectedTeacherId, teachersFromStore, classItem]);

  const validate = (): boolean => {
    const next: { title?: string; grade?: string } = {};
    if (!title || title.trim() === "") next.title = "Tên lớp học là bắt buộc";
    if (grade === "" || grade === null || grade === undefined) next.grade = "Khối là bắt buộc";
    else {
      const n = Number(grade);
      if (!Number.isFinite(n) || !Number.isInteger(n)) next.grade = "Khối phải là số nguyên hợp lệ";
      else if (n < 1 || n > 12) next.grade = "Khối phải nằm trong khoảng 1 - 12";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classItem) return;
    if (!validate()) return;

    // Determine createdBy to send:
    // - If user is SchoolAdmin: prefer selectedTeacherId if set, otherwise fallback to currentUserId
    // - If user is NOT SchoolAdmin: always use currentUserId
    const createdByToSend = isSchoolAdmin ? (selectedTeacherId ?? currentUserId) : currentUserId;

    const payload: any = {
      id: classItem.id,
      title: title.trim(),
      description: description.trim(),
      updatedBy: currentUserId || undefined,
      grade: grade === "" || grade === null ? undefined : Number(grade),
      homeroomTeacherId: selectedTeacherId ?? undefined,
      createdBy: createdByToSend,
    };

    // debug helper — check console for these lines after pressing Save
    console.debug("[EditClassModal] update payload:", payload);
    try {
      await (updateClass as any)(payload);
      setSuccessMsg("Cập nhật lớp thành công");
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error("EditClassModal updateClass error:", err);
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
                <button className="sr-only" aria-hidden />
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
                onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((s) => ({ ...s, title: undefined })); }}
                placeholder="Nhập tên lớp học"
                className="mt-1"
              />
              {errors.title && <div className="text-red-600 text-sm mt-1">{errors.title}</div>}
            </div>

            <div>
              <Label className="text-sm">Mô tả</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nhập mô tả lớp học (nếu có)" className="mt-1 h-28" />
            </div>

            <div>
              <Label className="text-sm">Khối <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={grade === null ? "" : grade}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") { setGrade(""); if (errors.grade) setErrors((s) => ({ ...s, grade: undefined })); return; }
                  if (/^-?\d*$/.test(v)) { const n = Number(v); setGrade(Number.isNaN(n) ? "" : n); if (errors.grade) setErrors((s) => ({ ...s, grade: undefined })); }
                }}
                placeholder="Ví dụ: 6"
                className="mt-1"
              />
              {errors.grade && <div className="text-red-600 text-sm mt-1">{errors.grade}</div>}
            </div>

            {isSchoolAdmin && (
              <div>
                <Label className="text-sm">Giáo viên chủ nhiệm</Label>

                {/* Show selected teacher name immediately even before teacher list is loaded */}
                <Select
                  value={selectedTeacherId ?? ""}
                  onValueChange={(val) => setSelectedTeacherId(val === "_none" ? null : val)}
                >
                  <SelectTrigger className="w-full">
                    {/* If we have a known teacher name, render it as SelectValue content so it's visible immediately */}
                    <SelectValue>{selectedTeacherName ?? (teachersLoadingFromStore ? "Đang tải..." : "Chọn giáo viên chủ nhiệm (tùy chọn)")}</SelectValue>
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="_none">Không chọn</SelectItem>

                    {teachersLoadingFromStore ? (
                      <SelectItem value="_loading">Đang tải...</SelectItem>
                    ) : teachersFromStore.length === 0 ? (
                      <SelectItem value="_none_empty">Không có giáo viên</SelectItem>
                    ) : (
                      teachersFromStore.map((t: any) => (
                        <SelectItem key={String(t.id ?? t.userId ?? t.value ?? t)} value={String(t.id ?? t.userId ?? t.value ?? "")}>
                          {t.fullname ?? t.name ?? t.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Extra hint: show current teacher name below select when not in options yet */}
                {selectedTeacherName && (
                  <div className="text-sm text-slate-500 mt-1">Hiện tại: {selectedTeacherName}</div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={onClose} type="button">Hủy</Button>
            <Button type="submit">Lưu</Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {successMsg && (
        <div role="status" aria-live="polite" className="fixed right-6 top-6 z-[60] bg-white border px-4 py-2 rounded shadow-md text-sm text-green-700">
          {successMsg}
        </div>
      )}
    </Dialog>
  );
};

export default EditClassModal;