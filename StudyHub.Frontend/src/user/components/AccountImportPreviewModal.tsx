import React, { useEffect, useRef } from "react";
import { Button } from "@/common/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/common/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

type PreviewData = { headers: string[]; rows: string[][] } | null;

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  previewData: PreviewData;
  importErrors: Record<number, string[]>;
  importCellErrors: Record<number, Record<number, string[]>>;
  onConfirmUpload: () => Promise<void>;
  onPreviewChange: (p: PreviewData) => void;
  onClose: () => void;
};

const AccountImportPreviewModal: React.FC<Props> = ({
  open,
  onOpenChange,
  previewData,
  importErrors,
  importCellErrors,
  onConfirmUpload,
  onPreviewChange,
  onClose,
}) => {
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !previewData) return;
    const rows = new Set<number>();
    Object.keys(importErrors).forEach((k) => rows.add(Number(k)));
    Object.keys(importCellErrors).forEach((k) => rows.add(Number(k)));
    const arr = Array.from(rows)
      .filter((r) => r > 0)
      .sort((a, b) => a - b);
    if (arr.length === 0) return;
    const first = arr[0];
    requestAnimationFrame(() => {
      const el = tableContainerRef.current?.querySelector(
        `tr[data-excel-row="${first}"]`
      ) as HTMLElement | null;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [open, previewData, importErrors, importCellErrors]);

  if (!open || !previewData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative max-w-5xl w-full bg-white rounded-lg shadow-lg p-4 z-10 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Preview Import</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onConfirmUpload}>
              Upload corrected file
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <div
          className="overflow-auto flex-1 border rounded"
          ref={tableContainerRef}
        >
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-2">#</th>
                {previewData.headers.map((h, i) => (
                  <th key={i} className="p-2 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.rows.map((row, ri) => {
                const excelRow = 2 + ri;
                const cellErrs = importCellErrors[excelRow] ?? {};
                const hasError =
                  !!(
                    importErrors[excelRow] && importErrors[excelRow].length > 0
                  ) || Object.keys(cellErrs).length > 0;
                return (
                  <tr
                    key={ri}
                    data-excel-row={excelRow}
                    className={hasError ? "bg-rose-50" : undefined}
                  >
                    <td className="p-2 align-top">{excelRow}</td>
                    {previewData.headers.map((_, ci) => (
                      <td key={ci} className="p-2 align-top">
                        <div className="flex items-start gap-2">
                          <input
                            className="flex-1 border px-2 py-1 rounded text-sm"
                            value={row[ci] ?? ""}
                            onChange={(e) => {
                              const next = previewData
                                ? { ...previewData }
                                : null;
                              if (!next) return;
                              next.rows = next.rows.map((r, idx) =>
                                idx === ri ? [...r] : r
                              );
                              next.rows[ri][ci] = e.target.value;
                              onPreviewChange(next);
                            }}
                          />
                          {cellErrs[ci] && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="p-1 text-rose-600"
                                    aria-label="Error"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="!px-2 !py-1"
                                >
                                  <div className="text-xs max-w-xs">
                                    {cellErrs[ci].join("; ")}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {(Object.keys(importErrors).length > 0 ||
          Object.keys(importCellErrors).length > 0) && (
          <div className="mb-4 p-4 border border-rose-200 rounded-md bg-rose-50 mt-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-rose-800">
                Lỗi khi import
              </h3>
              <div className="flex items-center gap-2">
                <button
                  className="text-sm text-rose-700 underline"
                  onClick={() => {
                    const lines: string[] = [];
                    const rows = new Set<number>();
                    Object.keys(importErrors).forEach((k) =>
                      rows.add(Number(k))
                    );
                    Object.keys(importCellErrors).forEach((k) =>
                      rows.add(Number(k))
                    );
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
                            (cellMsgs[ci] || []).forEach((m) =>
                              lines.push(`Hàng ${r}: ${m}`)
                            );
                          });
                      });
                    navigator.clipboard
                      .writeText(lines.join("\n"))
                      .then(() => toast.success("Copied lỗi vào clipboard"))
                      .catch(() => toast.error("Không thể copy"));
                  }}
                >
                  Copy
                </button>
                <button
                  className="text-sm text-rose-700"
                  onClick={() => {
                    // clearing handled by parent via onClose or external handlers
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-48 overflow-auto">
              {(() => {
                const rows = new Set<number>();
                Object.keys(importErrors).forEach((k) => rows.add(Number(k)));
                Object.keys(importCellErrors).forEach((k) =>
                  rows.add(Number(k))
                );
                return Array.from(rows)
                  .sort((a, b) => a - b)
                  .map((r) => (
                    <div key={r} className="text-sm">
                      <div className="font-medium text-rose-800">Hàng {r}</div>
                      <ul className="list-disc list-inside text-rose-700">
                        {(importErrors[Number(r)] || []).map((m, i) => (
                          <li key={`r-${i}`}>{m}</li>
                        ))}
                        {Object.keys(importCellErrors[Number(r)] || {})
                          .map((ci) => Number(ci))
                          .sort((a, b) => a - b)
                          .flatMap((ci) =>
                            (importCellErrors[Number(r)][ci] || []).map(
                              (m, i) => <li key={`c-${ci}-${i}`}>{m}</li>
                            )
                          )}
                      </ul>
                    </div>
                  ));
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountImportPreviewModal;
