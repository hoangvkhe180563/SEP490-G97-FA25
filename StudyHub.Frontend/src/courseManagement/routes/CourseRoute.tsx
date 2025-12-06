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
import { ROLES } from "@/common/constants/Roles";
import ProtectedRoute from "@/common/components/ProtectedRoute";

// --- TEACHER ROUTES (Đường dẫn con cho /teacher) ---
const teacherCourseRoutes: RouteObject[] = [
  {
    // path="courses" element={<CourseListTeacher />}
    path: CourseRouteConfig.TEACHER.COURSES,
    element: (
      <ProtectedRoute>
        <RequireRole
          allowedRoles={[
            ROLES.SUBJECT_TEACHER,
            ROLES.HOMEROOM_TEACHER,
            ROLES.HEAD_TEACHER,
            ROLES.QNA_TEACHER,
          ]}
        >
          <CourseListTeacher />
        </RequireRole>
      </ProtectedRoute>
    ),
  },
  {
    // path="courses/:id" element={<CourseDetailTeacher />}
    path: CourseRouteConfig.TEACHER.COURSE_DETAIL,
    element: (
      <ProtectedRoute>
        <RequireRole
          allowedRoles={[
            ROLES.SUBJECT_TEACHER,
            ROLES.HOMEROOM_TEACHER,
            ROLES.HEAD_TEACHER,
            ROLES.QNA_TEACHER,
          ]}
        >
          <CourseDetailTeacher />
        </RequireRole>
      </ProtectedRoute>
    ),
  },
  {
    // path="add-course" element={<AddCourse />}
    path: CourseRouteConfig.TEACHER.ADD_COURSE,
    element: (
      <ProtectedRoute>
        <RequireRole
          allowedRoles={[ROLES.SUBJECT_TEACHER, ROLES.HOMEROOM_TEACHER]}
        >
          <AddCourse />
        </RequireRole>
      </ProtectedRoute>
    ),
  },
  {
    // path="edit-course" element={<EditCourse />}
    path: CourseRouteConfig.TEACHER.EDIT_COURSE,
    element: (
      <ProtectedRoute>
        <RequireRole
          allowedRoles={[ROLES.SUBJECT_TEACHER, ROLES.HOMEROOM_TEACHER]}
        >
          <EditCourse />
        </RequireRole>
      </ProtectedRoute>
    ),
  },
  {
    // path="approved-courses" element={<ApprovedCourses />}
    path: CourseRouteConfig.TEACHER.APPROVED_COURSES,
    element: (
      <ProtectedRoute>
        <RequireRole allowedRoles={[ROLES.HEAD_TEACHER]}>
          <ApproveCourses />
        </RequireRole>
      </ProtectedRoute>
    ),
  },
  {
    // path="add-lecture" element={<AddLecture />}
    path: CourseRouteConfig.TEACHER.ADD_LECTURE,
    element: (
      <ProtectedRoute>
        <RequireRole
          allowedRoles={[ROLES.SUBJECT_TEACHER, ROLES.HOMEROOM_TEACHER]}
        >
          <AddLecture />
        </RequireRole>
      </ProtectedRoute>
    ),
  },
  {
    // path="edit-lecture" element={<EditLecture />}
    path: CourseRouteConfig.TEACHER.EDIT_LECTURE,
    element: (
      <ProtectedRoute>
        <RequireRole
          allowedRoles={[ROLES.SUBJECT_TEACHER, ROLES.HOMEROOM_TEACHER]}
        >
          <EditLecture />
        </RequireRole>
      </ProtectedRoute>
    ),
  },
  {
    // path="lecture/:id" element={<LectureDetails />}
    path: CourseRouteConfig.TEACHER.LECTURE_DETAIL,
    element: (
      <ProtectedRoute>
        <RequireRole
          allowedRoles={[
            ROLES.SUBJECT_TEACHER,
            ROLES.HOMEROOM_TEACHER,
            ROLES.HEAD_TEACHER,
            ROLES.QNA_TEACHER,
          ]}
        >
          <LectureDetails />
        </RequireRole>
      </ProtectedRoute>
    ),
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
    element: <Outlet />,
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
