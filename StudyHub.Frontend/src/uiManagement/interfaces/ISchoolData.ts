export interface ISchoolData {
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
  //qr code: on backend
}