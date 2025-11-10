const ExamRouteConfig = {
  STUDENT: {
    EXAM_DETAIL: "student/exams/:id",
    TAKE_EXAM: "student/take-exam/:id",
    CLASS: {
      EXAM_LIST: "student/class-exams",
      EXAM_RESULT_LIST: "student/class-exams/results"
    }
  },
  TEACHER: {
    CLASS: {
      EXAM_LIST: "teacher/class-exams/:classId",
      EXAM_RESULT_LIST: "teacher/class-exams/results"
    },
    LESSON: {
      LESSON_EXAM: "teacher/lesson-exam/:lessonId"
    },
    CREATE_EXAM: "teacher/create-exam",
    EDIT_EXAM: "teacher/edit-exam/:id",
    EXAM_DETAILS: "teacher/results/:id"
  },
  EXAM_RESULT_DETAIL: "results/:id"
};

export default ExamRouteConfig;