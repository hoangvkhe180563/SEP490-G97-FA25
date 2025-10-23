import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";

const LectureDiscussion: React.FunctionComponent = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuộc thảo luận</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs">
              T
            </div>
            <div>
              <div className="text-sm font-medium">
                Thành{" "}
                <span className="text-xs text-gray-500">• 2 giờ trước</span>
              </div>
              <div className="text-sm text-gray-700">
                Giải thích tuyệt vời về phép nhân ma trận! Các ví dụ thực sự hữu
                ích.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs">
              C
            </div>
            <div>
              <div className="text-sm font-medium">
                Chun{" "}
                <span className="text-xs text-gray-500">• 5 giờ trước</span>
              </div>
              <div className="text-sm text-gray-700">
                Bạn có thể cung cấp thêm ví dụ về phép nhân không giao hoán
                không?
              </div>
            </div>
          </div>

          <div className="mt-3">
            <button className="text-sm text-gray-600">
              Xem tất cả bình luận
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LectureDiscussion;
