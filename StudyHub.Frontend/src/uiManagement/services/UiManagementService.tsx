import { axiosInstance } from "@/lib/axios";
import type { ILandingPageService } from "../interfaces/ILandingPageService";

export class UiManagementService {
  async getLandingPageInformation(schoolId: number): Promise<ILandingPageService> {
    const response = await axiosInstance.get("/LandingPage/" + schoolId);
    const { data } = response;
    console.log("data is: ", data);

    return {
      bannerImage: data.bannerUrl,
      description: data.description,
      introductionImage: data.landingPageImages,
      featuredTeachers: data.featuredTeachers,
      featuredDocuments: data.featuredDocuments,
      featuredCourses: data.featuredCourses
    }
  }
}