import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/common/components/ui/card";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/common/components/ui/select";
import {
  AddLessonButton,
  Button,
  ViewLessonButton,
  EditLessonButton,
} from "@/common/components/ui/button";
import { Label } from "@/common/components/ui/label";
import {
  ArrowLeft,
  Upload,
  Video,
  X,
  Trash2,
  GripVertical,
} from "lucide-react";

const AddCourse: React.FC = () => {
  const navigate = useNavigate();
  const [tags, setTags] = useState<string[]>(["JavaScript", "React"]);
  const [tagInput, setTagInput] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      setTags((s) => [...s, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags((s) => s.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-[#525252] mb-3">Courses / Add Course</div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center border border-[#E5E5E5] rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 text-[#525252]" />
            </button>

            <div>
              <h1 className="text-2xl font-normal text-[#171717]">
                Add Course
              </h1>
              <p className="text-sm text-[#525252]">
                Modify course details and content
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Course title, description and meta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label>Course Title</Label>
                    <Input placeholder="Enter course title" />
                  </div>

                  <div className="space-y-4">
                    <Label>Course Description</Label>
                    <Textarea
                      placeholder="Describe what students will learn in this course"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 ">
                    <div className="space-y-4">
                      <Label>Category</Label>
                      <Select>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="programming">
                            Programming
                          </SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label>Difficulty Level</Label>
                      <Select>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">
                            Intermediate
                          </SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Course Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label>Course Thumbnail</Label>
                    <div className="mt-2 border-2 border-dashed border-[#D4D4D4] rounded-lg h-[196px] flex flex-col items-center justify-center">
                      <Upload className="w-[38px] h-[30px] text-[#A3A3A3] mb-2" />
                      <p className="text-sm text-[#525252] mb-1">
                        Drop your image here or click to browse
                      </p>
                      <p className="text-xs text-[#737373] mb-3">
                        Recommended size: 1280x720px
                      </p>
                      <Button variant="outline">Choose File</Button>
                    </div>
                  </div>

                  <div>
                    <Label>Course Preview Video (Optional)</Label>
                    <div className="mt-2 border-2 border-dashed border-[#D4D4D4] rounded-lg h-[166px] flex flex-col items-center justify-center">
                      <Video className="w-[27px] h-6 text-[#A3A3A3] mb-2" />
                      <p className="text-sm text-[#525252] mb-1">
                        Upload a preview video
                      </p>
                      <p className="text-xs text-[#737373] mb-3">
                        Max file size: 100MB
                      </p>
                      <Button variant="outline">Upload Video</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle>Course Content</CardTitle>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" /> Add Section
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-[#E5E5E5] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base text-[#171717]">
                        Section 1: Introduction
                      </h3>
                      <div className="flex items-center gap-2">
                        <ViewLessonButton />
                        <EditLessonButton />
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Trash2 className="w-3.5 h-4 text-[#A3A3A3]" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-[#FAFAFA] rounded h-9 px-2 flex items-center justify-between">
                        <span className="text-sm text-[#404040]">
                          Lesson 1: Welcome to the Course
                        </span>
                        <GripVertical className="w-2.5 h-4 text-[#A3A3A3]" />
                      </div>

                      <AddLessonButton />
                    </div>

                    <AddLessonButton className="mt-2" />

                    {/* Local helper component wired to navigation */}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <Label>Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1 text-base text-[#737373]">
                          $
                        </span>
                        <Input className="pl-8" placeholder="0.00" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Duration</Label>
                      <Input placeholder="e.g., 8 weeks" />
                    </div>

                    <div className="space-y-4">
                      <Label>Max Students</Label>
                      <Input placeholder="Unlimited" />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-[#404040]">Published</span>
                      <button
                        onClick={() => setIsPublished(!isPublished)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          isPublished ? "bg-[#171717]" : "bg-[#D4D4D4]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            isPublished ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Instructor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <Label>Primary Instructor</Label>
                      <Select>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select instructor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="john">John Smith</SelectItem>
                          <SelectItem value="sarah">Sarah Johnson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-[#FAFAFA] rounded-lg p-3 flex items-center gap-3">
                      <img
                        src="https://api.builder.io/api/v1/image/assets/TEMP/ad7da240b72ac1157e7a1043cd1b1821bb4369b1?width=80"
                        alt="Sarah Johnson"
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="text-sm text-[#171717]">
                          Sarah Johnson
                        </div>
                        <div className="text-xs text-[#737373]">
                          Web Development Expert
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Add tags (press Enter)"
                      className="w-full h-[42px] px-3 border border-[#D4D4D4] rounded-md text-base placeholder:text-[#ADAEBC] focus:outline-none focus:ring-1 focus:ring-[#D4D4D4]"
                    />

                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 px-2 h-6 bg-[#F5F5F5] rounded"
                        >
                          <span className="text-xs text-[#262626]">{tag}</span>
                          <button
                            onClick={() => removeTag(index)}
                            className="hover:bg-gray-200 rounded"
                          >
                            <X className="w-3 h-3 text-[#262626]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AddCourse;

// small helper used in page to navigate to add-lecture
