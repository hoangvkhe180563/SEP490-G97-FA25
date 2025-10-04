import React from "react";
import { TableRow, TableCell } from "@/common/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/common/components/ui/avatar";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import { Eye, Edit2, Trash2 } from "lucide-react";
import type { AccountItemProps as Props } from "@/ui/interfaces/props";
import type { User } from "@/ui/interfaces/user";
import { Link } from "react-router-dom";

const AccountItem: React.FC<Props> = ({ user, idx, setUsers, statusColor }) => {
  return (
    <TableRow>
      <TableCell className="px-4 py-4">
        <input type="checkbox" className="w-4 h-4" />
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-6 py-4 text-center">
        <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-3 py-1 text-sm">
          {user.role}
        </span>
      </TableCell>
      <TableCell className="px-6 py-4 text-gray-600 text-center">
        {user.createdAt}
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="flex items-center justify-center gap-3">
          <Select
            value={user.status}
            onValueChange={(val) =>
              setUsers((prev) =>
                prev.map((u, i) =>
                  i === idx ? { ...u, status: val as User["status"] } : u
                )
              )
            }
          >
            <SelectTrigger
              className={`w-24 justify-center ${
                statusColor[user.status] || ""
              } rounded-full text-xs font-medium py-1`}
            >
              {user.status}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TableCell>
      <TableCell className="px-6 py-4 text-right text-gray-600">
        <div className="flex items-center justify-end gap-3">
          <button
            title="View"
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <Eye />
          </button>
          <button
            title="Edit"
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <Link to="/manager/update-account">
              <Edit2 />
            </Link>
          </button>
          <button
            title="Delete"
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <Trash2 />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default AccountItem;
