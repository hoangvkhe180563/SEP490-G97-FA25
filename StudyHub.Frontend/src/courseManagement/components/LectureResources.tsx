import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
// button import removed; not used in the simplified resources UI

const LectureResources: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tài nguyên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            Không có tài nguyên nào đính kèm cho bài giảng này.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bài kiểm tra thực hành</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-3">
            Không có bài kiểm tra thực hành nào cho bài giảng này.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LectureResources;
