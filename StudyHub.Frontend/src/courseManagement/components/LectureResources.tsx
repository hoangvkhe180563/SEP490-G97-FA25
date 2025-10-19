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
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            No resources attached to this lecture.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Practice Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-3">
            No practice tests available for this lecture.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LectureResources;
