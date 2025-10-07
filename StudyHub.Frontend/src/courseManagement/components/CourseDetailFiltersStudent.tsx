import React from "react";
import { Checkbox } from "@/common/components/ui/checkbox";
import { Label } from "@/common/components/ui/label";

const CourseNavSidebar: React.FC = () => {
  return (
    <aside className="space-y-6">
      <div className="bg-white rounded-md p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Course Navigation</h4>
          <button className="text-xs text-gray-400">Clear</button>
        </div>

        <div className="text-sm text-gray-600 mb-2">Progress Filter</div>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span>Completed</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <span>In Progress</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span>Not Started</span>
          </label>
        </div>

        <div className="mt-4 text-sm text-gray-600">Content Type</div>
        <div className="space-y-2 text-sm mt-2">
          <label className="flex items-center gap-2">
            <Checkbox />
            <span>Video Lessons</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox />
            <span>Reading Material</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox />
            <span>Assignments</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox />
            <span>Quizzes</span>
          </label>
        </div>

        <div className="mt-4">
          <Label className="text-sm">Duration</Label>
          <select className="w-full mt-2 border rounded px-2 py-1 text-sm">
            <option>All Durations</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-md p-4 shadow-sm">
        <h4 className="text-sm font-medium mb-2">Course Stats</h4>
        <div className="text-sm text-gray-600">Overall Progress</div>
        <div className="w-full bg-gray-100 h-3 rounded mt-2 overflow-hidden">
          <div className="bg-gray-700 h-3 w-2/3" />
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500 mt-3">
          <div>12 Completed</div>
          <div>6 Remaining</div>
        </div>
      </div>
    </aside>
  );
};

export default CourseNavSidebar;
