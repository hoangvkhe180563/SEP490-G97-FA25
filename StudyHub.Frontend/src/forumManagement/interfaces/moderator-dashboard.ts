// moderator-dashboard.ts
export interface PostStatsDto {
  totalPosts: number;
  approvedPosts: number;
  pendingPosts: number;
  rejectedPosts: number;
  hiddenPosts: number;
  postsByPeriod: { period: string; count: number }[];
  topFlairs: { flairName: string; count: number }[];
}

export interface CommentStatsDto {
  totalComments: number;
  approvedComments: number;
  pendingComments: number;
  hiddenComments: number;
  commentsByPeriod: { period: string; count: number }[];
  averageCommentsPerPost: number;
}

export interface ViolationStatsDto {
  totalViolations: number;
  violationsByPeriod: { period: string; count: number }[];
  violationsBySeverity: { severity: string; count: number }[];
  topViolators: {
    userId: string;
    username: string;
    fullname: string;
    count: number;
  }[];
  averageViolationScore: number;
}

export interface AppealStatsDto {
  totalAppeals: number;
  pendingAppeals: number;
  approvedAppeals: number;
  rejectedAppeals: number;
  appealsByPeriod: { period: string; count: number }[];
  averageResolveHours: number;
}

export interface UserActivityStatsDto {
  totalActiveUsers: number;
  mutedUsers: number;
  topContributors: {
    userId: string;
    username: string;
    fullname: string;
    postCount: number;
    commentCount: number;
  }[];
  usersByViolationScore: { scoreRange: string; count: number }[];
}

export interface ModeratorActivityDto {
  moderatorId: string;
  moderatorName: string;
  actionsCount: number;
  approvedCount: number;
  rejectedCount: number;
  hiddenCount: number;
}

export interface PostStatsDto {
  totalPosts: number;
  approvedPosts: number;
  pendingPosts: number;
  rejectedPosts: number;
  hiddenPosts: number;
  postsByPeriod: { period: string; count: number }[];
  topFlairs: { flairName: string; count: number }[];
  topSubjects: { subjectName: string; count: number }[];
}

export interface CommentStatsDto {
  totalComments: number;
  approvedComments: number;
  pendingComments: number;
  hiddenComments: number;
  commentsByPeriod: { period: string; count: number }[];
  averageCommentsPerPost: number;
}

export interface ViolationStatsDto {
  totalViolations: number;
  violationsByPeriod: { period: string; count: number }[];
  violationsBySeverity: { severity: string; count: number }[];
  violationsBySourceType: { sourceType: string; count: number }[];
  violationsByRule: { ruleName: string; count: number }[];
  violationsByFlair: { flairName: string; count: number }[];
  violationsBySubject: { subjectName: string; count: number }[];
  topViolators: {
    userId: string;
    username: string;
    fullname: string;
    count: number;
  }[];
  averageViolationScore: number;
}

export interface AppealStatsDto {
  totalAppeals: number;
  pendingAppeals: number;
  approvedAppeals: number;
  rejectedAppeals: number;
  appealsByPeriod: { period: string; count: number }[];
  averageResolveHours: number;
}

export interface UserActivityStatsDto {
  totalActiveUsers: number;
  mutedUsers: number;
  topContributors: {
    userId: string;
    username: string;
    fullname: string;
    postCount: number;
    commentCount: number;
  }[];
  usersByViolationScore: { scoreRange: string; count: number }[];
}
export interface TopEngagedPost {
  postId: number;
  title: string;
  commentCount: number;
  viewCount: number;
  creatorName: string;
  createdAt: string;
}
export interface ModeratorActivityDto {
  moderatorId: string;
  moderatorName: string;
  actionsCount: number;
  approvedCount: number;
  rejectedCount: number;
  hiddenCount: number;
}
export default {} as unknown as PostStatsDto;
