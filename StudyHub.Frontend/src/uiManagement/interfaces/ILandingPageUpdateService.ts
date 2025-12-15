export interface ILandingPageUpdateService {
  bannerImage: File | null;
  logoImage: File | null;
  description: string;
  deletedLandingPageImages: string[];
  newLandingPageImages: File[];
  featuredDocuments: number[];
  featuredCourses: number[]
}