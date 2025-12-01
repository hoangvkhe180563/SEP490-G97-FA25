import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { ArrowRight, Sparkles, User } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

const IntroCard: React.FC = () => {
  const nav = useNavigate();

  return (
    <div
      className="
        relative min-h-screen flex items-center justify-center p-6
        bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 
        dark:from-slate-900 dark:via-slate-950 dark:to-slate-900
      "
    >
      {/* Dot grid background (Linear / Vercel style) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.2] dark:opacity-[0.15]
          bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.20)_1px,transparent_0)] 
          bg-[size:22px_22px]"
      />

      {/* Aurora soft glow */}
      <div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[350px] 
           bg-indigo-300/20 dark:bg-indigo-500/20 blur-3xl rounded-full"
      />

      <div
        className="absolute bottom-10 left-24 w-[400px] h-[250px] 
           bg-purple-300/20 dark:bg-purple-600/20 blur-3xl rounded-full"
      />

      <div
        className="absolute top-32 right-32 w-[300px] h-[200px] 
           bg-blue-300/20 dark:bg-blue-600/20 blur-2xl rounded-full"
      />

      {/* Main Card */}
      <Card
        className="relative z-10 max-w-4xl w-full shadow-[0_8px_30px_rgba(0,0,0,0.08)] 
                       dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]
                       border border-white/20 dark:border-slate-700/50 
                       backdrop-blur-xl bg-white/70 dark:bg-slate-900/40 rounded-2xl"
      >
        <CardHeader>
          <CardTitle className="text-3xl font-semibold">
            Tùy chọn gợi ý học tập bằng AI
          </CardTitle>
          <CardDescription className="text-base">
            Chọn cách AI phân tích để tạo ra lộ trình và gợi ý học tập phù hợp
            nhất với bạn.
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
            {/* Option 1 */}
            <Card
              className="p-5 border-slate-300/40 dark:border-slate-700/40 
                         hover:shadow-md hover:bg-white/60 dark:hover:bg-slate-800/40
                         transition cursor-pointer rounded-xl backdrop-blur-sm"
              onClick={() => nav("/recommend/student/results?mode=profile")}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                  <User className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">
                    Sử dụng dữ liệu của tôi
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    AI phân tích lịch sử học tập, điểm mạnh/yếu và tiến độ để
                    đưa ra gợi ý chính xác nhất.
                  </p>
                </div>

                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            </Card>

            {/* Option 2 */}
            <Card
              className="p-5 border-slate-300/40 dark:border-slate-700/40
                         hover:shadow-md hover:bg-white/60 dark:hover:bg-slate-800/40
                         transition cursor-pointer rounded-xl backdrop-blur-sm"
              onClick={() => nav("/recommend/student/llm")}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Sparkles className="w-6 h-6 text-slate-800 dark:text-slate-200" />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">
                    Nhập mô tả / mục tiêu học tập
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Bạn nhập vấn đề, mục tiêu hoặc kỹ năng muốn cải thiện — AI
                    sẽ phân tích và đề xuất phù hợp.
                  </p>
                </div>

                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            </Card>
          </div>

          <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">
            <strong>Lưu ý:</strong> Mỗi cách phân tích sẽ mang lại kết quả khác
            nhau tùy vào mức độ chi tiết của dữ liệu bạn cung cấp.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntroCard;
