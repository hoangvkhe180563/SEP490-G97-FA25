//src/documentManagement/constants/DocumentRouteConfig.ts
const DocumentRouteConfig = {
  TEACHER: {
    INDEX: "teacher",
    INFO: "doc-info/:id",
    DETAILS: "doc-details/:id",
    MYDOCUMENTS: "my-documents",
    ADD: "create-document",
    EDIT: "update-document/:id",
    DOCUMENTS: "documents",
    SCHOOL_TEACHERS: "school-teachers",
  },
  MANAGER: {
    INDEX: "manager",
    DASHBOARD: "dashboard",
    VERIFY: "verify",
    DETAILS: "details/:id",
    INFO: "doc-info/:id",
  },
  STUDENT: {
    INDEX: "",
    DETAILS: "details/:id",
    INFO: "doc-info/:id",
    DOCUMENTS: "documents",
  },
};

export default DocumentRouteConfig;
