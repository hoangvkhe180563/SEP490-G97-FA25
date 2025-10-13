import { Outlet } from "react-router-dom";
import Header from "../AppHeader";
import Footer from "../AppFooter";

const ParentLayout = () => {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
};
export default ParentLayout;
