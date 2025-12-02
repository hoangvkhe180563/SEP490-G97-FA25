import { useEffect, useState } from "react"
import Banner from "../components/Banner"
import { UiManagementService } from "../services/UiManagementService"
import type { ILandingPageService } from "../interfaces/ILandingPageService";
import Introduction from "../components/Introduction";
import FeaturedDocuments from "../components/FeaturedDocuments";
import FeaturedCourses from "../components/FeaturedCourses";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import { useNavigate } from "react-router-dom";

const Homepage = () => {
  const [data, setData] = useState<ILandingPageService>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const uiManagementService = new UiManagementService();

  useEffect(() => {
    if (user && user.schoolId !== null) {
      navigate(`/ui/school-landing`);
      return;
    }

    const fetchData = async () => {
      try {
        const landingPageData = await uiManagementService.getLandingPageGeneral();
        setData(landingPageData);
      } catch (error) {
        console.log("error", error);
        setData({
          bannerImage: "/banner-image.png",
          logoImage: "/StudyHubLogo.png",
          description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
          featuredCourses: [],
          featuredDocuments: [],
          featuredTeachers: [],
          introductionImage: [
            "/StudyHubLogo.png",
            "/StudyHubLogo.png",
            "/StudyHubLogo.png"
          ]
        })
      }
    }

    fetchData().catch(console.error);
  }, [user])

  return <div className="w-full h-full overflow-y-auto">
    <Banner logo={data?.logoImage} image={data?.bannerImage} schoolId={0} />
    <Introduction description={data?.description} introductionImage={data?.introductionImage} />
    <FeaturedDocuments data={data?.featuredDocuments ?? []} />
    <FeaturedCourses data={data?.featuredCourses ?? []} />
    <footer>
      <div className="w-full py-2 bg-gray-100 flex flex-col items-center gap-2 bg-gradient-to-b from-sky-200 to-sky-300">
        <img className="w-70" src={data?.logoImage} alt="[StudyHub Logo]" />
        <span className="text-gray-500 text-sm font-bold">© 2025 StudyHub. Tất cả quyền được bảo lưu. <span className="text-blue-600 underline">Gửi phản hồi</span></span>
      </div>
    </footer>
  </div>
}

export default Homepage