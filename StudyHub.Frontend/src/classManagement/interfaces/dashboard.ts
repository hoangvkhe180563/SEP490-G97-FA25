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
  createdBy: string;
  submissionsCount: number;
};
export type MonthlyCountDto = {
  month: string; // "YYYY-MM" format
  count: number;
};

export type ClassStatsDto = {
  classId: number;
  className: string;
  studentsCount: number;
  submissionRate: number; // fraction 0..1
  readRate: number; // fraction 0..1
  classworksCount: number;
  notificationsCount: number;
  totalSubmissions: number;
};

export type NotificationStatDto = {
  notificationId: number;
  title: string;
  readsCount: number;
  ignoredCount: number; // recipients - reads
  totalRecipients: number;
  submissionsCount?: number;
  createdBy?: string;
};
