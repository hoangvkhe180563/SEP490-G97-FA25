export type OverviewDto = {
  totalUsers: number;
  totalClasses: number;
  totalAssignments: number;
  totalAnnouncements: number;
};

export type GradeCountDto = {
  grade: number;
  count: number;
};

export type StudentsPerClassDto = {
  classId: number;
  className: string;
  students: number;
};

export type RoleCountDto = {
  roleName: string;
  count: number;
};

export type KeyValueDto = {
  key: string;
  value: number;
};

export type TopActiveClassDto = {
  classId: number;
  className: string;
  activityScore: number;
  notificationsCount: number;
  submissionsCount: number;
  commentsCount: number;
};

export type ScoreDistributionDto = {
  range: string;
  count: number;
  pct: number;
};

export type AssignmentInteractionDto = {
  notificationId: number;
  title: string;
  submissionsCount: number;
};