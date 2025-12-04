import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useClassStore } from "@/classManagement/stores/useClassStore";
import { Button } from "@/common/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/common/components/ui/dialog";
import { ScrollArea } from "@/common/components/ui/scroll-area";
import { axiosInstance } from "@/lib/axios";
import { showNotification } from "@/lib/notify";

type Props = {
  open: boolean;
  classId: number;
  onClose: () => void;
  onInvited?: (result?: any) => void;
};

type PreviewData = { headers: string[]; rows: string[][] };

const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;

/**
 * add-member-modal11
 * - Calls showNotification(...) to display a toast when invites succeed.
 * - Fixes missing helper implementations (handleDialogOpenChange, handleUploadCorrectedFile).
 * - Keeps inline/legacy success UI as well.
 */

const AddMemberModal: React.FC<Props> = ({ open, classId, onClose, onInvited }) => {
  const importMembers = useClassStore((s) => s.importMembers);
  const getClassMembers = useClassStore((s) => s.getClassMembers);

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [importErrors, setImportErrors] = useState<Record<number, string[]>>({});
  const [importCellErrors, setImportCellErrors] = useState<Record<number, Record<number, string[]>>>({});
  const [showImportErrors, setShowImportErrors] = useState(false);

  // success state + explicit toast visibility
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // single invite form state
  const [singleEmail, setSingleEmail] = useState<string>("");
  const [singleInviteProcessing, setSingleInviteProcessing] = useState(false);

  // version to key the table so programmatic changes remount inputs and update defaultValue
  const [previewVersion, setPreviewVersion] = useState(0);

  useEffect(() => {
    if (!open) resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setPreviewVersion((v) => v + 1);
  }, [previewData]);

  // Auto-close toast & dialog after 2.5s whenever successMsg is set
  useEffect(() => {
    if (!successMsg) {
      setShowToast(false);
      return;
    }
    setShowToast(true);
    const t = setTimeout(() => {
      setSuccessMsg(null);
      setShowToast(false);
    }, 2500);
    return () => clearTimeout(t);
  }, [successMsg]);

  const resetAll = () => {
    setFile(null);
    setIsProcessing(false);
    setError(null);
    setPreviewData(null);
    setShowPreview(false);
    setImportErrors({});
    setImportCellErrors({});
    setShowImportErrors(false);
    setSingleEmail("");
    setSingleInviteProcessing(false);
    if (inputRef.current) inputRef.current.value = "";
    // NOTE: don't clear successMsg here so success UI can remain visible briefly after actions
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

  // parse file into previewData
  const parseFileToPreview = async (f: File) => {
    setError(null);
    setIsProcessing(true);
    try {
      const XLSX = await import("xlsx");
      const ab = await f.arrayBuffer();
      const wb = XLSX.read(ab, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      if (!aoa || aoa.length === 0) {
        setError("File không có dữ liệu.");
        return null;
      }

      const firstRow = (aoa[0] || []).map((c: any) => String(c ?? "").trim());
      const lower = firstRow.map((s: string) => s.toLowerCase());
      const emailKeys = ["email", "e-mail", "email address", "địa chỉ email", "mail"];
      const nameKeys = ["họ và tên", "họ tên", "full name", "fullname", "name", "tên"];
      const hasEmailHeader = lower.some((h: string) => emailKeys.some((k) => h.includes(k)));
      const hasNameHeader = lower.some((h: string) => nameKeys.some((k) => h.includes(k)));

      const headers: string[] = [];
      const rows: string[][] = [];

      if (hasEmailHeader || hasNameHeader) {
        headers.push(...firstRow.map((c) => String(c ?? "")));
        for (let r = 1; r < aoa.length; r++) {
          const rowArr = aoa[r] || [];
          const rowLine = headers.map((_, i) => (rowArr[i] ?? "").toString());
          if (rowLine.every((c) => c === "")) continue;
          rows.push(rowLine);
        }
      } else {
        const maxCols = aoa.reduce((m, rr) => Math.max(m, (rr || []).length), 0);
        for (let i = 0; i < maxCols; i++) headers.push(`Column ${i + 1}`);
        for (let r = 0; r < aoa.length; r++) {
          const rowArr = aoa[r] || [];
          const rowLine = Array.from({ length: maxCols }).map((_, i) => (rowArr[i] ?? "").toString());
          if (rowLine.every((c) => c === "")) continue;
          rows.push(rowLine);
        }
      }

      return { headers, rows };
    } catch (err) {
      console.error("parse file err", err);
      setError("Không thể đọc file. Vui lòng kiểm tra định dạng.");
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // validate a single row and return maps
  const validateRow = (row: string[], rowIndexOneBased: number) => {
    const rowErrors: string[] = [];
    const cellErrors: Record<number, string[]> = {};
    const email = (row[0] ?? "").toString().trim();
    const name = (row[1] ?? "").toString().trim();

    if (!email) {
      rowErrors.push("Thiếu email");
      cellErrors[0] = cellErrors[0] || [];
      cellErrors[0].push("Thiếu email");
    } else if (!emailRegex.test(email)) {
      rowErrors.push("Email không hợp lệ");
      cellErrors[0] = cellErrors[0] || [];
      cellErrors[0].push("Email không hợp lệ");
    }

    if (!name) {
      rowErrors.push("Thiếu họ và tên");
      cellErrors[1] = cellErrors[1] || [];
      cellErrors[1].push("Thiếu họ và tên");
    }

    return { rowErrors, cellErrors };
  };

  const validateAllRows = (pdata: PreviewData) => {
    const rmap: Record<number, string[]> = {};
    const cmap: Record<number, Record<number, string[]>> = {};
    for (let i = 0; i < pdata.rows.length; i++) {
      const { rowErrors, cellErrors } = validateRow(pdata.rows[i], i + 1);
      if (rowErrors.length > 0) rmap[i + 1] = rowErrors;
      if (Object.keys(cellErrors).length > 0) cmap[i + 1] = cellErrors;
    }
    setImportErrors(rmap);
    setImportCellErrors(cmap);
    const has = Object.keys(rmap).length > 0 || Object.keys(cmap).length > 0;
    setShowImportErrors(has);
    return { rmap, cmap };
  };

  const handleFileSelected = async (f: File | null) => {
    if (!f) return;
    setFile(f);
    const preview = await parseFileToPreview(f);
    setImportErrors({});
    setImportCellErrors({});
    setShowImportErrors(false);
    if (preview) {
      setPreviewData(preview);
      validateAllRows(preview);
      setShowPreview(true);
    }
  };

  // Commit change from uncontrolled input into previewData (onBlur or Enter)
  const commitCellChange = (rowIdx: number, colIdx: number, value: string) => {
    setPreviewData((prev) => {
      if (!prev) return prev;
      const rows = prev.rows.slice();
      const row = rows[rowIdx] ? rows[rowIdx].slice() : Array.from({ length: prev.headers.length }).map(() => "");
      if (colIdx >= row.length) {
        for (let i = row.length; i <= colIdx; i++) row[i] = "";
      }
      row[colIdx] = value;
      rows[rowIdx] = row;
      const newPreview = { headers: prev.headers, rows };
      // validate this row immediately
      const { rowErrors, cellErrors } = validateRow(row, rowIdx + 1);
      setImportErrors((prevErr) => {
        const copy = { ...prevErr };
        if (rowErrors.length > 0) copy[rowIdx + 1] = rowErrors;
        else delete copy[rowIdx + 1];
        return copy;
      });
      setImportCellErrors((prevCell) => {
        const copy = { ...prevCell };
        if (Object.keys(cellErrors).length > 0) copy[rowIdx + 1] = cellErrors;
        else delete copy[rowIdx + 1];
        return copy;
      });
      setShowImportErrors(Boolean(Object.keys(importErrors).length || Object.keys(importCellErrors).length || rowErrors.length > 0));
      return newPreview;
    });
  };

  const addRow = (afterIdx?: number) => {
    if (!previewData) return;
    const newRow = Array.from({ length: previewData.headers.length }).map(() => "");
    const rows = [...previewData.rows];
    if (afterIdx === undefined) rows.push(newRow);
    else rows.splice(afterIdx + 1, 0, newRow);
    const newPreview = { headers: previewData.headers, rows };
    setPreviewData(newPreview);
    validateAllRows(newPreview);
  };

  const removeRow = (idx: number) => {
    if (!previewData) return;
    const rows = previewData.rows.filter((_, i) => i !== idx);
    const newPreview = { headers: previewData.headers, rows };
    setPreviewData(newPreview);
    validateAllRows(newPreview);
  };

  const addColumn = (name?: string) => {
    if (!previewData) return;
    let headerName = name ?? prompt("Tên cột mới:", `Column ${previewData.headers.length + 1}`) ?? "";
    headerName = headerName.trim() || `Column ${previewData.headers.length + 1}`;
    const headers = [...previewData.headers, headerName];
    const rows = previewData.rows.map((r) => [...r, ""]);
    const newPreview = { headers, rows };
    setPreviewData(newPreview);
    validateAllRows(newPreview);
  };

  const removeColumn = (colIdx: number) => {
    if (!previewData) return;
    if (!confirm(`Xóa cột "${previewData.headers[colIdx]}"? Hành động này sẽ xóa dữ liệu cột đó.`)) return;
    const headers = previewData.headers.filter((_, i) => i !== colIdx);
    const rows = previewData.rows.map((r) => r.filter((_, i) => i !== colIdx));
    const newCellErrors: Record<number, Record<number, string[]>> = {};
    Object.entries(importCellErrors).forEach(([rowStr, cmap]) => {
      const rowNum = Number(rowStr);
      const newMap: Record<number, string[]> = {};
      Object.keys(cmap).forEach((ciStr) => {
        const ci = Number(ciStr);
        if (ci === colIdx) return;
        const newIndex = ci > colIdx ? ci - 1 : ci;
        newMap[newIndex] = [...(cmap[ci] || [])];
      });
      if (Object.keys(newMap).length > 0) newCellErrors[rowNum] = newMap;
    });
    const newPreview = { headers, rows };
    setPreviewData(newPreview);
    setImportCellErrors(newCellErrors);
    validateAllRows(newPreview);
  };

  // generate .xlsx blob from previewData
  const generateXlsxBlob = async (pdata: PreviewData) => {
    const XLSX = await import("xlsx");
    const aoa = [pdata.headers, ...pdata.rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    const arrayBuf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    return new Blob([arrayBuf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  };

  const downloadCorrectedXlsx = async (pdata: PreviewData) => {
    try {
      const blob = await generateXlsxBlob(pdata);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "members-corrected.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error("download corrected xlsx err", err);
      setError("Không thể tạo file để tải xuống.");
    }
  };

  // send xlsx to API via store.importMembers
  const doImportFromPreview = async (pdata: PreviewData) => {
    if (!importMembers || typeof importMembers !== "function") {
      throw new Error("importMembers không được cấu hình trong store. Vui lòng kiểm tra store.");
    }
    setIsProcessing(true);
    try {
      const blob = await generateXlsxBlob(pdata);
      const fd = new FormData();
      fd.append("file", blob, "members-preview.xlsx");
      fd.append("role", "Student");
      const res = await importMembers(classId, fd);
      const payload = res?.data ?? res;
      return { res, payload };
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmUpload = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!previewData) return;
    const { rmap } = validateAllRows(previewData);
    if (Object.keys(rmap).length > 0) {
      setError("Vui lòng sửa các lỗi định dạng trước khi gửi.");
      setShowPreview(true);
      return;
    }

    try {
      const { res, payload } = await doImportFromPreview(previewData);
      console.log("bulk invite response:", res, payload);
      const errorsObj = (payload && (payload as any).errors) ?? (res && (res as any).errors) ?? null;
      if (errorsObj) {
        const rowMap: Record<number, string[]> = {};
        const cellMap: Record<number, Record<number, string[]>> = {};
        try {
          Object.entries(errorsObj || {}).forEach(([k, msgs]) => {
            const textMsgs = Array.isArray(msgs) ? msgs : [String(msgs)];
            textMsgs.forEach((raw) => {
              let t = String(raw ?? "");
              const rowMatch = k.match(/(\d+)/);
              let row = rowMatch ? parseInt(rowMatch[1], 10) : undefined;
              if (row === undefined) {
                const m2 = t.match(/(?:Hàng|Row)\s*(\d+)/i);
                if (m2) {
                  row = parseInt(m2[1], 10);
                  t = t.replace(/^(?:Hàng|Row)\s*\d+[:\s-]*/i, "").trim();
                }
              }
              if (row === undefined) row = 0;
              const fieldMatch = k.match(/Row\s*\d+\s*[-:]?\s*(.+)$/i) || k.match(/(.+)[_\-.]\d+$/i);
              let fieldName = fieldMatch ? fieldMatch[1].trim() : null;
              if (!fieldName && !/\d+/.test(k)) fieldName = k.trim();
              const clean = (m: string, fn?: string) => {
                let tt = String(m ?? "");
                if (fn) {
                  const prefix = new RegExp("^\\s*" + fn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*[:\\-\\s]+", "i");
                  if (prefix.test(tt)) tt = tt.replace(prefix, "").trim();
                }
                return tt;
              };
              t = clean(t, fieldName || undefined);
              if (fieldName && previewData) {
                const fnNorm = String(fieldName ?? "").toLowerCase();
                const idx = previewData.headers.findIndex((h) => (h || "").toString().toLowerCase().includes(fnNorm) || fnNorm.includes((h || "").toString().toLowerCase()));
                if (idx >= 0) {
                  if (!cellMap[row]) cellMap[row] = {};
                  if (!cellMap[row][idx]) cellMap[row][idx] = [];
                  cellMap[row][idx].push(t);
                  return;
                }
              }
              if (!rowMap[row]) rowMap[row] = [];
              rowMap[row].push(t);
            });
          });
        } catch (err) {
          rowMap[0] = [JSON.stringify(errorsObj)];
        }
        setImportErrors(rowMap);
        setImportCellErrors(cellMap);
        setShowImportErrors(true);
        setShowPreview(true);
        return;
      }

      if (payload && payload.success !== false) {
        try {
          if (getClassMembers && typeof getClassMembers === "function") {
            await getClassMembers(classId);
          }
        } catch (refreshErr) {
          console.warn("getClassMembers refresh failed", refreshErr);
        }

        try {
          let invitedCount: number | undefined = undefined;
          if (payload && payload.data) {
            if (Array.isArray(payload.data)) invitedCount = payload.data.length;
            else if (typeof payload.data.invitedCount === "number") invitedCount = payload.data.invitedCount;
            else if (Array.isArray((payload as any).data?.invited)) invitedCount = (payload as any).data.invited.length;
          }
          const title = "Đã gửi lời mời";
          const description = invitedCount !== undefined ? `Đã gửi lời mời tới ${invitedCount} người.` : "Lời mời đã được gửi.";
          setError(null);
          setSuccessMsg(`${title}\n\n${description}`);
          // show visible toast (uses notify util)
          try {
            showNotification(`${title}\n\n${description}`, { type: "success", duration: 2500 });
          } catch {
            /* ignore */
          }
        } catch {
          setError(null);
          setSuccessMsg("Đã gửi lời mời.");
          try {
            showNotification("Đã gửi lời mời.", { type: "success", duration: 2500 });
          } catch { /* ignore */ }
        }

        onInvited?.(payload);
        // don't clear successMsg here; auto-close effect will hide it
        resetAll();
      } else {
        const msg = (payload && (payload as any).message) ?? (res as any)?.message ?? "Import thất bại";
        setError(String(msg));
      }
    } catch (err: any) {
      console.error("handleConfirmUpload error:", err);
      const msg = err?.response?.data?.message ?? err?.message ?? "Lỗi khi gửi file lên server.";
      setError(String(msg));
    }
  };

  // upload corrected file into preview (keeps same previewData shape)
  const handleUploadCorrectedFile = async (f: File | null) => {
    if (!f) return;
    setError(null);
    setIsProcessing(true);
    try {
      const parsed = await parseFileToPreview(f);
      if (!parsed) {
        setError("Không thể đọc file đã sửa.");
        setIsProcessing(false);
        return;
      }

      const fixedRows = parsed.rows.map((r) => {
        const email = (r[0] ?? "").toString().trim().toLowerCase();
        const name = ((r[1] ?? "") as string).toString().trim().replace(/\s+/g, " ");
        const rest = r.slice(2).map((c) => (c ?? "").toString());
        return [email, name, ...rest];
      });

      const fixedPreview: PreviewData = { headers: parsed.headers, rows: fixedRows };
      setPreviewData(fixedPreview);
      validateAllRows(fixedPreview);
      setShowPreview(true);
      setError(null);
    } catch (err: any) {
      console.error("handleUploadCorrectedFile err", err);
      setError(err?.message ?? "Không thể xử lý file đã tải lên.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDialogOpenChange = (val: boolean) => {
    if (!val) {
      if (showPreview) return;
      onClose();
    }
  };

  // Single invite API call — send the payload the backend expects
  const sendSingleInvite = async () => {
    setError(null);
    const email = (singleEmail ?? "").trim();
    if (!email) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (!emailRegex.test(email)) {
      setError("Email không hợp lệ.");
      return;
    }

    setSingleInviteProcessing(true);
    try {
      // Backend expects InviteRequest with Emails list
      const url = `/ClassMember/invite?classId=${encodeURIComponent(classId)}`;
      const payload = { Emails: [email], Role: "Student" };
      console.log("sending single invite payload:", url, payload);
      const res = await axiosInstance.post(url, payload);
      console.log("single invite response:", res);
      const data = res?.data ?? res;

      if (data && data.success === false) {
        const msg = data.message ?? "Không thể gửi lời mời.";
        setError(String(msg));
        setSingleInviteProcessing(false);
        return;
      }

      // success — refresh members
      try {
        if (getClassMembers && typeof getClassMembers === "function") {
          await getClassMembers(classId);
        }
      } catch (refreshErr) {
        console.warn("getClassMembers refresh failed", refreshErr);
      }

      setError(null);
      const message = `Đã gửi lời mời tới ${email}.`;
      setSuccessMsg(message);
      // show toast
      try {
        showNotification(message, { type: "success", duration: 2500 });
      } catch {
        /* ignore */
      }
      setSingleEmail("");
      onInvited?.(data);

      // If parent closes the modal immediately via onInvited, notification is still shown (notify appends to body)
    } catch (err: any) {
      console.error("sendSingleInvite error:", err, err?.response?.data);
      const msg = err?.response?.data?.message ?? err?.message ?? "Lỗi khi gửi lời mời.";
      setError(String(msg));
    } finally {
      setSingleInviteProcessing(false);
    }
  };

  const PreviewModal: React.FC = () => {
    const fileRef = useRef<HTMLInputElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    if (!showPreview) return null;
    if (typeof document === "undefined") return null;

    const CONTENT_Z = 999999999;
    const BACKDROP_Z = 999999998;

    const onBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) setShowPreview(false);
    };

    const handleChooseCorrected = (e: React.MouseEvent) => {
      e.stopPropagation();
      fileRef.current?.click();
    };

    const handleCorrectedChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      const f = e.target.files?.[0] ?? null;
      e.currentTarget.value = "";
      await handleUploadCorrectedFile(f);
    };

    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      const t = setTimeout(() => {
        contentRef.current?.querySelector<HTMLElement>("button, input, [tabindex]")?.focus();
      }, 40);
      return () => clearTimeout(t);
    }, []);

    const hasClientErrors = Object.keys(importErrors).length > 0 || Object.keys(importCellErrors).length > 0;

    return ReactDOM.createPortal(
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: BACKDROP_Z,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto",
        }}
        onClick={onBackdropClick}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: BACKDROP_Z,
            pointerEvents: "auto",
          }}
        />

        <div
          ref={contentRef}
          style={{
            position: "relative",
            width: "94%",
            maxWidth: 1280,
            maxHeight: "90vh",
            overflow: "auto",
            background: "white",
            borderRadius: 10,
            padding: 16,
            zIndex: CONTENT_Z,
            boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
            pointerEvents: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <h3 style={{ margin: 0 }}>Preview Import</h3>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
                Bạn có thể thêm / sửa / xóa hàng và cột. Cột 1 = Email, Cột 2 = Họ & tên (validate).
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button type="button" onClick={(e) => { e.stopPropagation(); setShowPreview(false); }} style={{ padding: "6px 10px" }}>Đóng</button>

              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleCorrectedChange} />
              <button type="button" onClick={handleChooseCorrected} style={{ padding: "6px 10px" }}>Upload corrected file</button>

              <button
                type="button"
                onClick={async (e) => { e.stopPropagation(); if (previewData) await downloadCorrectedXlsx(previewData); }}
                disabled={!previewData}
                style={{ padding: "6px 10px", background: !previewData ? "#94a3b8" : "#2563eb", color: "#fff", borderRadius: 6, border: "none" }}
              >
                Tải .xlsx đã chỉnh
              </button>

              <button
                type="button"
                onClick={async (e) => { e.stopPropagation(); await handleConfirmUpload(e); }}
                disabled={isProcessing || hasClientErrors || !previewData}
                style={{ padding: "6px 10px", background: isProcessing || hasClientErrors || !previewData ? "#94a3b8" : "#0ea5a8", color: "#fff", borderRadius: 6, border: "none" }}
              >
                {isProcessing ? "Đang gửi..." : (hasClientErrors ? `Fix errors first (${Object.keys(importErrors).length + Object.keys(importCellErrors).length})` : "Confirm & Import")}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={(e) => { e.stopPropagation(); addRow(); }} style={{ padding: "6px 10px" }}>Thêm hàng</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); if (!previewData) return; addRow(previewData.rows.length - 1); }} style={{ padding: "6px 10px" }}>Chèn hàng cuối</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); addColumn(); }} style={{ padding: "6px 10px" }}>Thêm cột</button>
            </div>

            <div style={{ marginLeft: "auto", color: hasClientErrors ? "#b91c1c" : "#065f46", fontWeight: 600 }}>
              {hasClientErrors ? `Có ${Object.keys(importErrors).length + Object.keys(importCellErrors).length} lỗi` : `Không lỗi định dạng`}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <ScrollArea className="max-h-[70vh] rounded border p-3">
              <table key={previewVersion} style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "left", width: 60 }}>#</th>
                    {previewData?.headers.map((h, ci) => (
                      <th key={ci} style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "left", position: "relative" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{h}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); const newName = prompt("Tên cột:", h); if (!newName) return; if (!previewData) return; const headers = [...previewData.headers]; headers[ci] = newName; setPreviewData({ headers, rows: previewData.rows }); validateAllRows({ headers, rows: previewData.rows }); }} title="Đổi tên cột" style={{ padding: "2px 6px", fontSize: 12 }}>✏️</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); removeColumn(ci); }} title="Xóa cột" style={{ padding: "2px 6px", fontSize: 12, color: "#b91c1c" }}>🗑</button>
                        </div>
                      </th>
                    ))}
                    <th style={{ padding: 8, borderBottom: "1px solid #eee", textAlign: "left", width: 120 }}>Hành động</th>
                  </tr>
                </thead>

                <tbody>
                  {previewData?.rows.map((r, ri) => {
                    const rowNum = ri + 1;
                    const rowCellErrors = importCellErrors[rowNum] || {};
                    return (
                      <tr key={ri}>
                        <td style={{ padding: 8, verticalAlign: "top" }}>{rowNum}</td>
                        {r.map((c, ci) => {
                          const cellErrs = rowCellErrors[ci] || [];
                          const inputId = `preview-cell-${ri}-${ci}`;
                          const inputName = `preview[${ri}][${ci}]`;
                          const ariaLabel = `${previewData?.headers[ci] ?? `Column ${ci + 1}`} row ${rowNum}`;

                          return (
                            <td key={ci} style={{ padding: 8, verticalAlign: "top", borderLeft: "1px solid #f3f4f6" }}>
                              <div>
                                <input
                                  id={inputId}
                                  name={inputName}
                                  aria-label={ariaLabel}
                                  defaultValue={c}
                                  onBlur={(e) => commitCellChange(ri, ci, e.currentTarget.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); } }}
                                  onClick={(e) => e.stopPropagation()}
                                  onFocus={(e) => e.stopPropagation()}
                                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${cellErrs.length ? "#fca5a5" : "#e5e7eb"}` }}
                                />
                                {cellErrs.map((m, mi) => <div key={mi} style={{ color: "#b91c1c", fontSize: 12, marginTop: 6 }}>{m}</div>)}
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ padding: 8, verticalAlign: "top" }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" onClick={(e) => { e.stopPropagation(); addRow(ri); }} style={{ padding: "6px 10px" }}>Chèn dưới</button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeRow(ri); }} style={{ padding: "6px 10px", color: "#b91c1c" }}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>
          </div>

          {showImportErrors && Object.keys(importErrors).length > 0 && (
            <div style={{ marginTop: 12, padding: 10, background: "#fee2e2", color: "#b91c1c", borderRadius: 6 }}>
              <div style={{ fontWeight: 600 }}>Lỗi khi import</div>
              <div style={{ marginTop: 8, maxHeight: 160, overflow: "auto" }}>
                {Array.from(new Set([...Object.keys(importErrors).map(Number), ...Object.keys(importCellErrors).map(Number)])).sort((a, b) => a - b).map((r) => (
                  <div key={r} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>Hàng {r}</div>
                    <ul style={{ marginLeft: 16 }}>
                      {(importErrors[Number(r)] || []).map((m, i) => <li key={`r-${i}`}>{m}</li>)}
                      {Object.keys(importCellErrors[Number(r)] || {}).map(ci => Number(ci)).sort((a, b) => a - b).flatMap(ci => (importCellErrors[Number(r)][ci] || []).map((m, i) => <li key={`${ci}-${i}`}>Col {ci + 1}: {m}</li>))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  const dialogWrapperStyle: React.CSSProperties = {
    pointerEvents: showPreview ? "none" : "auto",
  };

  const SuccessDialog: React.FC = () => {
    const openSuccess = !!successMsg;
    return (
      <Dialog open={openSuccess} onOpenChange={(v) => { if (!v) setSuccessMsg(null); }}>
        <DialogContent className="sm:max-w-md w-full">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle>Thành công</DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  {successMsg}
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <button aria-label="Close" className="text-sm text-slate-500">✖</button>
              </DialogClose>
            </div>
          </DialogHeader>
          <div className="px-4 pb-4">
            <div className="flex justify-end">
              <Button onClick={() => setSuccessMsg(null)}>Đóng</Button>
            </div>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <div style={dialogWrapperStyle}>
        <Dialog open={open && !showPreview} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="sm:max-w-2xl w-full">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle>Import & Mời thành viên</DialogTitle>
                  <DialogDescription className="text-sm text-slate-500">
                    Upload file Excel (.xlsx) chứa danh sách Email và Họ & tên. Hoặc mời từng người bằng form bên dưới.
                  </DialogDescription>
                </div>
                <DialogClose asChild />
              </div>
            </DialogHeader>

            <div className="px-4 pb-4">
              {/* Single-invite small form */}
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="email"
                  placeholder="Nhập email để mời 1 người"
                  value={singleEmail}
                  onChange={(e) => setSingleEmail(e.target.value)}
                  className="px-3 py-2 border rounded w-full"
                  disabled={singleInviteProcessing}
                />
                <Button
                  onClick={sendSingleInvite}
                  disabled={singleInviteProcessing}
                >
                  {singleInviteProcessing ? "Đang gửi..." : "Gửi"}
                </Button>
              </div>

              {/* File upload / template area */}
              <label className="text-sm text-slate-600 block mb-2">Chọn file Excel (.xlsx/.xls/.csv)</label>
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  id="class-import-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={async (e) => {
                    const f = e.target.files?.[0] ?? null;
                    if (!f) { e.currentTarget.value = ""; return; }
                    await handleFileSelected(f);
                  }}
                  disabled={isProcessing}
                  className="hidden"
                />
                <label htmlFor="class-import-file">
                  <Button onClick={(e) => { e?.stopPropagation(); inputRef.current?.click(); }} disabled={isProcessing}>Chọn file</Button>
                </label>

                <Button variant="ghost" onClick={(e) => { e?.stopPropagation();
                  (async () => {
                    try {
                      const XLSX = await import("xlsx");
                      const headers = ["Email", "Họ và tên"];
                      const examples = [
                        ["hoangvk@example.com", "Vũ Khánh Hoàng"],
                        ["hainv@example.com", "Nguyễn Văn Hải"],
                      ];
                      const aoa = [headers, ...examples];
                      const ws = XLSX.utils.aoa_to_sheet(aoa);
                      ws["!cols"] = [{ wch: 30 }, { wch: 24 }];
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Danh sách");
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
                    } catch {
                      const lines = ["Email,Họ và tên", `"hoangvk@example.com","Vũ Khánh Hoàng"`, `"hainv@example.com","Nguyễn Văn Hải"`];
                      const csv = "\uFEFF" + lines.join("\r\n");
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "members-template.csv";
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      setTimeout(() => URL.revokeObjectURL(url), 5000);
                    }
                  })();
                }} className="ml-2">Tải mẫu (.xlsx)</Button>

                <div className="text-sm text-slate-500">Hoặc tải CSV nếu thuận tiện</div>
              </div>

              {file ? (
                <div className="mt-4 border-2 border-dashed border-sky-300 bg-sky-50 rounded-lg p-4 flex items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 flex items-center justify-center rounded-md bg-white border">
                      <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 7h6l4 4v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7z" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{file.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{humanFileSize(file.size)}</div>
                      <div className="text-xs text-slate-400 mt-1">Sẵn sàng để preview</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} disabled={isProcessing} className="text-xs px-3 py-1 rounded bg-white border hover:bg-slate-100">Thay đổi</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = ""; }} disabled={isProcessing} className="text-xs px-3 py-1 rounded bg-red-50 text-red-700 border border-red-100 hover:bg-red-100">Xóa</button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-dashed border-slate-200 p-4 bg-white text-sm text-slate-500">
                  Chưa có file được chọn.
                </div>
              )}

              <div className="mt-4">
                <div className="text-sm text-slate-600 mb-2">Lưu ý</div>
                <ScrollArea className="max-h-36 rounded border p-3 bg-slate-50">
                  <ul className="text-sm list-disc pl-5 space-y-1 text-slate-700">
                    <li>File nên có cột "Email" và "Họ và tên". Nếu không có header, hệ thống sẽ đọc cột 1 = Email và cột 2 = Họ và tên.</li>
                    <li>Sau khi chọn file, bạn có thể sửa trực tiếp trong preview trước khi gửi lời mời.</li>
                    <li>Nút "Upload corrected file" trong preview sẽ cố gắng tự sửa (chỉ cập nhật preview), Confirm mới thực hiện import.</li>
                  </ul>
                </ScrollArea>
              </div>

              {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={(e) => { e.stopPropagation(); onClose(); }} disabled={isProcessing}>Hủy</Button>
                <Button onClick={(e) => { e.stopPropagation(); if (!previewData) { setError("Vui lòng chọn file và chờ preview hiển thị trước khi xem."); return; } setShowPreview(true); }} disabled={isProcessing || !previewData}>{isProcessing ? "Đang xử lý..." : "Xem & Sửa trước khi gửi"}</Button>
              </div>
            </div>

            <DialogFooter />
          </DialogContent>
        </Dialog>
      </div>

      {/* Render the Preview modal when requested */}
      {showPreview && <PreviewModal />}

      {/* Visible top-right toast so user definitely sees the success */}
      {showToast && successMsg && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 9999999999,
            background: "#16a34a",
            color: "white",
            padding: "12px 16px",
            borderRadius: 8,
            boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
            whiteSpace: "pre-line",
            maxWidth: "min(80vw, 420px)",
          }}
        >
          {successMsg}
        </div>
      )}

      {/* Legacy success dialog (kept) */}
      {successMsg && <SuccessDialog />}

      {showImportErrors && Object.keys(importErrors).length > 0 && (
        <div className="mb-4 p-4 border border-rose-200 rounded-md bg-rose-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-rose-800">Lỗi khi import</h3>
            <div className="flex items-center gap-2">
              <button
                className="text-sm text-rose-700 underline"
                onClick={() => {
                  const lines: string[] = [];
                  const rows = new Set<number>();
                  Object.keys(importErrors).forEach((k) => rows.add(Number(k)));
                  Object.keys(importCellErrors).forEach((k) => rows.add(Number(k)));
                  Array.from(rows)
                    .sort((a, b) => a - b)
                    .forEach((r) => {
                      const rowMsgs = importErrors[Number(r)] ?? [];
                      rowMsgs.forEach((m) => lines.push(`Hàng ${r}: ${m}`));
                      const cellMsgs = importCellErrors[Number(r)] ?? {};
                      Object.keys(cellMsgs)
                        .map((ci) => Number(ci))
                        .sort((a, b) => a - b)
                        .forEach((ci) => {
                          (cellMsgs[ci] || []).forEach((m) => lines.push(`Hàng ${r}: ${m}`));
                        });
                    });
                  navigator.clipboard.writeText(lines.join("\n")).then(() => {}).catch(() => {});
                }}
              >
                Copy
              </button>
              <button className="text-sm text-rose-700" onClick={() => setShowImportErrors(false)}>Đóng</button>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-auto">
            {(() => {
              const rows = new Set<number>();
              Object.keys(importErrors).forEach((k) => rows.add(Number(k)));
              Object.keys(importCellErrors).forEach((k) => rows.add(Number(k)));
              return Array.from(rows)
                .sort((a, b) => a - b)
                .map((r) => (
                  <div key={r} className="text-sm">
                    <div className="font-medium text-rose-800">Hàng {r}</div>
                    <ul className="list-disc list-inside text-rose-700">
                      {(importErrors[Number(r)] || []).map((m, i) => <li key={`r-${i}`}>{m}</li>)}
                      {Object.keys(importCellErrors[Number(r)] || {})
                        .map((ci) => Number(ci))
                        .sort((a, b) => a - b)
                        .flatMap((ci) => (importCellErrors[Number(r)][ci] || []).map((m, i) => <li key={`c-${ci}-${i}`}>Col {ci + 1}: {m}</li>))
                      }
                    </ul>
                  </div>
                ));
            })()}
          </div>
        </div>
      )}
    </>
  );
};

export default AddMemberModal;