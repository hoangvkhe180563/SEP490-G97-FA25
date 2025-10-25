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
  },
  MANAGER: {
    INDEX: "manager",
    VERIFY: "verify",
    DETAILS: "details/:id",
    INFO: "doc-info/:id",
  },
  STUDENT: {
    INDEX: "student",
    DETAILS: "details/:id",
    INFO: "doc-info/:id",
    DOCUMENTS: "documents",
  },
};

export default DocumentRouteConfig;
