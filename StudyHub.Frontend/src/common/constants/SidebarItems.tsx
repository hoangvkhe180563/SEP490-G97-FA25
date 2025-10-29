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
    link: "/document/student/documents",
  },
  {
    icon: <BookOpen size={20} />,
    text: "Khóa học",
    link: "/courses",
  },
  {
    icon: <Users size={20} />,
    text: "Lớp học của tôi",
    link: "/classes",
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
