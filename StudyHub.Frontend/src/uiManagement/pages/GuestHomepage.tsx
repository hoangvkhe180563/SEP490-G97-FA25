import { useEffect, useState } from "react"
import Banner from "../components/Banner"
import { UiManagementService } from "../services/UiManagementService"
import type { ILandingPageService } from "../interfaces/ILandingPageService";
import Introduction from "../components/Introduction";
import FeaturedDocuments from "../components/FeaturedDocuments";
import FeaturedCourses from "../components/FeaturedCourses";
import { Card } from "@/common/components/ui/card";
import { BookOpen, Search, Users, Video } from "lucide-react";
import { Link } from "react-router-dom";

const GuestHomepage = () => {
  const [data, setData] = useState<ILandingPageService>();
  const uiManagementService = new UiManagementService();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const landingPageData = await uiManagementService.getLandingPageGeneral();
        setData(landingPageData);
      } catch (error) {
        console.log("error", error);
      }
    }

    fetchData().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div className="w-full h-full overflow-y-auto">
    <Banner logo="/StudyHubLogo.png" image="/banner-image.png" schoolId={0} />
    <Introduction description="StudyHub là một trang web phục vụ học tập và ôn luyện cho học sinh, giúp học sinh định hướng được phương pháp học tập cho bản thân. Với mong muốn tối ưu hóa trải nghiệm học tập cho học sinh, StudyHub không chỉ mang đến cho học sinh những học liệu chất lượng, mà còn đề xuất lộ trình học tập cụ thể cho học sinh thông qua AI theo nhu cầu.<br/>StudyHub hỗ trợ các tính năng:
    <ul class='list-disc pl-10 py-2'>
      <li>Tìm kiếm, xem và phân tích <b>tài liệu</b></li>
      <li>Ôn luyện thông qua tương tác với <b>khóa học</b> và <b>lớp học</b></li>
      <li>Ôn luyện thông qua <b>bài kiểm tra</b></li>
      <li><b>Hỏi đáp</b> với giáo viên/học sinh</li>
      <li>Đề xuất lộ trình học với <b>AI</b></li>
    </ul>
    " introductionImage={
        [
          "/intro1.png",
          "/intro2.png",
          "/intro3.png",
          "/intro4.png",
          "/intro5.png"
        ]
      } />

    <section id="features" className="py-12 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Một nền tảng. Mọi tính năng bạn cần.
          </h2>
          <p className="mt-4 text-lg text-slate-600">Không còn phải chuyển đổi giữa Zalo, Google Classroom, Google Drive...</p>
          <p className="text-lg text-slate-600">StudyHub tích hợp tất cả vào một nơi duy nhất.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Video size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Khóa học</h3>
            <p className="text-slate-600 leading-relaxed">
              Học theo tốc độ của cá nhân với video bài giảng chất lượng cao. Tự động đề xuất khóa học bổ trợ kiến thức bị hổng.
            </p>
          </Card>

          <Card className="p-8 hover:shadow-md transition-shadow border-blue-200 bg-blue-50/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Search size={100} />
            </div>
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Tài liệu</h3>
            <p className="text-slate-600 leading-relaxed">
              Tra cứu nội dung bên trong SGK và sách tham khảo chỉ trong tích tắc.
            </p>
          </Card>

          <Card className="p-8 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Lớp học</h3>
            <p className="text-slate-600 leading-relaxed">
              Nộp bài tập, xem điểm và tương tác với giáo viên dễ dàng. Không bao giờ bỏ lỡ thông báo hay deadline quan trọng.
            </p>
          </Card>
        </div>
      </div>
    </section>

    <FeaturedDocuments data={data?.featuredDocuments ?? []} />
    <FeaturedCourses data={data?.featuredCourses ?? []} />

    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="bg-sky-600 rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Sẵn sàng bứt phá điểm số?
            </h2>
            <p className="text-blue-100 text-lg">
              Tham gia StudyHub ngay!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link to={'/auth/register'}>
                <button className="h-12 px-8 rounded-md bg-white text-sky-600 font-bold text-lg hover:bg-slate-100 transition-colors">
                  Đăng ký miễn phí
                </button>
              </Link>
            </div>
          </div>

          <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-1/3 translate-y-1/3"></div>
        </div>
      </div>
    </section>

    <footer>
      <div className="w-full py-2 bg-gray-100 flex flex-col items-center gap-2 bg-gradient-to-b from-sky-200 to-sky-300">
        <img className="w-70" src="/StudyHubLogo.png" alt="[StudyHub Logo]" />
        <span className="text-gray-500 text-sm font-bold">© 2025 StudyHub. Tất cả quyền được bảo lưu. </span>
      </div>
    </footer>
  </div>
}

export default GuestHomepage