export interface ILandingPageUpdateService {
  bannerImage: File | null;
  description: string;
  deletedLandingPageImages: string[],
  newLandingPageImages: File[];
  featuredTeachers: number[],
  featuredDocuments: number[];
  featuredCourses: number[]
}