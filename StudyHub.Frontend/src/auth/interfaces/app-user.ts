interface AppUser {
  id: string;
  email: string;
  username: string;
  fullname: string;
  roles: string[];
  permissions: string[];
  classIds: number[];
  subjectIds: number[];
  schoolId: number;
}

export type { AppUser };
