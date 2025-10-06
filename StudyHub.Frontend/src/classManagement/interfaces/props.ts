import type { User } from "./user";

export interface AccountItemProps {
  user: User;
  idx: number;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  statusColor: Record<User["status"], string>;
}
