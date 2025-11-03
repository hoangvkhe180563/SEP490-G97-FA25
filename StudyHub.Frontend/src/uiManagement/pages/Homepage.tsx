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

  if (user && user.schoolId !== 0) {
    navigate(`/ui/${user.schoolId}/landing`);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const landingPageData = await uiManagementService.getLandingPageGeneral();
        setData(landingPageData);
      } catch (error) {
        console.log("error", error);
        setData({
          bannerImage: "/src/uiManagement/assets/banner-image.png",
          logoImage: "/src/common/assets/StudyHubLogo.png",
          description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
          featuredCourses: [],
          featuredDocuments: [],
          featuredTeachers: [],
          introductionImage: [
            "/src/common/assets/StudyHubLogo.png",
            "/src/common/assets/StudyHubLogo.png",
            "/src/common/assets/StudyHubLogo.png"
          ]
        })
      }
    }

    fetchData().catch(console.error);
  }, [])

  return <div className="w-full h-full overflow-y-auto">
    <Banner logo={data?.logoImage} image={data?.bannerImage} schoolId={0} />
    <Introduction description={data?.description} introductionImage={data?.introductionImage} />
    <FeaturedDocuments data={data?.featuredDocuments ?? []} />
    <FeaturedCourses data={data?.featuredCourses ?? []} />
  </div>
}

export default Homepage