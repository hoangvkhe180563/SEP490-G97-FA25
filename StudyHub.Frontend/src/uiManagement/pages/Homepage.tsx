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
  const [school] = useLocalStorage('school', '');
  const [data, setData] = useState<ILandingPageService>(); //chỉnh sau
  const uiManagementService = new UiManagementService();

  useEffect(() => {
    if (!school) {
      setData(uiManagementService.getLandingPageGeneralInformation());
    } else {
      setData(uiManagementService.getLandingPageSchoolInformation());
    }
  }, [])

  return <div className="w-full overflow-hidden">
    <Banner background={data?.primaryColor} logo={data?.logoImage} image={data?.bannerImage} />
    <Introduction background={data?.primaryColor} description={data?.description} introductionImage={data?.introductionImage} />
    {school && <FeaturedTeachers data={data?.featuredTeachers ?? []} />}
    <FeaturedDocuments data={data?.featuredDocuments ?? []} />
    <FeaturedCourses data={data?.featuredCourses ?? []} />
  </div>
}

export default Homepage