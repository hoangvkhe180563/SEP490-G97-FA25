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
        <CardTitle>Discussion</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs">
              AC
            </div>
            <div>
              <div className="text-sm font-medium">
                Alex Chen{" "}
                <span className="text-xs text-gray-500">• 2 hours ago</span>
              </div>
              <div className="text-sm text-gray-700">
                Great explanation of matrix multiplication! The examples really
                helped.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs">
              MR
            </div>
            <div>
              <div className="text-sm font-medium">
                Maria Rodriguez{" "}
                <span className="text-xs text-gray-500">• 5 hours ago</span>
              </div>
              <div className="text-sm text-gray-700">
                Could you provide more examples of non-commutative
                multiplication?
              </div>
            </div>
          </div>

          <div className="mt-3">
            <button className="text-sm text-gray-600">View All Comments</button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LectureDiscussion;
