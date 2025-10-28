export type UserStatus = "Active" | "Inactive";

interface AppUser {
  id: string;
  avatar?: string;
  email: string;
  username: string;
  fullname?: string;
  address: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  schoolName: string;
  roles?: string[];
  communeName: string;
}

export type { AppUser };
