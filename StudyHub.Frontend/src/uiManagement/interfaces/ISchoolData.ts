export interface ISchoolData {
  id?: number;
  schoolName: string;
  communeId: number;
  banner: File | null;
  logo: File | null;
  description: string;
  address: string;
  currentLandingPageImages: string[];
  newLandingPageImages: File[];
  featuredDocumentIds: number[];
  featuredCourseIds: number[];
  accountName: string;
  accountNumber: string;
  accountBank: string;
  exchangeRate: number;
}

export interface ISchoolFormData {
  schoolName: string;
  communeId: number;
  cityId: number;
  bannerUrl: string;
  logoUrl: string;
  description: string;
  address: string;
  landingPageImages: string[];
  featuredDocumentIds: number[];
  featuredCourseIds: number[];
  accountName: string;
  accountNumber: string;
  accountBank: string;
  exchangeRate: number;
}