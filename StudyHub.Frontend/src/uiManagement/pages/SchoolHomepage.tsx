import { useEffect, useState } from "react"
import Banner from "../components/Banner"
import { UiManagementService } from "../services/UiManagementService"
import type { ILandingPageService } from "../interfaces/ILandingPageService";
import Introduction from "../components/Introduction";
import FeaturedDocuments from "../components/FeaturedDocuments";
import FeaturedCourses from "../components/FeaturedCourses";
import FeaturedTeachers from "../components/FeaturedTeachers";
import { useParams } from "react-router-dom";

const SchoolHomepage = () => {
  const [data, setData] = useState<ILandingPageService>();
  const uiManagementService = new UiManagementService();
  const { schoolId } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!Number(schoolId)) {
          //navigate to Not Found
          throw new Error("Truyền sai id. Ngu như bò (bò ở đây là TL)!");
        }
        const landingPageData = await uiManagementService.getLandingPageSchool(Number(schoolId));
        setData(landingPageData);
      } catch (error) {
        console.log("error", error);
        setData({
          bannerImage: "/src/uiManagement/assets/banner-image.png",
          logoImage: "/src/common/assets/StudyHubLogo.png",
          description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
          featuredCourses: [],
          featuredDocuments: [],
          featuredTeachers: [
            {
              id: 1,
              imageUrl: "https://github.com/shadcn.png",
              name: "Giáo viên 1"
            }
          ],
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
    <Banner logo={data?.logoImage} image={data?.bannerImage} schoolId={Number(schoolId) ?? 0}/>
    <Introduction description={data?.description} introductionImage={data?.introductionImage} />
    {data && data.featuredTeachers && <FeaturedTeachers data={data.featuredTeachers ?? []} />}
    <FeaturedDocuments data={data?.featuredDocuments ?? []} />
    <FeaturedCourses data={data?.featuredCourses ?? []} />
  </div>
}

export default SchoolHomepage