import {
  BookOpen,
  FilePen,
  LayoutDashboard,
  LibraryBig,
  MessageSquare,
  NotebookPen,
  Users,
} from "lucide-react";
import type { ISidebarItem } from "../interfaces/IMainLayoutProps";

export const studentSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Trang chủ",
    link: "/",
  },
  {
    icon: <LibraryBig size={20} />,
    text: "Tài liệu",
    link: "/document/textbooks",
  },
  {
    icon: <BookOpen size={20} />,
    text: "Khóa học",
    link: "/courses",
  },
];

export const schoolStudentSidebarItems: ISidebarItem[] = [
  {
    icon: <Users size={20} />,
    text: "Lớp học của tôi",
    link: "/class",
  },
  {
    icon: <MessageSquare size={20} />,
    text: "Forum",
    link: "/forum",
  },
];

export const teacherSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Trang chủ",
    link: "/",
  },
  {
    icon: <LibraryBig size={20} />,
    text: "Tài liệu",
    link: "/document/textbooks",
  },
  {
    icon: <BookOpen size={20} />,
    text: "Khóa học",
    link: "/courses",
  },
  {
    icon: <Users size={20} />,
    text: "Lớp học của tôi",
    link: "/class",
  },
  {
    icon: <MessageSquare size={20} />,
    text: "Forum",
    link: "/forum",
  },
];

export const headOfDepartmentTeacherSidebarItems: ISidebarItem[] = [
  {
    icon: <NotebookPen size={20} />,
    text: "Duyệt khoá học",
    link: "/",
  },
];

export const qAndATeacherSidebarItems: ISidebarItem[] = [];

export const documentManagerSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Trang chủ",
    link: "/",
  },
  {
    icon: <LibraryBig size={20} />,
    text: "Quản lý tài liệu",
    link: "/documents",
  },
];

export const questionManagerSidebarItems: ISidebarItem[] = [
  {
    icon: <FilePen size={20} />,
    text: "Quản lý bài kiểm tra",
    link: "/",
  },
];

export const financialManagerSidebarItems: ISidebarItem[] = [];

export const uiManagerSidebarItems: ISidebarItem[] = [];

export const moderatorSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Trang chủ",
    link: "/",
  },
  {
    icon: <BookOpen size={20} />,
    text: "Duyệt bài viết forum",
    link: "/courses",
  },
  {
    icon: <Users size={20} />,
    text: "Quản lý luật forum",
    link: "/classes",
  },
];

export const schoolAdminSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Trang chủ",
    link: "/user/manager",
  },
  {
    icon: <BookOpen size={20} />,
    text: "Quản lý người dùng",
    link: "/user/manager/accounts",
  },
];
