import React, { useEffect, useRef, useState } from "react";
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
import { ScrollArea } from "@/common/components/ui/scroll-area";

type Props = {
  open: boolean;
  classId: number;
  onClose: () => void;
  onInvited?: (result?: any) => void;
};

const AddMemberModal: React.FC<Props> = ({ open, classId, onClose, onInvited }) => {
  // importMembers from store (uploads Excel)
  const importMembersFromHook = useClassStore((s) => (s as any).importMembers);
  const importMembers = importMembersFromHook ?? (useClassStore.getState() as any).importMembers;

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setIsProcessing(false);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    if (f) {
      const name = f.name.toLowerCase();
      if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
        setError("Vui lòng chọn file Excel (.xlsx hoặc .xls).");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setFile(f);
    } else {
      setFile(null);
    }
  };

  const removeChosenFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const humanFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    const kb = size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB`;
  };

  const handleImport = async () => {
    setError(null);
    if (!file) {
      setError("Vui lòng chọn file Excel trước khi import.");
      return;
    }
    if (typeof importMembers !== "function") {
      setError("Chức năng import hiện không khả dụng. Vui lòng thử lại sau.");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("role", "Student");

    setIsProcessing(true);
    try {
      const res = await importMembers(classId, fd);
      // accept multiple positive shapes
      if (res === true || (res && (res.success === true || res.data))) {
        onInvited?.(res);
        onClose();
        return;
      }
      setError(res?.message ?? "Import thất bại.");
    } catch (err: any) {
      console.error("importMembers error", err);
      const msg = err?.response?.data?.message ?? err?.message ?? "Lỗi khi import file.";
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate .xlsx template using SheetJS (xlsx). This uses dynamic import so the bundle
  // doesn't fail if the dependency isn't installed. If you don't have 'xlsx' installed,
  // run: npm install xlsx
  const downloadExcelTemplate = async () => {
    // headers and example rows
    const headers = ["Email", "Full Name", "Student ID", "Grade", "Section", "Role"];
    const examples = [
      ["hoangvk@example.com", "Vũ Khánh Hoàng", "S001", "9", "A", "Student"],
      ["hainv@example.com", "Nguyễn Văn Hải", "S002", "9", "A", "Student"],
    ];

    try {
      const XLSX = await import(/* webpackChunkName: "xlsx" */ "xlsx");
      const aoa = [headers, ...examples];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [
        { wch: 30 }, // Email
        { wch: 24 }, // Full Name
        { wch: 12 }, // Student ID
        { wch: 8 }, // Grade
        { wch: 8 }, // Section
        { wch: 12 }, // Role
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Members");
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "members-template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.warn("Failed to generate .xlsx using SheetJS, falling back to CSV. Error:", err);
      // fallback: generate CSV if xlsx isn't available
      const lines: string[] = [];
      lines.push(headers.join(","));
      for (const row of examples) {
        const escaped = row.map((v) => {
          if (v == null) return "";
          const s = String(v);
          if (s.includes('"')) return `"${s.replaceAll('"', '""')}"`;
          if (s.includes(",") || s.includes("\n")) return `"${s}"`;
          return s;
        });
        lines.push(escaped.join(","));
      }
      const csvContent = "\uFEFF" + lines.join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "members-template.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-2xl w-full">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>Import & Mời thành viên</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Upload file Excel (.xlsx) chứa danh sách email. Hệ thống sẽ xử lý file và gửi lời mời tự động.
                File nên có cột "Email", "Full Name", "Student ID", "Grade", "Section", "Role".
              </DialogDescription>
            </div>
            <DialogClose asChild>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="px-4 pb-4">
          <div>
            <label className="text-sm text-slate-600 block mb-2">Chọn file Excel (.xlsx)</label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={onFileChange}
                disabled={isProcessing}
                className="hidden"
                id="excel-file-input"
              />
              <label htmlFor="excel-file-input">
                <Button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                  Chọn file
                </Button>
              </label>

              <Button variant="ghost" onClick={downloadExcelTemplate} className="ml-2" disabled={isProcessing}>
                Tải mẫu (.xlsx)
              </Button>

              <div className="text-sm text-slate-500"> hoặc kéo thả file vào đây (tính năng kéo thả có thể được hỗ trợ sau)</div>
            </div>

            {/* Prominent file chosen display */}
            {file ? (
              <div
                className="mt-4 border-2 border-dashed border-sky-300 bg-sky-50 rounded-lg p-4 flex items-center justify-between gap-4 shadow-sm"
                role="group"
                aria-label="Selected file"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 flex items-center justify-center rounded-md bg-white border">
                    {/* Simple file icon */}
                    <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 7h6l4 4v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7z" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{file.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{humanFileSize(file.size)}</div>
                    <div className="text-xs text-slate-400 mt-1">Sẵn sàng để import</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // re-open file dialog to replace file
                      fileInputRef.current?.click();
                    }}
                    disabled={isProcessing}
                    className="text-xs px-3 py-1 rounded bg-white border hover:bg-slate-100"
                  >
                    Thay đổi
                  </button>

                  <button
                    type="button"
                    onClick={removeChosenFile}
                    disabled={isProcessing}
                    aria-label="Remove chosen file"
                    className="text-xs px-3 py-1 rounded bg-red-50 text-red-700 border border-red-100 hover:bg-red-100"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-md border border-dashed border-slate-200 p-4 bg-white text-sm text-slate-500">
                Chưa có file được chọn. Hãy nhấn "Chọn file" để chọn file Excel mẫu.
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="text-sm text-slate-600 mb-2">Lưu ý</div>
            <ScrollArea className="max-h-36 rounded border p-3 bg-slate-50">
              <ul className="text-sm list-disc pl-5 space-y-1 text-slate-700">
                <li>File nên có cột "Email" (không phân biệt hoa thường). Nếu không có header, hệ thống sẽ đọc cột đầu tiên.</li>
                <li>Thêm cột "Full Name", "Student ID", "Grade", "Section" để thuận tiện cho nhà trường.</li>
                <li>Hệ thống sẽ lọc trùng lặp và chỉ import các email hợp lệ.</li>
                <li>Server sẽ gửi email mời — frontend chỉ upload file và hiển thị kết quả trả về.</li>
                <li>Giới hạn kích thước file tùy thuộc cấu hình server.</li>
              </ul>
            </ScrollArea>
          </div>

          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isProcessing}>Hủy</Button>
            <Button onClick={handleImport} disabled={isProcessing}>
              {isProcessing ? "Đang xử lý..." : "Import & Mời"}
            </Button>
          </div>
        </div>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberModal;