import type { JSX } from "react";

export interface IMainLayoutProps {
  sidebarItems: ISidebarItem[];
  isLoggedIn: boolean;
}

export interface ISidebarItem {
  link: string;
  icon: JSX.Element;
  text: string;
  children?: ISidebarItem[];
}
