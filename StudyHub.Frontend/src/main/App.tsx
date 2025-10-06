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
import AddCourse from "@/ui/pages/teacher/AddCourse";
import EditCourse from "@/ui/pages/teacher/EditCourse";
import AddLecture from "@/ui/pages/teacher/AddLecture";
import ParentProfile from "@/ui/pages/parent/ParentProfile";
import CourseListTeacher from "@/ui/pages/teacher/CourseList";
import CourseListStudent from "@/ui/pages/student/CourseList";
import CourseDetailTeacher from "@/ui/pages/teacher/CourseDetail";
import CourseDetailStudent from "@/ui/pages/student/CourseDetail";
import LecturePlayer from "@/ui/pages/student/LecturePlayer";
import EditLecture from "@/ui/pages/teacher/EditLecture";
import LectureDetails from "@/ui/pages/teacher/LectureDetails";

function App() {
  return (
    <Routes>
      <Route element={<TeacherLayout />} path="/teacher">
        <Route index element={<div>Dashboard</div>} />
        <Route path="courses" element={<CourseListTeacher />} />
        <Route path="courses/:id" element={<CourseDetailTeacher />} />
        <Route path="add-course" element={<AddCourse />} />
        <Route path="edit-course" element={<EditCourse />} />
        <Route path="add-lecture" element={<AddLecture />} />
        <Route path="edit-lecture" element={<EditLecture />} />
        <Route path="lecture/:id" element={<LectureDetails />} />
        <Route path="profile" element={<TeacherProfile />} />
      </Route>
      <Route element={<ManagerLayout />} path="/manager">
        <Route index element={<div>Dashboard</div>} />
        <Route path="accounts" element={<AccountList />} />
        <Route path="add-account" element={<CreateAccount />} />
        <Route path="update-account" element={<UpdateAccount />} />
        <Route path="profile" element={<ManagerProfile />} />
      </Route>
      <Route element={<StudentLayout />} path="/">
        <Route path="courses" element={<CourseListStudent />} />
        <Route path="courses/:id" element={<CourseDetailStudent />} />
        <Route
          path="courses/:courseId/lecture/:lectureId"
          element={<LecturePlayer />}
        />
        <Route path="profile" element={<StudentProfile />} />
      </Route>
      <Route element={<ParentLayout />} path="/parent">
        <Route path="profile" element={<ParentProfile />} />
      </Route>
    </Routes>
  );
}

export default App;
