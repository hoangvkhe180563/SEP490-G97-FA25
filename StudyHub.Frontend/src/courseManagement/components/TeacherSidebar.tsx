import {
  BookOpen,
  FileText,
  LayoutDashboard,
  Play,
  Settings,
  BarChart3,
  Users,
  GraduationCap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/common/components/ui/sidebar";

type Props = {
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
};

export default function TeacherSidebar({
  className,
  isMobileOpen = false,
  onMobileClose,
}: Props) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      section: "Main",
      items: [
        {
          icon: LayoutDashboard,
          label: "Bảng điều khiển",
          path: "/course/teacher",
        },
      ],
    },
    {
      section: "Content",
      items: [
        { icon: BookOpen, label: "Khóa học", path: "/course/teacher/courses" },
        { icon: Play, label: "Bài học", path: "/course/teacher/lessons" },
        {
          icon: FileText,
          label: "Bài tập",
          path: "/course/teacher/assignments",
        },
      ],
    },
    {
      section: "Users",
      items: [
        { icon: Users, label: "Học viên", path: "/course/teacher/students" },
        {
          icon: GraduationCap,
          label: "Giảng viên",
          path: "/course/teacher/instructors",
        },
      ],
    },
    {
      section: "Settings",
      items: [
        { icon: Settings, label: "Hệ thống", path: "/course/settings" },
        { icon: BarChart3, label: "Phân tích", path: "/course/analytics" },
      ],
    },
  ];

  // Additional route patterns for menu items that don't live under the
  // exact item.path. Use this to mark the parent menu active for related
  // routes like /teacher/add-course, /teacher/edit-course, /teacher/lecture, etc.
  const extraRoutePatterns: Record<string, RegExp> = {
    "/teacher/courses":
      /^\/teacher\/(?:courses|add-course|edit-course|course)(?:\/|$)/,
    "/teacher/lessons":
      /^\/teacher\/(?:lessons|add-lecture|edit-lecture|lecture)(?:\/|$)/,
    "/teacher/assignments":
      /^\/teacher\/(?:assignments|add-assignment|edit-assignment)(?:\/|$)/,
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <div
        className={cn(
          "w-64 fixed lg:sticky lg:top-0 z-50 h-screen transition-transform duration-300 bg-[#FAFAFA] border-r border-[#E5E5E5]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        <Sidebar>
          <SidebarContent>
            <div className="h-[81px] border-b border-[#E5E5E5] flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#525252] rounded flex items-center justify-center">
                  <svg
                    width="18"
                    height="14"
                    viewBox="0 0 18 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8.99999 0.875C8.77851 0.875 8.55976 0.913281 8.35195 0.987109L0.682025 3.75703C0.422259 3.85273 0.249994 4.09883 0.249994 4.375C0.249994 4.65117 0.422259 4.89727 0.682025 4.99297L2.26523 5.56445C1.81679 6.26992 1.56249 7.10391 1.56249 7.98164V8.75C1.56249 9.52656 1.26718 10.3277 0.952728 10.9594C0.774994 11.3148 0.57265 11.6648 0.337494 11.9875C0.249994 12.1051 0.225384 12.2582 0.274603 12.3977C0.323822 12.5371 0.438666 12.641 0.580853 12.6766L2.33085 13.1141C2.4457 13.1441 2.56874 13.1223 2.66992 13.0594C2.77109 12.9965 2.84218 12.8926 2.86406 12.775C3.09921 11.6047 2.98163 10.5547 2.80663 9.80273C2.71913 9.41445 2.60156 9.01797 2.43749 8.6543V7.98164C2.43749 7.15586 2.7164 6.37656 3.20038 5.75312C3.55312 5.3293 4.00976 4.9875 4.5457 4.77695L8.83867 3.08984C9.06288 3.00234 9.31718 3.11172 9.40468 3.33594C9.49218 3.56016 9.3828 3.81445 9.15859 3.90195L4.86562 5.58906C4.52656 5.72305 4.22851 5.92812 3.98515 6.17969L8.34921 7.75469C8.55702 7.82852 8.77577 7.8668 8.99726 7.8668C9.21874 7.8668 9.43749 7.82852 9.64531 7.75469L17.318 4.99297C17.5777 4.9 17.75 4.65117 17.75 4.375C17.75 4.09883 17.5777 3.85273 17.318 3.75703L9.64804 0.987109C9.44023 0.913281 9.22148 0.875 8.99999 0.875ZM3.74999 11.1562C3.74999 12.1215 6.10156 13.125 8.99999 13.125C11.8984 13.125 14.25 12.1215 14.25 11.1562L13.8316 7.18047L9.94335 8.58594C9.63984 8.69531 9.31991 8.75 8.99999 8.75C8.68007 8.75 8.35741 8.69531 8.05663 8.58594L4.16835 7.18047L3.74999 11.1562Z"
                      fill="white"
                    />
                  </svg>
                </div>
                <span className="text-lg text-[#171717] font-normal">
                  StudyHub
                </span>
              </div>
              <button
                onClick={onMobileClose}
                className="lg:hidden p-2 hover:bg-gray-200 rounded-md"
              >
                <X className="w-5 h-5 text-[#404040]" />
              </button>
            </div>

            {menuItems.map((section) => (
              <SidebarGroup key={section.section}>
                <SidebarGroupLabel>
                  {section.section.toUpperCase()}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const pathname = location.pathname;
                      const baseActive = pathname === item.path;
                      const pattern = extraRoutePatterns[item.path];
                      const isActive =
                        baseActive ||
                        (pattern ? pattern.test(pathname) : false);
                      return (
                        <SidebarMenuItem key={item.label}>
                          <SidebarMenuButton asChild>
                            <button
                              onClick={() => {
                                navigate(item.path);
                                onMobileClose?.();
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-normal transition-colors",
                                isActive
                                  ? "bg-[#171717] text-white"
                                  : "text-[#404040] hover:bg-[#F5F5F5]"
                              )}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>
      </div>
    </>
  );
}
