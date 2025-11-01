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

interface EditAccountDto {
  // optional fields for partial updates
  email?: string | null;
  username?: string | null;
  fullname?: string | null;
  // backend expects GUIDs for role ids
  roleIds?: Array<string> | null;
  // backend expects integer commune id
  communeId?: number | null;
  schoolId?: number | null;
  status?: boolean | null;
  avatarFile?: File | null;
  // Gender as integer (1 -> Male, 0 -> Female)
  gender?: number | null;
}

interface UpdateProfileDto {
  // optional fields for partial updates
  email?: string | null;
  username?: string | null;
  fullname?: string | null;
  // backend expects GUIDs for role ids
  oldPassword?: string | null;
  newPassword?: string | null;
  // backend expects integer commune id
  communeId?: number | null;
  schoolId?: number | null;
  avatarFile?: File | null;
  // Gender as integer (1 -> Male, 0 -> Female)
  gender?: number | null;
}

export type { CreateAccountDto, EditAccountDto, UpdateProfileDto };
