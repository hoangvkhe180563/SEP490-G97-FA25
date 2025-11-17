export interface RoleDistributionItem {
  role: string;
  count: number;
}

export interface NewAccountsPeriodItem {
  period: string; // ISO date string or label
  count: number;
}

export interface AccountsOverviewDto {
  totalUsers: number;
  roleDistribution: RoleDistributionItem[];
  activeCount: number;
  inactiveCount: number;
  // inactiveRate as a percent number (e.g. 10 means 10%)
  inactiveRate?: number;
  newAccountsByPeriod: NewAccountsPeriodItem[];
  // Optional analytics values (may be provided by backend)
  retentionRate?: number; // percent
  averageLoginFrequency?: number; // avg logins per user
  // Detailed objects (if backend returns full objects)
  retention?: RetentionDto | null;
  averageLogin?: AverageLoginDto | null;
}

export interface RetentionDto {
  cohortStart?: string | null; // ISO datetime
  cohortEnd?: string | null;
  cohortCount?: number | null;
  retainedCount?: number | null;
  retentionRate?: number | null; // percent
  returnAfterDays?: number | null;
}

export interface AverageLoginDto {
  totalLogins?: number | null;
  distinctUsers?: number | null;
  averagePerUser?: number | null;
  periodStart?: string | null;
  periodEnd?: string | null;
}

export interface AccountRecoveryStatsDto {
  totalRequests: number;
  approvedCount: number;
  rejectedCount: number;
  approvedRate: number; // percent (e.g. 50)
  rejectedRate: number; // percent
  averageResolveMinutes?: number | null;
}

export interface DateCountDto {
  period: string; // e.g., yyyy-MM-dd or yyyy-MM
  count: number;
}

export interface HourCountDto {
  hour: number;
  count: number;
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RoleCountDto {
  role: string;
  count: number;
}

export interface RealtimePresenceDto {
  onlineCount: number;
  onlineByRole: RoleCountDto[];
}

export default {} as unknown as AccountsOverviewDto;
