import type { AppUser } from "./app-user";
import type { City } from "./city";
import type { Commune } from "./commune";
import type { Province } from "./province";
import type { School } from "./school";

interface AuthState {
  user: AppUser | null;
  googleRedirectURL: string;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  login: (
    username: string,
    email: string,
    password: string,
    handlerSuccess: () => void
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
    handlerSuccess: () => void
  ) => Promise<void>;
  checkAuth: () => Promise<void>;
  logout: () => void;
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
  fetchSchools: () => Promise<void>;
  selectedCity: City | null;
  selectedProvince: Province | null;
  selectedCommune: Commune | null;
  selectedSchool: School | null;
  setSelectedCity: (city: City) => void;
  setSelectedProvince: (province: Province) => void;
  setSelectedCommune: (commune: Commune) => void;
  setSelectedSchool: (school: School) => void;
}

export type { AuthState, LocationState };
