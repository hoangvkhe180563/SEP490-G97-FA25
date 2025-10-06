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
import { Button } from "@/common/components/ui/button";
import { Label } from "@/common/components/ui/label";
import { ArrowLeft, Upload } from "lucide-react";

const EditLecture: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-[1200px] mx-auto px-8 py-6">
        <div className="text-sm text-[#525252] mb-3">
          Lectures / Edit Lecture
        </div>

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
                Edit Lecture
              </h1>
              <p className="text-sm text-[#525252]">
                Modify lecture details and content
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Label>Course Selection</Label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Computer Science 101" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="c1">Computer Science 101</SelectItem>
                    <SelectItem value="c2">React Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Lecture Type</Label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Video Lecture" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Lecture</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Lecture Title</Label>
              <Input defaultValue="Introduction to Machine Learning" />
            </div>

            <div className="space-y-4">
              <Label>Description</Label>
              <Textarea
                defaultValue={`This lecture covers the fundamental concepts of machine learning, including supervised and unsupervised learning algorithms.`}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Label>Duration (minutes)</Label>
                <Input defaultValue="90" />
              </div>
              <div className="space-y-4">
                <Label>Scheduled Date</Label>
                <Input type="date" defaultValue="2025-02-15" />
              </div>
            </div>

            <div>
              <Label>Content</Label>
              <div className="mt-2 border border-[#E5E5E5] rounded-lg p-4 bg-white">
                <Textarea
                  defaultValue={`Machine learning is a subset of artificial intelligence that focuses on the development of algorithms that can learn and make decisions from data without being explicitly programmed. Key topics covered: • Supervised Learning • Unsupervised Learning • Neural Networks • Decision Trees`}
                  rows={6}
                />
              </div>
            </div>

            <div className="mt-4">
              <Label>Attachments</Label>
              <div className="mt-2 border-2 border-dashed border-[#D4D4D4] rounded-lg h-[120px] flex flex-col items-center justify-center">
                <Upload className="w-6 h-6 text-[#A3A3A3] mb-2" />
                <p className="text-sm text-[#525252] mb-1">
                  Drop files here or click to upload
                </p>
                <Button variant="outline">Choose Files</Button>
              </div>
              <div className="mt-3 text-sm text-[#404040]">
                ml-introduction.pdf 2.4 MB
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button variant="outline">Save as Draft</Button>
              <Button>Save</Button>
            </div>
          </div>

          <aside className="col-span-12 lg:col-span-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lecture Settings</CardTitle>
                  <CardDescription />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm text-[#404040]">
                    <div className="flex justify-between">
                      <span>Duration</span>
                      <span className="font-semibold">90 minutes</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Scheduled Date</span>
                      <span className="font-semibold">2025-02-15</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="recording"
                        type="checkbox"
                        className="w-4 h-4"
                        defaultChecked
                      />
                      <label
                        htmlFor="recording"
                        className="text-sm text-[#404040]"
                      >
                        Enable recording
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input id="notify" type="checkbox" className="w-4 h-4" />
                      <label
                        htmlFor="notify"
                        className="text-sm text-[#404040]"
                      >
                        Send notifications
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-[#404040]">
                    <div className="flex justify-between">
                      <span>Views</span>
                      <span className="font-semibold">142</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Downloads</span>
                      <span className="font-semibold">28</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated</span>
                      <span className="font-semibold">Jan 15, 2025</span>
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

export default EditLecture;
