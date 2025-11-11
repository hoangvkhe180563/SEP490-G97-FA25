import React, { createContext, useContext, useState } from "react";
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
import { Link, useLocation } from "react-router-dom";
import type { ISidebarItem } from "../interfaces/IMainLayoutProps";
import type { AppUser } from "@/auth/interfaces/app-user";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { axiosInstance } from "@/lib/axios";

interface ISidebarContextProps {
  expanded: boolean;
}
const SidebarContext = createContext<ISidebarContextProps>({ expanded: true });

export const Sidebar = (props: {
  children: React.ReactNode;
  user: AppUser;
}) => {
  const logout = async () => {
    await axiosInstance.post("/auth/logout").then((res) => {
      if (res.status === 200) {
        location.reload();
      } else {
        console.error("Lỗi không logout được!");
      }
    });
  };

  const [expanded, setExpanded] = useState<boolean>(true);

  return (
    <aside className="transition-all max-w-[250px] inline-flex flex-col border-r border-gray-300 shadow-lg bg-slate-200">
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
        <ul className="flex-1 px-3">{props.children}</ul>
      </SidebarContext.Provider>

      <div className="p-3 text-gray-500 border-t border-gray-300 flex items-center justify-center">
        <Avatar className="size-8">
          <AvatarImage src="" alt="User Avatar" />
          <AvatarFallback>
            {props.user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {expanded ? (
          <div className="flex-1 flex items-center ml-3">
            <div className="w-32 transition-opacity duration-150">
              <p className="font-medium">{props.user.fullname}</p>
              <p className="text-sm text-gray-600 line-clamp-1">
                {props.user.email}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`hover:bg-sky-400 hover:text-white w-10 ml-3`}
                >
                  <EllipsisVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-50 ml-3">
                <DropdownMenuItem>
                  <CircleUser className="mr-2 h-4 w-4" /> Thông tin cá nhân
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4 stroke-red-600" />{" "}
                  <span className="w-full hover:text-red-600">Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>
    </aside>
  );
};

export const SidebarItem = (props: ISidebarItem) => {
  const { expanded } = useContext(SidebarContext);
  const location = useLocation();
  const currentUrl = location.pathname;

  return (
    <li>
      <Link
        to={props.link}
        className={`relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors leading-4 group
      ${
        currentUrl === props.link
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
  const currentUrl = location.pathname;

  const handleToggle = (e: any) => {
    e.stopPropagation();
    setIsOpen((curr) => !curr);
  };

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
        currentUrl === child.link
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
