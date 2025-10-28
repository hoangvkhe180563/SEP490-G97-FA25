//src/forumManagement/constants/ForumRouteConfig.ts
const ForumRouteConfig = {
  TEACHER: {
    INDEX: "teacher",
  },
  MANAGER: {
    INDEX: "manager",
  },
  STUDENT: {
    INDEX: "student",
    FORUMS: "forums",
    POST_DETAIL: "forums/details/:postId",
  },
};

export default ForumRouteConfig;
