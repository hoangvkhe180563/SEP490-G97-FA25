import { Outlet } from "react-router-dom";
import Header from "../components/Header";

const GuestLayout = () => {
  return (
    <div className="relative">
      <Header />
      <Outlet />
    </div>
  );
};

export default GuestLayout;
