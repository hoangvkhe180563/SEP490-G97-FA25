const ClassRouteConfig = {
  TEACHER: {
    INDEX: "teacher",
    CLASS_DETAIL: ":id" // The path is relative to the TeacherLayout route
  },
  STUDENT: {
    INDEX: "student",
    CLASS_DETAIL: ":id" // The path is relative to the StudentLayout route
  }
};
export default ClassRouteConfig;