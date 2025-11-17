import * as React from "react";
import { useEffect, useState } from "react";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/common/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import useAccountRecoveryStore from "@/user/stores/useAccountRecoveryStore";
import type { AccountRecoveryItem } from "@/user/interfaces/account-recovery";
import { Loader2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/common/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/common/components/ui/tooltip";
import ConfirmActionModal from "@/user/components/ConfirmActionModal";

const AccountRecoveryList: React.FC = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [page, setPage] = useState(1);

  const { items, total, totalPages, isLoading, error, fetch, updateStatus } =
    useAccountRecoveryStore();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetch(
      debouncedSearch || null,
      statusFilter === "all" ? null : statusFilter,
      page,
      6
    ).catch((e) => console.error(e));
  }, [debouncedSearch, statusFilter, page, fetch]);

  // actions are handled via confirmation modal (openConfirm -> handleConfirm)

  // confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    type: "Đã phê duyệt" | "Đã từ chối";
  } | null>(null);

  const openConfirm = (id: string, type: "Đã phê duyệt" | "Đã từ chối") => {
    setPendingAction({ id, type });
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    const { id, type } = pendingAction;
    try {
      await updateStatus(id, type);
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmOpen(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-4 mb-6">
        <Input
          placeholder="Tìm theo email hoặc username..."
          className="max-w-xs bg-zinc-100 hover:bg-zinc-200 transition-all"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <Select
          onValueChange={(v) => {
            setStatusFilter(v as string);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40 bg-zinc-100 hover:bg-zinc-200 transition-all">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="Đang chờ">Đang chờ</SelectItem>
            <SelectItem value="Đã phê duyệt">Đã phê duyệt</SelectItem>
            <SelectItem value="Đã từ chối">Đã từ chối</SelectItem>
          </SelectContent>
        </Select>

        <Button className="ml-auto" onClick={() => fetch(null, null, 1, 6)}>
          Làm mới
        </Button>
      </div>

      <div className="overflow-hidden rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Người dùng
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lý do
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày gửi
              </TableHead>
              <TableHead className="w-48 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
                    <p className="text-sm text-gray-500">Đang tải...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <p className="text-sm font-medium text-gray-900">
                      Không có yêu cầu nào
                    </p>
                    {error && (
                      <p className="text-sm text-red-600">{String(error)}</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((it: AccountRecoveryItem) => (
                <TableRow key={it.id}>
                  <TableCell className="px-6 py-4">
                    {it.username ?? "-"}
                  </TableCell>
                  <TableCell className="px-6 py-4">{it.email ?? "-"}</TableCell>
                  <TableCell className="px-6 py-4 max-w-sm">
                    {it.requestReason ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate max-w-[28rem] cursor-help">
                              {it.requestReason}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-xs break-words"
                          >
                            <div className="text-sm">{it.requestReason}</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {(() => {
                      const mapLabel = (s: string) =>
                        s === "Đã phê duyệt"
                          ? "Đã phê duyệt"
                          : s === "Đã từ chối"
                          ? "Đã từ chối"
                          : "Đang chờ";
                      const mapClass = (s: string) =>
                        s === "Đã phê duyệt"
                          ? "bg-green-50 text-green-700"
                          : s === "Đã từ chối"
                          ? "bg-red-50 text-red-700"
                          : "bg-yellow-50 text-yellow-700";

                      return (
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${mapClass(
                            it.status
                          )}`}
                        >
                          {mapLabel(it.status)}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {new Date(it.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      {it.status === "Đang chờ" ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 text-gray-500 hover:text-gray-700">
                              <MoreVertical />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => openConfirm(it.id, "Đã phê duyệt")}
                            >
                              Phê duyệt
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => openConfirm(it.id, "Đã từ chối")}
                            >
                              Từ chối
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4 px-2">
        <span className="text-sm text-gray-600">Tổng: {total}</span>
        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(page - 1);
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={i + 1 === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(i + 1);
                    }}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage(page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      <ConfirmActionModal
        open={confirmOpen}
        title={
          pendingAction?.type === "Đã phê duyệt"
            ? "Xác nhận phê duyệt"
            : "Xác nhận từ chối"
        }
        description={
          pendingAction?.type === "Đã phê duyệt"
            ? "Bạn chắc chắn muốn phê duyệt yêu cầu này? Hành động này sẽ gửi email để thông báo cho người dùng."
            : "Bạn chắc chắn muốn từ chối yêu cầu này?"
        }
        confirmLabel={
          pendingAction?.type === "Đã phê duyệt" ? "Phê duyệt" : "Từ chối"
        }
        cancelLabel="Hủy"
        onConfirm={handleConfirm}
        onClose={() => {
          setConfirmOpen(false);
          setPendingAction(null);
        }}
      />
    </div>
  );
};

export default AccountRecoveryList;
