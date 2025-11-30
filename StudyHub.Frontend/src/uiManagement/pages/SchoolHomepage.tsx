import { useEffect, useState } from "react"
import Banner from "../components/Banner"
import { UiManagementService } from "../services/UiManagementService"
import type { ILandingPageService } from "../interfaces/ILandingPageService";
import Introduction from "../components/Introduction";
import FeaturedDocuments from "../components/FeaturedDocuments";
import FeaturedCourses from "../components/FeaturedCourses";
import FeaturedTeachers from "../components/FeaturedTeachers";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/auth/stores/useAuthStore";
import toast from "react-hot-toast";

const SchoolHomepage = () => {
  const [data, setData] = useState<ILandingPageService>();
  const navigate = useNavigate();
  const uiManagementService = new UiManagementService();
  const { user } = useAuthStore();
  const [schoolId, setSchoolId] = useState<number>(0);
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        return;
      }
      try {
        const schoolId = user.schoolId;
        if (!schoolId) {
          toast.error("Bạn không có quyền truy cập!");
          navigate("/");
          return;
        }
        setSchoolId(schoolId);
        const landingPageData = await uiManagementService.getLandingPageSchool(schoolId);
        setData(landingPageData);

        const address = await uiManagementService.getSchoolAddress(schoolId);
        setAddress(address);
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
  }, [user])

  return <div className="w-full h-full overflow-y-auto">
    <Banner logo={data?.logoImage} image={data?.bannerImage} schoolId={schoolId} />
    <Introduction description={data?.description} introductionImage={data?.introductionImage} />
    {data && data.featuredTeachers && <FeaturedTeachers data={data.featuredTeachers ?? []} />}
    <FeaturedDocuments data={data?.featuredDocuments ?? []} />
    <FeaturedCourses data={data?.featuredCourses ?? []} />
    <footer>
      <div className="w-full py-2 bg-gray-100 flex flex-col items-center gap-2 bg-gradient-to-b from-sky-200 to-sky-300">
        <div className="flex space-x-5 justify-center items-center">
          <img className="w-70 h-30" src="/src/common/assets/StudyHubLogo.png" alt="[StudyHub Logo]" />
          <span className="font-bold text-lg">x</span>
          <img className="w-70 h-30" src={data?.logoImage} alt="[School Logo]" />
        </div>
        <span>Địa chỉ: {address}</span>
        <span className="text-gray-500 text-sm font-bold">© 2025 StudyHub. Tất cả quyền được bảo lưu. <span className="text-blue-600 underline">Gửi phản hồi</span></span>
      </div>
    </footer>
  </div>
}

export default SchoolHomepage