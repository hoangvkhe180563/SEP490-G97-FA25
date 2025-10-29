import {
  Sidebar,
  SidebarCollapsibleItem,
  SidebarItem,
} from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import type { IMainLayoutProps } from "../interfaces/IMainLayoutProps";
import Header from "../components/Header";

const MainLayout = (props: IMainLayoutProps) => {
  return (
    <div className="h-screen flex flex-col">
      <Header isLoggedIn={props.isLoggedIn} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar>
          {props.sidebarItems.map((sidebarItem, index) =>
            sidebarItem.children ? (
              <SidebarCollapsibleItem
                key={`item-${index}`}
                icon={sidebarItem.icon}
                text={sidebarItem.text}
                link={sidebarItem.link}
                children={sidebarItem.children}
              />
            ) : (
              <SidebarItem
                link={sidebarItem.link}
                key={`item-${index}`}
                icon={sidebarItem.icon}
                text={sidebarItem.text}
              />
            )
          )}
        </Sidebar>
        <main className="flex-1 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
