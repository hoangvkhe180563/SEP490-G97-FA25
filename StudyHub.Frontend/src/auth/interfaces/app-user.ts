interface AppUser {
  id: string;
  email: string;
  username: string;
  fullname: string;
  avatar: string;
  roles: string[];
  permissions: string[];
  classIds: number[];
  subjectIds: number[];
  schoolId: number;
  isLoginWithGoogle: boolean;
  transferId: number;
  wallet: number;
  // Resolved location names provided by backend to avoid extra lookups
  schoolName?: string;
  communeId?: number;
  communeName?: string;
  cityId?: number;
  cityName?: string;
}

export type { AppUser };
