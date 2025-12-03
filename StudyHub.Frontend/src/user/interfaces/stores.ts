import type {
  AccountRecoveryItem,
  CreateAccountRecoveryRequest,
} from "./account-recovery";
import type { AppRole } from "./app-role";
import type { AppUser, CurrentUser } from "./app-user";
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
  teachers?: AppUser[];
  appUser: AppUser | undefined;
  currentUser: CurrentUser | undefined;
  success: boolean;
  message: string | { [key: string]: string[] };
  isLoading: boolean;
  meta?: Meta | null;

  filterAppUsers: (query: string) => Promise<FilterAppUsersResponse | null>;
  getTeachers?: () => Promise<AppUser[] | null>;
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

// Excel import/export preview store (separated from AppUserState)
interface ExcelImportState {
  // last previewed workbook (headers + rows)
  preview: { headers: string[]; rows: string[][] } | null;
  isLoading: boolean;
  success: boolean;
  message: string;

  // Read file and return parsed preview (sheet 0). Uses dynamic `xlsx` import.
  previewFile: (
    file: File
  ) => Promise<{ headers: string[]; rows: string[][] } | null>;
  // Clear preview data
  clearPreview: () => void;
  // Export endpoints (download blobs)
  exportAccounts: () => Promise<boolean>;
  exportTemplate: (rows?: number) => Promise<boolean>;
  // Upload file (raw File) to backend import endpoint
  importAccounts: (
    file: File,
    onValidationError?: (errors: { [key: string]: string[] }) => void
  ) => Promise<any>;
  // Upload a client-side edited preview (headers+rows) by regenerating an xlsx and sending
  uploadPreview: (
    preview: { headers: string[]; rows: string[][] },
    onValidationError?: (errors: { [key: string]: string[] }) => void
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

interface AccountRecoveryState {
  items: AccountRecoveryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  fetch: (
    search?: string | null,
    status?: string | null,
    page?: number,
    limit?: number
  ) => Promise<void>;
  updateStatus: (id: string, status: string) => Promise<void>;
  createRequest: (payload: CreateAccountRecoveryRequest) => Promise<void>;
}

export type {
  AppUserState,
  AppRoleState,
  LocationState,
  AccountRecoveryState,
  ExcelImportState,
};
