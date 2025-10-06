import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/common/components/ui/sidebar";
import TeacherHeader from "../../../courseManagement/components/TeacherHeader";
import TeacherSidebar from "../../../courseManagement/components/TeacherSidebar";

const TeacherLayout = () => {
  return (
    <SidebarProvider>
      <TeacherSidebar />
      <main className="w-full">
        <TeacherHeader />
        <Outlet />
      </main>
    </SidebarProvider>
  );
};
export default TeacherLayout;
