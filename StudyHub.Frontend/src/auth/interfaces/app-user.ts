interface AppUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  dob: string;
  gender: string;
  avatar: string;
  address: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
  schoolName: string;
  roles: string[];
  communeName: string;
}

export type { AppUser };
