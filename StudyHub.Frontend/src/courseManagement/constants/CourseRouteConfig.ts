const CourseRouteConfig = {
  TEACHER: {
    // Base paths
    INDEX: "teacher", // Base path for the teacher section (e.g., /teacher)

    // Course-related routes
    COURSES: "courses", // /teacher/courses
    COURSE_DETAIL: "courses/:id", // /teacher/courses/:id
    ADD_COURSE: "add-course", // /teacher/add-course
    EDIT_COURSE: "edit-course", // /teacher/edit-course

    // Lecture-related routes
    ADD_LECTURE: "add-lecture", // /teacher/add-lecture
    EDIT_LECTURE: "edit-lecture", // /teacher/edit-lecture
    LECTURE_DETAIL: "lecture/:id", // /teacher/lecture/:id (This replaces your original LECTURE_DETAIL: ":id")
  },
  STUDENT: {
    // Base paths
    INDEX: "/", // Base path for the student section (e.g., /) - assuming student routes are under the root or a different layout

    // Course-related routes
    COURSES: "courses", // /courses
    COURSE_DETAIL: "courses/:id", // /courses/:id

    // Lecture-related routes (specific for student, as it has two params)
    LECTURE_PLAYER: "courses/:courseId/lecture/:lectureId",
  },
};
export default CourseRouteConfig;
