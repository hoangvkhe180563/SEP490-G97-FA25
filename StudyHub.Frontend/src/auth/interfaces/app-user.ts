interface AppUser {
  id: string;
  email: string;
  username: string;
  fullname: string;
  roles: string[];
  permissions: string[];
  classIds: string[];
  subjectIds: string[];
  schoolId: string;
}

export type { AppUser };
