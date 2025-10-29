import { Outlet } from "react-router-dom";

const TeacherLayout = () => {
  return (
    <main className="w-full">
      <Outlet />
    </main>
  );
};
export default TeacherLayout;
