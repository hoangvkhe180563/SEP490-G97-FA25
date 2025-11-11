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
}

export interface AccountRecoveryStatsDto {
  totalRequests: number;
  approvedCount: number;
  rejectedCount: number;
  approvedRate: number; // percent (e.g. 50)
  rejectedRate: number; // percent
  averageResolveMinutes?: number | null;
}

export default {} as unknown as AccountsOverviewDto;
