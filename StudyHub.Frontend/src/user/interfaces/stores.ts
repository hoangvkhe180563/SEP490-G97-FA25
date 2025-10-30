import type { AppRole } from "./app-role";
import type { AppUser, ProfileResponse } from "./app-user";
import type { City } from "./city";
import type { Commune } from "./commune";
import type {
  CreateAccountDto,
  EditAccountDto,
  UpdateProfileDto,
} from "./dtos";
import type { Province } from "./province";
import type { School } from "./school";

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FilterAppUsersResponse {
  message?: string;
  data: AppUser[];
  meta?: Meta;
  success: boolean;
}
interface AppUserState {
  appUsers: AppUser[];
  appUser: AppUser | undefined;
  profileUser: ProfileResponse | undefined;
  success: boolean;
  message: string;
  isLoading: boolean;
  meta?: Meta | null;

  filterAppUsers: (query: string) => Promise<FilterAppUsersResponse | null>;
  // Accept either an array or a functional updater like React's setState
  setAppUsers: (users: AppUser[] | ((prev: AppUser[]) => AppUser[])) => void;
  getAppUserById: (id: string) => Promise<any>;
  // Update a user's status (Active / Inactive). Returns true when update succeeded.
  updateUserStatus: (
    id: string,
    status: AppUser["status"],
    successCallback?: (message?: string) => void,
    errorCallback?: (message?: string) => void
  ) => Promise<boolean>;
  // Create a new account using DTO containing fields and optional avatarFile
  createAccount: (
    dto: CreateAccountDto,
    successCallback?: (message?: string) => void,
    errorCallback?: (message?: string) => void
  ) => Promise<any>;
  updateAccount: (
    id: string,
    dto: EditAccountDto,
    successCallback?: (message?: string) => void,
    errorCallback?: (message?: string) => void
  ) => Promise<any>;
  getProfile: () => Promise<any>;
  updateProfile: (
    dto: UpdateProfileDto,
    successCallback?: (message?: string) => void,
    errorCallback?: (message?: string) => void
  ) => Promise<any>;
}

interface AppRoleState {
  appRoles: AppRole[];
  isLoading: boolean;
  success: boolean;
  message: string;
  getAppRoles: () => Promise<void>;
}

interface LocationState {
  isLoading: boolean;
  cities: City[];
  fetchCities: () => Promise<void>;
  provinces: Province[];
  fetchProvinces: (id: number) => Promise<void>;
  communes: Commune[];
  fetchCommunes: (id: number) => Promise<void>;
  schools: School[];
  fetchSchools: (id: number) => Promise<void>;
  selectedCity: City | null;
  selectedProvince: Province | null;
  selectedCommune: Commune | null;
  selectedSchool: School | null;
  setSelectedCity: (city: City) => void;
  setSelectedProvince: (province: Province) => void;
  setSelectedCommune: (commune: Commune) => void;
  setSelectedSchool: (school: School) => void;
}

export type { AppUserState, AppRoleState, LocationState };
