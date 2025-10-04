import { useState } from "react";
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

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/common/components/ui/pagination";
import { Link } from "react-router-dom";
import type { User } from "@/ui/interfaces/user";

const initialUsers: User[] = [
  {
    id: "1",
    avatar: "/avatars/user1.png",
    name: "John Smith",
    email: "john.smith@email.com",
    role: "UI Manager",
    createdAt: "2025-01-10",
    status: "Active",
  },
  {
    id: "2",
    avatar: "/avatars/user2.png",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    role: "Teacher",
    createdAt: "2025-01-08",
    status: "Active",
  },
  {
    id: "3",
    avatar: "/avatars/user3.png",
    name: "Mike Davis",
    email: "mike.davis@email.com",
    role: "Student",
    createdAt: "2025-01-12",
    status: "Active",
  },
  {
    id: "4",
    avatar: "/avatars/user4.png",
    name: "Lisa Wilson",
    email: "lisa.wilson@email.com",
    role: "Question Manager",
    createdAt: "2025-01-05",
    status: "Inactive",
  },
  {
    id: "5",
    avatar: "/avatars/user1.png",
    name: "John Smith",
    email: "john.smith3@email.com",
    role: "Parent",
    createdAt: "2025-01-10",
    status: "Active",
  },
];

const AccountList = () => {
  const [users, setUsers] = useState(initialUsers);
  const shownUsers = users.slice(0, 5); // Show only first 4 users for demo
  const statusColor: Record<User["status"], string> = {
    Active: "bg-emerald-100 text-emerald-800",
    Inactive: "bg-rose-100 text-rose-800",
  };
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center gap-4 mb-6">
        <Input placeholder="Search accounts..." className="max-w-xs" />
        <Select>
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
        <Select>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="ml-auto flex items-center gap-2">
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
            {shownUsers.map((user, idx) => (
              <AccountItem
                key={idx}
                user={user}
                idx={idx}
                setUsers={setUsers}
                statusColor={statusColor}
              />
            ))}
            {shownUsers.length < 4 && (
              <TableRow>
                <TableCell colSpan={6} className="h-20" />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between mt-4 px-2">
        <span className="text-sm text-gray-600">
          Showing 1 to 4 of 97 results
        </span>
        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default AccountList;
