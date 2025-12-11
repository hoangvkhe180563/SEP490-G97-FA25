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

interface CurrentUser {
  email: string;
  username: string;
  fullname?: string;
  gender?: boolean;
  avatar?: string;
  address?: string;
  status?: boolean;
  createdAt: string;
  updatedAt: string;
  schoolId: number;
  cityId: number;
  communeId: number;
  roles?: string[];
  subjects?: string[];
}

export type { AppUser, CurrentUser };
