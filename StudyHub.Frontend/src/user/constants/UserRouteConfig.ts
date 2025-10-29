const UserRouteConfig = {
  TEACHER: {
    INDEX: "teacher",
    PROFILE: "profile",
  },
  MANAGER: {
    INDEX: "manager",
    PROFILE: "profile",
    ACCOUNT_LIST: "accounts",
    ADD_ACCOUNT: "add-account",
    UPDATE_ACCOUNT: "update-account/:id",
  },
  STUDENT: {
    INDEX: "student",
    PROFILE: "profile",
  },
  PARENT: {
    INDEX: "parent",
    PROFILE: "profile",
  },
};

export default UserRouteConfig;
