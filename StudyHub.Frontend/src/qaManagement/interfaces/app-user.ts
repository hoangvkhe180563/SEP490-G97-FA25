interface AppUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatar: string;
  status: string;
  createdAt: string;
  roles: string[];
}

export type { AppUser };
