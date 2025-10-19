import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCourseStore } from "@/courseManagement/stores/useCourseStore";

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
import { Button } from "@/common/components/ui/button";
import { Label } from "@/common/components/ui/label";
import { ArrowLeft, Upload, Video } from "lucide-react";
import { documentService } from "@/documentManagement/services/documentService";

const AddCourse: React.FC = () => {
  const navigate = useNavigate();
  const [isPublished, setIsPublished] = useState(false);
  const createCourse = useCourseStore((s) => s.createCourse);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [price, setPrice] = useState<number | "">("");
  const [gradeId, setGradeId] = useState<number | "">("");
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [subjectId, setSubjectId] = useState<number | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const s = await documentService.getSubjects();
        setSubjects(s || []);
      } catch (err) {
        console.error("Failed to load subjects", err);
      }
    };
    load();
  }, []);

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
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!title) return alert("Please provide a course title");
                setSaving(true);
                try {
                  const dto: any = {
                    name: title,
                    information: description,
                    imageUrl: "none",
                    price: price,
                    grade: gradeId ? Number(gradeId) : 0,
                    category: subjectId ? Number(subjectId) : 0, // backend dùng "category" thay vì "subjectId"
                    schoolId: 0,
                    isFeatured: isFeatured,
                    status: isPublished,
                    createdAt: new Date().toISOString(),
                    instructorName: "3fa85f64-5717-4562-b3fc-2c963f66afa6", // tạm thời hardcode để pass validation
                    updatedAt: new Date().toISOString(),
                    updatedBy: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                    deletedAt: new Date().toISOString(),
                    chapters: [],
                  };

                  const created = createCourse
                    ? await createCourse(dto)
                    : undefined;

                  if (created && created.id) {
                    navigate(`/course/teacher/courses`);
                  } else {
                    alert("Failed to create course");
                  }
                } catch (err) {
                  console.error("create course failed", err);
                  alert("Create failed");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the core details of your course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Course Title */}
                  <div className="space-y-2">
                    <Label>Course Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter course title"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what students will learn"
                      rows={4}
                    />
                  </div>

                  {/* Subject & Grade */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select
                        value={subjectId ? String(subjectId) : ""}
                        onValueChange={(value) => setSubjectId(Number(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Grade</Label>
                      <Select
                        value={String(gradeId)}
                        onValueChange={(v) =>
                          setGradeId(v === "" ? "" : Number(v))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                            <SelectItem key={g} value={String(g)}>
                              {g}
                            </SelectItem>
                          ))}
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
                        <Input
                          className="pl-8"
                          placeholder="0.00"
                          value={price}
                          onChange={(e) => setPrice(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                      />
                      <Label>Featured Course</Label>
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
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AddCourse;

// small helper used in page to navigate to add-lecture
