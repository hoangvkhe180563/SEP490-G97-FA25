const ClassRouteConfig = {
  TEACHER: {
    INDEX: "teacher",
    CLASS_DETAIL: ":id",
    ADD_CLASSWORK:":id/classwork/add",
    EDIT_CLASSWORK:":id/classwork/:classworkId/edit", // The path is relative to the TeacherLayout route
    CLASSWORK_DETAIL:":id/classwork/:classworkId/detail"
  },
  STUDENT: {
    INDEX: "student",
    CLASS_DETAIL: ":id",
    CLASSWORK_DETAIL:":id/classwork/:classworkId/detail" // The path is relative to the StudentLayout route
  }
};
export default ClassRouteConfig;