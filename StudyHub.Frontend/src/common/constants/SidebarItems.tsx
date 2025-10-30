import {
  BookOpen,
  FileQuestionMark,
  LayoutDashboard,
  LibraryBig,
  Users,
} from "lucide-react";
import type { ISidebarItem } from "../interfaces/IMainLayoutProps";

export const guestSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Trang chủ",
    link: "/",
  },
  {
    icon: <LibraryBig size={20} />,
    text: "Tài liệu",
    link: "",
    children: [
      {
        icon: <BookOpen size={20} />,
        text: "Sách giáo khoa",
        link: "/document/textbooks",
      },
      {
        icon: <FileQuestionMark size={20} />,
        text: "Sách tham khảo",
        link: "/document/references",
      },
    ],
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
];

export const uiManagerSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Trang chủ",
    link: "",
    children: [
      {
        icon: <LayoutDashboard size={20} />,
        text: "Giao diện",
        link: "/",
      },
      {
        icon: <Users size={20} />,
        text: "Tùy chỉnh giao diện",
        link: "/ui/landing-pages",
      },
    ],
  },
];

export const schoolStudentSidebarItems: ISidebarItem[] = [
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
];

export const externalStudentSidebarItems: ISidebarItem[] = [
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
];

export const headOfDepartmentSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Trang chủ",
    link: "/",
  },
  {
    icon: <BookOpen size={20} />,
    text: "Duyệt khoá học",
    link: "/courses",
  },
];

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

export const schoolManagerSidebarItems: ISidebarItem[] = [
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
