const ClassRouteConfig = {
  TEACHER: {
    INDEX: "teacher",
    CLASS_DETAIL: ":id",
    ADD_CLASSWORK:":id/classwork/add",
    EDIT_CLASSWORK:":id/classwork/:classworkId/edit", // The path is relative to the TeacherLayout route
    CLASSWORK_DETAIL:":id/classwork/:classworkId/detail",
    CONFIRM_INVITE:":id/invite/confirm"
  },
  STUDENT: {
    INDEX: "student",
    CLASS_DETAIL: ":id",
    CLASSWORK_DETAIL:":id/classwork/:classworkId/detail", // The path is relative to the StudentLayout route
    CONFIRM_INVITE:":id/invite/confirm"
  }
};
export default ClassRouteConfig;