export type AccountRecoveryItem = {
  id: string;
  userId: string;
  username?: string | null;
  email?: string | null;
  requestReason?: string | null;
  status: string;
  createdAt: string;
  processedAt?: string | null;
  processedBy?: string | null;
};

export type PagedResult<T> = {
  Items: T[];
  Total: number;
  Page: number;
  Limit: number;
  TotalPages: number;
};

export type CreateAccountRecoveryRequest = {
  identifier: string;
  reason: string;
};
