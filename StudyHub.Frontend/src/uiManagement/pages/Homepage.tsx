import { useEffect, useState } from "react"
import Banner from "../components/Banner"
import { UiManagementService } from "../services/UiManagementService"
import type { ILandingPageService } from "../interfaces/ILandingPageService";
import Introduction from "../components/Introduction";
import FeaturedDocuments from "../components/FeaturedDocuments";
import FeaturedCourses from "../components/FeaturedCourses";
import FeaturedTeachers from "../components/FeaturedTeachers";
import useLocalStorage from "@/common/hooks/useLocalStorage";

const Homepage = () => {
  const [data, setData] = useState<ILandingPageService>(); //chỉnh sau
  const uiManagementService = new UiManagementService();
  const [schoolId] = useLocalStorage("schoolId", 0);

  useEffect(() => {
    const fetchData = async () => {
      const landingPageData = await uiManagementService.getLandingPageInformation(schoolId);
      setData(landingPageData);
    }

    fetchData().catch(console.error);
  }, [])

  return <div className="w-full overflow-hidden">
    <Banner logo="/src/common/assets/StudyHubLogo.png" image={data?.bannerImage} />
    <Introduction description={data?.description} introductionImage={data?.introductionImage} />
    {schoolId !== 0 && <FeaturedTeachers data={data?.featuredTeachers ?? []} />}
    <FeaturedDocuments data={data?.featuredDocuments ?? []} />
    <FeaturedCourses data={data?.featuredCourses ?? []} />
  </div>
}

export default Homepage