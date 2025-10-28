import type { AppUser } from "./app-user";

export interface AccountItemProps {
  user: AppUser;
  idx: number;
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  statusColor: Record<AppUser["status"], string>;
}
