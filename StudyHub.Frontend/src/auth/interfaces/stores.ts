import type { AppUser } from "./app-user";
import type { City } from "./city";
import type { Commune } from "./commune";
import type { School } from "./school";

interface AuthState {
  user: AppUser | null;
  googleRedirectURL: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCheckingAuth: boolean;
  error: string | null;
  message: string;
  loginMessage: string;
  registerMessage: string;
  verifyEmailMessage: string;
  forgotPasswordMessage: string;
  resetPasswordMessage: string;
  handlerGoogleCallbackMessage: string;
  loginError: string | null;
  registerError: string | null;
  verifyEmailError: string | null;
  forgotPasswordError: string | null;
  resetPasswordError: string | null;
  handlerGoogleCallbackError: string;
  // UI state for Account Inactive modal
  accountInactiveOpen: boolean;
  setAccountInactiveOpen: (open: boolean) => void;
  // UI state for the activation request form/modal
  activateFormOpen: boolean;
  setActivateFormOpen: (open: boolean) => void;
  login: (
    username: string,
    email: string,
    password: string,
    handlerSuccess: (data: AppUser) => void
  ) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    fullName: string,
    phoneNumber: string,
    communeId: number,
    schoolId?: number
  ) => Promise<void>;
  sendEmailVerification: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  forgetPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  getGoogleRedirectURL: () => Promise<void>;
  handleGoogleCallback: (
    code: string,
    state: string,
    error: string,
    handlerSuccess: () => void,
    handlerError: () => void
  ) => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
  // If `remote` is false, only perform a local logout (clear local state).
  // Returns a Promise so callers can await the server call when desired.
  logout: (remote?: boolean) => Promise<void>;
}

interface LocationState {
  isLoading: boolean;
  cities: City[];
  fetchCities: () => Promise<void>;
  communes: Commune[];
  fetchCommunes: (id: number) => Promise<void>;
  schools: School[];
  fetchSchools: (id: number) => Promise<void>;
  selectedCity: City | null;
  selectedCommune: Commune | null;
  selectedSchool: School | null;
  setSelectedCity: (city: City) => void;
  setSelectedCommune: (commune: Commune) => void;
  setSelectedSchool: (school: School) => void;
}

export type { AuthState, LocationState };
