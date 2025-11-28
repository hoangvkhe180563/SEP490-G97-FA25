const ClassRouteConfig = {
  TEACHER: {
    INDEX: "teacher",
    CLASS_DETAIL: ":id",
    ADD_CLASSWORK:":id/classwork/add",
    EDIT_CLASSWORK:":id/classwork/:classworkId/edit", // The path is relative to the TeacherLayout route
    CLASSWORK_DETAIL:":id/classwork/:classworkId/detail",
    CONFIRM_INVITE:":id/invite/confirm",
    SUBMISSION_PAGE:":id/classwork/:classworkId/submissions",
    CLASS_DOCUMENTS:":id/documents"
  },
  STUDENT: {
    INDEX: "student",
    CLASS_DETAIL: ":id",
    CLASSWORK_DETAIL:":id/classwork/:classworkId/detail", // The path is relative to the StudentLayout route
    CONFIRM_INVITE:":id/invite/confirm",
    CLASS_DOCUMENTS:":id/documents"
  }
};
export default ClassRouteConfig;