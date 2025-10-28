import type { IFeaturedCourse } from "./IFeaturedCourse";
import type { IFeaturedDocument } from "./IFeaturedDocument";
import type { IFeaturedTeacher } from "./IFeaturedTeacher";

export interface ILandingPageService {
  bannerImage: string;
  logoImage: string;
  description: string;
  introductionImage: string[];
  featuredTeachers: IFeaturedTeacher[],
  featuredDocuments: IFeaturedDocument[];
  featuredCourses: IFeaturedCourse[]
}