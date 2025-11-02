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
}

export type { AppUser };
