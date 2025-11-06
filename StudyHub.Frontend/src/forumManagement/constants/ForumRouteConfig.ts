// src/forumManagement/constants/ForumRouteConfig.ts
const ForumRouteConfig = {
  TEACHER: {
    INDEX: "teacher",
    FORUMS: "forums",
    POST_DETAIL: "forums/details/:postId",
  },
  MANAGER: {
    INDEX: "manager",
    FORUMS: "forums",
    POST_DETAIL: "forums/details/:postId",
    POST_MANAGEMENT: "posts",
    COMMENT_MANAGEMENT: "comments",
    APPEAL_MANAGEMENT: "appeals",
    VIOLATION_ACCOUNTS: "accounts",
    VIOLATION_RECORDS: "violations",
    FLAIR_MANAGEMENT: "flairs",
    REPORT_MANAGEMENT: "reports",
  },
  STUDENT: {
    INDEX: "student",
    FORUMS: "forums",
    POST_DETAIL: "forums/details/:postId",
  },
};

export default ForumRouteConfig;
