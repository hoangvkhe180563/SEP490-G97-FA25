import {
  ArrowDownCircle,
  ArrowUpCircle,
  BookOpen,
  Contact,
  Eye,
  FileQuestion,
  Home,
  LayoutDashboard,
  LibraryBig,
  Lightbulb,
  MessageCircleQuestionMark,
  MessageSquare,
  NotebookPen,
  Receipt,
  ScrollText,
  Settings,
  UserCog,
  Users,
} from "lucide-react";
import type { ISidebarItem } from "../interfaces/IMainLayoutProps";

export const externalStudentSidebarItems: ISidebarItem[] = [
  {
    icon: <Home size={20} />,
    text: "Trang chủ",
    link: "/ui/landing",
  },
  {
    icon: <LibraryBig size={20} />,
    text: "Tài liệu",
    link: "/document/documents",
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
    icon: <Home size={20} />,
    text: "Trang chủ",
    link: "/ui/school-landing",
  },
  {
    icon: <LibraryBig size={20} />,
    text: "Tài liệu",
    link: "/document/documents",
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
    icon: <Home size={20} />,
    text: "Trang chủ",
    link: "/ui/school-landing",
  },
  {
    icon: <LibraryBig size={20} />,
    text: "Quản lý Tài liệu",
    link: "/document/teacher/my-documents",
    children: [
      {
        icon: <ScrollText size={20} />,
        text: "Xem tài liệu của tôi",
        link: "/document/teacher/my-documents",
      },
      {
        icon: <ScrollText size={20} />,
        text: "Xem tài liệu trường tôi",
        link: "/document/teacher/documents",
      },
    ],
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
    text: "Dashboard",
    link: "/exam/manager/dashboard",
  },
  {
    icon: <FileQuestion size={20} />,
    text: "Quản lý câu hỏi",
    link: "/exam/manager/questions",
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

export const uiManagerSidebarItems: ISidebarItem[] = [
  {
    icon: <Home size={20} />,
    text: "Trang chủ",
    link: "",
    children: [
      {
        icon: <Eye size={20} />,
        text: "Xem trang chủ",
        link: "/ui/school-landing",
      },
      {
        icon: <Settings size={20} />,
        text: "Cấu hình trang chủ",
        link: "/ui/school-landing/edit",
      },
    ],
  },
];

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
    icon: <Home size={20} />,
    text: "Quản lý trang chủ",
    link: "",
    children: [
      {
        icon: <LayoutDashboard size={20} />,
        text: "Xem trang chủ",
        link: "/ui/school-landing",
      },
      {
        icon: <Settings size={20} />,
        text: "Sửa trang chủ",
        link: "/ui/school-landing/edit",
      },
    ],
  },
  {
    icon: <UserCog size={20} />,
    text: "Quản lý người dùng",
    link: "",
    children: [
      {
        icon: <LayoutDashboard size={20} />,
        text: "Thống kê người dùng",
        link: "/user/manager",
      },
      {
        icon: <Users size={20} />,
        text: "Quản lý người dùng",
        link: "/user/manager/accounts",
      },
      {
        icon: <Contact size={20} />,
        text: "Quản lý khôi phục tài khoản",
        link: "/user/manager/account-recoveries",
      },
    ],
  },
  {
    icon: <Receipt size={20} />,
    text: "Quản lý giao dịch",
    link: "",
    children: [
      {
        icon: <LayoutDashboard size={20} />,
        text: "Thống kê giao dịch",
        link: "/payment/financial/revenue",
      },
    ],
  },
  {
    icon: <BookOpen size={20} />,
    text: "Quản lý lớp học",
    link: "",
    children: [
      {
        icon: <LayoutDashboard size={20} />,
        text: "Thống kê lớp học",
        link: "/class/manager/dashboard-classes",
      },
      {
        icon: <BookOpen size={20} />,
        text: "Quản lí lớp học",
        link: "/class/manager/management-classes",
      }
    ],
  },
  {
    icon: <FileQuestion size={20} />,
    text: "Quản lý câu hỏi",
    link: "",
    children: [
      {
        icon: <LayoutDashboard size={20} />,
        text: "Dashboard",
        link: "/exam/manager/dashboard",
      },
      {
        icon: <FileQuestion size={20} />,
        text: "Danh sách câu hỏi",
        link: "/exam/manager/questions",
      },
    ],
  },
  {
    icon: <Lightbulb size={20} />,
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
  {
    icon: <MessageCircleQuestionMark size={20} />,
    text: "Quản lý hỏi đáp",
    link: "",
    children: [
      {
        icon: <LayoutDashboard size={20} />,
        text: "Thống kê hỏi đáp",
        link: "/qa/manager",
      },
      {
        icon: <MessageSquare size={20} />,
        text: "Quản lý chủ đề hỏi đáp",
        link: "/qa/manager/topics",
      },
    ],
  },
];
