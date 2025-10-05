// import { Button } from "@/common/components/ui/button";
import { Route, Routes } from "react-router-dom";
import AccountList from "../ui/pages/manager/AccountList";
import CreateAccount from "../ui/pages/manager/CreateAccount";
import TeacherLayout from "@/ui/components/layouts/TeacherLayout";
import UpdateAccount from "@/ui/pages/manager/UpdateAccount";
import StudentLayout from "@/ui/components/layouts/StudentLayout";
import StudentProfile from "@/ui/pages/student/StudentProfile";
import ManagerLayout from "@/ui/components/layouts/ManagerLayout";
import ParentLayout from "@/ui/components/layouts/ParentLayout";
import ManagerProfile from "@/ui/pages/manager/ManagerProfile";
import TeacherProfile from "@/ui/pages/teacher/TeacherProfile";
import ParentProfile from "@/ui/pages/parent/ParentProfile";
import ClassList from "@/ui/pages/ClassList";
import DetailedClassStudent from "@/ui/pages/student/DetailedClassStudent";
import DetailedClassTeacher from "@/ui/pages/teacher/DetailedClassTeacher";

function App() {
  return (
    <Routes>
      <Route element={<TeacherLayout />} path="/teacher">
        <Route index element={<div>Dashboard</div>} />
        <Route path="profile" element={<TeacherProfile />} />
        <Route path="classes" element={<ClassList />} />
        <Route path="classes/:id" element={<DetailedClassTeacher />} />
      </Route>
      <Route element={<ManagerLayout />} path="/manager">
        <Route index element={<div>Dashboard</div>} />
        <Route path="accounts" element={<AccountList />} />
        <Route path="add-account" element={<CreateAccount />} />
        <Route path="update-account" element={<UpdateAccount />} />
        <Route path="profile" element={<ManagerProfile />} />
      </Route>
      <Route element={<StudentLayout />} path="/">
        <Route path="profile" element={<StudentProfile />} />
        <Route path="classes" element={<ClassList />} />
         <Route path="classes/:id" element={<DetailedClassStudent />} />
        
      </Route>
      <Route element={<ParentLayout />} path="/parent">
        <Route path="profile" element={<ParentProfile />} />
      </Route>
    </Routes>
  );
}

export default App;
