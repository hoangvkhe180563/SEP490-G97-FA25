import React, { useMemo, useState, useEffect, useRef } from "react";
import { useTransactionStore } from "@/paymentManagement/stores/useTransactionStore";
import type { TransactionDto } from "@/paymentManagement/services/transactionService";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/common/components/ui/card";
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
import {
  Check,
  X as XIcon,
  Download,
  FileText,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Separator } from "@/common/components/ui/separator";
import { format, formatISO } from "date-fns";
import { Dialog, DialogContent } from "@/common/components/ui/dialog";
import type { DialogProps } from "@/courseManagement/components/AppDialog";
import { AppDialog } from "@/courseManagement/components/AppDialog";
import { Paging } from "@/common/components/Paging";

const TransactionList: React.FC = () => {
  const [userId, setUserId] = useState("");
  const [filterType, setFilterType] = useState<
    "All" | "Withdraw" | "Refund" | "TopUp"
  >("All");
  const [filterStatus, setFilterStatus] = useState<
    "All" | "Pending" | "Success" | "Cancelled" | "Failed"
  >("All");
  const {
    transactions,
    fetchUserTransactions,
    fetchPendingTransactions,
    adminApprove,
    adminReject,
    exportCsv,
    exportDoc,
    loading,
  } = useTransactionStore();
  const page = useTransactionStore((s) => s.page);
  const limit = useTransactionStore((s) => s.limit);
  const total = useTransactionStore((s) => s.total);
  const totalPages = useTransactionStore((s) => s.totalPages);

  // dynamic search: debounce userId input
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    // clear previous timer
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!userId || userId.trim() === "") {
      // when input is empty, load global pending transactions
      const typeParam =
        filterType && filterType !== "All" ? filterType : undefined;
      const statusParam =
        filterStatus && filterStatus !== "All" ? filterStatus : undefined;
      fetchPendingTransactions(1, 5, typeParam, statusParam).catch(() => {});
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      try {
        await fetchUserTransactions(userId.trim());
      } catch (e) {
        // ignore
      }
    }, 600);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [
    userId,
    fetchUserTransactions,
    fetchPendingTransactions,
    filterType,
    filterStatus,
  ]);

  const onApprove = async (
    id: number,
    txUserId?: string,
    body?: Partial<TransactionDto>
  ) => {
    // ensure we send the UserId so backend can find the pending tx
    const payload: Partial<TransactionDto> = {
      ...(body ?? {}),
      userId: txUserId ?? userId,
    } as any;
    await adminApprove(id, payload);
    // refresh appropriate list: user-specific if userId provided, otherwise pending list
    if (userId && userId.trim() !== "") {
      await fetchUserTransactions(userId);
    } else {
      const typeParam =
        filterType && filterType !== "All" ? filterType : undefined;
      const statusParam =
        filterStatus && filterStatus !== "All" ? filterStatus : undefined;
      await fetchPendingTransactions(
        page ?? 1,
        limit ?? 5,
        typeParam,
        statusParam
      );
    }
  };

  const onReject = async (id: number, txUserId?: string) => {
    const payload: Partial<TransactionDto> = {
      userId: txUserId ?? userId,
    } as any;
    await adminReject(id, payload);
    // refresh appropriate list: user-specific if userId provided, otherwise pending list
    if (userId && userId.trim() !== "") {
      await fetchUserTransactions(userId);
    } else {
      const typeParam =
        filterType && filterType !== "All" ? filterType : undefined;
      const statusParam =
        filterStatus && filterStatus !== "All" ? filterStatus : undefined;
      await fetchPendingTransactions(
        page ?? 1,
        limit ?? 5,
        typeParam,
        statusParam
      );
    }
  };

  const goToPage = async (p: number) => {
    if (!p || p < 1) return;
    const typeParam =
      filterType && filterType !== "All" ? filterType : undefined;
    const statusParam =
      filterStatus && filterStatus !== "All" ? filterStatus : undefined;
    await fetchPendingTransactions(p, limit ?? 5, typeParam, statusParam);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Success":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Failed":
        return "bg-red-200 text-red-900";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const typeLabel = (type: string) => {
    if (!type) return "-";
    switch (type.toLowerCase()) {
      case "withdraw":
        return "Rút tiền";
      case "refund":
        return "Hoàn tiền";
      case "topup":
      case "deposit":
      case "nạp tiền":
        return "Nạp tiền";
      default:
        // fallback: capitalize
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const statusLabel = (status: string) => {
    if (!status) return "-";
    switch (status) {
      case "Pending":
        return "Đang chờ";
      case "Success":
        return "Thành công";
      case "Cancelled":
        return "Đã hủy";
      case "Failed":
        return "Thất bại";
      default:
        return status;
    }
  };

  const [sortField, setSortField] = useState<"time" | "amount">("time");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const filteredSorted = useMemo(() => {
    const list = Array.isArray(transactions) ? [...transactions] : [];
    list.sort((a, b) => {
      if (sortField === "time") {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const cmp = tb - ta;
        if (cmp !== 0) return sortDir === "desc" ? cmp : -cmp;
        const ma = Number(a.amount ?? 0);
        const mb = Number(b.amount ?? 0);
        return mb - ma;
      }
      // amount
      const ma = Number(a.amount ?? 0);
      const mb = Number(b.amount ?? 0);
      const cmpAmt = mb - ma;
      if (cmpAmt !== 0) return sortDir === "desc" ? cmpAmt : -cmpAmt;
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    return list;
  }, [transactions, sortField, sortDir]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogProps>({
    open: false,
    title: "",
    message: "",
  });

  // Export helpers (delegates to backend)
  const exportToCSV = () => {
    (async () => {
      try {
        const typeParam =
          filterType && filterType !== "All" ? filterType : undefined;
        const statusParam =
          filterStatus && filterStatus !== "All" ? filterStatus : undefined;
        const blob = await exportCsv(
          typeParam,
          statusParam,
          userId && userId.trim() !== "" ? userId.trim() : undefined
        );
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions_${formatISO(new Date()).slice(0, 10)}.csv`;

        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        // ignore or show toast
      }
    })();
  };

  const exportToWord = () => {
    (async () => {
      try {
        const typeParam =
          filterType && filterType !== "All" ? filterType : undefined;
        const statusParam =
          filterStatus && filterStatus !== "All" ? filterStatus : undefined;
        const blob = await exportDoc(
          typeParam,
          statusParam,
          userId && userId.trim() !== "" ? userId.trim() : undefined
        );
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions_${formatISO(new Date()).slice(0, 10)}.doc`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        // ignore or show toast
      }
    })();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="shadow-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center justify-between">
            <span>Quản trị - Giao dịch</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={exportToCSV}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md shadow-sm"
              >
                <Download className="w-4 h-4" />
                Xuất Excel
              </Button>

              <Button
                size="sm"
                onClick={exportToWord}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md shadow-sm"
              >
                <FileText className="w-4 h-4" />
                Xuất Word
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="mt-4">
          <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
            <Input
              className="w-full md:w-1/3"
              placeholder="Nhập UserId (GUID)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                {[
                  { key: "All", label: "Tất cả" },
                  { key: "Withdraw", label: "Rút tiền" },
                  { key: "Refund", label: "Hoàn tiền" },
                  { key: "TopUp", label: "Nạp tiền" },
                ].map((opt) => {
                  const isActive = filterType === opt.key;
                  return (
                    <Button
                      key={opt.key}
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilterType(opt.key as any)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-150
                      ${
                        isActive
                          ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                          : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                      }`}
                    >
                      {opt.label}
                    </Button>
                  );
                })}
              </div>

              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as any)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Tất cả trạng thái</SelectItem>
                  <SelectItem value="Pending">Đang chờ</SelectItem>
                  <SelectItem value="Success">Thành công</SelectItem>
                  <SelectItem value="Cancelled">Đã hủy</SelectItem>
                  <SelectItem value="Failed">Thất bại</SelectItem>
                </SelectContent>
              </Select>
              {/* export buttons moved to header */}
            </div>
          </div>

          {(!filteredSorted || filteredSorted.length === 0) && !loading ? (
            <div className="text-center text-gray-500 py-8">
              Không tìm thấy giao dịch.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead>
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
                          <ChevronDown className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
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
                          <ChevronDown className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Tài khoản</TableHead>
                    <TableHead>Ảnh QR</TableHead>
                    <TableHead className="text-center w-[180px]">
                      Hành động
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSorted.map((t: TransactionDto, index: number) => (
                    <TableRow key={t.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {t.createdAt
                          ? format(new Date(t.createdAt), "yyyy-MM-dd HH:mm")
                          : "-"}
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {t.amount.toLocaleString()}₫
                      </TableCell>
                      <TableCell>{typeLabel(t.type)}</TableCell>
                      <TableCell>
                        <Badge className={statusColor(t.status)}>
                          {statusLabel(t.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {t.description ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {t.accountNumber ?? "-"}
                      </TableCell>
                      <TableCell>
                        {t.qrcodeUrl ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewUrl(t.qrcodeUrl ?? null)}
                            className="inline-block p-0"
                          >
                            <img
                              src={t.qrcodeUrl}
                              alt="proof"
                              className="h-10 w-10 object-cover rounded-md border"
                            />
                          </Button>
                        ) : (
                          <div className="text-gray-400">—</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {t.status === "Pending" ? (
                          <div className="flex justify-center gap-2">
                            <Button
                              size="sm"
                              variant="checked"
                              className="flex items-center gap-2"
                              onClick={() =>
                                setDialog({
                                  open: true,
                                  title: "Duyệt giao dịch",
                                  message:
                                    "Bạn có chắc muốn duyệt giao dịch này?",
                                  onConfirm: async () => {
                                    await onApprove(t.id, t.userId, {
                                      qrcodeUrl: t.qrcodeUrl,
                                      accountNumber: t.accountNumber,
                                    });
                                    setDialog((prev) => ({
                                      ...prev,
                                      open: false,
                                    }));
                                  },
                                })
                              }
                            >
                              <Check className="w-4 h-4" /> Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex items-center gap-2"
                              onClick={() =>
                                setDialog({
                                  open: true,
                                  title: "Từ chối giao dịch",
                                  message:
                                    "Bạn có chắc muốn từ chối giao dịch này?",
                                  onConfirm: async () => {
                                    await onReject(t.id, t.userId);
                                    setDialog((prev) => ({
                                      ...prev,
                                      open: false,
                                    }));
                                  },
                                })
                              }
                            >
                              <XIcon className="w-4 h-4" /> Từ chối
                            </Button>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-center">—</div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Pager - show only when looking at global pending (no userId) */}
          {(!userId || userId.trim() === "") && total > 0 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <span className="text-sm text-gray-600">
                {total > 0
                  ? `Hiển thị từ ${
                      page && limit ? (page - 1) * limit + 1 : 0
                    } đến ${
                      (page && limit ? (page - 1) * limit + 1 : 0) +
                      Math.max(0, filteredSorted.length - 1)
                    } trong tổng số ${total} kết quả`
                  : "Không tìm thấy kết quả nào"}
              </span>
              <Paging
                currentPage={page ?? 1}
                totalPages={totalPages ?? 1}
                onPageChange={(p: number) => goToPage(p)}
              />
            </div>
          )}

          {/* Image preview dialog */}
          <Dialog
            open={Boolean(previewUrl)}
            onOpenChange={(open) => {
              if (!open) setPreviewUrl(null);
            }}
          >
            <DialogContent className="!max-w-[95vw] !w-[80vw] p-0">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="qr-preview"
                  className="w-full h-[80vh] object-contain"
                />
              )}
            </DialogContent>
          </Dialog>
          {/* AppDialog for confirmations */}
          <AppDialog dialog={dialog} setDialog={setDialog} />
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionList;
