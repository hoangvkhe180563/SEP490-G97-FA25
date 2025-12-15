import { axiosInstance } from "@/lib/axios";
import type { ILandingPageService } from "../interfaces/ILandingPageService";
import type { IDocumentItem } from "../interfaces/IDocumentItem";
import type { ICourseItem } from "../interfaces/ICourseItem";
import type { ILandingPageUpdateService } from "../interfaces/ILandingPageUpdateService";
import type { School } from "../interfaces/School";
import type { City } from "@/auth/interfaces/city";
import type { Commune } from "../interfaces/Address";
import type { ISchoolData } from "../interfaces/ISchoolData";

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

  async getSchools(): Promise<School[]> {
    try {
      const res = await axiosInstance.get(`/LandingPage/schools`);
      if (res.status === 200) {
        return res.data.map((item: any) => {
          return {
            id: item.schoolId,
            name: item.schoolName,
            description: item.description,
            banner: item.bannerUrl,
            logo: item.logoUrl,
            address: item.address
          }
        });
      } else {
        throw new Error("Status: " + res.status);
      }
    } catch (error) {
      console.error("Error getSchools: ", error);
    }
    return [];
  }

  async getCities(): Promise<City[]> {
    try {
      const res = await axiosInstance.get(`/Location/cities`);
      if (res.status === 200) {
        return res.data.map((item: any) => {
          return {
            id: item.id,
            name: item.name
          }
        });
      } else {
        throw new Error("Status: " + res.status);
      }
    } catch (error) {
      console.error("Error getCities: ", error);
    }
    return [];
  }

  async getCommunesByCity(cityId: number): Promise<Commune[]> {
    try {
      const res = await axiosInstance.get(`/Location/cities/${cityId}/communes`);
      if (res.status === 200) {
        return res.data.map((item: any) => {
          return {
            id: item.id,
            name: item.name,
            cityId: item.cityId
          }
        });
      } else {
        throw new Error("Status: " + res.status);
      }
    } catch (error) {
      console.error("Error getCommunesByCity: ", error);
    }
    return [];
  }

  async addSchool(schoolData: ISchoolData): Promise<boolean> {
    if (!schoolData.banner || !schoolData.logo) {
      return false;
    }
    try {
      const formData = new FormData();
      formData.append("SchoolName", schoolData.schoolName);
      formData.append("CommuneId", schoolData.communeId.toString());
      formData.append("Banner", schoolData.banner);
      formData.append("Logo", schoolData.logo);
      formData.append("Description", schoolData.description);
      formData.append("Address", schoolData.address);
      for (const file of schoolData.newLandingPageImages) {
        formData.append("NewLandingPageImages", file);
      }
      formData.append("AccountName", schoolData.accountName);
      formData.append("AccountNumber", schoolData.accountNumber);
      formData.append("AccountBank", schoolData.accountName);
      formData.append("ExchangeRate", schoolData.exchangeRate.toString());

      const res = await axiosInstance.post("/LandingPage/schools/add", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      if (res.status === 200) {
        return true;
      } else {
        throw new Error("Status: " + res.status);
      }
    } catch (error) {
      console.error("Error addSchool: ", error);
    }
    return false;
  }
}