import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { useTransactionStore } from "@/paymentManagement/stores/useTransactionStore";
import type { TransactionDto } from "@/paymentManagement/services/transactionService";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/common/components/ui/card";
import { Separator } from "@/common/components/ui/separator";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import { Badge } from "@/common/components/ui/badge";
import { format } from "date-fns";
import { AppDialog } from "@/courseManagement/components/AppDialog";
import type { DialogProps } from "@/courseManagement/components/AppDialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/common/components/ui/tooltip";
import {
  HelpCircle,
  UploadCloud,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/common/components/ui/dialog";

const TransactionHistory: React.FC = () => {
  const authUser = useAuthStore((s) => s.user);
  const {
    transactions,
    fetchUserTransactions,
    requestWithdraw,
    loading,
    startTransactionConnection,
    stopTransactionConnection,
  } = useTransactionStore();

  const [q, setQ] = useState<string>("");
  const [filterType, setFilterType] = useState<string | "All">("All");
  const [filterStatus, setFilterStatus] = useState<string | "All">("All");
  const [dialog, setDialog] = useState<DialogProps>({
    open: false,
    title: "",
    message: "",
  });
  const [selectedTx, setSelectedTx] = useState<TransactionDto | null>(null);
  const [method, setMethod] = useState<"manual" | "upload">("manual");
  const [accountNumber, setAccountNumber] = useState("");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [detailTx, setDetailTx] = useState<TransactionDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sortField, setSortField] = useState<"time" | "amount">("time");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const uploadProof = useTransactionStore((s) => s.uploadProof);

  useEffect(() => {
    if (!authUser?.id) return;
    fetchUserTransactions(String(authUser.id));
  }, [authUser?.id, fetchUserTransactions]);

  // start real-time transaction connection so student sees approve/reject immediately
  useEffect(() => {
    if (!authUser?.id) return;
    let mounted = true;
    (async () => {
      try {
        await startTransactionConnection();
      } catch (err) {
        /* ignore */
      }
    })();
    return () => {
      if (!mounted) return;
      stopTransactionConnection();
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id]);

  const filtered = useMemo(() => {
    const t = transactions ?? [];
    const out = t.filter((tx) => {
      if (filterType && filterType !== "All" && tx.type !== filterType)
        return false;
      if (filterStatus && filterStatus !== "All" && tx.status !== filterStatus)
        return false;
      if (q && q.trim() !== "") {
        const s = q.trim().toLowerCase();
        return (
          String(tx.amount ?? "")
            .toLowerCase()
            .includes(s) ||
          String(tx.description ?? "")
            .toLowerCase()
            .includes(s)
        );
      }
      return true;
    });

    // Sort according to user selection: sortField & sortDir
    out.sort((a, b) => {
      if (sortField === "time") {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const cmp = tb - ta;
        if (cmp !== 0) return sortDir === "desc" ? cmp : -cmp;
        // fallback to amount
        const ma = Number(a.amount ?? 0);
        const mb = Number(b.amount ?? 0);
        return mb - ma;
      }
      // sortField === 'amount'
      const ma = Number(a.amount ?? 0);
      const mb = Number(b.amount ?? 0);
      const cmpAmt = mb - ma;
      if (cmpAmt !== 0) return sortDir === "desc" ? cmpAmt : -cmpAmt;
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    return out;
  }, [transactions, q, filterType, filterStatus, sortField, sortDir]);

  // map to check if a transaction already has a refund requested
  const hasRefundRequested = useMemo(() => {
    const set = new Set<string>();
    const list = transactions ?? [];
    for (const tx of list) {
      if (tx.type === "Refund" && tx.description) {
        // we stored original transaction code or id in the description when creating refund
        // attempt to extract reference by searching for numbers or using includes
        // simplest: mark any referenced id/code found in description
        for (const maybe of list) {
          const key = maybe.transactionCode ?? String(maybe.id);
          if (key && tx.description.includes(String(key))) {
            set.add(String(key));
          }
        }
      }
    }
    return set;
  }, [transactions]);

  const onRequestRefund = (tx: TransactionDto) => {
    // open refund form dialog
    setSelectedTx(tx);
    setMethod("manual");
    setAccountNumber("");
    setUploadPreview(null);
    setUploadedUrl(null);
    setDialog((d) => ({ ...d, open: true }));
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setDialog({
        open: true,
        title: "Lỗi",
        message: "Kích thước ảnh quá lớn (tối đa 5MB)",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result as string);
    reader.readAsDataURL(f);

    try {
      setUploading(true);
      const url = await uploadProof(f);
      console.log(url);
      if (url) {
        setUploadedUrl(url);
        setDialog({
          open: true,
          title: "Tải ảnh thành công",
          message: "Ảnh bằng chứng đã được tải lên máy chủ.",
        });
      } else throw new Error("Không thể tải ảnh lên máy chủ");
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      setDialog({ open: true, title: "Lỗi", message: msg });
    } finally {
      setUploading(false);
    }
  };

  const clearUpload = () => {
    setUploadPreview(null);
    setUploadedUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onRefundSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTx) return;
    if (!authUser?.id)
      return setDialog({
        open: true,
        title: "Lỗi",
        message: "Bạn phải đăng nhập để thực hiện yêu cầu",
      });

    try {
      setUploading(true);
      const req = {
        userId: String(authUser.id),
        amount: selectedTx.amount,
        type: "Refund",
        status: "Pending",
        courseId: selectedTx.courseId ?? undefined,
        accountNumber: method === "manual" ? accountNumber : undefined,
        qrcodeUrl: uploadedUrl ?? uploadPreview ?? null,
        description: `Yêu cầu hoàn tiền cho giao dịch ${
          selectedTx.transactionCode ?? selectedTx.id
        }`,
      } as any;

      const tx = await requestWithdraw(req);
      if (tx) {
        setDialog({
          open: true,
          title: "Yêu cầu gửi thành công",
          message: `Yêu cầu hoàn ${tx.amount.toLocaleString()}₫ đã được gửi. Trạng thái: ${
            tx.status
          }`,
        });
        // close refund form
        setSelectedTx(null);
        setAccountNumber("");
        clearUpload();
      }
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      setDialog({ open: true, title: "Lỗi", message: msg });
    } finally {
      setUploading(false);
      // ensure the form dialog is closed
      setDialog((d) => ({ ...d, open: false }));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AppDialog dialog={dialog as any} setDialog={(d: any) => setDialog(d)} />
      <Card className="shadow-lg">
        <CardHeader className="items-start">
          <div className="flex items-center justify-between w-full">
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">Lịch sử giao dịch</CardTitle>
                {/* top sort control removed; sorting available on table headers */}
              </div>
              <CardDescription className="mt-1 text-sm text-gray-500">
                Xem lại các giao dịch của bạn, tìm kiếm, lọc và gửi yêu cầu hoàn
                tiền khi cần.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent>
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Ô tìm kiếm */}
              <div className="flex-1 relative">
                <Input
                  placeholder="Tìm theo số tiền, nội dung..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full h-12 text-base pl-10 pr-4 rounded-lg border-slate-300 focus-visible:ring-primary focus-visible:ring-2 placeholder:text-slate-400"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                    />
                  </svg>
                </span>
              </div>

              {/* Bộ lọc */}
              <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                <Select
                  value={filterType}
                  onValueChange={(v) => setFilterType(v as any)}
                >
                  <SelectTrigger className="w-48 h-12 rounded-lg border-slate-300 focus:ring-primary focus:ring-2 text-base">
                    <SelectValue placeholder="Loại giao dịch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">Tất cả</SelectItem>
                    <SelectItem value="Withdraw">Rút tiền</SelectItem>
                    <SelectItem value="Refund">Hoàn tiền</SelectItem>
                    <SelectItem value="Deposit">Nạp tiền</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterStatus}
                  onValueChange={(v) => setFilterStatus(v as any)}
                >
                  <SelectTrigger className="w-48 h-12 rounded-lg border-slate-300 focus:ring-primary focus:ring-2 text-base">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">Tất cả</SelectItem>
                    <SelectItem value="Pending">Đang chờ</SelectItem>
                    <SelectItem value="Success">Thành công</SelectItem>
                    <SelectItem value="Cancelled">Đã hủy</SelectItem>
                    <SelectItem value="Failed">Thất bại</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[60px] text-sm font-medium text-gray-700">
                    #
                  </TableHead>
                  <TableHead className="text-sm font-medium text-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        if (sortField === "time") {
                          setSortDir((d) => (d === "desc" ? "asc" : "desc"));
                        } else {
                          setSortField("time");
                          setSortDir("desc");
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <span>Thời gian</span>
                      {sortField === "time" ? (
                        sortDir === "desc" ? (
                          <ChevronDown className="w-4 h-4 text-slate-600" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-600" />
                        )
                      ) : (
                        // show muted indicator when this column is not the active sort
                        <ChevronDown className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-sm font-medium text-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        if (sortField === "amount") {
                          setSortDir((d) => (d === "desc" ? "asc" : "desc"));
                        } else {
                          setSortField("amount");
                          setSortDir("desc");
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <span>Số tiền</span>
                      {sortField === "amount" ? (
                        sortDir === "desc" ? (
                          <ChevronDown className="w-4 h-4 text-slate-600" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-600" />
                        )
                      ) : (
                        // muted indicator when not active
                        <ChevronDown className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-sm font-medium text-gray-700">
                    Loại
                  </TableHead>
                  <TableHead className="text-sm font-medium text-gray-700">
                    Trạng thái
                  </TableHead>
                  <TableHead className="text-sm font-medium text-gray-700">
                    Nội dung
                  </TableHead>
                  <TableHead className="text-sm font-medium text-gray-700 text-center w-[160px]">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 6 }).map((_, idx) => (
                      <TableRow key={idx} className="animate-pulse">
                        <TableCell className="h-8 bg-gray-100" />
                        <TableCell className="h-8 bg-gray-100" />
                        <TableCell className="h-8 bg-gray-100" />
                        <TableCell className="h-8 bg-gray-100" />
                        <TableCell className="h-8 bg-gray-100" />
                        <TableCell className="h-8 bg-gray-100" />
                        <TableCell className="h-8 bg-gray-100" />
                      </TableRow>
                    ))
                  : filtered.map((t: TransactionDto, i: number) => (
                      <TableRow
                        key={t.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setDetailTx(t);
                          setDetailOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{i + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {t.createdAt
                            ? format(new Date(t.createdAt), "yyyy-MM-dd HH:mm")
                            : "-"}
                        </TableCell>
                        <TableCell className="font-semibold text-lg text-blue-600">
                          {t.amount.toLocaleString()}₫
                        </TableCell>
                        <TableCell className="text-sm">{t.type}</TableCell>
                        <TableCell>
                          <Badge
                            className={`px-2 py-1 rounded-full ${
                              t.status === "Success"
                                ? "bg-green-100 text-green-800"
                                : t.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {t.description ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            {t.status === "Success" &&
                            String(t.type).toLowerCase() === "deposit" &&
                            !hasRefundRequested.has(
                              String(t.transactionCode ?? t.id)
                            ) ? (
                              <Button
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-md"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  onRequestRefund(t);
                                }}
                              >
                                Yêu cầu rút tiền
                              </Button>
                            ) : (
                              <div className="text-gray-400">—</div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Global small AppDialog for messages */}
      <AppDialog dialog={dialog} setDialog={(d: any) => setDialog(d)} />

      {/* Transaction detail dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => setDetailOpen(open)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Chi tiết giao dịch</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về giao dịch đã chọn
            </DialogDescription>
          </DialogHeader>
          {detailTx ? (
            <div className="space-y-5 mt-4">
              {/* Top fields */}
              <div className="grid grid-cols-[160px_1fr] gap-y-3 items-center">
                <div className="text-sm text-slate-500">Mã giao dịch</div>
                <div className="font-mono text-sm text-right text-slate-800">
                  {detailTx.transactionCode ?? detailTx.id}
                </div>

                <div className="text-sm text-slate-500">Thời gian</div>
                <div className="text-sm text-right text-slate-800">
                  {detailTx.createdAt
                    ? format(
                        new Date(detailTx.createdAt),
                        "yyyy-MM-dd HH:mm:ss"
                      )
                    : "-"}
                </div>

                <div className="text-sm text-slate-500">Số tiền</div>
                <div className="font-semibold text-right text-blue-600 text-base">
                  {detailTx.amount.toLocaleString()}₫
                </div>

                <div className="text-sm text-slate-500">Loại</div>
                <div className="text-sm text-right text-slate-800">
                  {detailTx.type}
                </div>

                <div className="text-sm text-slate-500">Trạng thái</div>
                <div className="text-right">
                  <Badge
                    className={`px-2.5 py-1 rounded-full font-medium ${
                      detailTx.status === "Success"
                        ? "bg-green-100 text-green-700"
                        : detailTx.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {detailTx.status}
                  </Badge>
                </div>

                {/* Gộp 3 trường cuối vào cùng layout 2 cột */}
                <div className="text-sm text-slate-500">Nội dung</div>
                <div className="text-sm text-right text-slate-800 truncate">
                  {detailTx.description ?? "-"}
                </div>

                <div className="text-sm text-slate-500">Tài khoản nhận</div>
                <div className="text-sm text-right text-slate-800">
                  {detailTx.accountNumber ?? "-"}
                </div>

                <div className="text-sm text-slate-500">
                  Ảnh QR / Bằng chứng
                </div>
                <div className="flex justify-end items-center gap-3">
                  {detailTx.qrcodeUrl ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={detailTx.qrcodeUrl}
                        alt="qr"
                        className="h-20 w-20 object-cover rounded-lg border shadow-sm hover:scale-[1.02] transition-transform"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(detailTx.qrcodeUrl ?? undefined, "_blank")
                        }
                      >
                        Xem ảnh
                      </Button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t mt-2">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-500">
              Không có dữ liệu
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund form dialog */}
      <Dialog
        open={!!selectedTx && dialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTx(null);
            setDialog((d) => ({ ...d, open: false }));
          }
        }}
      >
        <DialogContent className="max-w-lg rounded-xl p-6">
          <DialogHeader className="space-y-2 border-b pb-3">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Yêu cầu hoàn tiền
            </DialogTitle>
            <DialogDescription className="text-base text-slate-600">
              Vui lòng nhập tài khoản nhận hoặc tải ảnh QR để gửi yêu cầu hoàn
              tiền.
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <form onSubmit={onRefundSubmit} className="space-y-6 mt-4">
              {/* --- Thông tin giao dịch --- */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-sm text-slate-500 mb-1">Giao dịch</div>
                <div className="font-semibold text-slate-900 text-base">
                  {selectedTx.transactionCode ?? selectedTx.id}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Số tiền:{" "}
                  <span className="font-bold text-lg text-blue-600">
                    {selectedTx.amount.toLocaleString()}₫
                  </span>
                </div>
              </div>

              {/* --- Chọn phương thức hoàn tiền --- */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-base font-medium text-slate-800">
                    Tài khoản nhận
                  </div>
                  <div className="flex items-center gap-2">
                    {method === "manual" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-slate-500 hover:text-primary"
                          >
                            <HelpCircle className="w-5 h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Format:{" "}
                          <span className="font-mono text-sm">
                            STK_NganHang
                          </span>{" "}
                          (VD:{" "}
                          <span className="font-mono text-sm">
                            0123456789_VCB
                          </span>
                          )
                        </TooltipContent>
                      </Tooltip>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={method === "manual" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMethod("manual")}
                        className="px-3"
                      >
                        Nhập STK
                      </Button>
                      <Button
                        type="button"
                        variant={method === "upload" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMethod("upload")}
                        className="px-3"
                      >
                        Tải ảnh QR
                      </Button>
                    </div>
                  </div>
                </div>

                {/* --- Nhập STK --- */}
                {method === "manual" && (
                  <Input
                    placeholder="STK_NganHang (VD: 0123456789_Vietcombank)"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="h-12 text-base border-slate-300 focus-visible:ring-primary"
                  />
                )}

                {/* --- Upload QR --- */}
                {method === "upload" && (
                  <div className="mt-3">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileChange}
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="h-11"
                      >
                        <UploadCloud className="w-4 h-4 mr-1" />
                        {uploading ? "Đang tải..." : "Chọn ảnh QR"}
                      </Button>

                      {uploadPreview && (
                        <div className="flex items-center gap-2">
                          <img
                            src={uploadPreview}
                            alt="preview"
                            className="h-20 w-20 object-cover rounded-lg border shadow-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearUpload}
                            className="text-sm text-destructive hover:bg-destructive/10 flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            Xóa
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Ảnh tối đa <strong>5MB</strong>. Ảnh này sẽ được gửi kèm
                      yêu cầu hoàn tiền.
                    </p>
                  </div>
                )}
              </div>

              {/* --- Footer --- */}
              <DialogFooter className="pt-4 border-t">
                <div className="flex justify-end gap-3 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setSelectedTx(null);
                      setDialog((d) => ({ ...d, open: false }));
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={uploading}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    {uploading ? "Đang gửi..." : "Gửi yêu cầu"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionHistory;
