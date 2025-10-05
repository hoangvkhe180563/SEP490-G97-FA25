import { Outlet } from "react-router-dom";
import Header from "../AppHeader";
import Footer from "../AppFooter";

const StudentLayout = () => {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
};
export default StudentLayout;
