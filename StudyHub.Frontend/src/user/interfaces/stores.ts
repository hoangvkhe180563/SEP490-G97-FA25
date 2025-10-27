import type { AppUser } from "./app-user";

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FilterAppUsersResponse {
  success: boolean;
  users: AppUser[];
  meta?: Meta;
}
interface GetAppUserByIdResponse {
  success: boolean;
  data: AppUser;
}
interface UserState {
  appUsers: AppUser[];
  appUser: AppUser | undefined;
  success: boolean;
  message: string;
  isLoading: boolean;
  meta?: Meta | null;

  filterAppUsers: (query: string) => Promise<FilterAppUsersResponse | null>;
  getAppUserById: (id: string) => Promise<GetAppUserByIdResponse | null>;
}

export type { UserState };
