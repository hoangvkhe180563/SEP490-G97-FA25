import {
  Sidebar,
  SidebarCollapsibleItem,
  SidebarItem,
} from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import type { AppUser } from "@/auth/interfaces/app-user";
import { useEffect, useState } from "react";
import { studentSidebarItems, schoolStudentSidebarItems, teacherSidebarItems, headOfDepartmentTeacherSidebarItems as headTeacherSidebarItems, qAndATeacherSidebarItems, documentManagerSidebarItems, financialManagerSidebarItems, uiManagerSidebarItems, questionManagerSidebarItems, moderatorSidebarItems, schoolAdminSidebarItems } from "../constants/SidebarItems";
import { ROLES } from "../constants/Roles";
import type { ISidebarItem } from "../interfaces/IMainLayoutProps";

interface IRegisteredLayoutProps {
  user: AppUser | null
}

const RegisteredLayout = (props: IRegisteredLayoutProps) => {
  const [sidebarItems, setSidebarItems] = useState<ISidebarItem[]>([]);

  useEffect(() => {
    if (!props.user || props.user.roles.length === 0) {
      return;
    }

    const allSidebarItems = [];

    if (props.user.roles.some(role => role.includes("Student"))) {
      allSidebarItems.push(...studentSidebarItems);
    } else if (props.user.roles.some(role => role.includes("Teacher"))) {
      allSidebarItems.push(...teacherSidebarItems);
    }

    props.user.roles.forEach(role => {
      if (role === ROLES.SCHOOL_STUDENT) {
        allSidebarItems.push(...schoolStudentSidebarItems);
      }
      if (role === ROLES.HEAD_TEACHER) {
        allSidebarItems.push(...headTeacherSidebarItems);
      }
      if (role === ROLES.QNA_TEACHER) {
        allSidebarItems.push(...qAndATeacherSidebarItems);
      }
      if (role === ROLES.DOCUMENT_MANAGER) {
        allSidebarItems.push(...documentManagerSidebarItems);
      }
      if (role === ROLES.FINANCIAL_MANAGER) {
        allSidebarItems.push(...financialManagerSidebarItems);
      }
      if (role === ROLES.UI_MANAGER) {
        allSidebarItems.push(...uiManagerSidebarItems);
      }
      if (role === ROLES.QUESTION_MANAGER) {
        allSidebarItems.push(...questionManagerSidebarItems)
      }
      if (role === ROLES.MODERATOR) {
        allSidebarItems.push(...moderatorSidebarItems);
      }
      if (role === ROLES.SCHOOL_ADMIN) {
        allSidebarItems.push(...schoolAdminSidebarItems);
      }
    });

    setSidebarItems(allSidebarItems);
  }, [props.user])

  return (
    <div className="h-screen flex">
      {
        sidebarItems.length > 0 && props.user && (
          <Sidebar user={props.user}>
            {sidebarItems.map((sidebarItem, index) =>
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
        )
      }
      <main className="flex-1 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default RegisteredLayout;