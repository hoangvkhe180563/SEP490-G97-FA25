import {
  BookOpen,
  FileQuestionMark,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  Play,
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
        link: "/ui/landing-page",
      },
    ],
  },
];

export const TeacherSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Bảng điều khiển",
    link: "/course/teacher",
  },
  {
    icon: <BookOpen size={20} />,
    text: "Nội dung giảng dạy",
    link: "",
    children: [
      {
        icon: <BookOpen size={20} />,
        text: "Khóa học",
        link: "/course/teacher/courses",
      },
      {
        icon: <Play size={20} />,
        text: "Bài học",
        link: "/course/teacher/lessons",
      },
      {
        icon: <FileText size={20} />,
        text: "Bài tập",
        link: "/course/teacher/assignments",
      },
    ],
  },
  {
    icon: <Users size={20} />,
    text: "Người dùng",
    link: "",
    children: [
      {
        icon: <Users size={20} />,
        text: "Học viên",
        link: "/course/teacher/students",
      },
      {
        icon: <GraduationCap size={20} />,
        text: "Giảng viên",
        link: "/course/teacher/instructors",
      },
    ],
  },
];
