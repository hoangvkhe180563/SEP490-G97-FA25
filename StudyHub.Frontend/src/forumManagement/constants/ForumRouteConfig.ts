// src/forumManagement/constants/ForumRouteConfig.ts
const ForumRouteConfig = {
  TEACHER: {
    INDEX: "",
    FORUMS: "forums",
    POST_DETAIL: "forums/details/:postId",
  },
  MANAGER: {
    INDEX: "manager",
    DASHBOARD: "dashboard",
    FORUMS: "forums",
    POST_DETAIL: "forums/details/:postId",
    POST_MANAGEMENT: "posts",
    APPEAL_MANAGEMENT: "appeals",
    VIOLATION_ACCOUNTS: "accounts",
    VIOLATION_RECORDS: "violations",
    FLAIR_MANAGEMENT: "flairs",
    RULE_MANAGEMENT: "rules",
  },
  STUDENT: {
    INDEX: "",
    FORUMS: "forums",
    POST_DETAIL: "forums/details/:postId",
  },
};

export default ForumRouteConfig;
