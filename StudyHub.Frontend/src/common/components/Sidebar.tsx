import React, { createContext, useContext, useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  ChevronFirst,
  ChevronDown,
  ChevronRight,
  Menu,
  EllipsisVertical,
  LogOut,
  CircleUser,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { ISidebarItem } from "../interfaces/IMainLayoutProps";
import type { AppUser } from "@/auth/interfaces/app-user";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MessageSquare } from "lucide-react";
import { CreateAppealModal } from "@/forumManagement/components/CreateAppealModal";
import { useAppealStore } from "@/forumManagement/stores/useAppealStore";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axios";
import { Skeleton } from "./ui/skeleton";
import { useAuthStore } from "@/auth/stores/useAuthStore";
// Use notification store from notification feature
import { useNotificationStore } from "@/notification/stores/useNotificationStore";
import RouteConfig from "../constants/RouteConfig";

interface ISidebarContextProps {
  expanded: boolean;
}
const SidebarContext = createContext<ISidebarContextProps>({ expanded: true });

export const Sidebar = (props: {
  children: React.ReactNode;
  user: AppUser;
}) => {
  const [showAppealModal, setShowAppealModal] = useState(false);
  const { createAppeal, isLoading } = useAppealStore();
  const { isCheckingAuth } = useAuthStore();
  const { fetchUnreadCount } = useNotificationStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (!props.user?.id) return;
    fetchUnreadCount().catch(console.warn);
  }, [props.user?.id, fetchUnreadCount]);
  const logout = async () => {
    await axiosInstance.post("/auth/logout").then((res) => {
      if (res.status === 200) {
        location.href = "/";
      } else {
        console.error("Lỗi không logout được!");
      }
    });
  };
  const handleCreateAppeal = async (reason: string) => {
    if (!props.user.schoolId) {
      toast.error("Không tìm thấy thông tin trường học");
      return;
    }

    const result = await createAppeal(props.user.schoolId, reason);
    if (result?.success) {
      toast.success(
        result?.message ||
          "Đã tạo kháng cáo thành công. Vui lòng đợi moderator xem xét."
      );
    } else {
      toast.error(
        result?.message || "Không thể tạo kháng cáo. Vui lòng thử lại."
      );
    }

    return result;
  };
  const [expanded, setExpanded] = useState<boolean>(true);

  if (isCheckingAuth) {
    return (
      <aside className="transition-all inline-flex flex-col border-r border-gray-300 shadow-lg bg-slate-200 p-4 w-64">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        <ul className="flex-1 px-1 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-4 w-11/12 rounded-md" />
            </li>
          ))}
        </ul>

        <div className="mt-4 pt-4 border-t border-gray-300 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      <aside className="transition-all inline-flex flex-col border-r border-gray-300 shadow-lg bg-slate-200">
        <div className="p-4 pb-2 flex justify-between items-center">
          <p
            className={`overflow-hidden transition-all text-center font-bold text-lg ${
              expanded ? "flex-1 w-32" : "w-0"
            }`}
          >
            Danh mục
          </p>
          <Button
            className="cursor-pointer"
            onClick={() => setExpanded((curr) => !curr)}
            variant="secondary"
            size="icon"
          >
            {expanded ? (
              <ChevronFirst className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </Button>
        </div>

        <SidebarContext.Provider value={{ expanded }}>
          <ul className="flex-1 overflow-y-auto px-3 scrollbar-hide">{props.children}</ul>
        </SidebarContext.Provider>

        <div className="p-2 text-gray-500 border-t border-gray-300 flex items-center justify-center">
          <Avatar className="size-8">
            <AvatarImage src={props.user.avatar} alt="User Avatar" />
            <AvatarFallback>
              {props.user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div
            className={`flex items-center transition-all overflow-hidden ${
              expanded ? "ml-3 flex-1" : "w-0"
            }`}
          >
            <div className="w-40">
              <p className="font-medium truncate">{props.user.fullname}</p>
              <p className="text-sm text-gray-600 truncate">
                {props.user.email}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`hover:bg-sky-400 hover:text-white overflow-hidden ${
                    expanded ? "ml-2 w-10" : "w-0"
                  }`}
                >
                  <EllipsisVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-50 ml-3">
                <DropdownMenuItem onClick={() => navigate("/user/profile")}>
                  <CircleUser className="mr-2 h-4 w-4" /> Thông tin cá nhân
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAppealModal(true)}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Tạo kháng cáo
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4 stroke-red-600" />{" "}
                  <span className="w-full hover:text-red-600">Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
      <CreateAppealModal
        isOpen={showAppealModal}
        onClose={() => setShowAppealModal(false)}
        onSubmit={handleCreateAppeal}
        isLoading={isLoading}
      />
    </>
  );
};

export const SidebarItem = (props: ISidebarItem) => {
  const { expanded } = useContext(SidebarContext);
  const location = useLocation();

  // get unread count directly from notification store
  const unreadCountRaw = useNotificationStore((s) => s.unreadCount);
  const unreadCount = Number(unreadCountRaw ?? 0);
  const displayCount = unreadCount > 99 ? "99+" : String(unreadCount);
  const isNotifications = (props.text ?? "").toString().trim().toLowerCase() === "thông báo";

  return (
    <li>
      <Link
        to={props.link}
        className={`relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors leading-4 group
      ${
        props.children === undefined && location.pathname.startsWith(props.link)
          ? "bg-gradient-to-tr from-sky-500 to-sky-200 text-blue-800"
          : "hover:bg-sky-200 text-gray-600"
      }
    `}
      >
        {props.icon}
        <span
          className={`whitespace-nowrap overflow-hidden transition-all leading-7 ${
            expanded ? "w-40 ml-3" : "w-0"
          }`}
        >
          {props.text}
        </span>

        {/* Badge shown absolutely so it's visible even when collapsed */}
        {isNotifications && unreadCount > 0 && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
            {displayCount}
          </span>
        )}

        {!expanded && (
          <div
            className={`absolute left-full rounded-md px-2 py-1 ml-6 text-sm bg-sky-200 text-gray-600 invisible -translate-x-3 transition-all opacity-20 whitespace-nowrap group-hover:visible group-hover:opacity-100 group-hover:translate-x-0`}
          >
            {props.text}
          </div>
        )}
      </Link>
    </li>
  );
};

export const SidebarCollapsibleItem = (props: ISidebarItem) => {
  const { expanded } = useContext(SidebarContext);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const handleToggle = (e: any) => {
    e.stopPropagation();
    setIsOpen((curr) => !curr);
  };


  const unreadCountRaw = useNotificationStore((s) => s.unreadCount);

  

  const unreadCount = Number(unreadCountRaw ?? 0);
  const displayCount = unreadCount > 99 ? "99+" : String(unreadCount);
  const isNotifications = props.link === RouteConfig.NOTIFICATION

  return (
    <div>
      <li
        className={`relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors leading-4 group hover:bg-sky-200 text-gray-600`}
        onClick={handleToggle}
      >
        {props.icon}
        <span
          className={`whitespace-nowrap overflow-hidden transition-all leading-7 ${
            expanded ? "w-40 ml-3" : "w-0"
          }`}
        >
          {props.text}
        </span> 

        {/* badge absolute so visible when collapsed */}
        {isNotifications && unreadCount > 0 && (
          <span className="absolute left-6 top-2 -translate-x-1/2 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {displayCount}
          </span>

        )}

        {expanded && (
          <span className="ml-auto transition-transform">
            {isOpen ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </span>
        )}

        {!expanded && (
          <div
            className={`absolute left-full rounded-md px-2 py-1 ml-6 text-sm bg-sky-200 text-gray-600 invisible -translate-x-3 transition-all opacity-20 whitespace-nowrap group-hover:visible group-hover:opacity-100 group-hover:translate-x-0`}
          >
            {props.text}
          </div>
        )}
      </li>
      <ul
        className={`transition-all duration-300 ${
          isOpen && expanded
            ? "max-h-96 opacity-100 w-full"
            : "max-h-0 opacity-0 w-0"
        }`}
      >
        {props.children &&
          props.children.map((child, index) => (
            <li key={`nav-${index}`}>
              <Link
                to={child.link}
                className={`relative flex items-center py-2 px-3 my-1 ml-3 font-medium rounded-md cursor-pointer transition-colors leading-4 group text-sm
                  ${
                    location.pathname === child.link
                      ? "bg-gradient-to-tr from-sky-400 to-sky-100 text-blue-800"
                      : "hover:bg-sky-100 text-gray-600"
                  }
                `}
              >
                {child.icon}
                <span
                  className={`transition-all ${expanded ? "w-36 ml-3" : "w-0"}`}
                >
                  {child.text}
                </span>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
};