import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";

const LectureNextUp: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Next Up</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Determinants</div>
            <div className="text-sm text-gray-800 mt-1">
              15:20 • Next lecture
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            ▶
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LectureNextUp;
