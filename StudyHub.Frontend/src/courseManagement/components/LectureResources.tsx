import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";

const LectureResources: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 border rounded">
              <div className="text-sm">Lecture Notes</div>
              <div className="text-xs text-gray-500">PDF · 2.4 MB</div>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <div className="text-sm">Practice Problems</div>
              <div className="text-xs text-gray-500">PDF · 1.8 MB</div>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <div className="text-sm">Matrix Calculator</div>
              <div className="text-xs text-gray-500">External Link</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Practice Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mb-3">
            Test your understanding with 10 questions about matrix operations.
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <div>Duration: 15 minutes</div>
              <div className="mt-2">Questions: 10</div>
              <Button className="mt-4">Start Practice Test</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LectureResources;
