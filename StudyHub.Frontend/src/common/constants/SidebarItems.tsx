import {
  ArrowDownCircle,
  ArrowUpCircle,
  BookOpen,
  FileQuestion,
  LayoutDashboard,
  LibraryBig,
  MessageCircleQuestionMark,
  MessageSquare,
  NotebookPen,
  Receipt,
  School,
  ScrollText,
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
    link: "/recommend/student",
  },
  {
    icon: <Receipt size={20} />,
    text: "Giao dịch",
    link: "",
    children: [
      {
        icon: <ScrollText size={20} />,
        text: "Lịch sử giao dịch",
        link: "/payment/student/transactions",
      },
      {
        icon: <ArrowDownCircle size={20} />,
        text: "Nạp tiền",
        link: "/payment/student/wallet/topup",
      },
      {
        icon: <ArrowUpCircle size={20} />,
        text: "Rút tiền",
        link: "/payment/student/wallet/withdrawal",
      },
    ],
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
    text: "Quản lý Tài liệu",
    link: "/document/teacher/my-documents",
  },
  {
    icon: <BookOpen size={20} />,
    text: "Quản lý Khóa học",
    link: "/course/teacher/courses",
  },
  {
    icon: <Users size={20} />,
    text: "Quản lý Lớp học",
    link: "/class",
  },
  {
    icon: <MessageSquare size={20} />,
    text: "Forum",
    link: "/forum/forums",
  },
];

export const headOfDepartmentTeacherSidebarItems: ISidebarItem[] = [
  {
    icon: <NotebookPen size={20} />,
    text: "Thống kê khoá học",
    link: "/course/teacher/approved-courses",
  },
];

export const qAndATeacherSidebarItems: ISidebarItem[] = [
  {
    icon: <MessageCircleQuestionMark size={20} />,
    text: "Các câu hỏi từ học sinh",
    link: "/qa/teacher/conversations",
  },
];

export const documentManagerSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Quản lý tài liệu",
    link: "",
    children: [
      {
        icon: <ArrowUpCircle size={20} />,
        text: "Thống kê tài liệu",
        link: "/document/manager/dashboard",
      },
      {
        icon: <ArrowDownCircle size={20} />,
        text: "Quản lý tài liệu",
        link: "/document/manager/verify",
      },
    ],
  },
];

export const questionManagerSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Quản lý câu hỏi",
    link: "",
    children: [
      {
        icon: <FileQuestion size={20} />,
        text: "Ngân hàng câu hỏi",
        link: "/exam/manager/questions",
      },
    ],
  },
];

export const financialManagerSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Quản lý giao dịch",
    link: "",
    children: [
      {
        icon: <Receipt size={20} />,
        text: "Thống kê doanh thu",
        link: "/payment/financial/revenue",
      },
      {
        icon: <ScrollText size={20} />,
        text: "Lịch sử giao dịch",
        link: "/payment/financial/transaction",
      },
    ],
  },
];

export const uiManagerSidebarItems: ISidebarItem[] = [];

export const moderatorSidebarItems: ISidebarItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    text: "Quản lý Forum",
    link: "/forum/manager/dashboard",
    children: [
      {
        icon: <Users size={20} />,
        text: "Thống kê forum",
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
    ],
  },
];

export const schoolAdminSidebarItems: ISidebarItem[] = [
  {
    icon: <BookOpen size={20} />,
    text: "Quản lý người dùng",
    link: "",
    children: [
      {
        icon: <LayoutDashboard size={20} />,
        text: "Thống kê người dùng",
        link: "/user/manager",
      },
      {
        icon: <BookOpen size={20} />,
        text: "Quản lý người dùng",
        link: "/user/manager/accounts",
      },
      {
        icon: <Users size={20} />,
        text: "Quản lý khôi phục tài khoản",
        link: "/user/manager/account-recoveries",
      },
    ],
  },
  {
    icon: <School size={20} />,
    text: "Quản lý giao diện",
    link: "/ui/landing-pages",
  },
  {
    icon: <BookOpen size={20} />,
    text: "Quản lý lớp học",
    link: "",
    children: [
      {
        icon: <LayoutDashboard size={20} />,
        text: "Thống kê lớp học",
        link: "/class/manager",
      },
      {
        icon: <BookOpen size={20} />,
        text: "Quản lý lớp học",
        link: "/class/manager/classes",
      },
    ],
  },
  {
    icon: <Receipt size={20} />,
    text: "Quản lý đề xuất",
    link: "",
    children: [
      {
        icon: <LayoutDashboard size={20} />,
        text: "Thống kê đề xuất",
        link: "/recommend/manager",
      },
    ],
  },
];
