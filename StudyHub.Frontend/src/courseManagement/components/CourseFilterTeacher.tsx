import React from "react";
import { Input } from "@/common/components/ui/input";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { Link } from "react-router-dom";

const CourseFilterTeacher: React.FC = () => {
  return (
    <div className="bg-white rounded-md shadow-sm p-4 mb-4">
      <div className="flex items-center gap-4">
        <Input placeholder="Search courses..." className="max-w-md" />

        <Select>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="programming">Programming</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Button className="bg-black text-white">
            <Link to="/teacher/add-course">+ Add Course</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseFilterTeacher;
