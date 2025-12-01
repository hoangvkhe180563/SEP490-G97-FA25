import { axiosInstance } from "@/lib/axios";
import type { ILandingPageService } from "../interfaces/ILandingPageService";
import type { IDocumentItem } from "../interfaces/IDocumentItem";
import type { ICourseItem } from "../interfaces/ICourseItem";
import type { ILandingPageUpdateService } from "../interfaces/ILandingPageUpdateService";

export class UiManagementService {
  async getLandingPageGeneral(): Promise<ILandingPageService> {
    const response = await axiosInstance.get("/LandingPage");
    const { data } = response;

    return {
      bannerImage: data.bannerUrl,
      logoImage: data.schoolLogoUrl,
      description: data.description,
      introductionImage: data.landingPageImages,
      featuredTeachers: data.featuredTeachers,
      featuredDocuments: data.featuredDocuments,
      featuredCourses: data.featuredCourses
    }
  }

  async getLandingPageSchool(schoolId: number): Promise<ILandingPageService> {
    const response = await axiosInstance.get("/LandingPage/" + schoolId);
    const { data } = response;

    return {
      bannerImage: data.bannerUrl,
      logoImage: data.schoolLogoUrl,
      description: data.description,
      introductionImage: data.landingPageImages,
      featuredTeachers: data.featuredTeachers,
      featuredDocuments: data.featuredDocuments,
      featuredCourses: data.featuredCourses
    }
  }

  async getAllDocuments(schoolId: number): Promise<IDocumentItem[]> {
    const response = await axiosInstance.get("/Document/school/" + schoolId);
    const { data } = response;

    return data.data.items.map((document: any) => {
      return {
        id: document.id,
        name: document.name,
        subject: document.subjectName,
        grade: document.grade,
        isFeatured: document.isFeatured
      }
    })
  }

  async getAllCourses(schoolId: number): Promise<ICourseItem[]> {
    const response = await axiosInstance.get("/Course/school/" + schoolId);
    const { data } = response;

    return data.map((course: any) => {
      return {
        id: course.id,
        name: course.name,
        subject: course.subjectName,
        grade: course.grade,
        isFeatured: course.isFeatured
      }
    })
  }

  async updateLandingPage(schoolId: number, landingPageData: ILandingPageUpdateService): Promise<string> {
    const formData = new FormData();
    formData.append("SchoolId", schoolId.toString());
    if (landingPageData.bannerImage) {
      formData.append("BannerFile", landingPageData.bannerImage);
    }
    if (landingPageData.logoImage) {
      formData.append("SchoolLogoFile", landingPageData.logoImage);
    }
    formData.append("Description", landingPageData.description);
    if (landingPageData.newLandingPageImages?.length) {
      for (const file of landingPageData.newLandingPageImages) {
        formData.append("LandingPageNewImages", file);
      }
    }
    for (const img of landingPageData.deletedLandingPageImages || []) {
      formData.append("LandingPageDeleteImages", img);
    }
    for (const id of landingPageData.featuredDocuments || []) {
      formData.append("FeaturedDocumentIds", id.toString());
    }
    for (const id of landingPageData.featuredCourses || []) {
      formData.append("FeaturedCourseIds", id.toString());
    }

    const response = await axiosInstance.put("/LandingPage", formData,
      {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      }
    );

    return response.status === 200 ? "" : response.data;
  }

  async getSchoolAddress(schoolId: number): Promise<string> {
    try {
      const res = await axiosInstance.get(`/LandingPage/${schoolId}/address`);
      if (res.status === 200) {
        return res.data;
      } else {
        throw new Error("Status: " + res.status);
      }
    } catch (error) {
      console.error("Error getSchoolAddress: ", error);
    }
    return '';
  }
}