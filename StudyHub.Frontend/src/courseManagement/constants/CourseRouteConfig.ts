const CourseRouteConfig = {
  TEACHER: {
    INDEX: "teacher",
    COURSES: "courses",
    COURSE_DETAIL: "courses/:id",
    ADD_COURSE: "add-course",
    EDIT_COURSE: "edit-course/:id",
    APPROVED_COURSES: "approved-courses",
    ADD_LECTURE: "add-lecture",
    EDIT_LECTURE: "edit-lecture/:id",
    LECTURE_DETAIL: "lecture/:id",
  },
  STUDENT: {
    INDEX: "student",
    COURSES: "courses",
    COURSE_DETAIL: "courses/:id",
    LECTURE_PLAYER: "courses/:courseId/lecture/:lectureId",
  },
};
export default CourseRouteConfig;
