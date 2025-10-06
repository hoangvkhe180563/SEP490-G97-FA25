import React from "react";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import { Label } from "@/common/components/ui/label";
import { Checkbox } from "@/common/components/ui/checkbox";

const CourseFilters: React.FC = () => {
  return (
    <aside className="bg-white rounded-md p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-[#171717]">Filters</h3>
        <button className="text-sm text-gray-500 hover:underline">
          Clear all
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm">Category</Label>
            <span className="text-xs text-gray-400">(24)</span>
          </div>
          <div className="space-y-2 mt-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox />
              <span>Computer Science</span>
              <span className="ml-auto text-xs text-gray-400">(24)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox />
              <span>Mathematics</span>
              <span className="ml-auto text-xs text-gray-400">(18)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox />
              <span>Business</span>
              <span className="ml-auto text-xs text-gray-400">(12)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox />
              <span>Design</span>
              <span className="ml-auto text-xs text-gray-400">(8)</span>
            </label>
          </div>
        </div>

        <div>
          <Label className="text-sm">Level</Label>
          <div className="space-y-2 mt-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="level" className="w-4 h-4" />
              <span>Beginner</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="level" className="w-4 h-4" />
              <span>Intermediate</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="level" className="w-4 h-4" />
              <span>Advanced</span>
            </label>
          </div>
        </div>

        <div>
          <Label className="text-sm">Duration</Label>
          <div className="space-y-2 mt-2 text-sm">
            <label className="flex items-center gap-2">
              <Checkbox />
              <span>0-5 hours</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span>5-20 hours</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span>20+ hours</span>
            </label>
          </div>
        </div>

        <div>
          <Label className="text-sm">Instructor</Label>
          <Input placeholder="Search instructors..." className="mt-2" />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline">Apply</Button>
          <Button className="bg-black text-white">Reset</Button>
        </div>
      </div>
    </aside>
  );
};

export default CourseFilters;
