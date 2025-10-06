export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  address?: string;
  avatar?: string;
  createdAt: string;
  status: "Active" | "Inactive";
}
