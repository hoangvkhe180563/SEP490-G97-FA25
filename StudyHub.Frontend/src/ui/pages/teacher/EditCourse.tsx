import React from "react";
import { useNavigate } from "react-router-dom";
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
  Button,
  ViewLessonButton,
  AddLessonButton,
  EditLessonButton,
} from "@/common/components/ui/button";
import { Label } from "@/common/components/ui/label";
import { ArrowLeft, Trash2, Upload, Video } from "lucide-react";

const EditCourse: React.FC = () => {
  const navigate = useNavigate();
  // demo edit page - no local tag state used here

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        {/* Breadcrumb */}
        <div className="text-sm text-[#525252] mb-3">Courses / Edit Course</div>

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
                Edit Course
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
                    <Input defaultValue="Complete Web Development Bootcamp" />
                  </div>

                  <div className="space-y-4">
                    <Label>Short Description</Label>
                    <Textarea
                      defaultValue={
                        "Master full-stack web development from scratch with hands-on projects and real-world applications."
                      }
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 ">
                    <div className="space-y-4">
                      <Label>Category</Label>
                      <Select>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Web Development" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web">Web Development</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label>Difficulty Level</Label>
                      <Select>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Beginner" />
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
                <CardTitle>Course Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Module 1 */}
                  <div className="border border-[#E5E5E5] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base text-[#171717]">
                        Module 1: HTML Fundamentals
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
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#D9D9D9]" />
                          <span className="text-sm text-[#404040]">
                            Introduction to HTML
                          </span>
                        </div>
                        <span className="text-xs text-[#8A8A8A]">15:30</span>
                      </div>

                      <div className="bg-[#FAFAFA] rounded h-9 px-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#D9D9D9]" />
                          <span className="text-sm text-[#404040]">
                            HTML: Tags and Elements
                          </span>
                        </div>
                        <span className="text-xs text-[#8A8A8A]">22:45</span>
                      </div>

                      <AddLessonButton />
                    </div>
                  </div>

                  {/* Module 2 */}
                  <div className="border border-[#E5E5E5] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base text-[#171717]">
                        Module 2: CSS Styling
                      </h3>
                      <div className="flex items-center gap-2">
                        <EditLessonButton />
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Trash2 className="w-3.5 h-4 text-[#A3A3A3]" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-[#FAFAFA] rounded h-9 px-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#D9D9D9]" />
                          <span className="text-sm text-[#404040]">
                            CSS Basics
                          </span>
                        </div>
                        <span className="text-xs text-[#8A8A8A]">18:20</span>
                      </div>

                      <AddLessonButton className="mt-2" />
                    </div>
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
                  <CardTitle>Course Thumbnail</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-36 bg-[#D9D9D9] rounded flex flex-col items-center justify-center text-sm text-[#666]">
                      <Upload className="w-6 h-6 text-[#666] mb-2" />
                      <div>Course Thumbnail</div>
                    </div>
                    <Button variant="outline">Upload New Image</Button>
                    <div className="mt-3 border-2 border-dashed border-[#D4D4D4] rounded-lg h-[120px] flex flex-col items-center justify-center">
                      <Video className="w-6 h-6 text-[#A3A3A3] mb-2" />
                      <div className="text-sm text-[#525252]">
                        Preview Video
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Course Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-base text-[#737373]">
                          $
                        </span>
                        <Input className="pl-8" defaultValue="199.00" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Access Type</Label>
                      <Select>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Lifetime Access" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lifetime">
                            Lifetime Access
                          </SelectItem>
                          <SelectItem value="subscription">
                            Subscription
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="featured"
                        type="checkbox"
                        className="w-4 h-4"
                      />
                      <label
                        htmlFor="featured"
                        className="text-sm text-[#404040]"
                      >
                        Featured Course
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Course Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-[#404040]">
                    <div className="flex justify-between">
                      <span>Enrolled Students</span>
                      <span className="font-semibold">1,247</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completion Rate</span>
                      <span className="font-semibold">78%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Rating</span>
                      <span className="font-semibold">4.8 ★</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-semibold">$248,153</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label>Publication Status</Label>
                    <Select>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Published" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="text-xs text-[#8A8A8A]">
                      <div>
                        Last Updated{" "}
                        <span className="float-right">Jan 15, 2025</span>
                      </div>
                      <div>
                        Created <span className="float-right">Dec 1, 2024</span>
                      </div>
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

export default EditCourse;
