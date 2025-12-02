const ExamRouteConfig = {
  STUDENT: {
    EXAM_DETAIL: "student/exams/:id",
    TAKE_EXAM: "student/take-exam/:id"
  },
  TEACHER: {
    CREATE_CLASS_EXAM: "teacher/create-exam",
    EDIT_CLASS_EXAM: "teacher/edit-exam/:id",
    EXAM_DETAILS: "teacher/results/:id"
  },
  QUESTION_MANAGER: {
    QUESTION_LIST: "manager/questions",
    CREATE_QUESTION: "manager/questions/create",
    DASHBOARD: "manager/dashboard"
  },
  EXAM_RESULT_DETAIL: "results/:id"
};

export default ExamRouteConfig;