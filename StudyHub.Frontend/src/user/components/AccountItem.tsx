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
import { Edit2 } from "lucide-react";
import type { AccountItemProps as Props } from "@/user/interfaces/props";
import type { AppUser } from "@/user/interfaces/app-user";
import { useAppUserStore } from "@/user/stores/useAppUserStore";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/common/components/ui/tooltip";
import { createFallBack } from "../utils/avatarUtils";
import { formatDate } from "../utils/dateUtils";
import toast from "react-hot-toast";

const AccountItem: React.FC<Props> = ({ user, idx, setUsers, statusColor }) => {
  const { updateUserStatus } = useAppUserStore();

  return (
    <TableRow>
      <TableCell className="px-6 py-4">
        <div className="flex items-center gap-4">
          <Avatar className="border-2 border-zinc-200">
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{createFallBack(user.fullname)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{user.fullname}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-6 py-4 text-center">
        {!user || !user.roles || user.roles.length === 0 ? (
          <span className="text-gray-700 bg-gray-200 rounded-full px-2.5 py-1 text-sm">
            Không có
          </span>
        ) : user.roles.length === 1 ? (
          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-sm font-medium">
            {user.roles[0]}
          </span>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center gap-2 cursor-pointer">
                  <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-sm font-medium">
                    {user.roles[0]}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-2.5 py-1 text-xs font-medium">
                    +{user.roles.length - 1}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="flex flex-col gap-1.5">
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-medium"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>
      <TableCell className="px-6 py-4 text-gray-600 text-center">
        {formatDate(user.createdAt)}
      </TableCell>
      <TableCell className="px-6 py-4">
        <div className="flex items-center justify-center gap-3">
          <Select
            value={user.status}
            onValueChange={async (val) => {
              const prevStatus = user.status;
              // optimistic update
              setUsers((prev) =>
                prev.map((u, i) =>
                  i === idx ? { ...u, status: val as AppUser["status"] } : u
                )
              );

              // persist to server
              try {
                const ok = await updateUserStatus(
                  user.id,
                  val as AppUser["status"],
                  (message?: string) => {
                    toast.success(message || "Cập nhật trạng thái thành công");
                  },
                  (message?: string) => {
                    toast.error(message || "Cập nhật trạng thái thất bại");
                  }
                );
                if (!ok) {
                  // revert on failure
                  setUsers((prev) =>
                    prev.map((u, i) =>
                      i === idx ? { ...u, status: prevStatus } : u
                    )
                  );
                }
              } catch (err) {
                // revert on error
                setUsers((prev) =>
                  prev.map((u, i) =>
                    i === idx ? { ...u, status: prevStatus } : u
                  )
                );
              }
            }}
          >
            <SelectTrigger
              className={`w-24 justify-center ${
                statusColor[user.status] || ""
              } rounded-full text-xs font-medium py-1 cursor-pointer transition-all focus:ring-2`}
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
        <div className="flex items-center justify-center gap-3">
          <button
            title="Edit"
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <Link to={`/user/manager/update-account/${user.id}`}>
              <Edit2 />
            </Link>
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default AccountItem;
