import CourseListTeacher from "@/courseManagement/pages/teacher/CourseList";
import CourseDetailTeacher from "@/courseManagement/pages/teacher/CourseDetail";
import AddCourse from "@/courseManagement/pages/teacher/AddCourse";
import EditCourse from "@/courseManagement/pages/teacher/EditCourse";
import AddLecture from "@/courseManagement/pages/teacher/AddLecture";
import EditLecture from "@/courseManagement/pages/teacher/EditLecture";
import LectureDetails from "@/courseManagement/pages/teacher/LectureDetails";
import CourseListStudent from "@/courseManagement/pages/student/CourseList";
import CourseDetailStudent from "@/courseManagement/pages/student/CourseDetail";
import LecturePlayer from "@/courseManagement/pages/student/LecturePlayer";
import CourseRouteConfig from "@/courseManagement/constants/CourseRouteConfig";
import { Outlet, type RouteObject } from "react-router-dom";
import RequireRole from "@/common/components/RequireRole";
import ApproveCourses from "../pages/teacher/ApproveCourses";

// --- TEACHER ROUTES (Đường dẫn con cho /teacher) ---
const teacherCourseRoutes: RouteObject[] = [
  {
    // index element={<div>Dashboard</div>} // Đường dẫn /teacher (Dashboard)
    index: true,
    element: <div>Dashboard</div>,
  },
  {
    // path="courses" element={<CourseListTeacher />}
    path: CourseRouteConfig.TEACHER.COURSES,
    element: <CourseListTeacher />,
  },
  {
    // path="courses/:id" element={<CourseDetailTeacher />}
    path: CourseRouteConfig.TEACHER.COURSE_DETAIL,
    element: <CourseDetailTeacher />,
  },
  {
    // path="add-course" element={<AddCourse />}
    path: CourseRouteConfig.TEACHER.ADD_COURSE,
    element: <AddCourse />,
  },
  {
    // path="edit-course" element={<EditCourse />}
    path: CourseRouteConfig.TEACHER.EDIT_COURSE,
    element: <EditCourse />,
  },
  {
    // path="approved-courses" element={<ApprovedCourses />}
    path: CourseRouteConfig.TEACHER.APPROVED_COURSES,
    element: <ApproveCourses />,
  },
  {
    // path="add-lecture" element={<AddLecture />}
    path: CourseRouteConfig.TEACHER.ADD_LECTURE,
    element: <AddLecture />,
  },
  {
    // path="edit-lecture" element={<EditLecture />}
    path: CourseRouteConfig.TEACHER.EDIT_LECTURE,
    element: <EditLecture />,
  },
  {
    // path="lecture/:id" element={<LectureDetails />}
    path: CourseRouteConfig.TEACHER.LECTURE_DETAIL,
    element: <LectureDetails />,
  },
];

// --- STUDENT ROUTES (Đường dẫn con cho /) ---
const studentCourseRoutes: RouteObject[] = [
  // Lưu ý: Không có 'index' element ở đây vì 'index' route thường là trang Home/Dashboard (nếu không được định nghĩa rõ ràng)
  // Trong mẫu của bạn, routes học sinh bắt đầu bằng /courses

  {
    // path="courses" element={<CourseListStudent />}
    path: CourseRouteConfig.STUDENT.COURSES,
    element: <CourseListStudent />,
  },
  {
    // path="courses/:id" element={<CourseDetailStudent />}
    path: CourseRouteConfig.STUDENT.COURSE_DETAIL,
    element: <CourseDetailStudent />,
  },
  {
    // path="courses/:courseId/lecture/:lectureId" element={<LecturePlayer />}
    path: CourseRouteConfig.STUDENT.LECTURE_PLAYER,
    element: <LecturePlayer />,
  },
];

// --- ROOT ROUTES ---
const courseRoutes: RouteObject[] = [
  // Cấu hình routes cho Giáo viên (Base path: /teacher)
  {
    path: CourseRouteConfig.TEACHER.INDEX,
    element: (
      <RequireRole
        allowedRoles={[
          "Subject Teacher",
          "Head of Department Teacher",
          "Q&A Teacher",
          "Homeroom Teacher",
          "School Admin",
        ]}
      >
        <Outlet />
      </RequireRole>
    ),
    children: teacherCourseRoutes,
  },

  // Cấu hình routes cho Học sinh (Base path: /)
  {
    path: CourseRouteConfig.STUDENT.INDEX,
    element: <Outlet />,
    children: studentCourseRoutes,
  },
];

export default courseRoutes;
