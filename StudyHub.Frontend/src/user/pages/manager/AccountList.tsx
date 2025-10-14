import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
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
import type { User } from "@/user/interfaces/user";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/common/components/ui/pagination";
import { Link } from "react-router-dom";
const AccountList = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [page, setPage] = useState(1);

  const { appUsers, meta, isLoading, filterAppUsers } = useAppUserStore();
  const [localUsers, setLocalUsers] = useState<User[]>([]);

  // Map frontend status to backend expected values (Active/Inactive)
  const statusColor: Record<AppUser["status"], string> = {
    Active: "bg-emerald-100 text-emerald-800",
    Inactive: "bg-rose-100 text-rose-800",
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
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("page", String(page));
    params.set("limit", "6");
    return params.toString();
  }, [roleFilter, statusFilter, debouncedSearch, page]);

  useEffect(() => {
    // Fetch when query changes
    filterAppUsers(query).catch((err) => console.error(err));
  }, [query, filterAppUsers]);

  // keep a local copy for UI edits (status toggle etc.)
  useEffect(() => {
    // Map AppUser (new shape) to old User shape used by AccountItem component
    const mapped: User[] = (appUsers ?? []).map((u) => ({
      id: u.id,
      name: u.fullName ?? (u.username as string) ?? u.email,
      email: u.email,
      role: u.roles && u.roles.length > 0 ? u.roles[0] : "",
      avatar: undefined,
      createdAt: u.createdAt,
      status: u.status,
    }));
    setLocalUsers(mapped);
  }, [appUsers]);
  const total = meta?.total ?? 0;
  const currentPage = meta?.page ?? page;
  const limit = meta?.limit ?? 6;
  const start = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-4 mb-6">
        <Input
          placeholder="Search accounts..."
          className="max-w-xs"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select onValueChange={(v) => { setRoleFilter(v as string); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select onValueChange={(v) => { setStatusFilter(v as string); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="ml-auto flex items-center gap-2" disabled={isLoading}>
          <Download className="w-4 h-4" /> Export
        </Button>
        <Button className="bg-black text-white flex items-center gap-2">
          <Link to="/manager/add-account">+ Add Account</Link>
        </Button>
      </div>
      <div className="overflow-hidden rounded-md ">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500">
                <input type="checkbox" className="w-4 h-4" />
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="w-36 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localUsers.length > 0 ? (
              localUsers.map((user, idx) => (
                <AccountItem
                  key={user.id}
                  user={user}
                  idx={idx}
                  setUsers={setLocalUsers}
                  statusColor={statusColor}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-20" />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between mt-4 px-2">
        <span className="text-sm text-gray-600">
          Showing {start} to {end} of {total} results
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
