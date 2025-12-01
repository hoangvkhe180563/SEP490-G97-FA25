import {
  BookOpen,
  FileQuestion,
  LayoutDashboard,
  LibraryBig,
  MessageCircleQuestionMark,
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
    link: "/document/student/documents",
  },
  {
    icon: <BookOpen size={20} />,
    text: "Khóa học",
    link: "/course/student/courses",
  },
  {
    icon: <MessageCircleQuestionMark size={20} />,
    text: "Hỏi đáp",
    link: "/qa/student/conversations",
  },
  {
    icon: <MessageSquare size={20} />,
    text: "Đề xuất",
    link: "/recommend",
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
    link: "/forum/forums",
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
    link: "/document/teacher/my-documents",
  },
  {
    icon: <BookOpen size={20} />,
    text: "Khóa học",
    link: "/course/teacher/courses",
  },
  {
    icon: <Users size={20} />,
    text: "Lớp học của tôi",
    link: "/class",
  },
  {
    icon: <MessageSquare size={20} />,
    text: "Forum",
    link: "/forum/forums",
  },
  {
    icon: <MessageCircleQuestionMark size={20} />,
    text: "Các câu hỏi từ học sinh",
    link: "/qa/teacher/conversations",
  },
];

export const headOfDepartmentTeacherSidebarItems: ISidebarItem[] = [
  {
    icon: <NotebookPen size={20} />,
    text: "Duyệt khoá học",
    link: "/course/teacher/approve-courses",
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
    link: "/document/manager/verify",
  },
];

export const questionManagerSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Trang chủ",
    link: "/",
  },
  {
    icon: <FileQuestion size={20} />,
    text: "Ngân hàng câu hỏi",
    link: "/exam/manager/questions",
  },
];

export const financialManagerSidebarItems: ISidebarItem[] = [];

export const uiManagerSidebarItems: ISidebarItem[] = [];

export const moderatorSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Trang chủ",
    link: "/forum/manager/dashboard",
  },
  {
    icon: <BookOpen size={20} />,
    text: "Duyệt bài viết forum",
    link: "/forum/manager/posts",
  },
  {
    icon: <Users size={20} />,
    text: "Quản lý luật forum",
    link: "/forum/manager/rules",
  },
  {
    icon: <Users size={20} />,
    text: "Quản lý khiếu nại",
    link: "/forum/manager/appeals",
  },
  {
    icon: <Users size={20} />,
    text: "Quản lý vi phạm",
    link: "/forum/manager/violations",
  },
  {
    icon: <Users size={20} />,
    text: "Quản lý luật thẻ",
    link: "/forum/manager/flairs",
  },
  {
    icon: <Users size={20} />,
    text: "Quản lý tài khoản",
    link: "/forum/manager/accounts",
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
