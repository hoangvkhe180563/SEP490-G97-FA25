//src/documentManagement/constants/DocumentRouteConfig.ts
const QARouteConfig = {
  TEACHER: {
    INDEX: "teacher",
    CONVERSATIONS: "conversations",
    DETAILS: "conversations/:id",
  },
  STUDENT: {
    INDEX: "student",
    CONVERSATIONS: "conversations",
    DETAILS: "conversations/:id",
  },
  MANAGER:{
    INDEX: "manager",
  }
};

export default QARouteConfig;
