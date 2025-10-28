interface CreateAccountDto {
  email: string;
  password: string;
  username: string;
  // backend expects GUIDs for role ids
  roleIds: Array<string>;
  // backend expects integer commune id
  communeId: number;
  avatarFile?: File | null;
  fullname?: string;
  // Gender as integer (1 -> Male, 0 -> Female, maybe 2 -> Other)
  gender: number;
}

export type { CreateAccountDto };
