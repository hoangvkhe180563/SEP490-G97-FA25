import { Outlet } from "react-router-dom";
import { AppSidebar } from "../AppSidebar";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/common/components/ui/sidebar";
import Header from "../AppHeader";

const ManagerLayout = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarTrigger />
      <main className="w-full">
        <Header />
        <Outlet />
      </main>
    </SidebarProvider>
  );
};
export default ManagerLayout;
