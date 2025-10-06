import type { ILandingPageService } from "../interfaces/ILandingPageService";

export class UiManagementService {
  getLandingPageGeneralInformation(): ILandingPageService {
    return {
      logoImage: "/src/common/assets/StudyHubLogo.png",
      bannerImage: "/src/uiManagement/assets/banner-image.png",
      primaryColor: "bg-blue-300",
      description: "Mười năm trôi qua,một chặng đường tuy không quá dài nhưng trường THCS – THPT ABCXYZ đã khẳng định được vị trí của mình trong sự nghiệp giáo dục Thủ đô.Trường THCS-THPT ABCXYZ tiền thân là trường Phổ thông Quốc tế XYZABC thành lập theo quyết định ngày 21/5/2009 theo quyết định số 2398/QĐ-UBND của UBND thành p...",
      introductionImage: [
        "/src/common/assets/StudyHubLogo.png",
        "/src/common/assets/StudyHubLogo.png",
        "/src/common/assets/StudyHubLogo.png"
      ],
      featuredDocuments: [
        {
          type: "textbook",
          image: "/src/uiManagement/assets/toan-1.jpg",
          id: 1,
          name: "Toán 1",
          subject: "Toán",
          grade: 1
        },
        {
          type: "textbook",
          image: "/src/uiManagement/assets/toan-2.jpg",
          id: 2,
          name: "Toán 2",
          subject: "Toán",
          grade: 2
        },
        {
          type: "textbook",
          image: "/src/uiManagement/assets/toan-1.jpg",
          id: 3,
          name: "Toán 3",
          subject: "Toán",
          grade: 3
        },
        {
          type: "reference",
          image: "/src/uiManagement/assets/toan-1.jpg",
          id: 4,
          name: "Toán 1",
          subject: "Toán",
          grade: 1
        },
        {
          type: "reference",
          image: "/src/uiManagement/assets/toan-2.jpg",
          id: 5,
          name: "Toán 2",
          subject: "Toán",
          grade: 2
        },
        {
          type: "reference",
          image: "/src/uiManagement/assets/toan-1.jpg",
          id: 6,
          name: "Toán 3",
          subject: "Toán",
          grade: 3
        },
      ],
      featuredCourses: [
        {
          image: "/src/uiManagement/assets/fmo.png",
          id: 1,
          name: "Khoá học Tin học lớp 3",
          subject: "Tin",
          grade: 3,
          numberOfStudents: 1234,
          price: 0
        },
        {
          image: "/src/uiManagement/assets/fmo.png",
          id: 2,
          name: "Khoá học Tin học lớp 4",
          subject: "Tin",
          grade: 4,
          numberOfStudents: 36,
          price: 0
        },
        {
          image: "/src/uiManagement/assets/fmo.png",
          id: 3,
          name: "Khoá học Tin học lớp 5",
          subject: "Tin",
          grade: 5,
          numberOfStudents: 12,
          price: 50000
        }
      ]
    }
  }

  getLandingPageSchoolInformation(): ILandingPageService {
    return {
      logoImage: "/src/uiManagement/assets/hts.png",
      bannerImage: "/src/uiManagement/assets/banner-hts.png",
      primaryColor: "bg-emerald-300",
      description: "Mười năm trôi qua,một chặng đường tuy không quá dài nhưng trường THCS - THPT ABCXYZ đã khẳng định được vị trí của mình trong sự nghiệp giáo dục Thủ đô.Trường THCS-THPT ABCXYZ tiền thân là trường Phổ thông Quốc tế XYZABC thành lập theo quyết định ngày 21/5/2009 theo quyết định số 2398/QĐ-UBND của UBND thành p...",
      introductionImage: [
        "/src/uiManagement/assets/banner-hts.png",
        "/src/uiManagement/assets/banner-hts.png",
        "/src/uiManagement/assets/banner-hts.png"
      ],
      featuredTeachers: [
        {
          id: 1,
          image: "/src/uiManagement/assets/anhsangaza.png",
          name: "Nguyễn Văn A",
          role: "Giáo viên bộ môn"
        },
        {
          id: 2,
          image: "/src/uiManagement/assets/daotua1j.png",
          name: "Nguyễn Văn B",
          role: "Giáo viên bộ môn"
        },
        {
          id: 3,
          image: "/src/uiManagement/assets/orange.png",
          name: "Nguyễn Văn C",
          role: "Giáo viên bộ môn"
        },
        {
          id: 4,
          image: "/src/uiManagement/assets/phuongmychi.png",
          name: "Nguyễn Văn D",
          role: "Giáo viên bộ môn"
        }
      ],
      featuredDocuments: [
        {
          type: "textbook",
          image: "/src/uiManagement/assets/toan-1.jpg",
          id: 1,
          name: "Toán 1",
          subject: "Toán",
          grade: 1
        },
        {
          type: "textbook",
          image: "/src/uiManagement/assets/toan-2.jpg",
          id: 2,
          name: "Toán 2",
          subject: "Toán",
          grade: 2
        },
        {
          type: "textbook",
          image: "/src/uiManagement/assets/toan-1.jpg",
          id: 3,
          name: "Toán 3",
          subject: "Toán",
          grade: 3
        },
        {
          type: "reference",
          image: "/src/uiManagement/assets/toan-1.jpg",
          id: 4,
          name: "Toán 1",
          subject: "Toán",
          grade: 1
        },
        {
          type: "reference",
          image: "/src/uiManagement/assets/toan-2.jpg",
          id: 5,
          name: "Toán 2",
          subject: "Toán",
          grade: 2
        },
        {
          type: "reference",
          image: "/src/uiManagement/assets/toan-1.jpg",
          id: 6,
          name: "Toán 3",
          subject: "Toán",
          grade: 3
        },
      ],
      featuredCourses: [
        {
          image: "/src/uiManagement/assets/fmo.png",
          id: 1,
          name: "Khoá học Tin học lớp 3",
          subject: "Tin",
          grade: 3,
          numberOfStudents: 1234,
          price: 0
        },
        {
          image: "/src/uiManagement/assets/fmo.png",
          id: 2,
          name: "Khoá học Tin học lớp 4",
          subject: "Tin",
          grade: 4,
          numberOfStudents: 36,
          price: 0
        },
        {
          image: "/src/uiManagement/assets/fmo.png",
          id: 3,
          name: "Khoá học Tin học lớp 5",
          subject: "Tin",
          grade: 5,
          numberOfStudents: 12,
          price: 50000
        }
      ]
    }
  }
}