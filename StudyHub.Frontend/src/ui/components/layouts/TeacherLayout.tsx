import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/common/components/ui/sidebar";
import TeacherHeader from "../TeacherHeader";
import TeacherSidebar from "../TeacherSidebar";

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
