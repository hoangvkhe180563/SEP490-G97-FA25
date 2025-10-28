import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, Inbox, Loader2 } from "lucide-react";
import { Input } from "@/common/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { Button } from "@/common/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import AccountItem from "../../components/AccountItem";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import type { AppUser } from "@/user/interfaces/app-user";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/common/components/ui/pagination";
import { Link } from "react-router-dom";
import { useAppRoleStore } from "@/user/stores/useRoleStore";
const AccountList = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [page, setPage] = useState(1);

  const {
    appUsers,
    setAppUsers,
    meta,
    isLoading,
    success,
    message,
    filterAppUsers,
  } = useAppUserStore();
  const { appRoles, getAppRoles } = useAppRoleStore();
  // Map frontend status to backend expected values (Active/Inactive)
  const statusColor: Record<AppUser["status"], string> = {
    Active:
      "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 focus:ring-green-300",
    Inactive: "bg-rose-100 text-rose-800 hover:bg-rose-200 focus:ring-rose-300",
  };

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Build query string for API call
  const query = useMemo(() => {
    const params = new URLSearchParams();
    // role is expected as an int by the backend requirement; if 'all' skip
    if (roleFilter && roleFilter !== "all") params.set("role", roleFilter);
    if (statusFilter && statusFilter !== "all")
      params.set("status", statusFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("page", String(page));
    params.set("limit", "6");
    return params.toString();
  }, [roleFilter, statusFilter, debouncedSearch, page]);

  useEffect(() => {
    // Fetch when query changes
    filterAppUsers(query).catch((err) => console.error(err));
    // Fetch roles for the role filter dropdown
    getAppRoles().catch((err) => console.error(err));
  }, [query, filterAppUsers, getAppRoles]);

  const total = meta?.total ?? 0;
  const currentPage = meta?.page ?? page;
  const limit = meta?.limit ?? 6;
  const start = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-4 mb-6">
        <Input
          placeholder="Tìm kiếm tài khoản..."
          className="max-w-xs bg-zinc-100 hover:bg-zinc-200 transition-all"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          onValueChange={(v) => {
            setRoleFilter(v as string);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40 bg-zinc-100 hover:bg-zinc-200 transition-all">
            <SelectValue placeholder="Chọn vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              {appRoles.map((role) => (
                <SelectItem key={role.id} value={String(role.id)}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
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
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="ml-auto flex items-center gap-2"
          disabled={isLoading}
        >
          <Download className="w-4 h-4" /> Export
        </Button>
        <Button className="bg-black text-white flex items-center gap-2">
          <Link to="/user/manager/add-account">+ Thêm tài khoản</Link>
        </Button>
      </div>
      <div className="overflow-hidden rounded-md ">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Người dùng
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vai trò
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </TableHead>
              <TableHead className="w-36 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-zinc-600" />
                    <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : !success ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 pt-5">
                    <div className="rounded-full bg-red-100 p-3">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        Đã có lỗi xảy ra khi tải dữ liệu
                      </p>
                      <p className="text-sm text-gray-500">{message}</p>
                    </div>
                    <Button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-zinc-600 text-white text-sm rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                      Thử lại
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : appUsers.length > 0 ? (
              appUsers.map((user, idx) => (
                <AccountItem
                  key={user.id}
                  user={user}
                  idx={idx}
                  setUsers={setAppUsers}
                  statusColor={statusColor}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="rounded-full bg-gray-100 p-3">
                      <Inbox className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        Không tìm thấy tài khoản nào phù hợp
                      </p>
                      <p className="text-sm text-gray-500">
                        Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn để
                        tìm kiếm kết quả khác.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between mt-4 px-2">
        <span className="text-sm text-gray-600">
          Hiển thị từ {start} đến {end} trong {total} kết quả
        </span>
        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setPage(currentPage - 1);
                  }}
                />
              </PaginationItem>
              {Array.from({ length: meta?.totalPages ?? 0 }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={i + 1 === currentPage}
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
                    if ((meta?.page ?? currentPage) < (meta?.totalPages ?? 1))
                      setPage((meta?.page ?? currentPage) + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default AccountList;
